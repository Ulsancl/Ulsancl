/**
 * newsSystem.js - 뉴스 시스템 모듈
 * 뉴스 생성, 영향 적용 등
 */

import { NEWS_TEMPLATES, SECTORS, GLOBAL_CRISIS_EVENTS, GLOBAL_EVENT_PROBABILITY } from '../constants'
import { randomRange, randomChoice, generateId, randomInt } from '../utils'

// 모듈 내부 상태
let activeNewsEffects = []
let activeGlobalEvent = null
let recentNewsContext = {
    lastSector: null,
    lastStock: null,
    lastType: null,
    trendStreak: 0,
    sectorMomentum: {}
}

/**
 * 활성 뉴스 효과 가져오기
 */
export const getActiveNewsEffects = () => activeNewsEffects

/**
 * 활성 글로벌 이벤트 가져오기
 */
export const getActiveGlobalEvent = () => activeGlobalEvent

/**
 * 뉴스 효과 업데이트
 */
export const updateNewsEffects = () => {
    activeNewsEffects = activeNewsEffects
        .map(effect => ({
            ...effect,
            currentImpact: effect.currentImpact * 0.95,
            remainingTime: effect.remainingTime - 1
        }))
        .filter(effect => effect.remainingTime > 0 && Math.abs(effect.currentImpact) > 0.001)

    if (activeGlobalEvent) {
        activeGlobalEvent.remainingTime -= 1
        activeGlobalEvent.intensity *= 0.97
        if (activeGlobalEvent.remainingTime <= 0) {
            activeGlobalEvent = null
        }
    }
}

/**
 * 뉴스 생성
 */
export const generateNews = (stocks, probability = 0.03) => {
    if (Math.random() > probability) return null

    const types = ['positive', 'negative', 'market', 'fund_positive', 'fund_negative']
    let weights = [0.35, 0.25, 0.15, 0.15, 0.10]

    // 이전 뉴스 트렌드에 따라 가중치 조절
    if (recentNewsContext.lastType) {
        if (recentNewsContext.trendStreak < 3) {
            if (recentNewsContext.lastType === 'positive' || recentNewsContext.lastType === 'fund_positive') {
                weights = [0.50, 0.15, 0.10, 0.20, 0.05]
            } else if (recentNewsContext.lastType === 'negative' || recentNewsContext.lastType === 'fund_negative') {
                weights = [0.15, 0.45, 0.10, 0.05, 0.25]
            }
        } else {
            if (recentNewsContext.lastType === 'positive' || recentNewsContext.lastType === 'fund_positive') {
                weights = [0.20, 0.40, 0.15, 0.10, 0.15]
            } else {
                weights = [0.45, 0.15, 0.15, 0.20, 0.05]
            }
        }
    }

    const random = Math.random()
    let cumulative = 0
    let selectedType = 'positive'

    for (let i = 0; i < types.length; i++) {
        cumulative += weights[i]
        if (random < cumulative) {
            selectedType = types[i]
            break
        }
    }

    const template = randomChoice(NEWS_TEMPLATES[selectedType])
    const stocksOnly = stocks.filter(s => !s.type || s.type === 'stock')

    let targetStock
    if (recentNewsContext.lastSector && Math.random() < 0.4) {
        const sameSectorStocks = stocksOnly.filter(s => s.sector === recentNewsContext.lastSector)
        targetStock = sameSectorStocks.length > 0 ? randomChoice(sameSectorStocks) : randomChoice(stocksOnly)
    } else if (recentNewsContext.lastStock && Math.random() < 0.2) {
        targetStock = stocks.find(s => s.id === recentNewsContext.lastStock) || randomChoice(stocksOnly)
    } else {
        targetStock = randomChoice(stocksOnly.length > 0 ? stocksOnly : stocks)
    }

    const sector = SECTORS[targetStock.sector]
    const baseImpact = randomRange(template.impact[0] * 0.5, template.impact[1] * 0.5)

    let text = template.text
        .replace('{stock}', targetStock.name)
        .replace('{sector}', sector?.name || '시장')

    if (targetStock.fundamentals) {
        text = text
            .replace('{revenue}', targetStock.fundamentals.revenue)
            .replace('{profit}', targetStock.fundamentals.profit)
            .replace('{marketCap}', targetStock.fundamentals.marketCap)
            .replace('{debtRatio}', targetStock.fundamentals.debtRatio)
            .replace('{pe}', targetStock.fundamentals.pe)
    }

    const newsEffect = {
        id: generateId(),
        targetStockId: template.marketWide ? null : (template.sectorWide ? null : targetStock.id),
        targetSector: template.sectorWide ? targetStock.sector : null,
        marketWide: template.marketWide || false,
        currentImpact: baseImpact,
        initialImpact: baseImpact,
        remainingTime: 20 + randomInt(0, 20),
    }
    activeNewsEffects.push(newsEffect)

    // 컨텍스트 업데이트
    const isPositive = selectedType === 'positive' || selectedType === 'fund_positive'
    const wasPositive = recentNewsContext.lastType === 'positive' || recentNewsContext.lastType === 'fund_positive'

    if ((isPositive && wasPositive) || (!isPositive && !wasPositive && recentNewsContext.lastType)) {
        recentNewsContext.trendStreak++
    } else {
        recentNewsContext.trendStreak = 1
    }

    recentNewsContext.lastType = selectedType
    recentNewsContext.lastSector = targetStock.sector
    recentNewsContext.lastStock = targetStock.id

    const sectorKey = targetStock.sector
    recentNewsContext.sectorMomentum[sectorKey] =
        (recentNewsContext.sectorMomentum[sectorKey] || 0) + (isPositive ? 0.1 : -0.1)

    return {
        id: generateId(),
        text,
        type: selectedType,
        impact: baseImpact,
        targetStockId: newsEffect.targetStockId,
        targetSector: newsEffect.targetSector,
        marketWide: newsEffect.marketWide,
        timestamp: Date.now(),
        read: false,
        effectId: newsEffect.id,
        followUp: recentNewsContext.trendStreak > 1
    }
}

