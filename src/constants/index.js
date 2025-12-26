/**
 * Constants 통합 인덱스
 * 모든 상수를 한 곳에서 re-export
 * 
 * 기존 코드 호환성을 위해 기존 constants.js에서 import하던 것과
 * 동일한 방식으로 사용 가능
 */

// 주식 데이터
export {
    INITIAL_STOCKS,
    INITIAL_CAPITAL,
    SECTORS,
    DIVIDEND_RATES
} from './stocks'

// 업적 시스템
export {
    ACHIEVEMENTS,
    LEVELS,
    MISSIONS
} from './achievements'

// 거래 설정
export {
    ORDER_TYPES,
    MARKET_HOURS,
    LEVERAGE_OPTIONS,
    SHORT_SELLING,
    CREDIT_TRADING,
    ALERT_TYPES,
    STATISTICS_METRICS,
    SOUNDS,
    THEMES,
    BOT_STRATEGIES,
    TIME_ATTACK_MODES,
    MARKET_EVENTS,
    IPO_CANDIDATES
} from './trading'

// 뉴스/매크로/스킬/파생상품
export {
    NEWS_TEMPLATES,
    GLOBAL_CRISIS_EVENTS,
    GLOBAL_EVENT_PROBABILITY
} from './news'

export {
    ETF_PRODUCTS,
    CRYPTO_PRODUCTS,
    BOND_PRODUCTS,
    COMMODITY_PRODUCTS
} from './products'

export {
    MACRO_CONFIG,
    MACRO_EVENTS
} from './macro'

export {
    SKILLS
} from './skills'
