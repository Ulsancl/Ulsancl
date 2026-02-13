import { lazy, Suspense } from 'react'
import ErrorBoundary from './ErrorBoundary'
import { AchievementPopup, AchievementsPanel } from './Achievements'
import TradeHistory from './TradeHistory'
import OrderManager from './OrderManager'
import MissionsPanel from './Missions'
import SettingsPanel from './Settings'
import Watchlist from './Watchlist'
import AlertManager from './AlertManager'
import SkillsPanel from './SkillsPanel'
import { useModal, MODAL_NAMES } from '../context'

const StockChartModal = lazy(() => import('./StockModal'))
const AssetChart = lazy(() => import('./AssetChart'))
const StatisticsPanel = lazy(() => import('./Statistics'))
const SeasonEndModal = lazy(() => import('./SeasonEnd'))
const LeaderboardPanel = lazy(() => import('./LeaderboardPanel'))

const lazyFallback = <div className="modal-loading-fallback">로딩 중...</div>

const AppModalsContainer = ({
    stocks,
    stocksById,
    tradeHistory,
    assetHistory,
    portfolio,
    shortPositions,
    cash,
    watchlist,
    alerts,
    settings,
    unlockedAchievements,
    unlockedSkills,
    totalXp,
    totalAssets,
    missionProgress,
    completedMissions,
    availableSkillPoints,
    gameYear,
    initialCapital,
    totalProfit,
    totalTrades,
    winStreak,
    maxWinStreak,
    canShortSell,
    tradeLogApi,
    onClaimMissionReward,
    onUpgradeSkill,
    onUpdateSettings,
    onToggleWatchlist,
    onAddAlert,
    onRemoveAlert,
    onPlaceOrder,
    onShortSell,
    onCoverShort,
    onStartNewSeason
}) => {
    const {
        activeModal,
        modalData,
        closeModal,
        achievementPopup,
        openChart,
        openOrderManager
    } = useModal()

    const { chartStock, orderManagerStock, orderManagerSide } = modalData
    const isOpen = (name) => activeModal === name

    return (
        <>
            {achievementPopup && (
                <AchievementPopup achievement={achievementPopup} onClose={() => closeModal()} />
            )}

            {isOpen(MODAL_NAMES.ACHIEVEMENTS) && (
                <AchievementsPanel
                    unlockedAchievements={unlockedAchievements}
                    totalXp={totalXp}
                    onClose={() => closeModal(MODAL_NAMES.ACHIEVEMENTS)}
                />
            )}

            {isOpen(MODAL_NAMES.TRADE_HISTORY) && (
                <TradeHistory
                    trades={tradeHistory}
                    stocks={stocks}
                    onClose={() => closeModal(MODAL_NAMES.TRADE_HISTORY)}
                />
            )}

            {isOpen(MODAL_NAMES.MISSIONS) && (
                <MissionsPanel
                    missionProgress={missionProgress}
                    completedMissions={completedMissions}
                    onClaimReward={onClaimMissionReward}
                    onClose={() => closeModal(MODAL_NAMES.MISSIONS)}
                />
            )}

            {isOpen(MODAL_NAMES.LEADERBOARD) && (
                <Suspense fallback={lazyFallback}>
                    <LeaderboardPanel isOpen onClose={() => closeModal(MODAL_NAMES.LEADERBOARD)} />
                </Suspense>
            )}

            {isOpen(MODAL_NAMES.SETTINGS) && (
                <SettingsPanel
                    settings={settings}
                    onUpdateSettings={onUpdateSettings}
                    onClose={() => closeModal(MODAL_NAMES.SETTINGS)}
                />
            )}

            {isOpen(MODAL_NAMES.ASSET_CHART) && (
                <Suspense fallback={lazyFallback}>
                    <AssetChart
                        assetHistory={assetHistory}
                        onClose={() => closeModal(MODAL_NAMES.ASSET_CHART)}
                    />
                </Suspense>
            )}

            {isOpen(MODAL_NAMES.WATCHLIST) && (
                <Watchlist
                    watchlist={watchlist}
                    stocks={stocks}
                    onToggleWatch={onToggleWatchlist}
                    onStockClick={openChart}
                    onClose={() => closeModal(MODAL_NAMES.WATCHLIST)}
                />
            )}

            {isOpen(MODAL_NAMES.STATISTICS) && (
                <Suspense fallback={lazyFallback}>
                    <StatisticsPanel
                        tradeHistory={tradeHistory}
                        assetHistory={assetHistory}
                        totalAssets={totalAssets}
                        onClose={() => closeModal(MODAL_NAMES.STATISTICS)}
                    />
                </Suspense>
            )}

            {isOpen(MODAL_NAMES.ALERT_MANAGER) && (
                <AlertManager
                    alerts={alerts}
                    stocks={stocks}
                    onAddAlert={onAddAlert}
                    onRemoveAlert={onRemoveAlert}
                    onClose={() => closeModal(MODAL_NAMES.ALERT_MANAGER)}
                />
            )}

            {isOpen(MODAL_NAMES.SKILLS) && (
                <SkillsPanel
                    unlockedSkills={unlockedSkills}
                    skillPoints={availableSkillPoints}
                    onUpgradeSkill={onUpgradeSkill}
                    onClose={() => closeModal(MODAL_NAMES.SKILLS)}
                />
            )}

            {isOpen(MODAL_NAMES.SEASON_END) && (
                <Suspense fallback={lazyFallback}>
                    <SeasonEndModal
                        year={gameYear}
                        totalAssets={totalAssets}
                        initialCapital={initialCapital}
                        totalProfit={totalProfit}
                        totalTrades={totalTrades}
                        winStreak={winStreak}
                        maxWinStreak={maxWinStreak}
                        tradeHistory={tradeHistory}
                        unlockedAchievements={unlockedAchievements}
                        assetHistory={assetHistory}
                        tradeLogApi={tradeLogApi}
                        onStartNewSeason={onStartNewSeason}
                        onClose={() => closeModal(MODAL_NAMES.SEASON_END)}
                    />
                </Suspense>
            )}

            {orderManagerStock && (
                <OrderManager
                    stock={orderManagerStock}
                    currentPrice={stocksById.get(orderManagerStock.id)?.price || orderManagerStock.price}
                    portfolio={portfolio}
                    shortPositions={shortPositions}
                    cash={cash}
                    canShortSell={canShortSell}
                    onPlaceOrder={onPlaceOrder}
                    onShortSell={onShortSell}
                    onCoverShort={onCoverShort}
                    onClose={() => closeModal(MODAL_NAMES.ORDER_MANAGER)}
                    initialSide={orderManagerSide}
                />
            )}

            {chartStock && (
                <ErrorBoundary
                    fallback={({ reset }) => (
                        <div
                            className="chart-modal-overlay"
                            onClick={() => {
                                reset()
                                closeModal(MODAL_NAMES.CHART)
                            }}
                            data-testid="chart-modal-overlay"
                        >
                            <div
                                className="chart-modal"
                                onClick={(event) => event.stopPropagation()}
                                style={{ maxWidth: '400px', padding: '40px', textAlign: 'center' }}
                                data-testid="chart-modal"
                            >
                                <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
                                <h3 style={{ marginBottom: '12px' }}>차트 로딩 오류</h3>
                                <p style={{ color: '#888', marginBottom: '20px' }}>
                                    차트 데이터를 불러오는 중 문제가 발생했습니다.
                                </p>
                                <button
                                    onClick={() => {
                                        reset()
                                        closeModal(MODAL_NAMES.CHART)
                                    }}
                                    style={{
                                        padding: '12px 24px',
                                        background: 'var(--color-accent)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: 'white',
                                        cursor: 'pointer'
                                    }}
                                >
                                    닫기
                                </button>
                            </div>
                        </div>
                    )}
                    onReset={() => closeModal(MODAL_NAMES.CHART)}
                >
                    <Suspense fallback={lazyFallback}>
                        <StockChartModal
                            stock={chartStock}
                            onClose={() => closeModal(MODAL_NAMES.CHART)}
                            currentPrice={stocksById.get(chartStock.id)?.price || chartStock.price}
                            portfolio={portfolio}
                            shortPositions={shortPositions}
                            canShortSell={canShortSell}
                            onOpenOrder={openOrderManager}
                        />
                    </Suspense>
                </ErrorBoundary>
            )}
        </>
    )
}

export default AppModalsContainer
