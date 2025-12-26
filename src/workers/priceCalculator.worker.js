/**
 * priceCalculator.worker.js - 가격 계산 Web Worker
 * 메인 스레드 블로킹 없이 복잡한 가격 계산 수행
 */

// 변동성 설정
import { calculatePriceChange } from '../engine/priceCalculator'

function calculateAllPrices(stocks, marketState, newsEffects, globalEvent) {
    return stocks.map(stock => ({
        id: stock.id,
        oldPrice: stock.price,
        newPrice: calculatePriceChange(stock, marketState, 0, newsEffects, globalEvent)
    }))
}

/**
 * 기술적 지표 계산
 */
function calculateIndicators(prices, period = 14) {
    if (!prices || prices.length < period) {
        return { sma: null, ema: null, rsi: null }
    }

    // SMA
    const sma = prices.slice(-period).reduce((a, b) => a + b, 0) / period

    // EMA
    const multiplier = 2 / (period + 1)
    let ema = prices[0]
    for (let i = 1; i < prices.length; i++) {
        ema = (prices[i] - ema) * multiplier + ema
    }

    // RSI
    let gains = 0, losses = 0
    for (let i = prices.length - period; i < prices.length; i++) {
        const change = prices[i] - prices[i - 1]
        if (change > 0) gains += change
        else losses += Math.abs(change)
    }
    const avgGain = gains / period
    const avgLoss = losses / period
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
    const rsi = 100 - (100 / (1 + rs))

    return { sma, ema, rsi }
}

// 메시지 핸들러
self.onmessage = function (e) {
    const { type, payload, id } = e.data

    let result

    switch (type) {
        case 'CALCULATE_PRICES':
            result = calculateAllPrices(
                payload.stocks,
                payload.marketState,
                payload.newsEffects || [],
                payload.globalEvent
            )
            break

        case 'CALCULATE_SINGLE_PRICE':
            result = calculatePriceChange(
                payload.stock,
                payload.marketState,
                0,
                payload.newsEffects || [],
                payload.globalEvent
            )
            break

        case 'CALCULATE_INDICATORS':
            result = calculateIndicators(payload.prices, payload.period)
            break

        case 'BATCH_INDICATORS':
            result = {}
            Object.entries(payload.priceHistories).forEach(([stockId, prices]) => {
                result[stockId] = calculateIndicators(prices, payload.period)
            })
            break

        default:
            result = { error: 'Unknown message type' }
    }

    self.postMessage({ id, type, result })
}

// Worker 시작 알림
self.postMessage({ type: 'READY' })
