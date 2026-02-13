/**
 * Components 모듈 인덱스
 * 모든 컴포넌트를 중앙에서 export
 */

// 새로운 모듈화된 컴포넌트
export { StatCard, DashboardGrid, CreditTradingCard } from './DashboardCards'
export { Modal, Button, Badge, Card, ProgressBar, Tooltip, Amount, Spinner } from './CommonUI'
export { default as TechnicalChart } from './TechnicalChart'
export { CrisisAlert, CrisisStatusWidget, CrisisHistory, CrisisProbabilityMeter } from './CrisisUI'

// Phase 2에서 새로 추가된 컴포넌트
export { default as GameHeader } from './GameHeader'
export { default as DashboardPanel } from './DashboardPanel'
export { default as StockListItem } from './StockListItem'
export { default as TabSection } from './TabSection'
export { default as ViewSection } from './ViewSection'
export { default as TradeModeSection } from './TradeModeSection'
export { default as MarketSection } from './MarketSection'
export { default as NewsSection } from './NewsSection'
export { default as OrdersSection } from './OrdersSection'
export { default as AppModalsContainer } from './AppModalsContainer'
export { default as ErrorBoundary } from './ErrorBoundary'

// 기존 컴포넌트들 (점진적 마이그레이션을 위해 re-export)
// 추후 이 파일들을 components 폴더로 이동하면 경로만 수정하면 됨
export { default as StockChartModal } from './StockModal'
export { default as NewsFeed } from './NewsFeed'
export { LevelBadge, AchievementPopup, AchievementsPanel } from './Achievements'
export { default as TradeHistory } from './TradeHistory'
export { default as OrderManager, PendingOrders } from './OrderManager'
export { default as Heatmap, PortfolioPieChart } from './Heatmap'
export { default as MissionsPanel } from './Missions'
export { default as LeaderboardPanel } from './LeaderboardPanel'
export { default as SettingsPanel } from './Settings'
export { default as AssetChart } from './AssetChart'
export { default as Watchlist, WatchButton } from './Watchlist'
export { default as StatisticsPanel } from './Statistics'
export { default as AlertManager } from './AlertManager'
export { default as Confetti } from './Confetti'
export { default as SeasonEndModal } from './SeasonEnd'
export { default as MacroIndicators } from './MacroIndicators'
export { default as SkillsPanel } from './SkillsPanel'
export { default as TickerTape } from './TickerTape'
export { default as ToastManager } from './ToastManager'
export { default as ActionFeedback } from './ActionFeedback'
export { default as Tutorial } from './Tutorial'
export { default as OrderBook } from './OrderBook'
