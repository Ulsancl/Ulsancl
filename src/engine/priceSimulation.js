/**
 * priceSimulation.js - batch price calculation utilities
 */

import { calculatePriceChange, normalizePrice } from './priceCalculator'
import { getActiveNewsEffects, getActiveGlobalEvent } from './newsSystem'

export const calculateAllStockPrices = (stocks, marketState, gameDay, gameTime = null) => {
    const results = {}
    const isMarketOpen = gameTime ? gameTime.isMarketOpen : true
    const activeNewsEffects = getActiveNewsEffects()
    const activeGlobalEvent = getActiveGlobalEvent()

    const independentStocks = stocks.filter(s => !s.baseStockId)
    independentStocks.forEach(stock => {
        const type = stock.type || 'stock'

        if (type !== 'crypto' && !isMarketOpen) {
            results[stock.id] = {
                newPrice: stock.price,
                changeRate: 0,
                marketClosed: true
            }
            return
        }

        let marketCapMultiplier = 1.0
        if (stock.fundamentals?.marketCap) {
            const cap = stock.fundamentals.marketCap
            if (cap >= 100) {
                marketCapMultiplier = 0.6 + Math.random() * 0.2
            } else if (cap >= 30) {
                marketCapMultiplier = 0.8 + Math.random() * 0.2
            } else if (cap >= 10) {
                marketCapMultiplier = 1.0 + Math.random() * 0.3
            } else if (cap >= 1) {
                marketCapMultiplier = 1.3 + Math.random() * 0.5
            } else {
                marketCapMultiplier = 1.5 + Math.random() * 1.0
            }
        }

        const newPrice = calculatePriceChange(
            stock,
            { ...marketState, volatility: (marketState.volatility || 1) * marketCapMultiplier },
            gameDay,
            activeNewsEffects,
            activeGlobalEvent
        )
        const changeRate = (newPrice - stock.price) / stock.price
        results[stock.id] = {
            newPrice,
            changeRate,
            marketCapMultiplier
        }
    })

    const dependentStocks = stocks.filter(s => s.baseStockId)
    dependentStocks.forEach(stock => {
        const type = stock.type || 'etf'

        if (type !== 'crypto' && !isMarketOpen) {
            results[stock.id] = {
                newPrice: stock.price,
                changeRate: 0,
                marketClosed: true
            }
            return
        }

        const baseResult = results[stock.baseStockId]
        const stockType = stock.type || 'stock'
        let newPrice = stock.price

        if (baseResult && !baseResult.marketClosed) {
            const multiplier = stock.multiplier || 1
            const targetChangeRate = baseResult.changeRate * multiplier
            const trackingError = (Math.random() - 0.5) * 0.0005
            const finalChangeRate = targetChangeRate + trackingError

            newPrice = stock.price * (1 + finalChangeRate)

            newPrice = normalizePrice(newPrice, stockType)
        } else if (!baseResult || baseResult.marketClosed) {
            results[stock.id] = {
                newPrice: stock.price,
                changeRate: 0,
                marketClosed: true
            }
            return
        } else {
            newPrice = calculatePriceChange(stock, marketState, gameDay, activeNewsEffects, activeGlobalEvent)
        }

        results[stock.id] = {
            newPrice,
            changeRate: (newPrice - stock.price) / stock.price
        }
    })

    return results
}
