import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import './App.css'

// 상수 및 유틸리티
import {
  INITIAL_STOCKS, INITIAL_CAPITAL, ACHIEVEMENTS, LEVELS, SECTORS,
  DIVIDEND_RATES, MISSIONS, LEVERAGE_OPTIONS, ETF_PRODUCTS, CRYPTO_PRODUCTS,
  BOND_PRODUCTS, COMMODITY_PRODUCTS, SHORT_SELLING, SKILLS, CREDIT_TRADING
} from './constants'
import {
  formatNumber, formatPercent, formatCompact,
  saveGame, loadGame, generateId, calculateLevel
} from './utils'

// 게임 엔진
import {
  updateMarketState, generateNews,
  applyNewsImpact, processOrders, checkAchievements, generateMarketEvent, applyEventEffect,
  startNewTradingDay, calculateGameDate, generateGlobalEvent,
  generateSeasonalEvent, calculateAllStockPrices,
  applyCrisisImpact, updatePricesWithCrisis, getActiveCrisis
} from './gameEngine'

// 분리된 UI 컴포넌트
import {
  GameHeader,
  DashboardPanel,
  StockListItem,
  TabSection,
  ViewSection,
  TradeModeSection
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
import AlertManager, { checkAlerts } from './AlertManager'
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



function App() {
  // 모든 금융 상품 합치기 (dailyOpen 초기화 포함)
  const allProducts = useMemo(() => [
    ...INITIAL_STOCKS.map(s => ({ ...s, type: 'stock', dailyOpen: s.price, dailyHigh: s.price, dailyLow: s.price })),
    ...ETF_PRODUCTS.map(s => ({ ...s, dailyOpen: s.price, dailyHigh: s.price, dailyLow: s.price })),
    ...CRYPTO_PRODUCTS.map(s => ({ ...s, dailyOpen: s.price, dailyHigh: s.price, dailyLow: s.price })),
    ...BOND_PRODUCTS.map(s => ({ ...s, dailyOpen: s.price, dailyHigh: s.price, dailyLow: s.price })),
    ...COMMODITY_PRODUCTS.map(s => ({ ...s, dailyOpen: s.price, dailyHigh: s.price, dailyLow: s.price }))
  ], [])

  // 게임 상태
  const [stocks, setStocks] = useState(allProducts)
  const [cash, setCash] = useState(INITIAL_CAPITAL)
  const [portfolio, setPortfolio] = useState({})
  const [shortPositions, setShortPositions] = useState({})
  const [priceHistory, setPriceHistory] = useState(() => {
    const initial = {}
    allProducts.forEach(stock => { initial[stock.id] = [stock.price] })
    return initial
  })
  const [priceChanges, setPriceChanges] = useState({})

  // 거래일 시스템
  const [gameStartTime, setGameStartTime] = useState(Date.now())
  const [currentDay, setCurrentDay] = useState(1)
  const [gameTime, setGameTime] = useState({ day: 1, hour: 9, minute: 0, displayDate: 'D+1', displayTime: '09:00' })
  const lastDayRef = useRef(1)

  // 시장 상태
  const [marketState, setMarketState] = useState({ trend: 0, volatility: 1, sectorTrends: {} })

  // 뉴스 시스템
  const [news, setNews] = useState([])

  // 거래 관련
  const [tradeHistory, setTradeHistory] = useState([])
  const [pendingOrders, setPendingOrders] = useState([])
  const [quantity, setQuantity] = useState(1)
  const [amountMode, setAmountMode] = useState(false)
  const [inputAmount, setInputAmount] = useState('')
  const [leverage, setLeverage] = useState('1x')
  const [tradeMode, setTradeMode] = useState('long')

  // 워치리스트
  const [watchlist, setWatchlist] = useState([])

  // 알림
  const [alerts, setAlerts] = useState([])

  // 신용 거래 (마진 거래)
  const [creditUsed, setCreditUsed] = useState(0)           // 사용 중인 대출금
  const [creditInterest, setCreditInterest] = useState(0)   // 누적 이자
  const [marginCallActive, setMarginCallActive] = useState(false)

  // 업적 & 레벨
  const [unlockedAchievements, setUnlockedAchievements] = useState({})
  const [unlockedSkills, setUnlockedSkills] = useState({})
  const [totalXp, setTotalXp] = useState(0)
  const [achievementPopup, setAchievementPopup] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showSkills, setShowSkills] = useState(false)

  // 통계
  const [totalTrades, setTotalTrades] = useState(0)
  const [winStreak, setWinStreak] = useState(0)
  const [totalProfit, setTotalProfit] = useState(0)
  const [assetHistory, setAssetHistory] = useState([])

  // 미션
  const [missionProgress, setMissionProgress] = useState({})
  const [completedMissions, setCompletedMissions] = useState({})
  const [dailyTrades, setDailyTrades] = useState(0)
  const [dailyProfit, setDailyProfit] = useState(0)

  // 배당금
  const [totalDividends, setTotalDividends] = useState(0)
  const [lastDividendTime, setLastDividendTime] = useState(Date.now())

  // Context로부터 설정 가져오기
  const { settings, setSettings } = useSettings()

  // UI 상태
  const [toasts, setToasts] = useState([])
  const [notification, setNotification] = useState(null) // Legacy support wrapper
  const [feedbackItems, setFeedbackItems] = useState([])
  const [showTutorial, setShowTutorial] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [chartStock, setChartStock] = useState(null)
  const [showAchievements, setShowAchievements] = useState(false)
  const [showTradeHistory, setShowTradeHistory] = useState(false)
  const [showMissions, setShowMissions] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showAssetChart, setShowAssetChart] = useState(false)
  const [showWatchlist, setShowWatchlist] = useState(false)
  const [showStatistics, setShowStatistics] = useState(false)
  const [showAlertManager, setShowAlertManager] = useState(false)
  const [orderManagerStock, setOrderManagerStock] = useState(null)
  const [orderManagerSide, setOrderManagerSide] = useState('buy')
  const [activeTab, setActiveTab] = useState('stocks')
  const [activeView, setActiveView] = useState('market')
  // AnalystReport state removed

  // 시즌 종료 관련
  const [showSeasonEnd, setShowSeasonEnd] = useState(false)
  const [maxWinStreak, setMaxWinStreak] = useState(0)
  const lastSeasonYearRef = useRef(2020)

  // 위기 이벤트 관련
  const [activeCrisis, setActiveCrisis] = useState(null)
  const [crisisAlert, setCrisisAlert] = useState(null)
  const [crisisHistory, setCrisisHistory] = useState([])

  // 사운드
  const { playSound } = useSound(settings.soundEnabled, settings.volume)

  // 레벨 정보
  const levelInfo = calculateLevel(totalXp, LEVELS)
  const canShortSell = levelInfo.level >= SHORT_SELLING.minLevel
  const canUseCredit = levelInfo.level >= CREDIT_TRADING.minLevel

  // 게임 로드
  useEffect(() => {
    const saved = loadGame()
    if (saved) {
      if (saved.stocks) setStocks(saved.stocks)
      setCash(saved.cash || INITIAL_CAPITAL)
      setPortfolio(saved.portfolio || {})
      setShortPositions(saved.shortPositions || {})
      setTradeHistory(saved.tradeHistory || [])
      setPendingOrders(saved.pendingOrders || [])
      setUnlockedAchievements(saved.unlockedAchievements || {})
      setUnlockedSkills(saved.unlockedSkills || {})
      setTotalXp(saved.totalXp || 0)
      setTotalTrades(saved.totalTrades || 0)
      setWinStreak(saved.winStreak || 0)
      setMaxWinStreak(saved.maxWinStreak || 0)
      setTotalProfit(saved.totalProfit || 0)
      setNews(saved.news || [])
      setMissionProgress(saved.missionProgress || {})
      setCompletedMissions(saved.completedMissions || {})
      setTotalDividends(saved.totalDividends || 0)
      setSettings(saved.settings || settings)
      setAssetHistory(saved.assetHistory || [])
      setWatchlist(saved.watchlist || [])
      setAlerts(saved.alerts || [])
      setGameStartTime(saved.gameStartTime || Date.now())
      setCurrentDay(saved.currentDay || 1)
      setCreditUsed(saved.creditUsed || 0)
      setCreditInterest(saved.creditInterest || 0)

      // 튜토리얼 체크 (거래 기록이 없으면 신규 유저로 간주)
      if ((saved.totalTrades || 0) === 0) {
        setShowTutorial(true)
      }
    } else {
      // 저장된 게임 없음 - 신규 시작
      setShowTutorial(true)
    }
    setIsInitialized(true)

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => { })
    }
  }, [])

  // 자동 저장
  useEffect(() => {
    if (!isInitialized) return
    const timer = setInterval(() => {
      saveGame({
        stocks, cash, portfolio, shortPositions, tradeHistory, pendingOrders,
        unlockedAchievements, unlockedSkills, totalXp, totalTrades, winStreak, maxWinStreak, totalProfit, news,
        missionProgress, completedMissions, totalDividends, settings, assetHistory,
        watchlist, alerts, gameStartTime, currentDay, creditUsed, creditInterest
      })
    }, 5000)
    return () => clearInterval(timer)
  }, [stocks, cash, portfolio, shortPositions, tradeHistory, pendingOrders, unlockedAchievements, unlockedSkills, totalXp, totalTrades, winStreak, maxWinStreak, totalProfit, news, missionProgress, completedMissions, totalDividends, settings, assetHistory, watchlist, alerts, isInitialized, gameStartTime, currentDay, creditUsed, creditInterest])

  // 계산된 값들
  // 계산된 값들 (안전장치 추가)
  const stockValue = useMemo(() => {
    if (!portfolio) return 0
    return Object.entries(portfolio).reduce((total, [stockId, holding]) => {
      const stock = stocks.find(s => s.id === parseInt(stockId))
      const val = stock ? stock.price * holding.quantity : 0
      return total + (isNaN(val) ? 0 : val)
    }, 0)
  }, [portfolio, stocks])

  const shortValue = useMemo(() => {
    if (!shortPositions) return 0
    return Object.entries(shortPositions).reduce((total, [stockId, position]) => {
      const stock = stocks.find(s => s.id === parseInt(stockId))
      if (!stock) return total
      const pnl = (position.entryPrice - stock.price) * position.quantity
      return total + (isNaN(pnl) ? 0 : pnl)
    }, 0)
  }, [shortPositions, stocks])

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

  // 1초마다 가격 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()

      // 게임 시간 업데이트
      const newGameTime = calculateGameDate(gameStartTime, now)
      setGameTime(newGameTime)
      const gameDay = newGameTime.day

      let workingStocks = stocks
      let workingCash = cash
      let workingPortfolio = portfolio
      let workingPendingOrders = pendingOrders
      let workingShortPositions = shortPositions
      let workingCreditUsed = creditUsed
      let workingCreditInterest = creditInterest
      let workingMarketState = updateMarketState(marketState)
      let workingAlerts = alerts

      const calcStockValue = (list, holdings) => {
        if (!holdings) return 0
        return Object.entries(holdings).reduce((total, [stockId, holding]) => {
          const stock = list.find(s => s.id === parseInt(stockId))
          if (!stock) return total
          const val = stock.price * holding.quantity
          return total + (isNaN(val) ? 0 : val)
        }, 0)
      }

      const calcShortValue = (list, shorts) => {
        if (!shorts) return 0
        return Object.entries(shorts).reduce((total, [stockId, position]) => {
          const stock = list.find(s => s.id === parseInt(stockId))
          if (!stock) return total
          const pnl = (position.entryPrice - stock.price) * position.quantity
          return total + (isNaN(pnl) ? 0 : pnl)
        }, 0)
      }

      // 새 거래일 시작 체크
      if (gameDay > lastDayRef.current) {
        lastDayRef.current = gameDay
        setCurrentDay(gameDay)

        // 새 거래일: dailyOpen 리셋
        workingStocks = startNewTradingDay(workingStocks)
        setDailyTrades(0)
        setDailyProfit(0)

        // 신용 거래 일일 이자 계산
        if (workingCreditUsed > 0) {
          const dailyInterest = Math.floor(workingCreditUsed * CREDIT_TRADING.dailyInterestRate)
          workingCreditInterest += dailyInterest
          if (dailyInterest > 0) {
            showNotification(`💳 신용 이자 ${formatNumber(dailyInterest)}원 발생`, 'warning')
          }
        }

        showNotification(`📅 ${newGameTime.displayDate} 거래일 시작!`, 'info')
        playSound('news')
      }

      // 마진콜 체크 (담보비율 30% 이하시 경고, 20% 이하시 강제청산)
      if (workingCreditUsed > 0) {
        const stockValueNow = calcStockValue(workingStocks, workingPortfolio)
        const shortValueNow = calcShortValue(workingStocks, workingShortPositions)
        const grossAssetsNow = workingCash + stockValueNow + shortValueNow
        const currentMarginRatio = grossAssetsNow / workingCreditUsed
        if (currentMarginRatio <= CREDIT_TRADING.liquidationMargin) {
          // 강제 청산
          showNotification('⚠️ 마진콜! 담보 부족으로 포지션 강제 청산됩니다!', 'error')
          setMarginCallActive(true)
          // 모든 주식 매도
          Object.keys(workingPortfolio).forEach(stockId => {
            const holding = workingPortfolio[stockId]
            const stock = workingStocks.find(s => s.id === parseInt(stockId))
            if (stock && holding.quantity > 0) {
              const saleAmount = Math.floor(stock.price * holding.quantity * 0.95) // 5% 슬리피지
              workingCash += saleAmount
            }
          })
          workingPortfolio = {}
          // 대출금 상환 (가능한 만큼)
          const repayable = Math.min(workingCash, workingCreditUsed + workingCreditInterest)
          if (repayable > 0) {
            const interestPayment = Math.min(repayable, workingCreditInterest)
            workingCreditInterest -= interestPayment
            const principalPayment = repayable - interestPayment
            workingCreditUsed = Math.max(0, workingCreditUsed - principalPayment)
            workingCash -= repayable
          }
        } else if (currentMarginRatio <= CREDIT_TRADING.maintenanceMargin && !marginCallActive) {
          showNotification('⚠️ 마진콜 경고! 담보 비율이 30% 이하입니다. 추가 입금 또는 포지션 정리를 권장합니다.', 'warning')
          setMarginCallActive(true)
        } else if (currentMarginRatio > CREDIT_TRADING.maintenanceMargin) {
          setMarginCallActive(false)
        }
      } else if (marginCallActive) {
        setMarginCallActive(false)
      }


      // 뉴스 생성 (3% 확률)
      const newNews = generateNews(workingStocks, 0.03)
      if (newNews) {
        setNews(prev => [newNews, ...prev].slice(0, 50))
        showNotification(`📰 ${newNews.text}`, newNews.type === 'positive' ? 'success' : newNews.type === 'negative' ? 'error' : 'info')
        playSound('news')

        const { stocks: impactedStocks, marketState: impactedMarket } = applyNewsImpact(workingStocks, newNews, workingMarketState)
        workingStocks = impactedStocks
        workingMarketState = impactedMarket
      }

      // 🌍 글로벌 특별 이벤트 체크 (매우 드물게)
      const globalEvent = generateGlobalEvent()
      if (globalEvent) {
        setNews(prev => [globalEvent, ...prev].slice(0, 50))
        const notifType = globalEvent.type === 'positive' ? 'success' : globalEvent.type === 'negative' ? 'error' : 'info'
        showNotification(`${globalEvent.icon} 속보: ${globalEvent.text}`, notifType)
        playSound('news')

        // 글로벌 이벤트는 전체 시장에 영향
        const { stocks: impactedStocks, marketState: impactedMarket } = applyNewsImpact(workingStocks, globalEvent, workingMarketState)
        workingStocks = impactedStocks
        workingMarketState = impactedMarket
      }

      // 🌸☀️🍂❄️ 계절별 특별 이벤트 (1% 확률)
      const seasonalEvent = generateSeasonalEvent(newGameTime.season, 0.01)
      if (seasonalEvent) {
        setNews(prev => [seasonalEvent, ...prev].slice(0, 50))
        const notifType = seasonalEvent.type === 'positive' ? 'success' : 'error'
        showNotification(`${seasonalEvent.icon} 계절 뉴스: ${seasonalEvent.text}`, notifType)
        playSound('news')

        const { stocks: impactedStocks, marketState: impactedMarket } = applyNewsImpact(workingStocks, seasonalEvent, workingMarketState)
        workingStocks = impactedStocks
        workingMarketState = impactedMarket
      }

      // 🎉 시즌 종료 체크 (1년 경과)
      if (newGameTime.isYearEnd && lastSeasonYearRef.current < newGameTime.year) {
        lastSeasonYearRef.current = newGameTime.year
        setShowSeasonEnd(true)
        playSound('levelUp')
      }

      // 마켓 이벤트 체크
      const event = generateMarketEvent(workingStocks)
      if (event) {
        const { stocks: eventStocks, cash: eventCash, portfolio: eventPortfolio, message } =
          applyEventEffect(event, workingStocks, workingCash, workingPortfolio)
        workingStocks = eventStocks
        workingCash = eventCash
        workingPortfolio = eventPortfolio
        if (message) {
          showNotification(`${event.icon} ${message}`, 'info')
        }
      }

      // 🚨 위기 이벤트 체크 (CrisisEvents 시스템 연동)
      const crisisResult = updatePricesWithCrisis(workingStocks, workingMarketState, gameDay)
      if (crisisResult.crisisEvent) {
        const { type, crisis } = crisisResult.crisisEvent

        if (type === 'crisis_started') {
          // 새 위기 발생
          setCrisisAlert(crisis)
          setActiveCrisis(crisis)
          setCrisisHistory(prev => [...prev, { ...crisis, startDay: gameDay }])

          const isPositive = crisis.baseImpact && crisis.baseImpact[0] > 0
          showNotification(
            `${crisis.icon} ${isPositive ? '호재' : '위기'} 발생: ${crisis.name}`,
            isPositive ? 'success' : 'error'
          )
          playSound('news')
        } else if (type === 'crisis_ended') {
          // 위기 종료
          setActiveCrisis(null)
          showNotification(`✅ ${crisis.name} 종료, 시장 정상화`, 'info')
        } else if (type === 'crisis_update') {
          // 위기 진행 업데이트
          setActiveCrisis(crisisResult.activeCrisis)
        }
      } else {
        // 활성 위기 상태 동기화
        const currentCrisis = crisisResult.activeCrisis || getActiveCrisis()
        setActiveCrisis(currentCrisis)
      }

      // 가격 변동 (시장 시간 체크 포함)
      const previousStocks = workingStocks
      const calculatedResults = calculateAllStockPrices(previousStocks, workingMarketState, gameDay, newGameTime)

      let newStocks = previousStocks.map(stock => {
        const result = calculatedResults[stock.id]
        const newPrice = result ? result.newPrice : stock.price

        return {
          ...stock,
          price: newPrice,
          momentum: (stock.momentum || 0) * 0.95,
          dailyHigh: Math.max(stock.dailyHigh || newPrice, newPrice),
          dailyLow: Math.min(stock.dailyLow || newPrice, newPrice)
        }
      })
      newStocks = applyCrisisImpact(newStocks, gameDay)

      const previousPriceMap = new Map(previousStocks.map(stock => [stock.id, stock.price]))
      const newChanges = {}
      newStocks.forEach(stock => {
        const prevPrice = previousPriceMap.get(stock.id) ?? stock.price
        newChanges[stock.id] = stock.price > prevPrice ? 'up' : stock.price < prevPrice ? 'down' : 'same'
      })
      setPriceChanges(newChanges)
      setTimeout(() => setPriceChanges({}), 500)

      setPriceHistory(prev => {
        const newHistory = { ...prev }
        newStocks.forEach(stock => {
          newHistory[stock.id] = [...(newHistory[stock.id] || []).slice(-29), stock.price]
        })
        return newHistory
      })

      workingStocks = newStocks
      if (workingPendingOrders.length > 0) {
        const feeDiscountLevel = unlockedSkills['fee_discount'] || 0
        let orderFeeRate = 0.0015
        if (feeDiscountLevel > 0) {
          orderFeeRate *= (1 - feeDiscountLevel * 0.05)
        }

        const { executedOrders, remainingOrders, cash: newCash, portfolio: newPortfolio } =
          processOrders(workingPendingOrders, workingStocks, workingCash, workingPortfolio, { feeRate: orderFeeRate })

        if (executedOrders.length > 0) {
          workingCash = newCash
          workingPortfolio = newPortfolio
          workingPendingOrders = remainingOrders
          const tradeCount = executedOrders.length
          let profitDelta = 0

          executedOrders.forEach(order => {
            showNotification(`🔔 ${order.stockName} ${order.type} 주문 체결!`, 'success')
            playSound(order.side === 'buy' ? 'buy' : 'sell')
            setTradeHistory(prev => [...prev, { ...order, type: order.side, id: generateId(), timestamp: now }])
            if (order.side === 'sell' && typeof order.profit === 'number') {
              profitDelta += order.profit
            }
          })
          setTotalTrades(prev => prev + tradeCount)
          setDailyTrades(prev => prev + tradeCount)
          if (profitDelta !== 0) {
            setTotalProfit(prev => prev + profitDelta)
            setDailyProfit(prev => prev + profitDelta)
          }
          setWinStreak(prev => {
            let streak = prev
            executedOrders.forEach(order => {
              if (order.side !== 'sell') return
              const profit = typeof order.profit === 'number' ? order.profit : 0
              if (profit > 0) streak += 1
              else streak = 0
            })
            return streak
          })
        }
      }

      // 공매도 이자 및 강제청산
      if (Object.keys(workingShortPositions).length > 0) {
        let newCash = workingCash
        const updatedShorts = {}
        const liquidated = []

        Object.entries(workingShortPositions).forEach(([stockId, position]) => {
          const stock = workingStocks.find(s => s.id === parseInt(stockId))
          if (!stock) return

          const interest = stock.price * position.quantity * SHORT_SELLING.interestRate
          newCash -= interest

          const pnl = (position.entryPrice - stock.price) * position.quantity
          const marginUsed = position.entryPrice * position.quantity * SHORT_SELLING.marginRate

          if (pnl < -marginUsed * 0.5) {
            liquidated.push({ stockId, position, stock, pnl })
          } else {
            updatedShorts[stockId] = position
          }
        })

        if (liquidated.length > 0) {
          liquidated.forEach(({ stockId, position, stock, pnl }) => {
            newCash += position.entryPrice * position.quantity + pnl
            showNotification(`⚠️ ${stock.name} 공매도 강제청산!`, 'error')
            playSound('error')
          })
          workingShortPositions = updatedShorts
        }

        if (newCash !== workingCash) workingCash = newCash
      }

      // 알림 체크
      const triggeredAlerts = checkAlerts(workingAlerts, workingStocks, workingPortfolio)
      if (triggeredAlerts.length > 0) {
        const triggeredIds = new Set(triggeredAlerts.map(alert => alert.id))
        triggeredAlerts.forEach(alert => {
          showNotification(`Alert: ${alert.stockName}`, 'info')
          playSound('news')
        })
        workingAlerts = workingAlerts.map(a => triggeredIds.has(a.id) ? { ...a, triggered: true } : a)
      }
      if (now - lastDividendTime > 60000) {
        let dividendTotal = 0
        Object.entries(workingPortfolio).forEach(([stockId, holding]) => {
          const rate = DIVIDEND_RATES[parseInt(stockId)] || 0
          const stock = workingStocks.find(s => s.id === parseInt(stockId))
          if (stock && rate > 0) {
            const dividend = Math.round(stock.price * holding.quantity * (rate / 100) / 60)
            dividendTotal += dividend
          }
        })
        if (dividendTotal > 0) {
          workingCash += dividendTotal
          setTotalDividends(prev => prev + dividendTotal)
          showNotification(`💰 배당금 ${formatNumber(dividendTotal)}원`, 'success')
        }
        setLastDividendTime(now)
      }

      const stockValueNow = calcStockValue(workingStocks, workingPortfolio)
      const shortValueNow = calcShortValue(workingStocks, workingShortPositions)
      const grossAssetsNow = workingCash + stockValueNow + shortValueNow
      const totalAssetsNow = grossAssetsNow - workingCreditUsed - workingCreditInterest

      if (now % 10000 < 1000) {
        setAssetHistory(prev => [...prev.slice(-100), { value: totalAssetsNow, timestamp: now, day: gameDay }])
      }

      setStocks(workingStocks)
      setMarketState(workingMarketState)
      if (workingCash !== cash) setCash(workingCash)
      if (workingPortfolio !== portfolio) setPortfolio(workingPortfolio)
      if (workingPendingOrders !== pendingOrders) setPendingOrders(workingPendingOrders)
      if (workingShortPositions !== shortPositions) setShortPositions(workingShortPositions)
      if (workingCreditUsed !== creditUsed) setCreditUsed(workingCreditUsed)
      if (workingCreditInterest !== creditInterest) setCreditInterest(workingCreditInterest)
      if (workingAlerts !== alerts) setAlerts(workingAlerts)
    }, 1000)

    return () => clearInterval(interval)
  }, [stocks, marketState, pendingOrders, cash, portfolio, shortPositions, creditUsed, creditInterest, marginCallActive, lastDividendTime, playSound, alerts, gameStartTime, currentDay, unlockedSkills])

  // 미션 진행도
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

  // Toast Helper
  const addToast = useCallback((message, type = 'info', subMessage = null) => {
    const id = generateId()
    setToasts(prev => [...prev, { id, message, type, subMessage, duration: 3000 }])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Legacy Wrapper
  const showNotification = (message, type = 'success') => {
    addToast(message, type)
  }

  // Action Feedback Helper
  const addActionFeedback = useCallback((text, type = 'neutral', x, y) => {
    const id = generateId()
    const finalX = x || window.innerWidth / 2
    const finalY = y || window.innerHeight / 2
    setFeedbackItems(prev => [...prev, { id, text, type, x: finalX, y: finalY }])
  }, [])

  const removeFeedback = useCallback((id) => {
    setFeedbackItems(prev => prev.filter(f => f.id !== id))
  }, [])

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

  // 신용 거래 - 대출
  const handleBorrowCredit = (amount) => {
    if (!canUseCredit) {
      showNotification('신용 거래는 레벨 3부터 가능합니다!', 'error')
      return false
    }

    if (amount <= 0) {
      showNotification('대출 금액을 입력하세요!', 'error')
      return false
    }

    if (amount > availableCredit) {
      showNotification(`대출 한도 초과! 가용 한도: ${formatNumber(availableCredit)}원`, 'error')
      return false
    }

    // 대출 수수료 차감
    const fee = Math.floor(amount * CREDIT_TRADING.borrowFee)
    const netAmount = amount - fee

    setCreditUsed(prev => prev + amount)
    setCash(prev => prev + netAmount)
    showNotification(`${formatNumber(amount)}원 대출 실행 (수수료 ${formatNumber(fee)}원)`, 'info')
    playSound('buy')
    return true
  }

  // 신용 거래 - 상환
  const handleRepayCredit = (amount) => {
    if (creditUsed <= 0 && creditInterest <= 0) {
      showNotification('상환할 대출이 없습니다!', 'error')
      return false
    }

    const totalDebtNow = creditUsed + creditInterest
    const repayAmount = Math.min(amount, totalDebtNow, cash)

    if (repayAmount <= 0) {
      showNotification('상환할 금액이 부족합니다!', 'error')
      return false
    }

    // 이자 먼저 상환, 그 다음 원금
    let remaining = repayAmount
    if (creditInterest > 0) {
      const interestPayment = Math.min(remaining, creditInterest)
      setCreditInterest(prev => prev - interestPayment)
      remaining -= interestPayment
    }
    if (remaining > 0 && creditUsed > 0) {
      const principalPayment = Math.min(remaining, creditUsed)
      setCreditUsed(prev => prev - principalPayment)
    }

    setCash(prev => prev - repayAmount)
    showNotification(`${formatNumber(repayAmount)}원 상환 완료`, 'success')
    playSound('sell')
    return true
  }

  // 매수
  const handleBuy = (stock, qty) => {
    const leverageMultiplier = currentLeverage.multiplier
    const effectiveQty = qty * leverageMultiplier
    const rawTotal = stock.price * qty

    // 수수료 계산 (기본 0.15%)
    let feeRate = 0.0015
    const feeDiscountLevel = unlockedSkills['fee_discount'] || 0
    if (feeDiscountLevel > 0) {
      feeRate *= (1 - feeDiscountLevel * 0.05) // 레벨당 5% 할인
    }
    const fee = Math.floor(rawTotal * feeRate)
    const total = rawTotal + fee

    if (total > cash) {
      showNotification('잔고가 부족합니다!', 'error')
      playSound('error')
      return
    }

    setCash(prev => prev - total)
    setPortfolio(prev => {
      const existing = prev[stock.id] || { quantity: 0, totalCost: 0 }
      return {
        ...prev,
        [stock.id]: {
          quantity: existing.quantity + effectiveQty,
          totalCost: existing.totalCost + total,
          leverage: leverageMultiplier > 1 ? leverageMultiplier : (existing.leverage || 1),
          firstBuyTime: existing.firstBuyTime || Date.now()
        }
      }
    })

    const trade = { id: generateId(), type: 'buy', stockId: stock.id, quantity: effectiveQty, price: stock.price, total, timestamp: Date.now() }
    setTradeHistory(prev => [...prev, trade])
    setTotalTrades(prev => prev + 1)
    setDailyTrades(prev => prev + 1)
    playSound('buy')
    showNotification(`${stock.name} ${effectiveQty}주 매수`, 'success')

    // Visual Feedback
    addActionFeedback(`-${formatCompact(total)}`, 'loss', window.innerWidth / 2, window.innerHeight / 2) // Spending money is red/loss visual but gaining stock
  }

  // 매도
  const handleSell = (stock, qty) => {
    const holding = portfolio[stock.id]
    if (!holding || qty > holding.quantity) {
      showNotification('보유 수량이 부족합니다!', 'error')
      playSound('error')
      return
    }

    const rawTotal = stock.price * qty

    // 수수료 계산
    let feeRate = 0.0015
    const feeDiscountLevel = unlockedSkills['fee_discount'] || 0
    if (feeDiscountLevel > 0) {
      feeRate *= (1 - feeDiscountLevel * 0.05)
    }
    const fee = Math.floor(rawTotal * feeRate)
    const netTotal = rawTotal - fee

    const avgPrice = holding.totalCost / holding.quantity
    // 수익 = (매도금액 - 수수료) - (매수평단 * 수량)
    // 매수평단에는 이미 매수 수수료가 포함되어 있음 (handleBuy에서 totalCost에 포함)
    const profit = netTotal - (avgPrice * qty)

    setCash(prev => prev + netTotal)
    setPortfolio(prev => {
      const remainingQty = holding.quantity - qty
      if (remainingQty <= 0) {
        const updated = { ...prev }
        delete updated[stock.id]
        return updated
      }
      return {
        ...prev,
        [stock.id]: { ...holding, quantity: remainingQty, totalCost: avgPrice * remainingQty }
      }
    })

    const trade = { id: generateId(), type: 'sell', stockId: stock.id, quantity: qty, price: stock.price, total: netTotal, profit, timestamp: Date.now() }
    setTradeHistory(prev => [...prev, trade])
    setTotalTrades(prev => prev + 1)
    setDailyTrades(prev => prev + 1)
    setTotalProfit(prev => prev + profit)
    setDailyProfit(prev => prev + profit)

    if (profit > 0) setWinStreak(prev => prev + 1)
    else setWinStreak(0)

    playSound('sell')
    showNotification(`${stock.name} ${qty}주 매도 (${profit >= 0 ? '+' : ''}${formatCompact(profit)})`, profit >= 0 ? 'success' : 'warning')

    // Visual Feedback
    addActionFeedback(`+${formatCompact(netTotal)}`, 'profit', window.innerWidth / 2, window.innerHeight / 2)
  }

  // 공매도
  const handleShortSell = (stock, qty) => {
    if (!canShortSell) {
      showNotification(`공매도는 Lv.${SHORT_SELLING.minLevel} 이상 필요!`, 'error')
      playSound('error')
      return
    }

    const marginRequired = stock.price * qty * SHORT_SELLING.marginRate
    if (marginRequired > cash) {
      showNotification('증거금이 부족합니다!', 'error')
      playSound('error')
      return
    }

    setCash(prev => prev - marginRequired)
    setShortPositions(prev => {
      const existing = prev[stock.id]
      if (existing) {
        const totalQty = existing.quantity + qty
        const avgPrice = (existing.entryPrice * existing.quantity + stock.price * qty) / totalQty
        return {
          ...prev,
          [stock.id]: { quantity: totalQty, entryPrice: avgPrice, margin: existing.margin + marginRequired, openTime: existing.openTime }
        }
      }
      return {
        ...prev,
        [stock.id]: { quantity: qty, entryPrice: stock.price, margin: marginRequired, openTime: Date.now() }
      }
    })

    const trade = { id: generateId(), type: 'short', stockId: stock.id, quantity: qty, price: stock.price, total: marginRequired, timestamp: Date.now() }
    setTradeHistory(prev => [...prev, trade])
    setTotalTrades(prev => prev + 1)
    setDailyTrades(prev => prev + 1)
    playSound('sell')
    showNotification(`🐻 ${stock.name} ${qty}주 공매도`, 'info')
  }

  // 공매도 청산
  const handleCoverShort = (stock, qty) => {
    const position = shortPositions[stock.id]
    if (!position || qty > position.quantity) {
      showNotification('공매도 포지션이 부족합니다!', 'error')
      playSound('error')
      return
    }

    const pnl = (position.entryPrice - stock.price) * qty
    const marginReturn = (position.margin / position.quantity) * qty

    setCash(prev => prev + marginReturn + pnl)
    setShortPositions(prev => {
      const remainingQty = position.quantity - qty
      if (remainingQty <= 0) {
        const updated = { ...prev }
        delete updated[stock.id]
        return updated
      }
      return {
        ...prev,
        [stock.id]: { ...position, quantity: remainingQty, margin: position.margin - marginReturn }
      }
    })

    setTotalTrades(prev => prev + 1)
    setTotalProfit(prev => prev + pnl)
    setDailyProfit(prev => prev + pnl)

    if (pnl > 0) setWinStreak(prev => prev + 1)
    else setWinStreak(0)

    playSound('buy')
    showNotification(`🐻 ${stock.name} 청산 (${pnl >= 0 ? '+' : ''}${formatCompact(pnl)})`, pnl >= 0 ? 'success' : 'error')
  }

  const handleBuyMax = (stock) => {
    const maxQty = Math.floor(cash / stock.price)
    if (maxQty > 0) handleBuy(stock, maxQty)
  }

  const handleSellAll = (stock) => {
    const holding = portfolio[stock.id]
    if (holding?.quantity > 0) handleSell(stock, holding.quantity)
  }

  const handlePlaceOrder = (order) => {
    setPendingOrders(prev => [...prev, { ...order, id: generateId() }])
    showNotification(`${order.type} 주문 등록됨`, 'info')
  }

  const handleCancelOrder = (order) => {
    setPendingOrders(prev => prev.filter(o => o.id !== order.id))
    showNotification('주문 취소됨', 'info')
  }

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
      {orderManagerStock && <OrderManager stock={orderManagerStock} currentPrice={stocks.find(s => s.id === orderManagerStock.id)?.price || orderManagerStock.price} portfolio={portfolio} cash={cash} onPlaceOrder={handlePlaceOrder} onClose={() => setOrderManagerStock(null)} initialSide={orderManagerSide} />}
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
                stocks.find(s => s.id === chartStock.id)?.price || chartStock.price
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
