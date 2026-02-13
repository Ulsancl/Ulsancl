/**
 * crisisSystem.js - crisis-related price adjustments
 */

import {
    checkAndGenerateCrisis,
    calculateCrisisImpact,
    getActiveCrisis,
    resetCrisis
} from '../game/CrisisEvents'
import { VOLATILITY_CONFIG, normalizePrice } from './priceCalculator'

export const applyCrisisImpact = (stocks, currentDay) => {
    const activeCrisis = getActiveCrisis(currentDay)
    if (!activeCrisis) return stocks

    return stocks.map(stock => {
        const crisisImpact = calculateCrisisImpact(stock, currentDay)

        if (crisisImpact !== 0) {
            const priceChange = stock.price * crisisImpact
            let newPrice = stock.price + priceChange

            const dailyOpen = stock.dailyOpen || stock.basePrice
            const dailyChange = (newPrice - dailyOpen) / dailyOpen
            const stockType = stock.type || 'stock'
            const config = VOLATILITY_CONFIG[stockType] || VOLATILITY_CONFIG.stock
            const maxDaily = config.maxDaily

            if (Math.abs(dailyChange) <= maxDaily) {
                newPrice = normalizePrice(newPrice, stockType)

                return {
                    ...stock,
                    price: newPrice,
                    momentum: (stock.momentum || 0) + crisisImpact * 0.5,
                    dailyHigh: Math.max(stock.dailyHigh || newPrice, newPrice),
                    dailyLow: Math.min(stock.dailyLow || newPrice, newPrice)
                }
            }
        }

        return stock
    })
}

export const updatePricesWithCrisis = (stocks, marketState, currentDay) => {
    const crisisResult = checkAndGenerateCrisis(currentDay, marketState)
    const activeCrisis = getActiveCrisis(currentDay)
    const updatedStocks = activeCrisis ? applyCrisisImpact(stocks, currentDay) : stocks

    return {
        stocks: updatedStocks,
        crisisEvent: crisisResult,
        activeCrisis
    }
}

export const resetCrisisState = () => {
    resetCrisis()
}

export {
    checkAndGenerateCrisis,
    calculateCrisisImpact,
    getActiveCrisis
}
