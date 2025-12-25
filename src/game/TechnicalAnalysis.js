/**
 * TechnicalAnalysis - 기술적 분석 도구
 * 이동평균, RSI, MACD, 볼린저 밴드 등
 */

/**
 * 단순 이동평균 (SMA)
 * @param {number[]} prices - 가격 배열
 * @param {number} period - 기간
 */
export const calculateSMA = (prices, period) => {
    if (prices.length < period) return null

    const sma = []
    for (let i = period - 1; i < prices.length; i++) {
        const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
        sma.push(sum / period)
    }
    return sma
}

/**
 * 지수 이동평균 (EMA)
 * @param {number[]} prices - 가격 배열
 * @param {number} period - 기간
 */
export const calculateEMA = (prices, period) => {
    if (prices.length < period) return null

    const multiplier = 2 / (period + 1)
    const ema = []

    // 첫 EMA는 SMA로
    let sum = 0
    for (let i = 0; i < period; i++) {
        sum += prices[i]
    }
    ema.push(sum / period)

    // 나머지는 EMA 공식
    for (let i = period; i < prices.length; i++) {
        const value = (prices[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1]
        ema.push(value)
    }

    return ema
}

/**
 * RSI (상대강도지수)
 * @param {number[]} prices - 가격 배열
 * @param {number} period - 기간 (기본 14)
 */
export const calculateRSI = (prices, period = 14) => {
    if (prices.length < period + 1) return null

    const rsi = []
    let gains = 0
    let losses = 0

    // 첫 기간의 평균 상승/하락 계산
    for (let i = 1; i <= period; i++) {
        const change = prices[i] - prices[i - 1]
        if (change > 0) gains += change
        else losses += Math.abs(change)
    }

    let avgGain = gains / period
    let avgLoss = losses / period

    // RSI 계산
    for (let i = period; i < prices.length; i++) {
        if (i > period) {
            const change = prices[i] - prices[i - 1]
            const gain = change > 0 ? change : 0
            const loss = change < 0 ? Math.abs(change) : 0

            avgGain = (avgGain * (period - 1) + gain) / period
            avgLoss = (avgLoss * (period - 1) + loss) / period
        }

        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
        rsi.push(100 - (100 / (1 + rs)))
    }

    return rsi
}

/**
 * MACD (이동평균수렴발산)
 * @param {number[]} prices - 가격 배열
 * @param {number} fastPeriod - 빠른 EMA (기본 12)
 * @param {number} slowPeriod - 느린 EMA (기본 26)
 * @param {number} signalPeriod - 시그널 EMA (기본 9)
 */
export const calculateMACD = (prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
    if (prices.length < slowPeriod + signalPeriod) return null

    const fastEMA = calculateEMA(prices, fastPeriod)
    const slowEMA = calculateEMA(prices, slowPeriod)

    if (!fastEMA || !slowEMA) return null

    // MACD 라인 = Fast EMA - Slow EMA
    const macdLine = []
    const offset = slowPeriod - fastPeriod

    for (let i = 0; i < slowEMA.length; i++) {
        macdLine.push(fastEMA[i + offset] - slowEMA[i])
    }

    // 시그널 라인 = MACD의 EMA
    const signalLine = calculateEMA(macdLine, signalPeriod)

    if (!signalLine) return null

    // 히스토그램 = MACD - Signal
    const histogram = []
    const signalOffset = signalPeriod - 1

    for (let i = 0; i < signalLine.length; i++) {
        histogram.push(macdLine[i + signalOffset] - signalLine[i])
    }

    return {
        macdLine: macdLine.slice(-histogram.length),
        signalLine,
        histogram
    }
}

/**
 * 볼린저 밴드
 * @param {number[]} prices - 가격 배열
 * @param {number} period - 기간 (기본 20)
 * @param {number} stdDev - 표준편차 배수 (기본 2)
 */
export const calculateBollingerBands = (prices, period = 20, stdDev = 2) => {
    if (prices.length < period) return null

    const bands = {
        upper: [],
        middle: [],
        lower: []
    }

    for (let i = period - 1; i < prices.length; i++) {
        const slice = prices.slice(i - period + 1, i + 1)
        const sma = slice.reduce((a, b) => a + b, 0) / period

        // 표준편차 계산
        const squaredDiffs = slice.map(p => Math.pow(p - sma, 2))
        const std = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / period)

        bands.middle.push(sma)
        bands.upper.push(sma + stdDev * std)
        bands.lower.push(sma - stdDev * std)
    }

    return bands
}

