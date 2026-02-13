/**
 * App.jsx - main app shell for the stock trading game
 * Composes contexts and game hooks into a single UI tree.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import './App.css'

// Constants and utilities
import {
  INITIAL_STOCKS,
  INITIAL_CAPITAL,
  ACHIEVEMENTS,
  ETF_PRODUCTS,
  CRYPTO_PRODUCTS,
  BOND_PRODUCTS,
  COMMODITY_PRODUCTS,
  SHORT_SELLING
} from './constants'
import { consumeSeasonResetNotice, formatNumber, formatCompact } from './utils'

// Game engine
import { checkAchievements, resetCrisisState, resetNewsSystem } from './engine'

// UI components
import {
  GameHeader,
  TabSection,
  ViewSection,
  DashboardPanel,
  MarketSection,
  NewsSection,
  OrdersSection,
  AppModalsContainer,
  Heatmap,
  PortfolioPieChart,
  Confetti,
  MacroIndicators,
  TickerTape,
  ToastManager,
  ActionFeedback,
  Tutorial,
  CrisisAlert,
  CrisisStatusWidget,
  CrisisProbabilityMeter
} from './components'
import useSound from './useSound'

// Context hooks
import { useSettings, useModal, MODAL_NAMES } from './context'
import {
  useGameState as usePersistentGameState,
  useTrading,
  useTradeLog,
  useToast,
  useFeedback,
  useUiState,
  useGameCalculations,
  useGameLoop
} from './hooks'

const PRODUCT_TYPE_LABELS = {
  etf: 'ETF',
  crypto: '코인',
  bond: '채권',
  commodity: '원자재'
}

const toTradeableProduct = (product, fallbackType = 'stock') => ({
  ...product,
  type: product.type || fallbackType,
  dailyOpen: product.price,
  dailyHigh: product.price,
  dailyLow: product.price
})

const ALL_PRODUCTS = [
  ...INITIAL_STOCKS.map((stock) => toTradeableProduct(stock, 'stock')),
  ...ETF_PRODUCTS.map((product) => toTradeableProduct(product)),
  ...CRYPTO_PRODUCTS.map((product) => toTradeableProduct(product)),
  ...BOND_PRODUCTS.map((product) => toTradeableProduct(product)),
  ...COMMODITY_PRODUCTS.map((product) => toTradeableProduct(product))
]

const filterStocksByTab = (stocks, activeTab) => {
  switch (activeTab) {
    case 'stocks':
      return stocks.filter((stock) => stock.type === 'stock' || !stock.type)
    case 'etf':
      return stocks.filter((stock) => stock.type === 'etf')
    case 'crypto':
      return stocks.filter((stock) => stock.type === 'crypto')
    case 'bond':
      return stocks.filter((stock) => stock.type === 'bond')
    case 'commodity':
      return stocks.filter((stock) => stock.type === 'commodity')
    default:
      return stocks
  }
}

const estimateQuantity = (stockPrice, inputAmount) => Math.floor((parseInt(inputAmount, 10) || 0) / stockPrice)


function App() {
  // Initialize all tradeable products (including daily open values)
  const allProducts = useMemo(() => ALL_PRODUCTS, [])

  // Load user settings
  const { settings, setSettings } = useSettings()

  // Modal context state
  const {
    openModal,
    closeModal,
    showConfetti,
    showAchievementPopup,
    activeTab,
    setActiveTab,
    activeView,
    setActiveView,
    activeCrisis,
    setActiveCrisis,
    crisisAlert,
    setCrisisAlert,
    setCrisisHistory,
    openChart,
    openOrderManager
  } = useModal()

  // Tutorial and season notice overlays
  const [showTutorial, setShowTutorial] = useState(false)
  const [showSeasonResetNotice, setShowSeasonResetNotice] = useState(false)

  // Trade input UI state
  const {
    quantity, setQuantity,
    amountMode, setAmountMode,
    inputAmount, setInputAmount,
    leverage,
    tradeMode, setTradeMode
  } = useUiState()

  const { toasts, removeToast, showNotification } = useToast()

  const {
    feedbackItems,
    addFeedback: addActionFeedback,
    removeFeedback
  } = useFeedback()

  const tradeLog = useTradeLog({
    initialCapital: INITIAL_CAPITAL
  })

  const handleNewUser = useCallback(() => {
    setShowTutorial(true)
  }, [])

  // Persistent game state
  const {
    isInitialized,
    stocks, setStocks,
    cash, setCash,
    portfolio, setPortfolio,
    shortPositions, setShortPositions,
    creditUsed, setCreditUsed,
    creditInterest, setCreditInterest,
    marginCallActive, setMarginCallActive,
    tradeHistory, setTradeHistory,
    pendingOrders, setPendingOrders,
    unlockedAchievements, setUnlockedAchievements,
    unlockedSkills, setUnlockedSkills,
    totalXp, setTotalXp,
    totalTrades, setTotalTrades,
    winStreak, setWinStreak,
    maxWinStreak, setMaxWinStreak,
    totalProfit, setTotalProfit,
    dailyTrades, setDailyTrades,
    dailyProfit, setDailyProfit,
    missionProgress, setMissionProgress,
    completedMissions, setCompletedMissions,
    news, setNews,
    assetHistory, setAssetHistory,
    watchlist, setWatchlist,
    alerts, setAlerts,
    setTotalDividends,
    gameStartTime,
    setCurrentDay,
    resetGameState
  } = usePersistentGameState({
    allProducts,
    settings,
    setSettings,
    onNewUser: handleNewUser
  })

  const [_priceHistory, setPriceHistory] = useState(() => {
    const initial = {}
    allProducts.forEach(stock => { initial[stock.id] = [stock.price] })
    return initial
  })
  const [priceChanges, setPriceChanges] = useState({})

  // In-game time state
  const [gameTime, setGameTime] = useState({ day: 1, hour: 9, minute: 0, displayDate: 'D+1', displayTime: '09:00' })

  // Market state
  const [marketState, setMarketState] = useState({ trend: 0, volatility: 1, sectorTrends: {} })

  // Sound controls
  const { playSound } = useSound(settings.soundEnabled, settings.volume)

  const {
    stocksById,
    levelInfo,
    canShortSell,
    canUseCredit,
    stockValue,
    totalAssets,
    profitRate,
    currentLeverage,
    maxCreditLimit,
    availableCredit,
    availableSkillPoints
  } = useGameCalculations({
    stocks,
    portfolio,
    shortPositions,
    cash,
    creditUsed,
    creditInterest,
    leverage,
    totalXp,
    unlockedSkills,
    initialCapital: INITIAL_CAPITAL
  })

  const {
    handleBuy,
    handleSellAll,
    handleShortSell,
    handleCoverShort,
    handlePlaceOrder,
    handleCancelOrder,
    handleBorrowCredit,
    handleRepayCredit
  } = useTrading({
    cash, setCash,
    portfolio, setPortfolio,
    shortPositions, setShortPositions,
    creditUsed, setCreditUsed,
    creditInterest, setCreditInterest,
    setTradeHistory,
    setPendingOrders,
    setTotalTrades,
    setDailyTrades,
    setDailyProfit,
    setTotalProfit,
    setWinStreak,
    unlockedSkills,
    currentLeverage,
    canUseCredit,
    canShortSell,
    availableCredit,
    showNotification,
    playSound,
    addActionFeedback,
    recordTrade: tradeLog.recordTrade,
    formatNumber,
    formatCompact
  })

  useEffect(() => {
    if (consumeSeasonResetNotice()) {
      setShowSeasonResetNotice(true)
    }
  }, [])

  // Stocks filtered by active product tab
  const filteredStocks = useMemo(() => filterStocksByTab(stocks, activeTab), [stocks, activeTab])

  // Bridge game loop season-end signal to modal
  const handleShowSeasonEnd = useCallback((show) => {
    if (show) {
      openModal(MODAL_NAMES.SEASON_END)
    } else {
      closeModal(MODAL_NAMES.SEASON_END)
    }
  }, [openModal, closeModal])

  useGameLoop({
    stocks,
    setStocks,
    cash,
    setCash,
    portfolio,
    setPortfolio,
    shortPositions,
    setShortPositions,
    creditUsed,
    setCreditUsed,
    creditInterest,
    setCreditInterest,
    marginCallActive,
    setMarginCallActive,
    setTradeHistory,
    pendingOrders,
    setPendingOrders,
    setTotalTrades,
    setDailyTrades,
    setDailyProfit,
    setTotalProfit,
    setWinStreak,
    setNews,
    alerts,
    setAlerts,
    setAssetHistory,
    setTotalDividends,
    unlockedSkills,
    gameStartTime,
    setCurrentDay,
    marketState,
    setMarketState,
    setGameTime,
    setPriceHistory,
    setPriceChanges,
    setShowSeasonEnd: handleShowSeasonEnd,
    setActiveCrisis,
    setCrisisAlert,
    setCrisisHistory,
    showNotification,
    playSound,
    formatNumber,
    onTick: tradeLog.advanceTick,
    recordTrade: tradeLog.recordTrade
  })

  const unlockAchievement = useCallback((id) => {
    if (unlockedAchievements[id]) return
    const ach = ACHIEVEMENTS[id]
    if (!ach) return

    setUnlockedAchievements(prev => ({ ...prev, [id]: true }))
    setTotalXp(prev => prev + ach.xp)
    showAchievementPopup(ach)
    playSound('achievement')
  }, [playSound, showAchievementPopup, setTotalXp, setUnlockedAchievements, unlockedAchievements])

  // Mission progress
  useEffect(() => {
    setMissionProgress({
      daily_trade_3: dailyTrades,
      daily_profit_1m: dailyProfit,
      daily_hold_5: Object.keys(portfolio).length,
      weekly_trade_20: totalTrades,
      weekly_profit_10m: totalProfit,
      weekly_streak: winStreak,
    })
  }, [dailyTrades, dailyProfit, portfolio, setMissionProgress, totalTrades, totalProfit, winStreak])

  useEffect(() => {
    setMaxWinStreak(prev => Math.max(prev, winStreak))
  }, [setMaxWinStreak, winStreak])

  // Achievement checks
  useEffect(() => {
    const gameState = { totalTrades, totalProfit, totalAssets, portfolio, tradeHistory, winStreak }
    const newUnlocks = checkAchievements(gameState, unlockedAchievements, ACHIEVEMENTS)
    newUnlocks.forEach(ach => unlockAchievement(ach.id))
  }, [portfolio, totalAssets, totalProfit, totalTrades, tradeHistory, unlockAchievement, unlockedAchievements, winStreak])

  // Mission rewards
  const handleClaimMissionReward = useCallback((mission) => {
    setCompletedMissions(prev => ({ ...prev, [mission.id]: true }))
    setCash(prev => prev + mission.reward.cash)
    setTotalXp(prev => prev + mission.reward.xp)
    showNotification(`🎁 ${mission.name} 보상 수령!`, 'success')
    playSound('achievement')
  }, [playSound, setCash, setCompletedMissions, setTotalXp, showNotification])

  const handleUpgradeSkill = useCallback((skill) => {
    setUnlockedSkills(prev => {
      const currentLevel = prev[skill.id] || 0
      if (currentLevel >= skill.maxLevel) return prev
      return { ...prev, [skill.id]: currentLevel + 1 }
    })
    showNotification(`${skill.name} 강화 성공!`, 'success')
    playSound('achievement')
  }, [playSound, setUnlockedSkills, showNotification])

  const toggleWatchlist = useCallback((stockId) => {
    setWatchlist(prev => prev.includes(stockId) ? prev.filter(id => id !== stockId) : [...prev, stockId])
  }, [setWatchlist])

  const getEstimatedQuantity = useCallback((stock) => estimateQuantity(stock.price, inputAmount), [inputAmount])

  const getProductTypeLabel = useCallback((type) => {
    return PRODUCT_TYPE_LABELS[type] || '주식'
  }, [])

  const handleStartNewSeason = useCallback(() => {
    closeModal(MODAL_NAMES.SEASON_END)
    resetGameState()
    tradeLog.reset()
    resetNewsSystem()
    resetCrisisState()
    showNotification(`🎉 ${gameTime.year + 1}년 시즌 시작!`, 'success')
  }, [closeModal, gameTime.year, resetGameState, showNotification, tradeLog])

  return (
    <div className={`app theme-${settings.theme}`}>
      <Confetti trigger={showConfetti} />
      <ToastManager toasts={toasts} removeToast={removeToast} />
      <ActionFeedback items={feedbackItems} onRemove={removeFeedback} />
      <Tutorial active={showTutorial} onClose={() => setShowTutorial(false)} />
      {showSeasonResetNotice && (
        <div
          className="season-reset-notice-overlay"
          data-testid="season-reset-notice-overlay"
          onClick={() => setShowSeasonResetNotice(false)}
        >
          <div className="season-reset-notice-modal" onClick={(e) => e.stopPropagation()}>
            <h3>신규 시즌 전환 안내</h3>
            <p>신규 시즌 전환으로 기존 로컬 진행 데이터가 초기화되었습니다.</p>
            <button data-testid="season-reset-notice-confirm" onClick={() => setShowSeasonResetNotice(false)}>확인</button>
          </div>
        </div>
      )}

      <AppModalsContainer
        stocks={stocks}
        stocksById={stocksById}
        tradeHistory={tradeHistory}
        assetHistory={assetHistory}
        portfolio={portfolio}
        shortPositions={shortPositions}
        cash={cash}
        watchlist={watchlist}
        alerts={alerts}
        settings={settings}
        unlockedAchievements={unlockedAchievements}
        unlockedSkills={unlockedSkills}
        totalXp={totalXp}
        totalAssets={totalAssets}
        profitRate={profitRate}
        missionProgress={missionProgress}
        completedMissions={completedMissions}
        availableSkillPoints={availableSkillPoints}
        gameYear={gameTime.year}
        initialCapital={INITIAL_CAPITAL}
        totalProfit={totalProfit}
        totalTrades={totalTrades}
        winStreak={winStreak}
        maxWinStreak={maxWinStreak}
        canShortSell={canShortSell}
        tradeLogApi={tradeLog}
        onClaimMissionReward={handleClaimMissionReward}
        onUpgradeSkill={handleUpgradeSkill}
        onUpdateSettings={setSettings}
        onToggleWatchlist={toggleWatchlist}
        onAddAlert={(a) => setAlerts(prev => [...prev, a])}
        onRemoveAlert={(id) => setAlerts(prev => prev.filter(a => a.id !== id))}
        onPlaceOrder={handlePlaceOrder}
        onShortSell={handleShortSell}
        onCoverShort={handleCoverShort}
        onStartNewSeason={handleStartNewSeason}
        showNotification={showNotification}
      />

      <GameHeader
        gameTime={gameTime}
        totalXp={totalXp}
        onShowSkills={() => openModal(MODAL_NAMES.SKILLS)}
        onShowMissions={() => openModal(MODAL_NAMES.MISSIONS)}
        onShowAchievements={() => openModal(MODAL_NAMES.ACHIEVEMENTS)}
        onShowLeaderboard={() => openModal(MODAL_NAMES.LEADERBOARD)}
        onShowStatistics={() => openModal(MODAL_NAMES.STATISTICS)}
        onShowWatchlist={() => openModal(MODAL_NAMES.WATCHLIST)}
        onShowAlertManager={() => openModal(MODAL_NAMES.ALERT_MANAGER)}
        onShowTradeHistory={() => openModal(MODAL_NAMES.TRADE_HISTORY)}
        onShowSettings={() => openModal(MODAL_NAMES.SETTINGS)}
      />

      <TickerTape news={news} stocks={stocks} />

      <MacroIndicators macro={marketState.macro} />

      {/* Crisis alert banner */}
      {crisisAlert && (
        <CrisisAlert
          crisis={crisisAlert}
          onClose={() => setCrisisAlert(null)}
        />
      )}

      {/* Active crisis status widget */}
      {activeCrisis && (
        <div className="crisis-widget-container">
          <CrisisStatusWidget crisis={activeCrisis} />
        </div>
      )}

      {/* Market instability indicator */}
      <div className="market-risk-indicator">
        <CrisisProbabilityMeter marketState={marketState} />
      </div>

      <DashboardPanel
        totalAssets={totalAssets}
        profitRate={profitRate}
        cash={cash}
        stockValue={stockValue}
        canUseCredit={canUseCredit}
        marginCallActive={marginCallActive}
        creditUsed={creditUsed}
        creditInterest={creditInterest}
        maxCreditLimit={maxCreditLimit}
        availableCredit={availableCredit}
        onBorrowCredit={handleBorrowCredit}
        onRepayCredit={handleRepayCredit}
        onShowAssetChart={() => openModal(MODAL_NAMES.ASSET_CHART)}
      />

      <TabSection activeTab={activeTab} onTabChange={setActiveTab} />

      <ViewSection activeView={activeView} onViewChange={setActiveView} />

      <NewsSection
        news={news}
        onNewsClick={(item) => setNews(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n))}
      />

      <OrdersSection
        pendingOrders={pendingOrders}
        stocks={stocks}
        onCancelOrder={handleCancelOrder}
      />

      {activeView === 'heatmap' && <section className="heatmap-section"><Heatmap stocks={filteredStocks} portfolio={portfolio} onStockClick={openChart} /></section>}
      {activeView === 'portfolio' && <section className="portfolio-view-section"><PortfolioPieChart portfolio={portfolio} stocks={stocks} cash={cash} totalAssets={totalAssets} /></section>}

      {activeView === 'market' && (
        <MarketSection
          tradeMode={tradeMode}
          amountMode={amountMode}
          quantity={quantity}
          inputAmount={inputAmount}
          canShortSell={canShortSell}
          shortSellingMinLevel={SHORT_SELLING.minLevel}
          isInitialized={isInitialized}
          filteredStocks={filteredStocks}
          portfolio={portfolio}
          shortPositions={shortPositions}
          priceChanges={priceChanges}
          watchlist={watchlist}
          cash={cash}
          onTradeModeChange={setTradeMode}
          onAmountModeChange={setAmountMode}
          onQuantityChange={setQuantity}
          onInputAmountChange={setInputAmount}
          onToggleWatchlist={toggleWatchlist}
          onShowChart={openChart}
          onBuy={handleBuy}
          onSellAll={handleSellAll}
          onShortSell={handleShortSell}
          onCoverShort={handleCoverShort}
          onOpenOrderManager={openOrderManager}
          getEstimatedQuantity={getEstimatedQuantity}
          getProductTypeLabel={getProductTypeLabel}
        />
      )}

      <footer className="footer">
        <p>Lv.{levelInfo.level} {levelInfo.name} | {gameTime.displayDate} | {totalTrades}회 거래 | 연승 {winStreak}</p>
      </footer>

    </div>
  )
}

export default App
