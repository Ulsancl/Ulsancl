import { useState, useEffect, useMemo, useCallback } from 'react'
import './App.css'

// 상수 및 유틸리티
import {
  INITIAL_STOCKS, INITIAL_CAPITAL, ACHIEVEMENTS, LEVELS,
  LEVERAGE_OPTIONS, ETF_PRODUCTS, CRYPTO_PRODUCTS,
  BOND_PRODUCTS, COMMODITY_PRODUCTS, SHORT_SELLING, SKILLS, CREDIT_TRADING
} from './constants'
import {
  formatNumber, formatPercent, formatCompact,
  calculateLevel
} from './utils'

// 게임 엔진
import { checkAchievements } from './engine'

// 분리된 UI 컴포넌트
import {
  GameHeader,
  TabSection,
  ViewSection
} from './components'

// 기존 컴포넌트
import StockChartModal from './StockModal'
import NewsFeed from './NewsFeed'
import { LevelBadge, AchievementPopup, AchievementsPanel } from './Achievements'
import TradeHistory from './TradeHistory'
import OrderManager, { PendingOrders } from './OrderManager'
import Heatmap, { PortfolioPieChart } from './Heatmap'
import MissionsPanel from './Missions'
import Leaderboard from './Leaderboard'
import SettingsPanel from './Settings'
import AssetChart from './AssetChart'
import Watchlist, { WatchButton } from './Watchlist'
import StatisticsPanel from './Statistics'
import AlertManager from './AlertManager'
import Confetti from './Confetti'
import useSound from './useSound'
import SeasonEndModal from './SeasonEnd'
import MacroIndicators from './MacroIndicators'
import SkillsPanel from './SkillsPanel'
import TickerTape from './TickerTape'
import ToastManager from './ToastManager'
import ActionFeedback from './ActionFeedback'
import Tutorial from './Tutorial'
import { CrisisAlert, CrisisStatusWidget, CrisisProbabilityMeter } from './components/CrisisUI'
import ErrorBoundary from './components/ErrorBoundary'

