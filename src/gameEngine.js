// 게임 엔진 - 현실적인 가격 변동, 뉴스, 거래일 시스템, 글로벌 이벤트

import { NEWS_TEMPLATES, SECTORS, MARKET_HOURS, MARKET_EVENTS, SHORT_SELLING, GLOBAL_CRISIS_EVENTS, GLOBAL_EVENT_PROBABILITY, MACRO_CONFIG, MACRO_EVENTS, IPO_CANDIDATES } from './constants'
import { randomRange, randomChoice, generateId, randomInt } from './utils'
import { checkAndGenerateCrisis, calculateCrisisImpact, getActiveCrisis, resetCrisis as resetCrisisState } from './game/CrisisEvents'

// 활성 뉴스 영향 저장
let activeNewsEffects = []

// 활성 글로벌 이벤트
let activeGlobalEvent = null

// 상품 타입별 변동성 설정 (초당 변동률) - 활발한 거래를 위해 증가
const VOLATILITY_CONFIG = {
    stock: {
        base: 0.0015,      // 0.15% 기본 변동 (증가)
        maxDaily: 0.15,    // 일일 최대 ±15% (서킷브레이커 수준)
        typical: 0.03,     // 일반적 일일 변동 ±3%
        momentum: 0.4,
    },
    etf: {
        base: 0.001,       // 0.1% 기본 변동 (증가)
        maxDaily: 0.10,
        typical: 0.02,
        momentum: 0.3,
    },
    crypto: {
        base: 0.012,       // 1.2% 기본 변동 (대폭 증가!)
        maxDaily: 0.50,    // 일일 최대 ±50% (코인 특성)
        typical: 0.15,     // 일반적 일일 변동 ±15%
        momentum: 1.2,     // 높은 모멘텀 영향
    },
    bond: {
        base: 0.0002,      // 채권은 안정적으로 유지
        maxDaily: 0.02,
        typical: 0.005,
        momentum: 0.15,
    },
    commodity: {
        base: 0.002,       // 0.2% 기본 변동 (증가)
        maxDaily: 0.10,
        typical: 0.03,
        momentum: 0.4,
    }
}
// 호가 단위 (틱 사이즈) 계산 - 자산 유형별
export const getTickSize = (price, type = 'stock') => {
    // 코인 - 가격대별 틱 사이즈 (비트코인/알트코인 기준)
    if (type === 'crypto') {
        if (price < 10) return 0.01        // 1원 미만 코인
        if (price < 100) return 0.1
        if (price < 1000) return 1
        if (price < 10000) return 5
        if (price < 100000) return 10
        if (price < 1000000) return 50
        if (price < 10000000) return 100
        return 500                          // 비트코인급
    }

    // 원자재 (금, 은, 원유 등)
    if (type === 'commodity') {
        if (price < 1000) return 1
        if (price < 10000) return 5
        if (price < 100000) return 10
        return 50
    }

    // 채권 (100,000원 기준)
    if (type === 'bond') {
        return 10  // 채권은 10원 단위
    }

    // 주식/ETF - 한국 증시 기준
    if (price < 1000) return 1
    if (price < 5000) return 5
    if (price < 10000) return 10
    if (price < 50000) return 50
    if (price < 100000) return 100
    if (price < 500000) return 500
    return 1000
}

// 가격을 호가 단위에 맞게 반올림
export const roundToTickSize = (price, type = 'stock') => {
    const tickSize = getTickSize(price, type)
    return Math.round(price / tickSize) * tickSize
}

