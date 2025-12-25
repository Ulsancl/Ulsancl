/**
 * engine/index.js - 게임 엔진 통합 모듈
 * 모든 엔진 모듈을 중앙에서 export
 */

// 가격 계산기
export {
    VOLATILITY_CONFIG,
    getTickSize,
    roundToTickSize,
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
    resetNewsSystem
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
    GAME_SPEED,
    SECONDS_PER_DAY,
    MARKET_START_HOUR,
    MARKET_END_HOUR,
    calculateGameDate,
    updateMarketState,
    isMarketHours
} from './marketState'

// 기존 gameEngine의 함수들 (호환성 유지)
// 점진적 마이그레이션을 위해 기존 gameEngine에서 re-export
export {
    calculateAllStockPrices,
    generateSeasonalEvent,
    updatePricesWithCrisis,
    getActiveCrisis
} from '../gameEngine'
