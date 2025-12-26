import React from 'react'
import ErrorBoundary from './ErrorBoundary'
import StockChartModal from './StockModal'
import { AchievementPopup, AchievementsPanel } from './Achievements'
import TradeHistory from './TradeHistory'
import OrderManager from './OrderManager'
import MissionsPanel from './Missions'
import Leaderboard from './Leaderboard'
import SettingsPanel from './Settings'
import AssetChart from './AssetChart'
import Watchlist from './Watchlist'
import StatisticsPanel from './Statistics'
import AlertManager from './AlertManager'
import SeasonEndModal from './SeasonEnd'
import SkillsPanel from './SkillsPanel'

const AppModalsContainer = ({
  achievementPopup,
  onCloseAchievementPopup,
  showAchievements,
  unlockedAchievements,
  totalXp,
  onCloseAchievements,
  showTradeHistory,
  tradeHistory,
  stocks,
  onCloseTradeHistory,
  showMissions,
  missionProgress,
  completedMissions,
  onClaimMissionReward,
  onCloseMissions,
  showLeaderboard,
  totalAssets,
  profitRate,
  playerName,
  onCloseLeaderboard,
  onSaveScore,
  showSettings,
  settings,
  onUpdateSettings,
  onCloseSettings,
  showAssetChart,
  assetHistory,
  onCloseAssetChart,
  showWatchlist,
  watchlist,
  onToggleWatchlist,
  onShowChart,
  onCloseWatchlist,
  showStatistics,
  onCloseStatistics,
  showAlertManager,
  alerts,
  onAddAlert,
  onRemoveAlert,
  onCloseAlertManager,
  orderManagerStock,
  orderManagerSide,
  portfolio,
  cash,
  onPlaceOrder,
  onCloseOrderManager,
  showSkills,
  unlockedSkills,
  availableSkillPoints,
  onUpgradeSkill,
  onCloseSkills,
  showSeasonEnd,
  gameYear,
  initialCapital,
  totalProfit,
  totalTrades,
  winStreak,
  maxWinStreak,
  onStartNewSeason,
  onCloseSeasonEnd,
  chartStock,
  stocksById,
  onCloseChartStock,
  onOpenOrder
}) => (
  <>
    {achievementPopup && (
      <AchievementPopup
        achievement={achievementPopup}
        onClose={onCloseAchievementPopup}
      />
    )}
    {showAchievements && (
      <AchievementsPanel
        unlockedAchievements={unlockedAchievements}
        totalXp={totalXp}
        onClose={onCloseAchievements}
      />
    )}
    {showTradeHistory && (
      <TradeHistory trades={tradeHistory} stocks={stocks} onClose={onCloseTradeHistory} />
    )}
    {showMissions && (
      <MissionsPanel
        missionProgress={missionProgress}
        completedMissions={completedMissions}
        onClaimReward={onClaimMissionReward}
        onClose={onCloseMissions}
      />
    )}
    {showLeaderboard && (
      <Leaderboard
        currentScore={{ totalAssets, profitRate }}
        playerName={playerName}
        onClose={onCloseLeaderboard}
        onSaveScore={onSaveScore}
      />
    )}
    {showSettings && (
      <SettingsPanel settings={settings} onUpdateSettings={onUpdateSettings} onClose={onCloseSettings} />
    )}
    {showAssetChart && (
      <AssetChart assetHistory={assetHistory} onClose={onCloseAssetChart} />
    )}
    {showWatchlist && (
      <Watchlist
        watchlist={watchlist}
        stocks={stocks}
        onToggleWatch={onToggleWatchlist}
        onStockClick={onShowChart}
        onClose={onCloseWatchlist}
      />
    )}
    {showStatistics && (
      <StatisticsPanel
        tradeHistory={tradeHistory}
        assetHistory={assetHistory}
        totalAssets={totalAssets}
        onClose={onCloseStatistics}
      />
    )}
    {showAlertManager && (
      <AlertManager
        alerts={alerts}
        stocks={stocks}
        onAddAlert={onAddAlert}
        onRemoveAlert={onRemoveAlert}
        onClose={onCloseAlertManager}
      />
    )}
    {orderManagerStock && (
      <OrderManager
        stock={orderManagerStock}
        currentPrice={stocksById.get(orderManagerStock.id)?.price || orderManagerStock.price}
        portfolio={portfolio}
        cash={cash}
        onPlaceOrder={onPlaceOrder}
        onClose={onCloseOrderManager}
        initialSide={orderManagerSide}
      />
    )}
    {showSkills && (
      <SkillsPanel
        unlockedSkills={unlockedSkills}
        skillPoints={availableSkillPoints}
        onUpgradeSkill={onUpgradeSkill}
        onClose={onCloseSkills}
      />
    )}

    {showSeasonEnd && (
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
        onStartNewSeason={onStartNewSeason}
        onClose={onCloseSeasonEnd}
      />
    )}

    {chartStock && (
      <ErrorBoundary
        fallback={({ reset }) => (
          <div className="chart-modal-overlay" onClick={() => { reset(); onCloseChartStock(); }}>
            <div className="chart-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
              <h3 style={{ marginBottom: '12px' }}>차트 로딩 오류</h3>
              <p style={{ color: '#888', marginBottom: '20px' }}>차트 데이터를 불러오는 중 문제가 발생했습니다.</p>
              <button
                onClick={() => { reset(); onCloseChartStock(); }}
                style={{ padding: '12px 24px', background: 'var(--color-accent)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
              >
                닫기
              </button>
            </div>
          </div>
        )}
        onReset={onCloseChartStock}
      >
        <StockChartModal
          stock={chartStock}
          onClose={onCloseChartStock}
          currentPrice={stocksById.get(chartStock.id)?.price || chartStock.price}
          onOpenOrder={onOpenOrder}
        />
      </ErrorBoundary>
    )}
  </>
)

export default AppModalsContainer
