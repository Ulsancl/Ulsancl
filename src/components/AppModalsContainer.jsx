/**
 * AppModalsContainer - Context 기반 모달 컨테이너
 * ModalContext를 활용하여 props drilling 제거
 */

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
import { useModal, MODAL_NAMES } from '../context'

/**
 * 리팩토링된 AppModalsContainer
 * 
 * Context에서 가져오는 것:
 * - activeModal, modalData, closeModal (모달 열림/닫힘 상태)
 * - achievementPopup, showConfetti
 * 
 * Props로 받는 것:
 * - 게임 데이터 (stocks, portfolio, cash, tradeHistory 등)
 * - 이벤트 핸들러 (onClaimMissionReward, onUpgradeSkill 등)
 */
const AppModalsContainer = ({
  // 게임 데이터
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
  profitRate,
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

  // 이벤트 핸들러
  onClaimMissionReward,
  onUpgradeSkill,
  onUpdateSettings,
  onToggleWatchlist,
  onAddAlert,
  onRemoveAlert,
  onPlaceOrder,
  onShortSell,
  onCoverShort,
  onStartNewSeason,
  showNotification
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

  // 헬퍼: 특정 모달이 열려있는지 확인
  const isOpen = (name) => activeModal === name

  return (
    <>
      {/* 업적 팝업 */}
      {achievementPopup && (
        <AchievementPopup
          achievement={achievementPopup}
          onClose={() => closeModal()}
        />
      )}

      {/* 업적 패널 */}
      {isOpen(MODAL_NAMES.ACHIEVEMENTS) && (
        <AchievementsPanel
          unlockedAchievements={unlockedAchievements}
          totalXp={totalXp}
          onClose={() => closeModal(MODAL_NAMES.ACHIEVEMENTS)}
        />
      )}

      {/* 거래 기록 */}
      {isOpen(MODAL_NAMES.TRADE_HISTORY) && (
        <TradeHistory
          trades={tradeHistory}
          stocks={stocks}
          onClose={() => closeModal(MODAL_NAMES.TRADE_HISTORY)}
        />
      )}

      {/* 미션 */}
      {isOpen(MODAL_NAMES.MISSIONS) && (
        <MissionsPanel
          missionProgress={missionProgress}
          completedMissions={completedMissions}
          onClaimReward={onClaimMissionReward}
          onClose={() => closeModal(MODAL_NAMES.MISSIONS)}
        />
      )}

      {/* 리더보드 */}
      {isOpen(MODAL_NAMES.LEADERBOARD) && (
        <Leaderboard
          currentScore={{ totalAssets, profitRate }}
          playerName={settings.playerName}
          onClose={() => closeModal(MODAL_NAMES.LEADERBOARD)}
          onSaveScore={() => showNotification('기록 저장됨!', 'success')}
        />
      )}

      {/* 설정 */}
      {isOpen(MODAL_NAMES.SETTINGS) && (
        <SettingsPanel
          settings={settings}
          onUpdateSettings={onUpdateSettings}
          onClose={() => closeModal(MODAL_NAMES.SETTINGS)}
        />
      )}

      {/* 자산 차트 */}
      {isOpen(MODAL_NAMES.ASSET_CHART) && (
        <AssetChart
          assetHistory={assetHistory}
          onClose={() => closeModal(MODAL_NAMES.ASSET_CHART)}
        />
      )}

      {/* 관심종목 */}
      {isOpen(MODAL_NAMES.WATCHLIST) && (
        <Watchlist
          watchlist={watchlist}
          stocks={stocks}
          onToggleWatch={onToggleWatchlist}
          onStockClick={openChart}
          onClose={() => closeModal(MODAL_NAMES.WATCHLIST)}
        />
      )}

      {/* 통계 */}
      {isOpen(MODAL_NAMES.STATISTICS) && (
        <StatisticsPanel
          tradeHistory={tradeHistory}
          assetHistory={assetHistory}
          totalAssets={totalAssets}
          onClose={() => closeModal(MODAL_NAMES.STATISTICS)}
        />
      )}

      {/* 알림 관리 */}
      {isOpen(MODAL_NAMES.ALERT_MANAGER) && (
        <AlertManager
          alerts={alerts}
          stocks={stocks}
          onAddAlert={onAddAlert}
          onRemoveAlert={onRemoveAlert}
          onClose={() => closeModal(MODAL_NAMES.ALERT_MANAGER)}
        />
      )}

      {/* 스킬 */}
      {isOpen(MODAL_NAMES.SKILLS) && (
        <SkillsPanel
          unlockedSkills={unlockedSkills}
          skillPoints={availableSkillPoints}
          onUpgradeSkill={onUpgradeSkill}
          onClose={() => closeModal(MODAL_NAMES.SKILLS)}
        />
      )}

      {/* 시즌 종료 */}
      {isOpen(MODAL_NAMES.SEASON_END) && (
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
          onClose={() => closeModal(MODAL_NAMES.SEASON_END)}
        />
      )}

      {/* 주문 관리자 */}
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

      {/* 차트 모달 */}
      {chartStock && (
        <ErrorBoundary
          fallback={({ reset }) => (
            <div className="chart-modal-overlay" onClick={() => { reset(); closeModal(MODAL_NAMES.CHART); }}>
              <div className="chart-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
                <h3 style={{ marginBottom: '12px' }}>차트 로딩 오류</h3>
                <p style={{ color: '#888', marginBottom: '20px' }}>차트 데이터를 불러오는 중 문제가 발생했습니다.</p>
                <button
                  onClick={() => { reset(); closeModal(MODAL_NAMES.CHART); }}
                  style={{ padding: '12px 24px', background: 'var(--color-accent)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
                >
                  닫기
                </button>
              </div>
            </div>
          )}
          onReset={() => closeModal(MODAL_NAMES.CHART)}
        >
          <StockChartModal
            stock={chartStock}
            onClose={() => closeModal(MODAL_NAMES.CHART)}
            currentPrice={stocksById.get(chartStock.id)?.price || chartStock.price}
            onOpenOrder={openOrderManager}
          />
        </ErrorBoundary>
      )}
    </>
  )
}

export default AppModalsContainer