// 현실적인 가격 변동 계산
export const calculatePriceChange = (stock, marketState = {}, gameDay = 0) => {
    const { trend = 0, volatility = 1, sectorTrends = {} } = marketState
    const type = stock.type || 'stock'
    const config = VOLATILITY_CONFIG[type] || VOLATILITY_CONFIG.stock

    // 기본 랜덤 워크 (정규분포에 가깝게)
    const randomFactor = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5
    let baseChange = randomFactor * config.base

    // 시장 전체 트렌드 영향
    baseChange += trend * config.base * 0.5

    // 섹터 트렌드 영향
    const sectorTrend = sectorTrends[stock.sector] || 0
    baseChange += sectorTrend * config.base * 0.8

    // 변동성 조절 (volatility는 const이므로 별도 변수에 누적)
    let volMultiplier = volatility
    if (stock.fundamentals) {
        // PER에 따른 변동성 조정: 고PER일수록 변동성 증가
        if (stock.fundamentals.pe) {
            const peFactor = 1 + (stock.fundamentals.pe - 20) * 0.005
            volMultiplier *= Math.max(0.8, Math.min(1.5, peFactor))
        }

        // 시가총액에 따른 변동성 (대형주 안정성, 소형주 변동성)
        if (stock.fundamentals.marketCap) {
            const cap = stock.fundamentals.marketCap
            if (cap > 50) volMultiplier *= 0.9 // 초대형주
            else if (cap > 20) volMultiplier *= 0.95 // 대형주
            else if (cap < 5) volMultiplier *= 1.15 // 중소형주
        }

        // 부채비율에 따른 리스크 (하락장에서 하락폭 확대)
        if (stock.fundamentals.debtRatio && stock.fundamentals.debtRatio > 150) {
            volMultiplier *= 1.1
            if (trend < 0) {
                baseChange -= 0.0003 // 부채 부담으로 인한 추가 하락 압력
            }
        }

        // 배당수익률(yield)에 따른 영향
        if (stock.fundamentals.yield) {
            // 배당수익률이 높으면 하락장에서 방어력 증가 (변동성 감소)
            if (stock.fundamentals.yield > 3.0) {
                volMultiplier *= 0.92
            }

            // 금리 대비 배당 매력도 (거시경제 금리보다 1.5%p 이상 높으면 매력적)
            const interestRate = (marketState.macro && marketState.macro.interestRate) || 3.5
            if (stock.fundamentals.yield > interestRate + 1.5) {
                baseChange += 0.0001 // 배당 매력으로 인한 소폭 매수세
            }
        }
    }
    baseChange *= volMultiplier

    // 모멘텀
    if (stock.momentum) {
        baseChange += stock.momentum * config.momentum * config.base
    }

    // 활성 뉴스 효과 적용
    activeNewsEffects.forEach(effect => {
        let impactMultiplier = 0
        if (effect.targetStockId === stock.id) {
            impactMultiplier = 1
        } else if (effect.targetSector === stock.sector) {
            impactMultiplier = 0.5
        } else if (effect.marketWide) {
            impactMultiplier = 0.3
        }
        baseChange += effect.currentImpact * impactMultiplier * 0.1
    })

    // 활성 글로벌 이벤트 영향
    if (activeGlobalEvent) {
        baseChange += activeGlobalEvent.currentImpact * 0.05
        // 섹터별 추가 영향
        if (activeGlobalEvent.sectors && activeGlobalEvent.sectors[stock.sector]) {
            baseChange += activeGlobalEvent.sectors[stock.sector] * activeGlobalEvent.intensity * 0.02
        }
    }

    // ETF 특수 처리 (레버리지/인버스)
    if (type === 'etf') {
        if (stock.category === 'leverage') {
            baseChange *= (stock.multiplier || 2)
        } else if (stock.category === 'inverse') {
            baseChange *= (stock.multiplier || -1)
        }
    }

    // 일일 변동폭 제한
    const dailyOpen = stock.dailyOpen || stock.basePrice
    const dailyChange = ((stock.price * (1 + baseChange)) - dailyOpen) / dailyOpen
    if (Math.abs(dailyChange) > config.maxDaily) {
        baseChange = 0
    }

    let newPrice = stock.price * (1 + baseChange)

    // 모든 자산 유형에 틱 사이즈 적용
    const tickSize = getTickSize(stock.price, type)
    const roundedPrice = roundToTickSize(newPrice, type)

    // 가격 변동이 있는데 반올림으로 똑같아지면 방향으로 1틱 이동
    if (roundedPrice === stock.price && baseChange !== 0) {
        // 확률적으로 1틱 변동 - 활발한 거래를 위해 확률 대폭 증가
        const moveChance = type === 'crypto' ? 0.6 : (type === 'bond' ? 0.25 : 0.45)
        if (Math.random() < moveChance) {
            newPrice = stock.price + (baseChange > 0 ? tickSize : -tickSize)
        } else {
            newPrice = stock.price
        }
    } else {
        newPrice = roundedPrice
    }

    // 최소 가격 설정 (자산 유형별)
    const minPrice = type === 'crypto' ? 0.01 : (type === 'bond' ? 90000 : (type === 'commodity' ? 1 : 100))
    return Math.max(minPrice, newPrice)
}

