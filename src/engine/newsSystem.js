/**
 * newsSystem.js - 뉴스 시스템 모듈
 * 뉴스 생성, 영향 적용 등
 */

import { NEWS_TEMPLATES, SECTORS, GLOBAL_CRISIS_EVENTS, GLOBAL_EVENT_PROBABILITY } from '../constants'
import { randomRange, randomChoice, generateId, randomInt } from '../utils'
import { VOLATILITY_CONFIG, normalizePrice } from './priceCalculator'
import { SEASONS } from './marketState'

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

    const newStocks = stocks.map(stock => {
        let priceChange = 0
        let momentumBoost = 0
        const type = stock.type || 'stock'
        const config = VOLATILITY_CONFIG[type] || VOLATILITY_CONFIG.stock

        if (news.marketWide || news.isGlobal) {
            priceChange = news.impact * (news.isGlobal ? 1 : 0.5)
            momentumBoost = news.impact * 0.5
        } else if (news.sectors && news.sectors[stock.sector] !== undefined) {
            priceChange = news.impact + news.sectors[stock.sector]
            momentumBoost = priceChange * 0.5
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
                newPrice = normalizePrice(newPrice, stockType)

                return {
                    ...stock,
                    price: newPrice,
                    momentum: (stock.momentum || 0) + momentumBoost,
                    dailyHigh: Math.max(stock.dailyHigh || newPrice, newPrice),
                    dailyLow: Math.min(stock.dailyLow || newPrice, newPrice)
                }
            }
        }
        return stock
    })

    let newMarketState = { ...marketState }
    if (news.marketWide || news.isGlobal) {
        newMarketState.trend = Math.max(-0.5, Math.min(0.5, newMarketState.trend + news.impact))
    } else if (news.sectors) {
        const updatedTrends = { ...newMarketState.sectorTrends }
        Object.entries(news.sectors).forEach(([sector, impact]) => {
            updatedTrends[sector] = Math.max(-0.5, Math.min(0.5,
                (updatedTrends[sector] || 0) + impact * 2
            ))
        })
        newMarketState.sectorTrends = updatedTrends
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

export const SEASONAL_EVENTS = {
    spring: [
        { id: 'cherry_blossom', text: '🌸 전국 벚꽃 축제 시작, 여행/레저 업종 수혜', impact: [0.03, 0.08], sectors: { entertainment: 0.1, retail: 0.05 } },
        { id: 'spring_rain', text: '🌧️ 봄비 지속으로 야외 활동 위축', impact: [-0.02, -0.05], sectors: { retail: -0.05 } },
        { id: 'new_semester', text: '🎓 새 학기 시즌, 교육/문구 관련주 상승', impact: [0.02, 0.05], sectors: { retail: 0.05 } },
        { id: 'spring_fashion', text: '👗 봄 패션 시즌, 의류/화장품 업종 호황', impact: [0.02, 0.06], sectors: { retail: 0.08 } },
    ],
    summer: [
        { id: 'heatwave', text: '🔥 기록적인 폭염, 에어컨/냉방 업종 급등', impact: [0.04, 0.10], sectors: { energy: 0.08, retail: 0.05 } },
        { id: 'monsoon_flood', text: '🌊 집중호우로 건설/보험주 급락', impact: [-0.05, -0.12], sectors: { construction: -0.15, finance: -0.05 } },
        { id: 'vacation_boom', text: '🏖️ 여름 휴가 시즌 본격화, 항공/여행주 상승', impact: [0.04, 0.09], sectors: { entertainment: 0.12 } },
        { id: 'summer_blackout', text: '⚡ 전력 수요 폭증, 전력주 변동', impact: [-0.03, -0.07], sectors: { energy: -0.05 } },
        { id: 'ice_cream_sales', text: '🍦 아이스크림 판매 호조', impact: [0.02, 0.05], sectors: { retail: 0.06 } },
    ],
    autumn: [
        { id: 'fall_foliage', text: '🍁 단풍 시즌 개막, 관광업 특수', impact: [0.02, 0.06], sectors: { entertainment: 0.08 } },
        { id: 'hit_drama', text: '🎬 인기 드라마 흥행, 콘텐츠 업종 급등', impact: [0.05, 0.12], sectors: { entertainment: 0.15, tech: 0.05 } },
        { id: 'chuseok', text: '🧧 추석 연휴 소비 증가, 유통주 상승', impact: [0.03, 0.07], sectors: { retail: 0.10 } },
        { id: 'harvest_festival', text: '🌾 풍년 예상, 농산물 가격 안정', impact: [0.01, 0.03], sectors: {} },
        { id: 'iphone_release', text: '📱 신형 스마트폰 출시, IT 부품주 급등', impact: [0.04, 0.10], sectors: { tech: 0.12, semiconductor: 0.08 } },
    ],
    winter: [
        { id: 'heavy_snow', text: '❄️ 전국 폭설, 교통 마비로 물류 차질', impact: [-0.04, -0.08], sectors: { auto: -0.08, construction: -0.05 } },
        { id: 'christmas', text: '🎄 크리스마스 쇼핑 시즌, 유통주 상승', impact: [0.04, 0.09], sectors: { retail: 0.12, entertainment: 0.06 } },
        { id: 'year_end_rally', text: '🎉 연말 랠리 기대감 증시 상승 모드', impact: [0.03, 0.08], sectors: {} },
        { id: 'flu_outbreak', text: '🧪 독감 유행, 제약/바이오주 급등', impact: [0.03, 0.08], sectors: { bio: 0.15 } },
        { id: 'heating_demand', text: '♨️ 난방비 급등, 에너지주 상승', impact: [0.02, 0.06], sectors: { energy: 0.10 } },
        { id: 'ski_season', text: '🎿 스키 시즌 개막, 레저 업종 호황', impact: [0.02, 0.05], sectors: { entertainment: 0.06 } },
    ]
}

export const generateSeasonalEvent = (season, probability = 0.01) => {
    if (Math.random() > probability) return null

    const events = SEASONAL_EVENTS[season]
    if (!events || events.length === 0) return null

    const event = events[Math.floor(Math.random() * events.length)]
    const impact = event.impact[0] + Math.random() * (event.impact[1] - event.impact[0])
    const icon = SEASONS[season]?.icon

    return {
        id: generateId(),
        text: event.text,
        type: impact >= 0 ? 'positive' : 'negative',
        impact,
        isSeasonal: true,
        season,
        sectors: event.sectors || {},
        timestamp: Date.now(),
        read: false,
        icon
    }
}
