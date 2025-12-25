/**
 * Game 모듈 인덱스
 * 게임 시스템 관련 모듈 중앙 export
 */

// 포트폴리오 분석
export {
    calculateSectorDistribution,
    calculateConcentrationRisk,
    calculatePortfolioBeta,
    calculateVaR,
    analyzePerformance,
    calculatePortfolioHealth
} from './PortfolioAnalyzer'

// 자동 매매 봇
export {
    BOT_STRATEGIES,
    executeStrategy,
    TradingBot
} from './TradingBot'

// 경제 위기 이벤트
export {
    CRISIS_TYPES,
    BOOM_EVENTS,
    checkAndGenerateCrisis,
    calculateCrisisImpact,
    getActiveCrisis,
    triggerCrisis,
    resetCrisis
} from './CrisisEvents'

// 기술적 분석
export {
    calculateSMA,
    calculateEMA,
    calculateRSI,
    calculateMACD,
    calculateBollingerBands,
    calculateStochastic,
    calculateATR,
    calculateSupportResistance,
    analyzeTrend,
    generateSignals
} from './TechnicalAnalysis'

// 챌린지 시스템
export {
    SCENARIOS,
    DAILY_CHALLENGES,
    WEEKLY_CHALLENGES,
    ChallengeManager
} from './ChallengeSystem'

// 고급 알림 시스템
export {
    ALERT_TYPES,
    createAlert,
    checkAlerts as checkAdvancedAlerts,
    generateSmartAlerts,
    groupAlertsByStock
} from './AdvancedAlerts'

// 추가 업적
export { ADVANCED_ACHIEVEMENTS } from './AdvancedAchievements'
