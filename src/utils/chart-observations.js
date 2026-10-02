import { calculateSMA, calculateRSI, calculateMACD, calculateBollingerBands } from '../game/TechnicalAnalysis'

/** No synthetic samples, interpolation or price rounding enter this pipeline. */
export function aggregateObservations(observations = [], { kind = 'ticks', size = 1, maxCandles = 60 } = {}) {
  if (!['ticks', 'days'].includes(kind) || !Number.isInteger(size) || size < 1) return []
  const unique = new Map()
  for (const point of observations) {
    if (!Number.isSafeInteger(point?.sequence) || point.sequence < 0 || !Number.isFinite(point.price) || point.price < 0 || !Number.isFinite(point.timeMs)) continue
    if (kind === 'days' && (!Number.isInteger(point.gameDay) || point.gameDay < 1)) continue
    if (!unique.has(point.sequence)) unique.set(point.sequence, point)
  }
  const points = [...unique.values()].sort((a, b) => a.sequence - b.sequence), buckets = new Map()
  for (const point of points) {
    const bucket = Math.floor((kind === 'days' ? point.gameDay - 1 : point.sequence) / size)
    let candle = buckets.get(bucket)
    if (!candle) {
      candle = { id: `${kind}:${size}:${bucket}`, kind, size, bucket, firstSequence: point.sequence, lastSequence: point.sequence,
        timeStartMs: point.timeMs, timeEndMs: point.timeMs, gameDay: point.gameDay, gameMinute: point.gameMinute,
        endGameDay: point.gameDay, endGameMinute: point.gameMinute, open: point.price, high: point.price, low: point.price,
        close: point.price, count: 0, complete: false, partial: false }
      buckets.set(bucket, candle)
    }
    if (candle.count && point.sequence !== candle.lastSequence + 1) candle.partial = true
    candle.high = Math.max(candle.high, point.price); candle.low = Math.min(candle.low, point.price)
    candle.close = point.price; candle.lastSequence = point.sequence; candle.timeEndMs = point.timeMs
    candle.endGameDay = point.gameDay; candle.endGameMinute = point.gameMinute; candle.count++
  }
  const last = points.at(-1), candles = [...buckets.values()]
  for (const candle of candles) {
    if (kind === 'ticks') {
      candle.complete = candle.lastSequence >= (candle.bucket + 1) * size - 1 || Math.floor(last.sequence / size) > candle.bucket
      candle.partial ||= candle.firstSequence !== candle.bucket * size || (candle.complete && candle.count !== size)
    } else {
      candle.complete = last.gameDay > (candle.bucket + 1) * size
      // The initial retained day can start in the middle of a trading day.
      candle.partial ||= candle === candles[0]
    }
  }
  return candles.slice(-Math.max(1, maxCandles))
}

export function alignedIndicators(candles) {
  const prices = candles.map(candle => candle.close), n = prices.length
  const align = values => Array(n - (values?.length || 0)).fill(null).concat(values || [])
  const macd = calculateMACD(prices), bb = calculateBollingerBands(prices)
  return { sma5: align(calculateSMA(prices, 5)), sma20: align(calculateSMA(prices, 20)), sma60: align(calculateSMA(prices, 60)),
    rsi: align(calculateRSI(prices)), macd: align(macd?.macdLine), signal: align(macd?.signalLine), histogram: align(macd?.histogram),
    bbUpper: align(bb?.upper), bbLower: align(bb?.lower), bbMiddle: align(bb?.middle) }
}

export function priceDomain(values) {
  const finite = values.filter(Number.isFinite)
  if (!finite.length) return { min: 0, max: 1 }
  const low = Math.min(...finite), high = Math.max(...finite)
  const pad = Math.max((high - low) * .08, Math.abs(high) * .0005, 1e-10)
  return { min: low - pad, max: high + pad }
}

export function formatChartPrice(value, interval) {
  if (!Number.isFinite(value)) return '—'
  const absolute = Math.abs(value)
  if (absolute > 0 && absolute < 1e-7) return value.toPrecision(6)
  const base = absolute >= 100 ? 2 : absolute >= 1 ? 4 : 8
  const decimals = Number.isFinite(interval) && interval > 0 ? Math.max(base, Math.ceil(-Math.log10(interval)) + 1) : base
  return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: Math.min(12, Math.max(0, decimals)) }).format(Object.is(value, -0) ? 0 : value)
}

export function observationTime(point, end = false) {
  const day = end ? point.endGameDay : point.gameDay, minute = end ? point.endGameMinute : point.gameMinute
  if (Number.isFinite(day) && Number.isFinite(minute)) return `${day}일 ${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(Math.floor(minute % 60)).padStart(2, '0')}`
  const time = end ? point.timeEndMs : point.timeStartMs
  return Number.isFinite(time) ? new Date(time).toLocaleTimeString('ko-KR', { hour12: false }) : '시각 없음'
}

export function assetPlotPoints(history, width = 600, height = 240) {
  const valid = (history || []).filter(p => Number.isFinite(p?.value) && Number.isFinite(p.timestamp)).slice().sort((a, b) => a.timestamp - b.timestamp)
  if (!valid.length) return { points: [], domain: priceDomain([]) }
  const domain = priceDomain(valid.map(p => p.value)), first = valid[0].timestamp, last = valid.at(-1).timestamp
  const points = valid.map(p => ({ ...p, x: last === first ? width / 2 : 85 + (p.timestamp - first) / (last - first) * (width - 105),
    y: 20 + (domain.max - p.value) / (domain.max - domain.min) * (height - 60) }))
  return { points, domain }
}
