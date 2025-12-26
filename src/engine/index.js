/**
 * engine/index.js - 게임 엔진 통합 모듈
 * 모든 엔진 모듈을 중앙에서 export
 */

// 가격 계산기
export {
    VOLATILITY_CONFIG,
    getTickSize,
    roundToTickSize,
    getMinPrice,
    normalizePrice,
    calculatePriceChange,
    startNewTradingDay,
    updateDailyRange
} from './priceCalculator'

// 뉴스 시스템
export {
    getActiveNewsEffects,
    getActiveGlobalEvent,
    updateNewsEffects,
    generateNews,
    generateGlobalEvent,
    applyNewsImpact,
    resetNewsSystem,
    SEASONAL_EVENTS,
    generateSeasonalEvent
} from './newsSystem'

// 거래 시스템
export {
    processOrders,
    checkAchievements,
    generateMarketEvent,
    applyEventEffect
} from './tradingSystem'

// 시장 상태
export {
    SECONDS_PER_DAY,
    GAME_START_YEAR,
    DAYS_PER_YEAR,
    MINUTES_PER_TICK,
    MARKET_OPEN_HOUR,
    MARKET_CLOSE_HOUR,
    MARKET_START_HOUR,
    MARKET_END_HOUR,
    SEASONS,
    calculateGameDate,
    updateMarketState,
    isMarketHours
} from './marketState'

export {
    calculateAllStockPrices
} from './priceSimulation'

export {
    applyCrisisImpact,
    updatePricesWithCrisis,
    getActiveCrisis,
    checkAndGenerateCrisis,
    calculateCrisisImpact
} from './crisisSystem'
