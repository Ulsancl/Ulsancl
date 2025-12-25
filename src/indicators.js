// 기술적 지표 계산 함수들

// 단순 이동평균선 (SMA)
export const calculateSMA = (data, period) => {
    const result = []
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            result.push(null)
        } else {
            const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b.close, 0)
            result.push(sum / period)
        }
    }
    return result
}

// 지수 이동평균선 (EMA)
export const calculateEMA = (data, period) => {
    const result = []
    const multiplier = 2 / (period + 1)

    // 첫 번째 EMA는 SMA로 계산
    let ema = data.slice(0, period).reduce((a, b) => a + b.close, 0) / period

    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            result.push(null)
        } else if (i === period - 1) {
            result.push(ema)
        } else {
            ema = (data[i].close - ema) * multiplier + ema
            result.push(ema)
        }
    }
    return result
}

// 볼린저 밴드
export const calculateBollingerBands = (data, period = 20, multiplier = 2) => {
    const sma = calculateSMA(data, period)
    const upper = []
    const lower = []

    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            upper.push(null)
            lower.push(null)
        } else {
            const slice = data.slice(i - period + 1, i + 1)
            const mean = sma[i]
            const squaredDiffs = slice.map(d => Math.pow(d.close - mean, 2))
            const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period
            const stdDev = Math.sqrt(variance)

            upper.push(mean + multiplier * stdDev)
            lower.push(mean - multiplier * stdDev)
        }
    }

    return { upper, middle: sma, lower }
}

// MACD (Moving Average Convergence Divergence)
export const calculateMACD = (data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
    const fastEMA = calculateEMA(data, fastPeriod)
    const slowEMA = calculateEMA(data, slowPeriod)

    const macdLine = fastEMA.map((fast, i) => {
        if (fast === null || slowEMA[i] === null) return null
        return fast - slowEMA[i]
    })

    // Signal line (MACD의 EMA)
    const signalData = macdLine
        .filter(v => v !== null)
        .map(v => ({ close: v }))

    const signalEMA = calculateEMA(signalData, signalPeriod)

    const signal = []
    let signalIndex = 0
    for (let i = 0; i < macdLine.length; i++) {
        if (macdLine[i] === null) {
            signal.push(null)
        } else {
            signal.push(signalEMA[signalIndex] || null)
            signalIndex++
        }
    }

    // Histogram
    const histogram = macdLine.map((macd, i) => {
        if (macd === null || signal[i] === null) return null
        return macd - signal[i]
    })

    return { macdLine, signal, histogram }
}

// RSI (Relative Strength Index)
export const calculateRSI = (data, period = 14) => {
    const result = []
    const gains = []
    const losses = []

    for (let i = 1; i < data.length; i++) {
        const change = data[i].close - data[i - 1].close
        gains.push(change > 0 ? change : 0)
        losses.push(change < 0 ? Math.abs(change) : 0)
    }

    result.push(null) // 첫 번째 데이터에는 RSI 없음

    for (let i = 0; i < gains.length; i++) {
        if (i < period - 1) {
            result.push(null)
        } else {
            let avgGain, avgLoss

            if (i === period - 1) {
                avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period
                avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period
            } else {
                const prevAvgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period
                const prevAvgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period
                avgGain = (prevAvgGain * (period - 1) + gains[i]) / period
                avgLoss = (prevAvgLoss * (period - 1) + losses[i]) / period
            }

            if (avgLoss === 0) {
                result.push(100)
            } else {
                const rs = avgGain / avgLoss
                result.push(100 - (100 / (1 + rs)))
            }
        }
    }

    return result
}

// 일목균형표 (Ichimoku Cloud)
export const calculateIchimoku = (data, tenkanPeriod = 9, kijunPeriod = 26, senkouBPeriod = 52) => {
    const getHighLow = (slice) => {
        const highs = slice.map(d => d.high)
        const lows = slice.map(d => d.low)
        return {
            high: Math.max(...highs),
            low: Math.min(...lows)
        }
    }

    const tenkanSen = [] // 전환선
    const kijunSen = []  // 기준선
    const senkouSpanA = [] // 선행스팬 A
    const senkouSpanB = [] // 선행스팬 B
    const chikouSpan = []  // 후행스팬

    for (let i = 0; i < data.length; i++) {
        // 전환선 (9일)
        if (i < tenkanPeriod - 1) {
            tenkanSen.push(null)
        } else {
            const { high, low } = getHighLow(data.slice(i - tenkanPeriod + 1, i + 1))
            tenkanSen.push((high + low) / 2)
        }

        // 기준선 (26일)
        if (i < kijunPeriod - 1) {
            kijunSen.push(null)
        } else {
            const { high, low } = getHighLow(data.slice(i - kijunPeriod + 1, i + 1))
            kijunSen.push((high + low) / 2)
        }

        // 선행스팬 A (전환선 + 기준선) / 2, 26일 앞으로
        if (tenkanSen[i] !== null && kijunSen[i] !== null) {
            senkouSpanA.push((tenkanSen[i] + kijunSen[i]) / 2)
        } else {
            senkouSpanA.push(null)
        }

        // 선행스팬 B (52일 최고/최저 평균), 26일 앞으로
        if (i < senkouBPeriod - 1) {
            senkouSpanB.push(null)
        } else {
            const { high, low } = getHighLow(data.slice(i - senkouBPeriod + 1, i + 1))
            senkouSpanB.push((high + low) / 2)
        }

        // 후행스팬 (현재 종가, 26일 뒤로)
        chikouSpan.push(data[i].close)
    }

    return {
        tenkanSen,
        kijunSen,
        senkouSpanA,
        senkouSpanB,
        chikouSpan,
        kumoShift: kijunPeriod // 구름대 이동 기간
    }
}

// 거래량 가중 이동평균 (VWMA)
export const calculateVWMA = (data, period) => {
    const result = []

    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            result.push(null)
        } else {
            const slice = data.slice(i - period + 1, i + 1)
            const sumPriceVolume = slice.reduce((a, d) => a + d.close * d.volume, 0)
            const sumVolume = slice.reduce((a, d) => a + d.volume, 0)
            result.push(sumPriceVolume / sumVolume)
        }
    }

    return result
}

// 스토캐스틱 오실레이터
export const calculateStochastic = (data, kPeriod = 14, dPeriod = 3) => {
    const kValues = []

    for (let i = 0; i < data.length; i++) {
        if (i < kPeriod - 1) {
            kValues.push(null)
        } else {
            const slice = data.slice(i - kPeriod + 1, i + 1)
            const highestHigh = Math.max(...slice.map(d => d.high))
            const lowestLow = Math.min(...slice.map(d => d.low))
            const currentClose = data[i].close

            if (highestHigh === lowestLow) {
                kValues.push(50)
            } else {
                kValues.push(((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100)
            }
        }
    }

    // %D (K의 이동평균)
    const dValues = []
    for (let i = 0; i < kValues.length; i++) {
        if (kValues[i] === null || i < kPeriod + dPeriod - 2) {
            dValues.push(null)
        } else {
            const slice = kValues.slice(i - dPeriod + 1, i + 1).filter(v => v !== null)
            dValues.push(slice.reduce((a, b) => a + b, 0) / slice.length)
        }
    }

    return { k: kValues, d: dValues }
}
