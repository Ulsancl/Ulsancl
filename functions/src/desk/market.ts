import { sha256 } from '@noble/hashes/sha256'
import { hmac } from '@noble/hashes/hmac'
import { utf8ToBytes } from '@noble/hashes/utils'
import {
  Instrument,
  Market,
  SPOTS,
  TICKS_PER_DAY,
  MAX_TICK,
  instrument,
  money,
  scenarioById,
} from './model'
// HMAC prevents a private 256-bit season seed from collapsing into a recoverable
// small PRNG state. Bounded memoization makes repeated Brownian nodes inexpensive.
const normalCache = new Map<string, number>()
function normal(key: string): number {
  const cached = normalCache.get(key)
  if (cached !== undefined) return cached
  const separator = key.indexOf(':')
  const digest = hmac(
    sha256,
    utf8ToBytes(key.slice(0, separator)),
    utf8ToBytes('marketdesk:v2:' + key.slice(separator + 1))
  )
  const word = (offset: number) =>
    ((digest[offset] << 24) |
      (digest[offset + 1] << 16) |
      (digest[offset + 2] << 8) |
      digest[offset + 3]) >>>
    0
  const a = (word(0) + 1) / 4294967297,
    b = (word(4) + 1) / 4294967297
  const value = Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * b)
  if (normalCache.size >= 100000) normalCache.clear()
  normalCache.set(key, value)
  return value
}
// A seeded Brownian bridge gives a consistent price path at any minute in O(log horizon).
function brownian(seed: string, tick: number): number {
  if (tick <= 0) return 0
  let lo = 0,
    hi = 1048576,
    a = 0,
    b = normal(seed + ':end') * Math.sqrt(hi)
  while (hi - lo > 1) {
    const mid = (lo + hi) / 2,
      value = (a + b) / 2 + (normal(seed + ':' + lo + ':' + hi) * Math.sqrt(hi - lo)) / 2
    if (tick === mid) return value
    if (tick < mid) {
      hi = mid
      b = value
    } else {
      lo = mid
      a = value
    }
  }
  return tick === lo ? a : b
}
export function spotPrice(asset: Instrument, market: Market): number {
  const tick = Math.max(0, Math.min(MAX_TICK, Math.floor(market.tick)))
  const years = tick / (TICKS_PER_DAY * 252),
    common = brownian(market.seed + ':market', tick),
    own = brownian(market.seed + ':' + asset.id, tick)
  let shock = 0
  for (const event of scenarioById(market.scenario).shocks) {
    const elapsed = tick - event.day * TICKS_PER_DAY
    if (elapsed >= 0) shock += event.impact * asset.beta * Math.min(1, (elapsed + 1) / 30)
  }
  const vol = asset.volatility
  const noise =
    (common * asset.beta + own * Math.sqrt(1 - asset.beta ** 2)) / Math.sqrt(TICKS_PER_DAY * 252)
  const value = asset.base * Math.exp((asset.drift - (vol * vol) / 2) * years + vol * noise + shock)
  const exDividend = Math.pow(1 - asset.dividend / 12, Math.floor(tick / (21 * TICKS_PER_DAY)))
  return Math.max(
    1,
    money(Math.max(asset.base * 0.02, Math.min(asset.base * 50, value * exDividend)))
  )
}
function cdf(x: number): number {
  const z = Math.abs(x),
    t = 1 / (1 + 0.2316419 * z),
    p =
      1 -
      0.3989422804014327 *
        Math.exp((-z * z) / 2) *
        t *
        (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))))
  return x >= 0 ? p : 1 - p
}
export function optionValue(
  s: number,
  k: number,
  years: number,
  volatility: number,
  right: 'call' | 'put',
  rate = 0.03,
  dividend = 0.02
) {
  if (years <= 0)
    return {
      price: Math.max(0, right === 'call' ? s - k : k - s),
      delta: right === 'call' ? (s > k ? 1 : 0) : s < k ? -1 : 0,
      theta: 0,
      vega: 0,
      gamma: 0,
    }
  const root = Math.sqrt(years),
    d1 =
      (Math.log(s / k) + (rate - dividend + (volatility * volatility) / 2) * years) /
      (volatility * root),
    d2 = d1 - volatility * root
  const ds = Math.exp(-dividend * years),
    dk = Math.exp(-rate * years),
    density = Math.exp((-d1 * d1) / 2) / Math.sqrt(2 * Math.PI)
  const call = right === 'call'
  const price = call ? s * ds * cdf(d1) - k * dk * cdf(d2) : k * dk * cdf(-d2) - s * ds * cdf(-d1)
  const theta =
    ((-s * ds * density * volatility) / (2 * root) +
      (call
        ? -rate * k * dk * cdf(d2) + dividend * s * ds * cdf(d1)
        : rate * k * dk * cdf(-d2) - dividend * s * ds * cdf(-d1))) /
    252
  return {
    price: Math.max(0, price),
    delta: ds * (call ? cdf(d1) : cdf(d1) - 1),
    theta,
    vega: (s * ds * root * density) / 100,
    gamma: (ds * density) / (s * volatility * root),
  }
}
export function quote(id: string, market: Market) {
  const asset = instrument(id)
  if (asset.kind !== 'future' && asset.kind !== 'option')
    return { price: spotPrice(asset, market), delta: 1, theta: 0, vega: 0, gamma: 0 }
  const underlying = instrument(asset.underlying!),
    spot = spotPrice(underlying, market),
    years = Math.max(0, (asset.expiry! - market.tick) / (TICKS_PER_DAY * 252))
  if (asset.kind === 'future')
    return {
      price: money(spot * Math.exp((0.03 - underlying.dividend) * years)),
      delta: Math.exp((0.03 - underlying.dividend) * years),
      theta: 0,
      vega: 0,
      gamma: 0,
    }
  const value = optionValue(
    spot,
    asset.strike!,
    years,
    underlying.volatility,
    asset.right!,
    0.03,
    underlying.dividend
  )
  return { ...value, price: Math.max(market.tick >= asset.expiry! ? 0 : 1, money(value.price)) }
}
export function executionPrice(
  id: string,
  side: 'buy' | 'sell',
  quantity: number,
  market: Market
): number {
  const asset = instrument(id),
    mid = quote(id, market).price
  const impact = Math.min(
    100,
    Math.sqrt((quantity * mid * asset.multiplier) / asset.liquidity) * 25
  )
  return Math.max(
    1,
    money(mid * (1 + ((side === 'buy' ? 1 : -1) * (asset.spreadBps / 2 + impact)) / 10000))
  )
}
export function marketQuotes(market: Market) {
  return SPOTS.map((asset) => {
    const price = quote(asset.id, market).price,
      previous = quote(asset.id, {
        ...market,
        tick: Math.max(0, Math.floor(market.tick / TICKS_PER_DAY) * TICKS_PER_DAY - 1),
      }).price
    return { ...asset, price, change: price / previous - 1 }
  })
}
export function newsAt(market: Market) {
  return scenarioById(market.scenario)
    .shocks.filter((e) => e.day * TICKS_PER_DAY <= market.tick)
    .slice(-5)
    .reverse()
    .map((e) => ({ ...e, tick: e.day * TICKS_PER_DAY }))
}
export interface Candle {
  tick: number
  open: number
  high: number
  low: number
  close: number
}
export function candles(id: string, market: Market, interval: number, count = 60): Candle[] {
  if (![1, 5, 30, 390].includes(interval) || !Number.isInteger(count) || count < 1 || count > 60)
    throw new Error('지원하지 않는 차트 범위입니다.')
  const result: Candle[] = [],
    start = Math.max(0, (Math.floor(market.tick / interval) - count + 1) * interval)
  for (let from = start; from <= market.tick; from += interval) {
    let open = 0,
      high = -Infinity,
      low = Infinity,
      close = 0
    for (let tick = from; tick <= Math.min(market.tick, from + interval - 1); tick++) {
      const p = quote(id, { ...market, tick }).price
      if (tick === from) open = p
      high = Math.max(high, p)
      low = Math.min(low, p)
      close = p
    }
    result.push({ tick: from, open, high, low, close })
  }
  return result
}