// 활성 뉴스 효과 업데이트
export const updateNewsEffects = () => {
    activeNewsEffects = activeNewsEffects
        .map(effect => ({
            ...effect,
            currentImpact: effect.currentImpact * 0.95,
            remainingTime: effect.remainingTime - 1
        }))
        .filter(effect => effect.remainingTime > 0 && Math.abs(effect.currentImpact) > 0.001)

    // 글로벌 이벤트 업데이트
    if (activeGlobalEvent) {
        activeGlobalEvent.remainingTime -= 1
        activeGlobalEvent.intensity *= 0.97 // 점점 약해짐
        if (activeGlobalEvent.remainingTime <= 0) {
            activeGlobalEvent = null
        }
    }
}

// 시장 상태 업데이트
export const updateMarketState = (prevState) => {
    // 1. 거시 경제 지표 업데이트 (매우 느리게 변화)
    const macro = prevState.macro || {
        interestRate: MACRO_CONFIG.interestRate.base,
        inflation: MACRO_CONFIG.inflation.base,
        gdpGrowth: MACRO_CONFIG.gdpGrowth.base
    }

    // 확률적으로 조금씩 변화 (0.1% 확률)
    if (Math.random() < 0.001) {
        macro.interestRate += (Math.random() - 0.5) * MACRO_CONFIG.interestRate.volatility
        macro.interestRate = Math.max(MACRO_CONFIG.interestRate.min, Math.min(MACRO_CONFIG.interestRate.max, macro.interestRate))
    }
    if (Math.random() < 0.001) {
        macro.inflation += (Math.random() - 0.5) * MACRO_CONFIG.inflation.volatility
        macro.inflation = Math.max(MACRO_CONFIG.inflation.min, Math.min(MACRO_CONFIG.inflation.max, macro.inflation))
    }
    if (Math.random() < 0.001) {
        macro.gdpGrowth += (Math.random() - 0.5) * MACRO_CONFIG.gdpGrowth.volatility
        macro.gdpGrowth = Math.max(MACRO_CONFIG.gdpGrowth.min, Math.min(MACRO_CONFIG.gdpGrowth.max, macro.gdpGrowth))
    }

    // 2. 거시 경제가 시장에 미치는 영향 계산
    let macroTrendBoost = 0
    // 금리가 낮을수록, GDP가 높을수록 시장에 긍정적
    macroTrendBoost += (MACRO_CONFIG.interestRate.base - macro.interestRate) * 0.02
    macroTrendBoost += (macro.gdpGrowth - MACRO_CONFIG.gdpGrowth.base) * 0.03
    macroTrendBoost -= (macro.inflation - MACRO_CONFIG.inflation.base) * 0.01

    let newTrend = prevState.trend * 0.98 + (Math.random() - 0.5) * 0.05 + macroTrendBoost * 0.01
    newTrend = Math.max(-0.5, Math.min(0.5, newTrend))

    let newVolatility = prevState.volatility * 0.95 + 1 * 0.05 + (Math.random() - 0.5) * 0.1

    // 글로벌 이벤트가 있으면 변동성 증가
    if (activeGlobalEvent && activeGlobalEvent.volatilityBoost) {
        newVolatility *= activeGlobalEvent.volatilityBoost
    }

    // 인플레이션이 높으면 변동성 증가
    if (macro.inflation > 4.0) {
        newVolatility *= 1.2
    }

    newVolatility = Math.max(0.5, Math.min(2.5, newVolatility))

    const sectorTrends = { ...prevState.sectorTrends }
    Object.keys(SECTORS).forEach(sector => {
        let current = sectorTrends[sector] || 0

        // 섹터별 거시경제 민감도
        let sensitivity = 0
        if (sector === 'tech' || sector === 'bio') {
            // 성장주는 금리에 민감 (금리 오르면 하락)
            sensitivity -= (macro.interestRate - MACRO_CONFIG.interestRate.base) * 0.05
        } else if (sector === 'finance') {
            // 금융주는 금리 오르면 이익 (상승)
            sensitivity += (macro.interestRate - MACRO_CONFIG.interestRate.base) * 0.04
        } else if (sector === 'energy' || sector === 'steel') {
            // 원자재/산업재는 인플레이션에 민감 (상승)
            sensitivity += (macro.inflation - MACRO_CONFIG.inflation.base) * 0.03
        }

        current = current * 0.95 + (Math.random() - 0.5) * 0.1 + sensitivity * 0.05
        sectorTrends[sector] = Math.max(-0.5, Math.min(0.5, current))
    })

    updateNewsEffects()

    return { trend: newTrend, volatility: newVolatility, sectorTrends, macro }
}

