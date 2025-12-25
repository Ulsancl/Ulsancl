/**
 * 게임 타입 정의
 */

// 주식/상품 기본 타입
export interface Stock {
    id: number
    name: string
    code: string
    price: number
    basePrice: number
    color: string
    type: 'stock' | 'etf' | 'crypto' | 'bond' | 'commodity'
    sector?: string
    volatility?: number
    dailyOpen?: number
    dailyHigh?: number
    dailyLow?: number
    fundamentals?: StockFundamentals
}

export interface StockFundamentals {
    marketCap: number
    pe: number
    eps: number
    yield: number
    revenue: number
    profit: number
    debtRatio: number
}

// 포트폴리오 타입
export interface PortfolioHolding {
    quantity: number
    totalCost: number
    leverage?: number
    firstBuyTime?: number
}

export interface Portfolio {
    [stockId: number]: PortfolioHolding
}

// 공매도 포지션 타입
export interface ShortPosition {
    quantity: number
    entryPrice: number
    margin: number
    openTime: number
}

export interface ShortPositions {
    [stockId: number]: ShortPosition
}

// 거래 기록 타입
export interface Trade {
    id: string
    type: 'buy' | 'sell' | 'short' | 'cover'
    stockId: number
    quantity: number
    price: number
    total: number
    profit?: number
    timestamp: number
}

// 주문 타입
export interface Order {
    id: string
    stockId: number
    type: 'limit' | 'stop' | 'stop-limit'
    side: 'buy' | 'sell'
    price: number
    quantity: number
    stopPrice?: number
    createdAt: number
    expiresAt?: number
}

// 뉴스 타입
export interface News {
    id: string
    text: string
    type: 'positive' | 'negative' | 'neutral'
    stockId?: number
    sector?: string
    impact: [number, number]
    timestamp: number
    read?: boolean
    icon?: string
    followUp?: boolean
}

// 게임 시간 타입
export interface GameTime {
    day: number
    hour: number
    minute: number
    displayDate: string
    displayTime: string
    year?: number
    month?: number
    dayOfMonth?: number
    season?: string
    isMarketOpen?: boolean
    isMarketClosing?: boolean
}

// 시장 상태 타입
export interface MarketState {
    trend: number
    volatility: number
    sectorTrends: { [sector: string]: number }
    macro?: MacroIndicators
}

export interface MacroIndicators {
    gdp: number
    inflation: number
    interestRate: number
    unemployment: number
}

// 업적 타입
export interface Achievement {
    id: string
    name: string
    description: string
    icon: string
    xp: number
    condition: (gameState: GameState) => boolean
}

// 미션 타입
export interface Mission {
    id: string
    name: string
    description: string
    target: number
    reward: number
    type: 'daily' | 'weekly' | 'permanent'
}

// 알림 타입
export interface Alert {
    id: string
    stockId: number
    type: 'price_above' | 'price_below' | 'profit_rate' | 'loss_rate' | 'news'
    value: number
    active: boolean
}

// 설정 타입
export interface Settings {
    theme: 'dark' | 'light'
    soundEnabled: boolean
    volume: number
    playerName: string
}

// 레벨 정보 타입
export interface LevelInfo {
    level: number
    name: string
    minXp: number
    progress: number
    xpToNext: number
}

// 전체 게임 상태 타입
export interface GameState {
    stocks: Stock[]
    cash: number
    portfolio: Portfolio
    shortPositions: ShortPositions
    creditUsed: number
    creditInterest: number
    tradeHistory: Trade[]
    pendingOrders: Order[]
    unlockedAchievements: { [id: string]: boolean }
    unlockedSkills: { [id: string]: number }
    totalXp: number
    totalTrades: number
    winStreak: number
    totalProfit: number
    news: News[]
    missionProgress: { [id: string]: number }
    completedMissions: { [id: string]: boolean }
    totalDividends: number
    assetHistory: AssetHistoryEntry[]
    watchlist: number[]
    alerts: Alert[]
    gameStartTime: number
    currentDay: number
    settings: Settings
}

export interface AssetHistoryEntry {
    timestamp: number
    totalAssets: number
    cash: number
    stockValue: number
}

// 계산된 자산 타입
export interface CalculatedAssets {
    stockValue: number
    shortValue: number
    grossAssets: number
    totalAssets: number
    profitRate: number
    marginRatio: number
    creditLimitRatio: number
    maxCreditLimit: number
    availableCredit: number
    totalDebt: number
    safeCash: number
    safeCreditUsed: number
    safeCreditInterest: number
}

// 토스트 타입
export interface Toast {
    id: string
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
    subMessage?: string
    duration: number
}

// 액션 피드백 타입
export interface FeedbackItem {
    id: string
    text: string
    type: 'profit' | 'loss' | 'neutral'
    x: number
    y: number
}

// 모달 타입
export type ModalType =
    | 'chart'
    | 'achievements'
    | 'tradeHistory'
    | 'missions'
    | 'leaderboard'
    | 'settings'
    | 'assetChart'
    | 'watchlist'
    | 'statistics'
    | 'alertManager'
    | 'orderManager'
    | 'skills'
    | 'seasonEnd'
    | 'tutorial'
    | null

// 위기 이벤트 타입
export interface CrisisEvent {
    id: string
    name: string
    type: 'financial' | 'pandemic' | 'geopolitical' | 'natural' | 'market'
    severity: 'minor' | 'moderate' | 'major' | 'catastrophic'
    icon: string
    description: string
    baseImpact: [number, number]
    duration: number
    sectorImpacts?: { [sector: string]: number }
    startDay?: number
    remainingDays?: number
}

export interface CrisisHistory {
    crisis: CrisisEvent
    startDay: number
    endDay: number
    peakImpact: number
}

// 레버리지 옵션 타입
export interface LeverageOption {
    id: string
    label: string
    multiplier: number
    minLevel: number
}

// 스킬 타입
export interface Skill {
    id: string
    name: string
    description: string
    icon: string
    maxLevel: number
    cost: number
    tier: number
    effects: { [level: number]: string }
}

// 컴포넌트 Props 타입
export interface GameHeaderProps {
    gameTime: GameTime
    totalXp: number
    onShowSkills: () => void
    onShowMissions: () => void
    onShowAchievements: () => void
    onShowLeaderboard: () => void
    onShowStatistics: () => void
    onShowWatchlist: () => void
    onShowAlertManager: () => void
    onShowTradeHistory: () => void
    onShowSettings: () => void
}

export interface DashboardPanelProps {
    totalAssets: number
    profitRate: number
    cash: number
    stockValue: number
    canUseCredit: boolean
    marginCallActive: boolean
    creditUsed: number
    creditInterest: number
    maxCreditLimit: number
    availableCredit: number
    onBorrowCredit: (amount: number) => void
    onRepayCredit: (amount: number) => void
    onShowAssetChart: () => void
}

export interface StockListItemProps {
    stock: Stock
    index: number
    isInitialized: boolean
    holding?: PortfolioHolding
    shortPosition?: ShortPosition
    priceChange?: 'up' | 'down' | 'same'
    isWatched: boolean
    estimatedQty: number
    tradeMode: 'long' | 'short'
    cash: number
    onToggleWatchlist: (stockId: number) => void
    onShowChart: (stock: Stock) => void
    onBuy: (stock: Stock, qty: number) => void
    onSellAll: (stock: Stock) => void
    onShortSell: (stock: Stock, qty: number) => void
    onCoverShort: (stock: Stock, qty: number) => void
    onOpenOrderManager: (stock: Stock, side: string) => void
    getProductTypeLabel: (type: string) => string
}