// Context
import { useSettings } from './context'
import { useGameState as usePersistentGameState, useTrading, useToast, useFeedback, useUiState, useGameLoop } from './hooks'



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
    leverage, setLeverage,
    tradeMode, setTradeMode,
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
  } = useUiState()

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

  const stocksById = useMemo(() => new Map(stocks.map(stock => [stock.id, stock])), [stocks])

  // 레벨 정보
  const levelInfo = calculateLevel(totalXp, LEVELS)
  const canShortSell = levelInfo.level >= SHORT_SELLING.minLevel
  const canUseCredit = levelInfo.level >= CREDIT_TRADING.minLevel

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => { })
    }
  }, [])

  // 계산된 값들
  // 계산된 값들 (안전장치 추가)
  const stockValue = useMemo(() => {
    if (!portfolio) return 0
    return Object.entries(portfolio).reduce((total, [stockId, holding]) => {
      const stock = stocksById.get(parseInt(stockId))
      const val = stock ? stock.price * holding.quantity : 0
      return total + (isNaN(val) ? 0 : val)
    }, 0)
  }, [portfolio, stocksById])

  const shortValue = useMemo(() => {
    if (!shortPositions) return 0
    return Object.entries(shortPositions).reduce((total, [stockId, position]) => {
      const stock = stocksById.get(parseInt(stockId))
      if (!stock) return total
      const pnl = (position.entryPrice - stock.price) * position.quantity
      return total + (isNaN(pnl) ? 0 : pnl)
    }, 0)
  }, [shortPositions, stocksById])

  const safeCash = isNaN(cash) ? 0 : cash
  const safeCreditUsed = isNaN(creditUsed) ? 0 : creditUsed
  const safeCreditInterest = isNaN(creditInterest) ? 0 : creditInterest

  const grossAssets = safeCash + stockValue + shortValue  // 총 자산 (부채 제외)
  const totalAssets = grossAssets - safeCreditUsed - safeCreditInterest  // 순 자산 (부채 차감)
  const profitRate = INITIAL_CAPITAL > 0 ? ((totalAssets - INITIAL_CAPITAL) / INITIAL_CAPITAL) * 100 : 0
  const currentLeverage = LEVERAGE_OPTIONS.find(l => l.id === leverage) || LEVERAGE_OPTIONS[0]

  // 신용 거래 관련 비율 및 계산
  const marginRatio = safeCreditUsed > 0 ? (grossAssets / safeCreditUsed) : Infinity  // 담보비율
  const creditLimitRatio = CREDIT_TRADING.creditLimit[`level${Math.min(levelInfo?.level || 1, 6)}`] || 0
  const maxCreditLimit = Math.floor(grossAssets * creditLimitRatio)  // 총자산 기준 한도
  const availableCredit = Math.max(0, maxCreditLimit - safeCreditUsed)
  const totalDebt = safeCreditUsed + safeCreditInterest  // 총 부채

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
    totalTrades, setTotalTrades,
    dailyTrades, setDailyTrades,
    dailyProfit, setDailyProfit,
    totalProfit, setTotalProfit,
    winStreak, setWinStreak,
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
  }, [dailyTrades, dailyProfit, portfolio, totalTrades, totalProfit, winStreak])

  useEffect(() => {
    setMaxWinStreak(prev => Math.max(prev, winStreak))
  }, [winStreak])

  // 업적 체크
  useEffect(() => {
    const gameState = { totalTrades, totalProfit, totalAssets, portfolio, tradeHistory, winStreak }
    const newUnlocks = checkAchievements(gameState, unlockedAchievements, ACHIEVEMENTS)
    newUnlocks.forEach(ach => unlockAchievement(ach.id))
  }, [totalTrades, totalProfit, totalAssets, portfolio, winStreak])

  const unlockAchievement = (id) => {
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
  }

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

  const availableSkillPoints = useMemo(() => {
    const totalPoints = Math.max(0, levelInfo.level - 1)
    const spentPoints = Object.entries(unlockedSkills).reduce((sum, [id, level]) => {
      let cost = 1
      Object.values(SKILLS).forEach(tier => {
        const found = tier.find(s => s.id === id)
        if (found) cost = found.cost
      })
      return sum + (cost * level)
    }, 0)
    return totalPoints - spentPoints
  }, [levelInfo.level, unlockedSkills])

  return (
    <div className={`app theme-${settings.theme}`}>
      <Confetti trigger={showConfetti} />
      <ToastManager toasts={toasts} removeToast={removeToast} />
      <ActionFeedback items={feedbackItems} onRemove={removeFeedback} />
      <Tutorial active={showTutorial} onClose={() => setShowTutorial(false)} />

      {achievementPopup && <AchievementPopup achievement={achievementPopup} onClose={() => setAchievementPopup(null)} />}
      {showAchievements && <AchievementsPanel unlockedAchievements={unlockedAchievements} totalXp={totalXp} onClose={() => setShowAchievements(false)} />}
      {showTradeHistory && <TradeHistory trades={tradeHistory} stocks={stocks} onClose={() => setShowTradeHistory(false)} />}
      {showMissions && <MissionsPanel missionProgress={missionProgress} completedMissions={completedMissions} onClaimReward={handleClaimMissionReward} onClose={() => setShowMissions(false)} />}
      {showLeaderboard && <Leaderboard currentScore={{ totalAssets, profitRate }} playerName={settings.playerName} onClose={() => setShowLeaderboard(false)} onSaveScore={() => showNotification('기록 저장됨!', 'success')} />}
      {showSettings && <SettingsPanel settings={settings} onUpdateSettings={setSettings} onClose={() => setShowSettings(false)} />}
      {showAssetChart && <AssetChart assetHistory={assetHistory} onClose={() => setShowAssetChart(false)} />}
      {showWatchlist && <Watchlist watchlist={watchlist} stocks={stocks} onToggleWatch={toggleWatchlist} onStockClick={setChartStock} onClose={() => setShowWatchlist(false)} />}
      {showStatistics && <StatisticsPanel tradeHistory={tradeHistory} assetHistory={assetHistory} totalAssets={totalAssets} onClose={() => setShowStatistics(false)} />}
      {showAlertManager && <AlertManager alerts={alerts} stocks={stocks} onAddAlert={(a) => setAlerts(prev => [...prev, a])} onRemoveAlert={(id) => setAlerts(prev => prev.filter(a => a.id !== id))} onClose={() => setShowAlertManager(false)} />}
      {orderManagerStock && <OrderManager stock={orderManagerStock} currentPrice={stocksById.get(orderManagerStock.id)?.price || orderManagerStock.price} portfolio={portfolio} cash={cash} onPlaceOrder={handlePlaceOrder} onClose={() => setOrderManagerStock(null)} initialSide={orderManagerSide} />}
      {showSkills && <SkillsPanel unlockedSkills={unlockedSkills} skillPoints={availableSkillPoints} onUpgradeSkill={handleUpgradeSkill} onClose={() => setShowSkills(false)} />}


      {/* 시즌 종료 모달 */}
      {showSeasonEnd && (
        <SeasonEndModal
          year={gameTime.year}
          totalAssets={totalAssets}
          initialCapital={INITIAL_CAPITAL}
          totalProfit={totalProfit}
          totalTrades={totalTrades}
          winStreak={winStreak}
          maxWinStreak={maxWinStreak}
          tradeHistory={tradeHistory}
          unlockedAchievements={unlockedAchievements}
          assetHistory={assetHistory}
          onStartNewSeason={() => {
            setShowSeasonEnd(false)
            showNotification(`🚀 ${gameTime.year + 1}년 새 시즌 시작!`, 'success')
          }}
          onClose={() => setShowSeasonEnd(false)}
        />
      )}

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

      <section className="dashboard">
        <div className="dashboard-grid">
          <div className="stat-card stat-total" onClick={() => setShowAssetChart(true)} style={{ cursor: 'pointer' }}>
            <div className="stat-label">총 자산</div>
            <div className="stat-value">{formatCompact(totalAssets)}</div>
          </div>
          <div className={`stat-card stat-profit ${profitRate >= 0 ? 'positive' : 'negative'}`}>
            <div className="stat-label">수익률</div>
            <div className="stat-value">{formatPercent(profitRate)}</div>
          </div>
          <div className="stat-card stat-cash">
            <div className="stat-label">현금</div>
            <div className="stat-value">{formatCompact(cash)}</div>
          </div>
          <div className="stat-card stat-stock">
            <div className="stat-label">투자금</div>
            <div className="stat-value">{formatCompact(stockValue)}</div>
          </div>
        </div>

        {/* 신용 거래 섹션 */}
        {canUseCredit && (
          <div className={`credit-trading-card ${marginCallActive ? 'margin-call' : ''}`}>
            <div className="credit-header">
              <span className="credit-title">💳 신용 거래</span>
              {marginCallActive && <span className="margin-call-badge">⚠️ 마진콜</span>}
            </div>
            <div className="credit-info-grid">
              <div className="credit-info">
                <span className="credit-label">대출금</span>
                <span className="credit-value negative">{formatCompact(creditUsed)}</span>
              </div>
              <div className="credit-info">
                <span className="credit-label">이자</span>
                <span className="credit-value negative">{formatCompact(creditInterest)}</span>
              </div>
              <div className="credit-info">
                <span className="credit-label">한도</span>
                <span className="credit-value">{formatCompact(maxCreditLimit)}</span>
              </div>
              <div className="credit-info">
                <span className="credit-label">가용</span>
                <span className="credit-value positive">{formatCompact(availableCredit)}</span>
              </div>
            </div>
            <div className="credit-actions">
              <button
                className="credit-btn borrow"
                onClick={() => {
                  const amount = prompt('대출 금액을 입력하세요 (원)', String(Math.min(availableCredit, 10000000)))
                  if (amount) handleBorrowCredit(parseInt(amount))
                }}
                disabled={availableCredit <= 0}
              >
                💵 대출
              </button>
              <button
                className="credit-btn repay"
                onClick={() => {
                  const amount = prompt('상환 금액을 입력하세요 (원)', String(Math.min(cash, creditUsed + creditInterest)))
                  if (amount) handleRepayCredit(parseInt(amount))
                }}
                disabled={creditUsed + creditInterest <= 0}
              >
                💰 상환
              </button>
            </div>
          </div>
        )}
      </section>

      <TabSection activeTab={activeTab} onTabChange={setActiveTab} />

      <ViewSection activeView={activeView} onViewChange={setActiveView} />

      <section className="news-section">
        <NewsFeed news={news} onNewsClick={(item) => setNews(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n))} />
      </section>

      {
        pendingOrders.length > 0 && (
          <section className="orders-section">
            <PendingOrders orders={pendingOrders} stocks={stocks} onCancelOrder={handleCancelOrder} />
          </section>
        )
      }

      {activeView === 'heatmap' && <section className="heatmap-section"><Heatmap stocks={filteredStocks} portfolio={portfolio} onStockClick={setChartStock} /></section>}
      {activeView === 'portfolio' && <section className="portfolio-view-section"><PortfolioPieChart portfolio={portfolio} stocks={stocks} cash={cash} totalAssets={totalAssets} /></section>}

      {
        activeView === 'market' && (
          <>
            <section className="trade-mode-section">
              <div className="trade-mode-toggle">
                <button className={`mode-btn ${tradeMode === 'long' ? 'active' : ''}`} onClick={() => setTradeMode('long')}>📈 롱</button>
                <button className={`mode-btn short ${tradeMode === 'short' ? 'active' : ''} ${!canShortSell ? 'disabled' : ''}`} onClick={() => canShortSell && setTradeMode('short')} title={!canShortSell ? `Lv.${SHORT_SELLING.minLevel} 필요` : ''}>🐻 숏</button>
              </div>
              <div className="trade-mode-toggle">
                <button className={`mode-btn ${!amountMode ? 'active' : ''}`} onClick={() => setAmountMode(false)}>수량</button>
                <button className={`mode-btn ${amountMode ? 'active' : ''}`} onClick={() => setAmountMode(true)}>금액</button>
              </div>
              {amountMode ? (
                <div className="amount-input-section">
                  <input type="number" value={inputAmount} onChange={(e) => setInputAmount(e.target.value)} placeholder="금액" className="amount-input" />
                  <span className="amount-unit">원</span>
                </div>
              ) : (
                <div className="quantity-global-section">
                  <button className="qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</button>
                  <input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="quantity-input" min="1" />
                  <button className="qty-btn" onClick={() => setQuantity(q => q + 1)}>+</button>
                </div>
              )}
            </section>

            <section className="stock-section">
              <div className="stock-list">
                {filteredStocks.map((stock, index) => {
                  // 일일 변동률 (dailyOpen 기준)
                  const dailyChangeRate = stock.dailyOpen ? ((stock.price - stock.dailyOpen) / stock.dailyOpen) * 100 : 0
                  const isUp = dailyChangeRate >= 0
                  const holding = portfolio[stock.id]
                  const shortPos = shortPositions[stock.id]
                  const heldQty = holding?.quantity || 0
                  const shortQty = shortPos?.quantity || 0
                  const priceChange = priceChanges[stock.id]
                  const isWatched = watchlist.includes(stock.id)
                  const estimatedQty = amountMode ? getEstimatedQuantity(stock) : quantity
                  const shortPnl = shortPos ? (shortPos.entryPrice - stock.price) * shortPos.quantity : 0

                  return (
                    <div key={stock.id} className={`stock-card stock-card-compact ${isInitialized ? 'initialized' : ''}`} style={{ '--animation-delay': `${index * 0.03}s` }}>
                      <div className="stock-left">
                        <div className="stock-header-row">
                          <WatchButton isWatched={isWatched} onClick={() => toggleWatchlist(stock.id)} />
                          <div className="stock-icon" style={{ background: stock.color }}>{stock.code?.slice(0, 2)}</div>
                          <div className="stock-name-group">
                            <span className="stock-name">{stock.name}</span>
                            <span className="stock-code">{stock.code} · {getProductTypeLabel(stock.type)}</span>
                          </div>
                        </div>
                      </div>

                      {/* 가격 정보 - 클릭하면 상세 차트 열림 */}
                      <div className="stock-center" onClick={() => setChartStock(stock)}>
                        <div className={`stock-price ${isUp ? 'text-profit' : 'text-loss'} ${priceChange === 'up' ? 'flash-up' : priceChange === 'down' ? 'flash-down' : ''}`}>
                          {formatNumber(stock.price)}원
                        </div>
                        <div className={`stock-change ${isUp ? 'positive' : 'negative'}`}>
                          {isUp ? '▲' : '▼'} {formatPercent(dailyChangeRate)}
                        </div>
                      </div>

                      {/* 일일 고가/저가 + 보유 정보 */}
                      <div className="stock-meta">
                        <div className="stock-ohlc-inline">
                          <span className="ohlc-mini high">H {formatCompact(stock.dailyHigh || stock.price)}</span>
                          <span className="ohlc-mini low">L {formatCompact(stock.dailyLow || stock.price)}</span>
                        </div>
                        {(heldQty > 0 || shortQty > 0) && (
                          <div className="stock-positions-inline">
                            {heldQty > 0 && <span className="pos-badge long">📈{heldQty}</span>}
                            {shortQty > 0 && <span className={`pos-badge short ${shortPnl >= 0 ? 'profit' : 'loss'}`}>🐻{shortQty}</span>}
                          </div>
                        )}
                      </div>

                      <div className="stock-right">
                        {/* 간소화된 퀵 버튼 */}
                        <div className="quick-trade-buttons">
                          {tradeMode === 'long' ? (
                            <>
                              <button
                                className="quick-btn buy"
                                onClick={() => handleBuy(stock, estimatedQty)}
                                disabled={cash < stock.price * estimatedQty || estimatedQty < 1}
                                title={`${estimatedQty}주 매수`}
                              >
                                매수
                              </button>
                              {heldQty > 0 && (
                                <button
                                  className="quick-btn sell-all"
                                  onClick={() => handleSellAll(stock)}
                                  title={`${heldQty}주 전량 매도`}
                                >
                                  전량매도
                                </button>
                              )}
                            </>
                          ) : (
                            <>
                              <button
                                className="quick-btn short"
                                onClick={() => handleShortSell(stock, estimatedQty)}
                                disabled={cash < stock.price * estimatedQty * SHORT_SELLING.marginRate || estimatedQty < 1}
                                title={`${estimatedQty}주 공매도`}
                              >
                                공매도
                              </button>
                              {shortQty > 0 && (
                                <button
                                  className="quick-btn cover-all"
                                  onClick={() => handleCoverShort(stock, shortQty)}
                                  title={`${shortQty}주 전량 청산`}
                                >
                                  전량청산
                                </button>
                              )}
                            </>
                          )}
                        </div>
                        {/* 상세 주문 버튼 */}
                        <button
                          className="detail-order-btn"
                          onClick={() => { setOrderManagerStock(stock); setOrderManagerSide(tradeMode === 'long' ? 'buy' : 'short'); }}
                          title="상세 주문"
                        >
                          ⚙️
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </>
        )
      }

      <footer className="footer">
        <p>Lv.{levelInfo.level} {levelInfo.name} | {gameTime.displayDate} | {totalTrades}회 | 연승 {winStreak}</p>
      </footer>

      {
        chartStock && (
          <ErrorBoundary
            fallback={({ error, reset }) => (
              <div className="chart-modal-overlay" onClick={() => { reset(); setChartStock(null); }}>
                <div className="chart-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', padding: '40px', textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
                  <h3 style={{ marginBottom: '12px' }}>차트 로딩 오류</h3>
                  <p style={{ color: '#888', marginBottom: '20px' }}>차트 데이터를 불러오는 중 문제가 발생했습니다.</p>
                  <button
                    onClick={() => { reset(); setChartStock(null); }}
                    style={{ padding: '12px 24px', background: 'var(--color-accent)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
                  >
                    닫기
                  </button>
                </div>
              </div>
            )}
            onReset={() => setChartStock(null)}
          >
            <StockChartModal
              stock={chartStock}
              onClose={() => setChartStock(null)}
              currentPrice={
                stocksById.get(chartStock.id)?.price || chartStock.price
              }
              tradeHistory={tradeHistory}
              history={priceHistory[chartStock.id] || []}
              onOpenOrder={(stock, side) => {
                setOrderManagerStock(stock)
                setOrderManagerSide(side || 'buy')
              }}
            />
          </ErrorBoundary>
        )
      }
    </div >
  )
}

export default App
