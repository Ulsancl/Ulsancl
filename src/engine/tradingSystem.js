/**
 * tradingSystem.js - 거래 처리 모듈
 * 주문 처리, 업적 체크 등
 */

import { ACHIEVEMENTS, MARKET_EVENTS, IPO_CANDIDATES } from '../constants'
import { randomChoice, generateId } from '../utils'

/**
 * 주문 처리
 */
export const processOrders = (orders, stocks, cash, portfolio) => {
    const executedOrders = []
    const remainingOrders = []
    let newCash = cash
    let newPortfolio = { ...portfolio }

    orders.forEach(order => {
        const stock = stocks.find(s => s.id === order.stockId)
        if (!stock) {
            remainingOrders.push(order)
            return
        }

        let shouldExecute = false

        switch (order.type) {
            case 'limit':
                if (order.side === 'buy' && stock.price <= order.targetPrice) {
                    shouldExecute = true
                } else if (order.side === 'sell' && stock.price >= order.targetPrice) {
                    shouldExecute = true
                }
                break
            case 'stopLoss':
                if (stock.price <= order.targetPrice) shouldExecute = true
                break
            case 'takeProfit':
                if (stock.price >= order.targetPrice) shouldExecute = true
                break
        }

        if (shouldExecute) {
            const totalValue = stock.price * order.quantity

            if (order.side === 'buy') {
                if (totalValue <= newCash) {
                    newCash -= totalValue
                    const existing = newPortfolio[order.stockId] || { quantity: 0, totalCost: 0 }
                    newPortfolio[order.stockId] = {
                        quantity: existing.quantity + order.quantity,
                        totalCost: existing.totalCost + totalValue
                    }
                    executedOrders.push({ ...order, executedPrice: stock.price, executedAt: Date.now() })
                } else {
                    remainingOrders.push(order)
                }
            } else if (order.side === 'sell') {
                const holding = newPortfolio[order.stockId]
                if (holding && holding.quantity >= order.quantity) {
                    newCash += totalValue
                    const avgPrice = holding.totalCost / holding.quantity
                    const remainingQty = holding.quantity - order.quantity

                    if (remainingQty <= 0) {
                        delete newPortfolio[order.stockId]
                    } else {
                        newPortfolio[order.stockId] = {
                            quantity: remainingQty,
                            totalCost: avgPrice * remainingQty
                        }
                    }
                    executedOrders.push({ ...order, executedPrice: stock.price, executedAt: Date.now() })
                } else {
                    remainingOrders.push(order)
                }
            }
        } else {
            remainingOrders.push(order)
        }
    })

    return { executedOrders, remainingOrders, cash: newCash, portfolio: newPortfolio }
}

/**
 * 업적 체크
 */
export const checkAchievements = (gameState, unlockedAchievements, achievements = ACHIEVEMENTS) => {
    const newUnlocks = []
    const { totalTrades, totalProfit, totalAssets, portfolio, tradeHistory, winStreak } = gameState

    if (!unlockedAchievements.firstTrade && totalTrades >= 1) newUnlocks.push('firstTrade')
    if (!unlockedAchievements.trader10 && totalTrades >= 10) newUnlocks.push('trader10')
    if (!unlockedAchievements.trader100 && totalTrades >= 100) newUnlocks.push('trader100')
    if (!unlockedAchievements.trader1000 && totalTrades >= 1000) newUnlocks.push('trader1000')

    if (!unlockedAchievements.firstProfit && totalProfit > 0) newUnlocks.push('firstProfit')
    if (!unlockedAchievements.profit1m && totalProfit >= 1000000) newUnlocks.push('profit1m')
    if (!unlockedAchievements.profit10m && totalProfit >= 10000000) newUnlocks.push('profit10m')
    if (!unlockedAchievements.profit100m && totalProfit >= 100000000) newUnlocks.push('profit100m')

    if (!unlockedAchievements.assets200m && totalAssets >= 200000000) newUnlocks.push('assets200m')
    if (!unlockedAchievements.assets500m && totalAssets >= 500000000) newUnlocks.push('assets500m')
    if (!unlockedAchievements.assets1b && totalAssets >= 1000000000) newUnlocks.push('assets1b')

    if (!unlockedAchievements.diversified && Object.keys(portfolio).length >= 5) newUnlocks.push('diversified')

    if (!unlockedAchievements.winStreak5 && winStreak >= 5) newUnlocks.push('winStreak5')
    if (!unlockedAchievements.winStreak10 && winStreak >= 10) newUnlocks.push('winStreak10')

    return newUnlocks.map(id => achievements[id]).filter(Boolean)
}