/**
 * 스토캐스틱
 * @param {object[]} candles - OHLC 캔들 데이터
 * @param {number} period - 기간 (기본 14)
 */
export const calculateStochastic = (candles, period = 14) => {
    if (candles.length < period) return null

    const stochK = []
    const stochD = []

    for (let i = period - 1; i < candles.length; i++) {
        const slice = candles.slice(i - period + 1, i + 1)
        const highs = slice.map(c => c.high)
        const lows = slice.map(c => c.low)
        const close = candles[i].close

        const highestHigh = Math.max(...highs)
        const lowestLow = Math.min(...lows)

        const k = highestHigh !== lowestLow
            ? ((close - lowestLow) / (highestHigh - lowestLow)) * 100
            : 50

        stochK.push(k)
    }

    // %D는 %K의 3일 SMA
    for (let i = 2; i < stochK.length; i++) {
        const d = (stochK[i] + stochK[i - 1] + stochK[i - 2]) / 3
        stochD.push(d)
    }

    return { stochK: stochK.slice(2), stochD }
}

/**
 * ATR (Average True Range)
 * @param {object[]} candles - OHLC 캔들 데이터
 * @param {number} period - 기간 (기본 14)
 */
export const calculateATR = (candles, period = 14) => {
    if (candles.length < period + 1) return null

    const trueRanges = []

    for (let i = 1; i < candles.length; i++) {
        const high = candles[i].high
        const low = candles[i].low
        const prevClose = candles[i - 1].close

        const tr = Math.max(
            high - low,
            Math.abs(high - prevClose),
            Math.abs(low - prevClose)
        )
        trueRanges.push(tr)
    }

    // ATR은 TR의 EMA
    return calculateEMA(trueRanges, period)
}

/**
 * 지지선/저항선 계산
 * @param {object[]} candles - OHLC 캔들 데이터
 * @param {number} lookback - 검토 기간
 */
export const calculateSupportResistance = (candles, lookback = 30) => {
    if (candles.length < lookback) return { support: [], resistance: [] }

    const recentCandles = candles.slice(-lookback)
    const levels = { support: [], resistance: [] }

    // 피벗 포인트 감지
    for (let i = 2; i < recentCandles.length - 2; i++) {
        const curr = recentCandles[i]
        const prev1 = recentCandles[i - 1]
        const prev2 = recentCandles[i - 2]
        const next1 = recentCandles[i + 1]
        const next2 = recentCandles[i + 2]

        // 저항선 (고점)
        if (curr.high > prev1.high && curr.high > prev2.high &&
            curr.high > next1.high && curr.high > next2.high) {
            levels.resistance.push(curr.high)
        }

        // 지지선 (저점)
        if (curr.low < prev1.low && curr.low < prev2.low &&
            curr.low < next1.low && curr.low < next2.low) {
            levels.support.push(curr.low)
        }
    }

    // 중복 제거 (5% 이내는 같은 레벨로)
    const consolidate = (levels) => {
        const sorted = levels.sort((a, b) => a - b)
        const result = []

        for (const level of sorted) {
            const existing = result.find(r => Math.abs(r.price - level) / level < 0.05)
            if (existing) {
                existing.count++
                existing.price = (existing.price + level) / 2
            } else {
                result.push({ price: level, count: 1 })
            }
        }

        return result.sort((a, b) => b.count - a.count).slice(0, 3)
    }

    return {
        support: consolidate(levels.support),
        resistance: consolidate(levels.resistance)
    }
}

/**
 * 추세 판단
 * @param {number[]} prices - 가격 배열
 */
