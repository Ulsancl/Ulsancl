import { useState, useEffect, useMemo, useCallback } from 'react'
import './App.css'

// 상수 및 유틸리티
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
import { formatNumber, formatCompact } from './utils'

// 게임 엔진
import { checkAchievements } from './engine'

// 분리된 UI 컴포넌트
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

// Context
import { useSettings } from './context'
import {
  useGameState as usePersistentGameState,
  useTrading,
  useToast,
  useFeedback,
  useUiState,
  useAppModalState,
  useGameCalculations,
  useGameLoop
} from './hooks'



function App() {
  // 모든 금융 상품 합치기 (dailyOpen 초기화 포함)
  const allProducts = useMemo(() => [
    ...INITIAL_STOCKS.map(s => ({ ...s, type: 'stock', dailyOpen: s.price, dailyHigh: s.price, dailyLow: s.price })),
    ...ETF_PRODUCTS.map(s => ({ ...s, dailyOpen: s.price, dailyHigh: s.price, dailyLow: s.price })),
    ...CRYPTO_PRODUCTS.map(s => ({ ...s, dailyOpen: s.price, dailyHigh: s.price, dailyLow: s.price })),
    ...BOND_PRODUCTS.map(s => ({ ...s, dailyOpen: s.price, dailyHigh: s.price, dailyLow: s.price })),
    ...COMMODITY_PRODUCTS.map(s => ({ ...s, dailyOpen: s.price, dailyHigh: s.price, dailyLow: s.price }))
  ], [])

  // Context로부터 설정 가져오기
  const { settings, setSettings } = useSettings()

  // UI 상태
  const {
    quantity, setQuantity,
    amountMode, setAmountMode,
    inputAmount, setInputAmount,
    leverage,
    tradeMode, setTradeMode
  } = useUiState()

  const {
    achievementPopup, setAchievementPopup,
    showConfetti, setShowConfetti,
    showSkills, setShowSkills,
    showTutorial, setShowTutorial,
    chartStock, setChartStock,
    showAchievements, setShowAchievements,
    showTradeHistory, setShowTradeHistory,
    showMissions, setShowMissions,
    showLeaderboard, setShowLeaderboard,
    showSettings, setShowSettings,
    showAssetChart, setShowAssetChart,
    showWatchlist, setShowWatchlist,
    showStatistics, setShowStatistics,
    showAlertManager, setShowAlertManager,
    orderManagerStock, setOrderManagerStock,
    orderManagerSide, setOrderManagerSide,
    activeTab, setActiveTab,
    activeView, setActiveView,
    showSeasonEnd, setShowSeasonEnd,
    activeCrisis, setActiveCrisis,
    crisisAlert, setCrisisAlert,
    setCrisisHistory
  } = useAppModalState()

  const { toasts, removeToast, showNotification } = useToast()

  const {
    feedbackItems,
    addFeedback: addActionFeedback,
    removeFeedback
  } = useFeedback()

  const handleNewUser = useCallback(() => {
    setShowTutorial(true)
  }, [setShowTutorial])

  // 게임 상태
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
    setCurrentDay
  } = usePersistentGameState({
    allProducts,
    settings,
    setSettings,
    onNewUser: handleNewUser
  })

  const [priceHistory, setPriceHistory] = useState(() => {
    const initial = {}
    allProducts.forEach(stock => { initial[stock.id] = [stock.price] })
    return initial
  })
  const [priceChanges, setPriceChanges] = useState({})

  // 거래일 시스템
  const [gameTime, setGameTime] = useState({ day: 1, hour: 9, minute: 0, displayDate: 'D+1', displayTime: '09:00' })

  // 시장 상태
  const [marketState, setMarketState] = useState({ trend: 0, volatility: 1, sectorTrends: {} })

  // 사운드
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
    formatNumber,
    formatCompact
  })

  // 필터된 종목
  const filteredStocks = useMemo(() => {
    switch (activeTab) {
      case 'stocks': return stocks.filter(s => s.type === 'stock' || !s.type)
      case 'etf': return stocks.filter(s => s.type === 'etf')
      case 'crypto': return stocks.filter(s => s.type === 'crypto')
      case 'bond': return stocks.filter(s => s.type === 'bond')
      case 'commodity': return stocks.filter(s => s.type === 'commodity')
      default: return stocks
    }
  }, [stocks, activeTab])

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
    setShowSeasonEnd,
    setActiveCrisis,
    setCrisisAlert,
    setCrisisHistory,
    showNotification,
    playSound,
    formatNumber
  })

  const unlockAchievement = useCallback((id) => {
    if (unlockedAchievements[id]) return
    const ach = ACHIEVEMENTS[id]
    if (!ach) return

    setUnlockedAchievements(prev => ({ ...prev, [id]: true }))
    setTotalXp(prev => prev + ach.xp)
    setAchievementPopup(ach)
    setShowConfetti(true)
    playSound('achievement')
    setTimeout(() => {
      setAchievementPopup(null)
      setShowConfetti(false)
    }, 3000)
  }, [playSound, setAchievementPopup, setShowConfetti, setTotalXp, setUnlockedAchievements, unlockedAchievements])

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

  // 업적 체크
  useEffect(() => {
    const gameState = { totalTrades, totalProfit, totalAssets, portfolio, tradeHistory, winStreak }
    const newUnlocks = checkAchievements(gameState, unlockedAchievements, ACHIEVEMENTS)
    newUnlocks.forEach(ach => unlockAchievement(ach.id))
  }, [portfolio, totalAssets, totalProfit, totalTrades, tradeHistory, unlockAchievement, unlockedAchievements, winStreak])

  // Mission rewards
  const handleClaimMissionReward = (mission) => {
    setCompletedMissions(prev => ({ ...prev, [mission.id]: true }))
    setCash(prev => prev + mission.reward.cash)
    setTotalXp(prev => prev + mission.reward.xp)
    showNotification(`🎁 ${mission.name} 보상 수령!`, 'success')
    playSound('achievement')
  }

  const handleUpgradeSkill = (skill) => {
    setUnlockedSkills(prev => {
      const currentLevel = prev[skill.id] || 0
      if (currentLevel >= skill.maxLevel) return prev
      return { ...prev, [skill.id]: currentLevel + 1 }
    })
    showNotification(`${skill.name} 강화 성공!`, 'success')
    playSound('achievement')
  }

  const toggleWatchlist = (stockId) => {
    setWatchlist(prev => prev.includes(stockId) ? prev.filter(id => id !== stockId) : [...prev, stockId])
  }

  const getEstimatedQuantity = (stock) => Math.floor((parseInt(inputAmount) || 0) / stock.price)

  const getProductTypeLabel = (type) => {
    switch (type) {
      case 'etf': return 'ETF'
      case 'crypto': return '코인'
      case 'bond': return '채권'
      case 'commodity': return '원자재'
      default: return '주식'
    }
  }

  return (
    <div className={`app theme-${settings.theme}`}>
      <Confetti trigger={showConfetti} />
      <ToastManager toasts={toasts} removeToast={removeToast} />
      <ActionFeedback items={feedbackItems} onRemove={removeFeedback} />
      <Tutorial active={showTutorial} onClose={() => setShowTutorial(false)} />

      <AppModalsContainer
        achievementPopup={achievementPopup}
        onCloseAchievementPopup={() => setAchievementPopup(null)}
        showAchievements={showAchievements}
        unlockedAchievements={unlockedAchievements}
        totalXp={totalXp}
        onCloseAchievements={() => setShowAchievements(false)}
        showTradeHistory={showTradeHistory}
        tradeHistory={tradeHistory}
        stocks={stocks}
        onCloseTradeHistory={() => setShowTradeHistory(false)}
        showMissions={showMissions}
        missionProgress={missionProgress}
        completedMissions={completedMissions}
        onClaimMissionReward={handleClaimMissionReward}
        onCloseMissions={() => setShowMissions(false)}
        showLeaderboard={showLeaderboard}
        totalAssets={totalAssets}
        profitRate={profitRate}
        playerName={settings.playerName}
        onCloseLeaderboard={() => setShowLeaderboard(false)}
        onSaveScore={() => showNotification('기록 저장됨!', 'success')}
        showSettings={showSettings}
        settings={settings}
        onUpdateSettings={setSettings}
        onCloseSettings={() => setShowSettings(false)}
        showAssetChart={showAssetChart}
        assetHistory={assetHistory}
        onCloseAssetChart={() => setShowAssetChart(false)}
        showWatchlist={showWatchlist}
        watchlist={watchlist}
        onToggleWatchlist={toggleWatchlist}
        onShowChart={setChartStock}
        onCloseWatchlist={() => setShowWatchlist(false)}
        showStatistics={showStatistics}
        onCloseStatistics={() => setShowStatistics(false)}
        showAlertManager={showAlertManager}
        alerts={alerts}
        onAddAlert={(a) => setAlerts(prev => [...prev, a])}
        onRemoveAlert={(id) => setAlerts(prev => prev.filter(a => a.id !== id))}
        onCloseAlertManager={() => setShowAlertManager(false)}
        orderManagerStock={orderManagerStock}
        orderManagerSide={orderManagerSide}
        portfolio={portfolio}
        cash={cash}
        onPlaceOrder={handlePlaceOrder}
        onCloseOrderManager={() => setOrderManagerStock(null)}
        showSkills={showSkills}
        unlockedSkills={unlockedSkills}
        availableSkillPoints={availableSkillPoints}
        onUpgradeSkill={handleUpgradeSkill}
        onCloseSkills={() => setShowSkills(false)}
        showSeasonEnd={showSeasonEnd}
        gameYear={gameTime.year}
        initialCapital={INITIAL_CAPITAL}
        totalProfit={totalProfit}
        totalTrades={totalTrades}
        winStreak={winStreak}
        maxWinStreak={maxWinStreak}
        onStartNewSeason={() => {
          setShowSeasonEnd(false)
          showNotification(`🚀 ${gameTime.year + 1}년 새 시즌 시작!`, 'success')
        }}
        onCloseSeasonEnd={() => setShowSeasonEnd(false)}
        chartStock={chartStock}
        priceHistory={priceHistory}
        stocksById={stocksById}
        onCloseChartStock={() => setChartStock(null)}
        onOpenOrder={(stock, side) => {
          setOrderManagerStock(stock)
          setOrderManagerSide(side || 'buy')
        }}
      />

      <GameHeader
        gameTime={gameTime}
        totalXp={totalXp}
        onShowSkills={() => setShowSkills(true)}
        onShowMissions={() => setShowMissions(true)}
        onShowAchievements={() => setShowAchievements(true)}
        onShowLeaderboard={() => setShowLeaderboard(true)}
        onShowStatistics={() => setShowStatistics(true)}
        onShowWatchlist={() => setShowWatchlist(true)}
        onShowAlertManager={() => setShowAlertManager(true)}
        onShowTradeHistory={() => setShowTradeHistory(true)}
        onShowSettings={() => setShowSettings(true)}
      />

      <TickerTape news={news} stocks={stocks} />

      <MacroIndicators macro={marketState.macro} />

      {/* 위기 이벤트 알림 */}
      {crisisAlert && (
        <CrisisAlert
          crisis={crisisAlert}
          onClose={() => setCrisisAlert(null)}
        />
      )}

      {/* 활성 위기 상태 위젯 */}
      {activeCrisis && (
        <div className="crisis-widget-container">
          <CrisisStatusWidget crisis={activeCrisis} />
        </div>
      )}

      {/* 시장 불안정 지수 */}
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
        onShowAssetChart={() => setShowAssetChart(true)}
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

      {activeView === 'heatmap' && <section className="heatmap-section"><Heatmap stocks={filteredStocks} portfolio={portfolio} onStockClick={setChartStock} /></section>}
      {activeView === 'portfolio' && <section className="portfolio-view-section"><PortfolioPieChart portfolio={portfolio} stocks={stocks} cash={cash} totalAssets={totalAssets} /></section>}

      {
        activeView === 'market' && (
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
            onShowChart={setChartStock}
            onBuy={handleBuy}
            onSellAll={handleSellAll}
            onShortSell={handleShortSell}
            onCoverShort={handleCoverShort}
            onOpenOrderManager={(stock, side) => {
              setOrderManagerStock(stock)
              setOrderManagerSide(side)
            }}
            getEstimatedQuantity={getEstimatedQuantity}
            getProductTypeLabel={getProductTypeLabel}
          />
        )
      }

      <footer className="footer">
        <p>Lv.{levelInfo.level} {levelInfo.name} | {gameTime.displayDate} | {totalTrades}회 | 연승 {winStreak}</p>
      </footer>

    </div >
  )
}

export default App