// 새 거래일 시작
export const startNewTradingDay = (stocks) => {
    return stocks.map(stock => ({
        ...stock,
        dailyOpen: stock.price,
        dailyHigh: stock.price,
        dailyLow: stock.price,
        prevClose: stock.dailyOpen || stock.basePrice,
        momentum: (stock.momentum || 0) * 0.5,
    }))
}

// 일일 고가/저가 업데이트
export const updateDailyRange = (stocks) => {
    return stocks.map(stock => ({
        ...stock,
        dailyHigh: Math.max(stock.dailyHigh || stock.price, stock.price),
        dailyLow: Math.min(stock.dailyLow || stock.price, stock.price),
    }))
}

// 뉴스 생성
// 최근 뉴스 컨텍스트 저장 (뉴스 일관성용)
let recentNewsContext = {
    lastSector: null,
    lastStock: null,
    lastType: null,
    trendStreak: 0,  // 연속으로 같은 방향 뉴스 수
    sectorMomentum: {}  // 섹터별 뉴스 모멘텀
}

export const generateNews = (stocks, probability = 0.03) => {
    if (Math.random() > probability) return null

    const types = ['positive', 'negative', 'market', 'fund_positive', 'fund_negative']
    let weights = [0.35, 0.25, 0.15, 0.15, 0.10]

    // 이전 뉴스 트렌드에 따라 가중치 조절 (일관성 부여)
    if (recentNewsContext.lastType) {
        if (recentNewsContext.trendStreak < 3) {
            // 같은 방향 뉴스가 이어질 확률 증가 (70%)
            if (recentNewsContext.lastType === 'positive' || recentNewsContext.lastType === 'fund_positive') {
                weights = [0.50, 0.15, 0.10, 0.20, 0.05]  // 호재 더 높음
            } else if (recentNewsContext.lastType === 'negative' || recentNewsContext.lastType === 'fund_negative') {
                weights = [0.15, 0.45, 0.10, 0.05, 0.25]  // 악재 더 높음
            }
        } else {
            // 4연속 같은 방향이면 반전 확률 증가
            if (recentNewsContext.lastType === 'positive' || recentNewsContext.lastType === 'fund_positive') {
                weights = [0.20, 0.40, 0.15, 0.10, 0.15]  // 악재로 반전
            } else {
                weights = [0.45, 0.15, 0.15, 0.20, 0.05]  // 호재로 반전
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

    // 이전 뉴스와 관련된 종목/섹터 우선 선택 (40% 확률)
    let targetStock
    if (recentNewsContext.lastSector && Math.random() < 0.4) {
        // 같은 섹터의 다른 종목
        const sameSectorStocks = stocksOnly.filter(s => s.sector === recentNewsContext.lastSector)
        targetStock = sameSectorStocks.length > 0 ? randomChoice(sameSectorStocks) : randomChoice(stocksOnly)
    } else if (recentNewsContext.lastStock && Math.random() < 0.2) {
        // 같은 종목 팔로업 뉴스
        targetStock = stocks.find(s => s.id === recentNewsContext.lastStock) || randomChoice(stocksOnly)
    } else {
        targetStock = randomChoice(stocksOnly.length > 0 ? stocksOnly : stocks)
    }

    const sector = SECTORS[targetStock.sector]

    const baseImpact = randomRange(template.impact[0] * 0.5, template.impact[1] * 0.5)

    let text = template.text
        .replace('{stock}', targetStock.name)
        .replace('{sector}', sector?.name || '시장')

    // 펀더멘털 데이터 치환
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

    // 뉴스 컨텍스트 업데이트
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

    // 섹터 모멘텀 업데이트
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
        followUp: recentNewsContext.trendStreak > 1  // 연속 뉴스 표시
    }
}

// 🌍 글로벌 특별 이벤트 생성
export const generateGlobalEvent = () => {
    // 이미 진행 중인 이벤트가 있으면 스킵
    if (activeGlobalEvent) return null

    // 확률 체크
    if (Math.random() > GLOBAL_EVENT_PROBABILITY) return null

    // 이벤트 타입 선택 (호재 45%, 악재 45%, 중립 10%)
    const rand = Math.random()
    let eventType
    if (rand < 0.45) {
        eventType = 'positive'
    } else if (rand < 0.90) {
        eventType = 'negative'
    } else {
        eventType = 'neutral'
    }

    const events = GLOBAL_CRISIS_EVENTS[eventType]
    if (!events || events.length === 0) return null

    const eventTemplate = randomChoice(events)
    const selectedName = randomChoice(eventTemplate.names)

    const text = eventTemplate.template.replace('{name}', selectedName)
    const impact = randomRange(eventTemplate.impact[0], eventTemplate.impact[1])

    // 글로벌 이벤트 활성화
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

// 뉴스 영향 적용
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
        } else if (news.targetSector && stock.sector === news.targetSector) {
            priceChange = news.impact * 0.7
            momentumBoost = news.impact * 0.5
        } else if (news.targetStockId === stock.id) {
            priceChange = news.impact
            momentumBoost = news.impact * 0.8
        }

        // ETF 레버리지/인버스 배수 적용
        if (stock.type === 'etf' && priceChange !== 0) {
            if (stock.category === 'leverage') {
                priceChange *= (stock.multiplier || 2)
            } else if (stock.category === 'inverse') {
                priceChange *= (stock.multiplier || -1)
            }
        }

        if (priceChange !== 0) {
            const dailyOpen = stock.dailyOpen || stock.basePrice
            let newPrice = stock.price * (1 + priceChange)
            const dailyChange = (newPrice - dailyOpen) / dailyOpen

            if (Math.abs(dailyChange) <= config.maxDaily) {
                // 호가 단위 적용
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

// 마켓 이벤트 생성
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

// 이벤트 효과 적용
export const applyEventEffect = (event, stocks, cash, portfolio) => {
    let newStocks = [...stocks]
    let newCash = cash
    let newPortfolio = { ...portfolio }
    let message = ''

    switch (event.type) {
        case 'ipo':
            // 이미 상장된 종목 제외
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
                    sector: candidate.sector === 'travel' || candidate.sector === 'service' ? 'retail' : candidate.sector, // 매핑
                    type: 'stock',
                    dailyOpen: candidate.basePrice,
                    dailyHigh: candidate.basePrice,
                    dailyLow: candidate.basePrice,
                    momentum: 0.5 // 신규 상장 버프
                }
                newStocks = [...stocks, newStock]
                message = `🔔 ${candidate.name} 신규 상장! (공모가: ${candidate.basePrice.toLocaleString()}원)`
            } else {
                message = '신규 상장 예정 기업 심사 중...'
            }
            break;

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

// 주문 처리
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

// 업적 체크
export const checkAchievements = (gameState, unlockedAchievements, ACHIEVEMENTS) => {
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

    return newUnlocks.map(id => ACHIEVEMENTS[id]).filter(Boolean)
}

// 활성 효과 가져오기
export const getActiveNewsEffects = () => activeNewsEffects
export const getActiveGlobalEvent = () => activeGlobalEvent

// 위기 이벤트 시스템 re-export
export { checkAndGenerateCrisis, calculateCrisisImpact, getActiveCrisis }

// 초기화
export const resetNewsEffects = () => {
    activeNewsEffects = []
    activeGlobalEvent = null
    resetCrisisState()
}

/**
 * 위기 이벤트를 포함한 통합 가격 업데이트
 * @param {Array} stocks - 주식 배열
 * @param {Object} marketState - 시장 상태
 * @param {number} currentDay - 현재 게임 일
 * @returns {Object} - 업데이트된 주식과 위기 이벤트 정보
 */
export const updatePricesWithCrisis = (stocks, marketState, currentDay) => {
    // 1. 위기 이벤트 체크 및 생성
    const crisisResult = checkAndGenerateCrisis(currentDay, marketState)
    const activeCrisis = getActiveCrisis()

    // 2. 위기가 있으면 각 종목에 영향 적용
    const updatedStocks = stocks.map(stock => {
        if (!activeCrisis) return stock

        // 위기 영향 계산
        const crisisImpact = calculateCrisisImpact(stock, currentDay)

        if (crisisImpact !== 0) {
            const priceChange = stock.price * crisisImpact
            let newPrice = stock.price + priceChange

            // 일일 제한 체크
            const dailyOpen = stock.dailyOpen || stock.basePrice
            const dailyChange = (newPrice - dailyOpen) / dailyOpen
            const maxDaily = stock.type === 'crypto' ? 0.5 : 0.15

            if (Math.abs(dailyChange) <= maxDaily) {
                // 호가 단위 적용
                const tickSize = getTickSize(stock.price, stock.type || 'stock')
                newPrice = Math.round(newPrice / tickSize) * tickSize

                return {
                    ...stock,
                    price: Math.max(100, newPrice),
                    momentum: (stock.momentum || 0) + crisisImpact * 0.5
                }
            }
        }

        return stock
    })

    return {
        stocks: updatedStocks,
        crisisEvent: crisisResult,
        activeCrisis
    }
}

// 게임 날짜/시간 계산
// 300초 = 1거래일 (실시간 5분 = 게임 1일)
// 시간은 10분 단위로 표시 (09:00 ~ 16:00, 총 42틱)
export const SECONDS_PER_DAY = 300
export const GAME_START_YEAR = 2020
export const DAYS_PER_YEAR = 365
export const MINUTES_PER_TICK = 10  // 10분 단위

// 시장 운영 시간
export const MARKET_OPEN_HOUR = 9
export const MARKET_CLOSE_HOUR = 16  // 16:00에 장 마감

// 계절 정의 (월 기준)
export const SEASONS = {
    spring: { months: [3, 4, 5], name: '봄', icon: '🌸' },
    summer: { months: [6, 7, 8], name: '여름', icon: '☀️' },
    autumn: { months: [9, 10, 11], name: '가을', icon: '🍂' },
    winter: { months: [12, 1, 2], name: '겨울', icon: '❄️' }
}

// 월별 일수
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

export const calculateGameDate = (gameStartTime, currentTime) => {
    const elapsedSeconds = Math.floor((currentTime - gameStartTime) / 1000)
    const totalDays = Math.floor(elapsedSeconds / SECONDS_PER_DAY)
    const secondsInDay = elapsedSeconds % SECONDS_PER_DAY

    // 연도, 월, 일 계산
    let remainingDays = totalDays
    let year = GAME_START_YEAR
    let month = 1
    let day = 1

    // 연도 계산
    while (remainingDays >= DAYS_PER_YEAR) {
        remainingDays -= DAYS_PER_YEAR
        year++
    }

    // 월, 일 계산
    for (let m = 0; m < 12; m++) {
        const daysInMonth = DAYS_IN_MONTH[m]
        if (remainingDays < daysInMonth) {
            month = m + 1
            day = remainingDays + 1
            break
        }
        remainingDays -= daysInMonth
    }

    // 시간 계산 (09:00 ~ 16:00, 7시간 = 420분 = 42틱)
    const tradingHours = MARKET_CLOSE_HOUR - MARKET_OPEN_HOUR  // 7시간
    const tradingMinutes = tradingHours * 60  // 420분
    const totalTicks = tradingMinutes / MINUTES_PER_TICK  // 42틱

    const currentTick = Math.floor((secondsInDay / SECONDS_PER_DAY) * totalTicks)
    const elapsedMinutes = currentTick * MINUTES_PER_TICK
    const hour = MARKET_OPEN_HOUR + Math.floor(elapsedMinutes / 60)
    const minute = elapsedMinutes % 60

    // 계절 결정
    let season = 'winter'
    for (const [seasonKey, seasonData] of Object.entries(SEASONS)) {
        if (seasonData.months.includes(month)) {
            season = seasonKey
            break
        }
    }

    // 시장 개장 여부 (09:00 ~ 15:50, 16:00 마감)
    const isMarketOpen = hour >= MARKET_OPEN_HOUR && hour < MARKET_CLOSE_HOUR
    const isMarketClosing = hour === 15 && minute >= 50  // 마감 임박

    // 1년 경과 여부 (12월 31일 16:00)
    const isYearEnd = month === 12 && day === 31 && hour >= 15 && minute >= 50
    const dayOfYear = totalDays % DAYS_PER_YEAR

    return {
        day: totalDays + 1,  // 총 경과 일수 (하위 호환)
        totalDays: totalDays + 1,
        year,
        month,
        dayOfMonth: day,
        dayOfYear: dayOfYear + 1,
        hour: Math.min(MARKET_CLOSE_HOUR, hour),
        minute,
        season,
        seasonInfo: SEASONS[season],
        isMarketOpen,
        isMarketClosing,
        isYearEnd,
        displayDate: `${year % 100}년 ${month}월 ${day}일`,
        displayTime: `${hour.toString().padStart(2, '0')}:${(Math.floor(minute / 10) * 10).toString().padStart(2, '0')}`,
        displaySeason: SEASONS[season].icon + SEASONS[season].name
    }
}

// 계절별 특별 이벤트 (새로 추가)
export const SEASONAL_EVENTS = {
    spring: [
        { id: 'cherry_blossom', text: '🌸 전국 벚꽃 축제 시작, 여행/레저 업종 수혜', impact: [0.03, 0.08], sectors: { entertainment: 0.1, retail: 0.05 } },
        { id: 'spring_rain', text: '🌧️ 봄비 지속으로 야외 활동 위축', impact: [-0.02, -0.05], sectors: { retail: -0.05 } },
        { id: 'new_semester', text: '📚 신학기 시즌, 교육/문구 관련주 상승', impact: [0.02, 0.05], sectors: { retail: 0.05 } },
        { id: 'spring_fashion', text: '👗 봄 패션 시즌, 의류/화장품 업종 호황', impact: [0.02, 0.06], sectors: { retail: 0.08 } },
    ],
    summer: [
        { id: 'heatwave', text: '🔥 기록적 폭염, 에어컨/음료 업종 급등', impact: [0.04, 0.10], sectors: { energy: 0.08, retail: 0.05 } },
        { id: 'monsoon_flood', text: '🌊 중부지방 집중호우, 건설/보험주 급락', impact: [-0.05, -0.12], sectors: { construction: -0.15, finance: -0.05 } },
        { id: 'vacation_boom', text: '✈️ 여름 휴가 시즌 본격화, 항공/여행주 상승', impact: [0.04, 0.09], sectors: { entertainment: 0.12 } },
        { id: 'summer_blackout', text: '⚡ 전력 수요 폭증, 전력난 우려', impact: [-0.03, -0.07], sectors: { energy: -0.05 } },
        { id: 'ice_cream_sales', text: '🍦 아이스크림/음료 판매 역대 최고', impact: [0.02, 0.05], sectors: { retail: 0.06 } },
    ],
    autumn: [
        { id: 'fall_foliage', text: '🍁 단풍 시즌 개막, 관광업 특수', impact: [0.02, 0.06], sectors: { entertainment: 0.08 } },
        { id: 'hit_drama', text: '🎬 인기 드라마 열풍, 콘텐츠 업종 급등', impact: [0.05, 0.12], sectors: { entertainment: 0.15, tech: 0.05 } },
        { id: 'chuseok', text: '🎑 추석 연휴 소비 증가, 유통업 호황', impact: [0.03, 0.07], sectors: { retail: 0.10 } },
        { id: 'harvest_festival', text: '🌾 풍년 예상, 농산물 가격 안정', impact: [0.01, 0.03], sectors: {} },
        { id: 'iphone_release', text: '📱 신형 스마트폰 출시, IT 부품주 급등', impact: [0.04, 0.10], sectors: { tech: 0.12, semiconductor: 0.08 } },
    ],
    winter: [
        { id: 'heavy_snow', text: '❄️ 전국 폭설, 교통 마비로 물류 차질', impact: [-0.04, -0.08], sectors: { auto: -0.08, construction: -0.05 } },
        { id: 'christmas', text: '🎄 크리스마스 쇼핑 시즌, 유통업 대목', impact: [0.04, 0.09], sectors: { retail: 0.12, entertainment: 0.06 } },
        { id: 'year_end_rally', text: '🎉 연말 랠리 기대감, 증시 상승 모드', impact: [0.03, 0.08], sectors: {} },
        { id: 'flu_outbreak', text: '🤒 독감 대유행, 제약/바이오주 급등', impact: [0.03, 0.08], sectors: { bio: 0.15 } },
        { id: 'heating_demand', text: '🔥 한파로 난방비 급등, 가스/에너지주 상승', impact: [0.02, 0.06], sectors: { energy: 0.10 } },
        { id: 'ski_season', text: '⛷️ 스키 시즌 개막, 레저 업종 호황', impact: [0.02, 0.05], sectors: { entertainment: 0.06 } },
    ]
}

// 계절 이벤트 생성 (확률적)
export const generateSeasonalEvent = (season, probability = 0.01) => {
    if (Math.random() > probability) return null

    const events = SEASONAL_EVENTS[season]
    if (!events || events.length === 0) return null

    const event = events[Math.floor(Math.random() * events.length)]
    const impact = event.impact[0] + Math.random() * (event.impact[1] - event.impact[0])

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
        icon: SEASONS[season].icon
    }
}

// 모든 종목 가격 일괄 계산 (ETF 연동 처리, 시장 시간 적용)
export const calculateAllStockPrices = (stocks, marketState, gameDay, gameTime = null) => {
    const results = {}

    // 시장 개장 여부 확인 (코인은 항상 거래)
    const isMarketOpen = gameTime ? gameTime.isMarketOpen : true

    // 1. 독립적인 종목(기초자산이 없는 종목) 먼저 계산
    const independentStocks = stocks.filter(s => !s.baseStockId)
    independentStocks.forEach(stock => {
        const type = stock.type || 'stock'

        // 코인은 24시간 거래, 나머지는 시장 시간에만 거래
        if (type !== 'crypto' && !isMarketOpen) {
            // 장 외 시간: 가격 변동 없음
            results[stock.id] = {
                newPrice: stock.price,
                changeRate: 0,
                marketClosed: true
            }
            return
        }

        // 시가총액 기반 변동성 조절
        let marketCapMultiplier = 1.0
        if (stock.fundamentals?.marketCap) {
            const cap = stock.fundamentals.marketCap
            if (cap >= 100) {
                // 대형주 (100조 이상): 안정적 (0.6~0.8배)
                marketCapMultiplier = 0.6 + Math.random() * 0.2
            } else if (cap >= 30) {
                // 중대형주 (30~100조): 보통 (0.8~1.0배)
                marketCapMultiplier = 0.8 + Math.random() * 0.2
            } else if (cap >= 10) {
                // 중형주 (10~30조): 약간 높음 (1.0~1.3배)
                marketCapMultiplier = 1.0 + Math.random() * 0.3
            } else if (cap >= 1) {
                // 소형주 (1~10조): 높음 (1.3~1.8배)
                marketCapMultiplier = 1.3 + Math.random() * 0.5
            } else {
                // 초소형주 (1조 미만): 매우 높음 (1.5~2.5배)
                marketCapMultiplier = 1.5 + Math.random() * 1.0
            }
        }

        const newPrice = calculatePriceChange(stock, { ...marketState, volatility: (marketState.volatility || 1) * marketCapMultiplier }, gameDay)
        const changeRate = (newPrice - stock.price) / stock.price
        results[stock.id] = {
            newPrice,
            changeRate,
            marketCapMultiplier
        }
    })

    // 2. 종속적인 종목(ETF 등) 계산
    const dependentStocks = stocks.filter(s => s.baseStockId)
    dependentStocks.forEach(stock => {
        const type = stock.type || 'etf'

        // ETF도 시장 시간에만 거래
        if (type !== 'crypto' && !isMarketOpen) {
            results[stock.id] = {
                newPrice: stock.price,
                changeRate: 0,
                marketClosed: true
            }
            return
        }

        const baseResult = results[stock.baseStockId]
        let newPrice = stock.price

        if (baseResult && !baseResult.marketClosed) {
            // 기초자산의 변동률을 그대로 따라감 (레버리지 적용)
            const multiplier = stock.multiplier || 1
            const targetChangeRate = baseResult.changeRate * multiplier

            // 약간의 괴리율 (Tracking Error) 추가 (0.01% ~ 0.05%)
            const trackingError = (Math.random() - 0.5) * 0.0005

            const finalChangeRate = targetChangeRate + trackingError

            newPrice = stock.price * (1 + finalChangeRate)

            // 호가 단위 적용 (ETF도)
            if (stock.type === 'etf') {
                newPrice = roundToTickSize(newPrice, 'etf')
            } else {
                newPrice = Math.round(newPrice)
            }
        } else if (!baseResult || baseResult.marketClosed) {
            // 기초자산이 장 마감이면 ETF도 마감
            results[stock.id] = {
                newPrice: stock.price,
                changeRate: 0,
                marketClosed: true
            }
            return
        } else {
            // 기초자산을 못 찾은 경우 독립적으로 계산 (fallback)
            newPrice = calculatePriceChange(stock, marketState, gameDay)
        }

        const minPrice = stock.type === 'crypto' ? 0.01 : 100
        newPrice = Math.max(minPrice, newPrice)

        results[stock.id] = {
            newPrice,
            changeRate: (newPrice - stock.price) / stock.price
        }
    })

    return results
}