export const analyzeTrend = (prices) => {
    if (prices.length < 20) return { trend: 'neutral', strength: 0 }

    const sma5 = calculateSMA(prices, 5)
    const sma20 = calculateSMA(prices, 20)

    if (!sma5 || !sma20 || sma5.length === 0 || sma20.length === 0) {
        return { trend: 'neutral', strength: 0 }
    }

    const currentSma5 = sma5[sma5.length - 1]
    const currentSma20 = sma20[sma20.length - 1]
    const currentPrice = prices[prices.length - 1]

    // Golden Cross / Death Cross 확인
    const prevSma5 = sma5[sma5.length - 2] || currentSma5
    const prevSma20 = sma20[sma20.length - 2] || currentSma20

    const goldenCross = prevSma5 <= prevSma20 && currentSma5 > currentSma20
    const deathCross = prevSma5 >= prevSma20 && currentSma5 < currentSma20

    // 추세 강도 계산
    const diff = (currentSma5 - currentSma20) / currentSma20 * 100
    const priceAboveSma = currentPrice > currentSma5 ? 1 : -1

    let trend = 'neutral'
    let strength = Math.abs(diff) * 10  // 0-100 스케일로

    if (diff > 1 && priceAboveSma > 0) {
        trend = 'uptrend'
    } else if (diff < -1 && priceAboveSma < 0) {
        trend = 'downtrend'
    }

    strength = Math.min(100, strength)

    return {
        trend,
        strength: Math.round(strength),
        goldenCross,
        deathCross,
        sma5: currentSma5,
        sma20: currentSma20,
        pricePosition: priceAboveSma > 0 ? 'above' : 'below'
    }
}

/**
 * 매수/매도 신호 생성
 * @param {number[]} prices - 가격 배열
 */
export const generateSignals = (prices) => {
    const signals = []

    if (prices.length < 30) return signals

    const rsi = calculateRSI(prices)
    const macd = calculateMACD(prices)
    const bb = calculateBollingerBands(prices)
    const trend = analyzeTrend(prices)

    const currentPrice = prices[prices.length - 1]

    // RSI 신호
    if (rsi && rsi.length > 0) {
        const currentRSI = rsi[rsi.length - 1]
        if (currentRSI < 30) {
            signals.push({ type: 'buy', indicator: 'RSI', message: `RSI 과매도 (${currentRSI.toFixed(1)})`, strength: 'strong' })
        } else if (currentRSI > 70) {
            signals.push({ type: 'sell', indicator: 'RSI', message: `RSI 과매수 (${currentRSI.toFixed(1)})`, strength: 'strong' })
        }
    }

    // MACD 신호
    if (macd && macd.histogram.length > 1) {
        const currHist = macd.histogram[macd.histogram.length - 1]
        const prevHist = macd.histogram[macd.histogram.length - 2]

        if (prevHist < 0 && currHist > 0) {
            signals.push({ type: 'buy', indicator: 'MACD', message: 'MACD 골든크로스', strength: 'medium' })
        } else if (prevHist > 0 && currHist < 0) {
            signals.push({ type: 'sell', indicator: 'MACD', message: 'MACD 데드크로스', strength: 'medium' })
        }
    }

    // 볼린저 밴드 신호
    if (bb && bb.lower.length > 0) {
        const lower = bb.lower[bb.lower.length - 1]
        const upper = bb.upper[bb.upper.length - 1]

        if (currentPrice <= lower) {
            signals.push({ type: 'buy', indicator: 'BB', message: '볼린저 밴드 하단 터치', strength: 'medium' })
        } else if (currentPrice >= upper) {
            signals.push({ type: 'sell', indicator: 'BB', message: '볼린저 밴드 상단 터치', strength: 'medium' })
        }
    }

    // 골든/데드 크로스
    if (trend.goldenCross) {
        signals.push({ type: 'buy', indicator: 'MA', message: '골든 크로스 발생', strength: 'strong' })
    } else if (trend.deathCross) {
        signals.push({ type: 'sell', indicator: 'MA', message: '데드 크로스 발생', strength: 'strong' })
    }

    return signals
}

export default {
    calculateSMA,
    calculateEMA,
    calculateRSI,
    calculateMACD,
    calculateBollingerBands,
    calculateStochastic,
    calculateATR,
    calculateSupportResistance,
    analyzeTrend,
    generateSignals
}