/**
 * 마켓 이벤트 생성
 */
export const generateMarketEvent = (stocks) => {
    for (const eventType of MARKET_EVENTS) {
        if (Math.random() < eventType.probability * 0.5) {
            const targetStock = randomChoice(stocks.filter(s => !s.type || s.type === 'stock'))

            return {
                id: generateId(),
                type: eventType.id,
                name: eventType.name,
                icon: eventType.icon,
                description: eventType.description,
                targetStockId: targetStock?.id,
                targetStockName: targetStock?.name,
                timestamp: Date.now(),
            }
        }
    }
    return null
}

/**
 * 이벤트 효과 적용
 */
export const applyEventEffect = (event, stocks, cash, portfolio) => {
    let newStocks = [...stocks]
    let newCash = cash
    let newPortfolio = { ...portfolio }
    let message = ''

    switch (event.type) {
        case 'ipo':
            const available = IPO_CANDIDATES.filter(c => !stocks.find(s => s.name === c.name))
            if (available.length > 0) {
                const candidate = randomChoice(available)
                const newId = Math.max(...stocks.map(s => s.id)) + 1
                const newStock = {
                    id: newId,
                    name: candidate.name,
                    code: candidate.code,
                    price: candidate.basePrice,
                    basePrice: candidate.basePrice,
                    color: candidate.color,
                    sector: candidate.sector === 'travel' || candidate.sector === 'service' ? 'retail' : candidate.sector,
                    type: 'stock',
                    dailyOpen: candidate.basePrice,
                    dailyHigh: candidate.basePrice,
                    dailyLow: candidate.basePrice,
                    momentum: 0.5
                }
                newStocks = [...stocks, newStock]
                message = `🔔 ${candidate.name} 신규 상장! (공모가: ${candidate.basePrice.toLocaleString()}원)`
            } else {
                message = '신규 상장 예정 기업 심사 중...'
            }
            break

        case 'split':
            newStocks = stocks.map(s => {
                if (s.id === event.targetStockId) {
                    return {
                        ...s,
                        price: Math.round(s.price / 2),
                        dailyOpen: Math.round((s.dailyOpen || s.price) / 2),
                        basePrice: Math.round(s.basePrice / 2)
                    }
                }
                return s
            })
            if (portfolio[event.targetStockId]) {
                newPortfolio[event.targetStockId] = {
                    ...portfolio[event.targetStockId],
                    quantity: portfolio[event.targetStockId].quantity * 2,
                    totalCost: portfolio[event.targetStockId].totalCost
                }
            }
            message = `${event.targetStockName} 1:2 주식 분할!`
            break

        case 'dividend_special':
            const holding = portfolio[event.targetStockId]
            if (holding) {
                const stock = stocks.find(s => s.id === event.targetStockId)
                const dividend = Math.round(stock.price * holding.quantity * 0.02)
                newCash += dividend
                message = `${event.targetStockName} 특별 배당 ${dividend.toLocaleString()}원!`
            } else {
                message = `${event.targetStockName} 특별 배당 발표!`
            }
            break

        case 'buyback':
            newStocks = stocks.map(s => {
                if (s.id === event.targetStockId) {
                    const boost = s.price * 0.03
                    return {
                        ...s,
                        price: Math.round(s.price + boost),
                        momentum: (s.momentum || 0) + 0.02
                    }
                }
                return s
            })
            message = `${event.targetStockName} 자사주 매입 발표`
            break

        case 'circuit_breaker':
            message = '서킷브레이커 발동!'
            break
    }

    return { stocks: newStocks, cash: newCash, portfolio: newPortfolio, message }
}