/**
 * 글로벌 이벤트 생성
 */
export const generateGlobalEvent = () => {
    if (activeGlobalEvent) return null
    if (Math.random() > GLOBAL_EVENT_PROBABILITY) return null

    const rand = Math.random()
    let eventType
    if (rand < 0.45) eventType = 'positive'
    else if (rand < 0.90) eventType = 'negative'
    else eventType = 'neutral'

    const events = GLOBAL_CRISIS_EVENTS[eventType]
    if (!events || events.length === 0) return null

    const eventTemplate = randomChoice(events)
    const selectedName = randomChoice(eventTemplate.names)

    const text = eventTemplate.template.replace('{name}', selectedName)
    const impact = randomRange(eventTemplate.impact[0], eventTemplate.impact[1])

    activeGlobalEvent = {
        id: generateId(),
        type: eventType,
        eventId: eventTemplate.id,
        text,
        impact,
        currentImpact: impact,
        intensity: 1,
        sectors: eventTemplate.sectors || {},
        volatilityBoost: eventTemplate.volatilityBoost || (Math.abs(impact) > 0.1 ? 1.5 : 1.2),
        duration: eventTemplate.duration || 30,
        remainingTime: eventTemplate.duration || 30,
        timestamp: Date.now(),
    }

    return {
        id: activeGlobalEvent.id,
        text,
        type: eventType,
        impact,
        isGlobal: true,
        timestamp: Date.now(),
        read: false,
        icon: eventType === 'positive' ? '🎉' : eventType === 'negative' ? '🚨' : '📢'
    }
}

/**
 * 뉴스 영향 적용
 */
export const applyNewsImpact = (stocks, news, marketState) => {
    if (!news) return { stocks, marketState }

    const { VOLATILITY_CONFIG } = require('./priceCalculator')
    const { roundToTickSize } = require('./priceCalculator')

    const newStocks = stocks.map(stock => {
        let priceChange = 0
        let momentumBoost = 0
        const type = stock.type || 'stock'
        const config = VOLATILITY_CONFIG[type] || VOLATILITY_CONFIG.stock

        if (news.marketWide || news.isGlobal) {
            priceChange = news.impact * (news.isGlobal ? 1 : 0.5)
            momentumBoost = news.impact * 0.5
        } else if (news.targetSector && stock.sector === news.targetSector) {
            priceChange = news.impact * 0.7
            momentumBoost = news.impact * 0.5
        } else if (news.targetStockId === stock.id) {
            priceChange = news.impact
            momentumBoost = news.impact * 0.8
        }

        if (stock.type === 'etf' && priceChange !== 0) {
            if (stock.category === 'leverage') priceChange *= (stock.multiplier || 2)
            else if (stock.category === 'inverse') priceChange *= (stock.multiplier || -1)
        }

        if (priceChange !== 0) {
            const dailyOpen = stock.dailyOpen || stock.basePrice
            let newPrice = stock.price * (1 + priceChange)
            const dailyChange = (newPrice - dailyOpen) / dailyOpen

            if (Math.abs(dailyChange) <= config.maxDaily) {
                const stockType = stock.type || 'stock'
                if (stockType === 'stock' || stockType === 'etf') {
                    newPrice = roundToTickSize(newPrice)
                } else {
                    newPrice = Math.round(newPrice)
                }

                return {
                    ...stock,
                    price: Math.max(100, newPrice),
                    momentum: (stock.momentum || 0) + momentumBoost
                }
            }
        }
        return stock
    })

    let newMarketState = { ...marketState }
    if (news.marketWide || news.isGlobal) {
        newMarketState.trend = Math.max(-0.5, Math.min(0.5, newMarketState.trend + news.impact))
    } else if (news.targetSector) {
        newMarketState.sectorTrends = {
            ...newMarketState.sectorTrends,
            [news.targetSector]: Math.max(-0.5, Math.min(0.5,
                (newMarketState.sectorTrends[news.targetSector] || 0) + news.impact * 2
            ))
        }
    }

    return { stocks: newStocks, marketState: newMarketState }
}

/**
 * 뉴스 시스템 리셋
 */
export const resetNewsSystem = () => {
    activeNewsEffects = []
    activeGlobalEvent = null
    recentNewsContext = {
        lastSector: null,
        lastStock: null,
        lastType: null,
        trendStreak: 0,
        sectorMomentum: {}
    }
}
