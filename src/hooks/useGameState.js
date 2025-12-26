/**
 * useGameState - 게임 상태 저장/로드 관리 커스텀 훅
 */

import { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react'
import { saveGame, loadGame } from '../utils'
import { INITIAL_CAPITAL } from '../constants'

const AUTO_SAVE_INTERVAL = 5000

// 초기 게임 상태
const INITIAL_STATE = {
    cash: INITIAL_CAPITAL,
    portfolio: {},
    shortPositions: {},
    creditUsed: 0,
    creditInterest: 0,
    tradeHistory: [],
    pendingOrders: [],
    unlockedAchievements: {},
    unlockedSkills: {},
    totalXp: 0,
    totalTrades: 0,
    winStreak: 0,
    maxWinStreak: 0,
    totalProfit: 0,
    news: [],
    missionProgress: {},
    completedMissions: {},
    totalDividends: 0,
    assetHistory: [],
    watchlist: [],
    alerts: [],
    currentDay: 1
}

export const useGameState = (input = {}) => {
    const isLegacy = Array.isArray(input)
    const allProducts = isLegacy ? input : (input.allProducts || [])
    const settings = isLegacy ? undefined : input.settings
    const setSettings = isLegacy ? undefined : input.setSettings
    const onNewUser = isLegacy ? undefined : input.onNewUser

    // 게임 로드 상태
    const [isInitialized, setIsInitialized] = useState(false)
    const isInitializedRef = useRef(false)
    const gameStateRef = useRef({ ...INITIAL_STATE, stocks: allProducts })
    const persistGameStateRef = useRef(null)
    const settingsRef = useRef(settings)

    // 주식 데이터
    const [stocks, setStocks] = useState(allProducts)
    const stocksRef = useRef(stocks)

    // 자금 관련
    const [cash, setCash] = useState(INITIAL_CAPITAL)
    const [portfolio, setPortfolio] = useState({})
    const [shortPositions, setShortPositions] = useState({})
    const cashRef = useRef(cash)
    const portfolioRef = useRef(portfolio)
    const shortPositionsRef = useRef(shortPositions)

    // 신용 거래
    const [creditUsed, setCreditUsed] = useState(0)
    const [creditInterest, setCreditInterest] = useState(0)
    const [marginCallActive, setMarginCallActive] = useState(false)
    const creditUsedRef = useRef(creditUsed)
    const creditInterestRef = useRef(creditInterest)

    // 거래 기록
    const [tradeHistory, setTradeHistory] = useState([])
    const [pendingOrders, setPendingOrders] = useState([])
    const tradeHistoryRef = useRef(tradeHistory)
    const pendingOrdersRef = useRef(pendingOrders)

    // 업적/레벨
    const [unlockedAchievements, setUnlockedAchievements] = useState({})
    const [unlockedSkills, setUnlockedSkills] = useState({})
    const [totalXp, setTotalXp] = useState(0)
    const unlockedAchievementsRef = useRef(unlockedAchievements)
    const unlockedSkillsRef = useRef(unlockedSkills)
    const totalXpRef = useRef(totalXp)

    // 통계
    const [totalTrades, setTotalTrades] = useState(0)
    const [winStreak, setWinStreak] = useState(0)
    const [maxWinStreak, setMaxWinStreak] = useState(0)
    const [totalProfit, setTotalProfit] = useState(0)
    const [dailyTrades, setDailyTrades] = useState(0)
    const [dailyProfit, setDailyProfit] = useState(0)
    const totalTradesRef = useRef(totalTrades)
    const winStreakRef = useRef(winStreak)
    const maxWinStreakRef = useRef(maxWinStreak)
    const totalProfitRef = useRef(totalProfit)
    const dailyTradesRef = useRef(dailyTrades)
    const dailyProfitRef = useRef(dailyProfit)

    // 미션
    const [missionProgress, setMissionProgress] = useState({})
    const [completedMissions, setCompletedMissions] = useState({})
    const missionProgressRef = useRef(missionProgress)
    const completedMissionsRef = useRef(completedMissions)

    // 기타
    const [news, setNews] = useState([])
    const [assetHistory, setAssetHistory] = useState([])
    const [watchlist, setWatchlist] = useState([])
    const [alerts, setAlerts] = useState([])
    const [totalDividends, setTotalDividends] = useState(0)
    const newsRef = useRef(news)
    const assetHistoryRef = useRef(assetHistory)
    const watchlistRef = useRef(watchlist)
    const alertsRef = useRef(alerts)
    const totalDividendsRef = useRef(totalDividends)

    // 시간 관련
    const [gameStartTime, setGameStartTime] = useState(Date.now())
    const [currentDay, setCurrentDay] = useState(1)
    const gameStartTimeRef = useRef(gameStartTime)
    const currentDayRef = useRef(currentDay)

    const setIfChanged = useCallback((setter, value) => {
        setter(prev => (Object.is(prev, value) ? prev : value))
    }, [])

    const buildSnapshot = useCallback(() => {
        const nextState = {
            stocks: stocksRef.current,
            cash: cashRef.current,
            portfolio: portfolioRef.current,
            shortPositions: shortPositionsRef.current,
            creditUsed: creditUsedRef.current,
            creditInterest: creditInterestRef.current,
            tradeHistory: tradeHistoryRef.current,
            pendingOrders: pendingOrdersRef.current,
            unlockedAchievements: unlockedAchievementsRef.current,
            unlockedSkills: unlockedSkillsRef.current,
            totalXp: totalXpRef.current,
            totalTrades: totalTradesRef.current,
            winStreak: winStreakRef.current,
            maxWinStreak: maxWinStreakRef.current,
            totalProfit: totalProfitRef.current,
            dailyTrades: dailyTradesRef.current,
            dailyProfit: dailyProfitRef.current,
            news: newsRef.current,
            missionProgress: missionProgressRef.current,
            completedMissions: completedMissionsRef.current,
            totalDividends: totalDividendsRef.current,
            assetHistory: assetHistoryRef.current,
            watchlist: watchlistRef.current,
            alerts: alertsRef.current,
            gameStartTime: gameStartTimeRef.current,
            currentDay: currentDayRef.current
        }
        if (settingsRef.current !== undefined) {
            nextState.settings = settingsRef.current
        }
        return nextState
    }, [])

    const persistGameState = useCallback((context) => {
        if (!isInitializedRef.current) return false
        const snapshot = buildSnapshot()
        gameStateRef.current = snapshot
        const result = saveGame(snapshot)
        if (!result) {
            // 저장 실패 시 콘솔 경고만 남기고 UI 알림은 추가하지 않는다.
            console.warn(`게임 저장 실패: ${context}`)
        }
        return result
    }, [buildSnapshot])

    // 게임 로드
    const loadGameState = useCallback(() => {
        const saved = loadGame()
        if (saved) {
            if (saved.stocks) setIfChanged(setStocks, saved.stocks)
            setIfChanged(setCash, saved.cash ?? INITIAL_CAPITAL)
            setIfChanged(setPortfolio, saved.portfolio ?? {})
            setIfChanged(setShortPositions, saved.shortPositions ?? {})
            setIfChanged(setCreditUsed, saved.creditUsed ?? 0)
            setIfChanged(setCreditInterest, saved.creditInterest ?? 0)
            setIfChanged(setTradeHistory, saved.tradeHistory ?? [])
            setIfChanged(setPendingOrders, saved.pendingOrders ?? [])
            setIfChanged(setUnlockedAchievements, saved.unlockedAchievements ?? {})
            setIfChanged(setUnlockedSkills, saved.unlockedSkills ?? {})
            setIfChanged(setTotalXp, saved.totalXp ?? 0)
            setIfChanged(setTotalTrades, saved.totalTrades ?? 0)
            setIfChanged(setWinStreak, saved.winStreak ?? 0)
            setIfChanged(setTotalProfit, saved.totalProfit ?? 0)
            setIfChanged(setNews, saved.news ?? [])
            setIfChanged(setMissionProgress, saved.missionProgress ?? {})
            setIfChanged(setCompletedMissions, saved.completedMissions ?? {})
            setIfChanged(setTotalDividends, saved.totalDividends ?? 0)
            setIfChanged(setMaxWinStreak, saved.maxWinStreak ?? 0)
            setIfChanged(setAssetHistory, saved.assetHistory ?? [])
            setIfChanged(setWatchlist, saved.watchlist ?? [])
            setIfChanged(setAlerts, saved.alerts ?? [])
            setIfChanged(setGameStartTime, saved.gameStartTime ?? Date.now())
            setIfChanged(setCurrentDay, saved.currentDay ?? 1)
            if (saved.settings && typeof setSettings === 'function') {
                setSettings(prev => ({ ...prev, ...saved.settings }))
            }
            const isNewUser = (saved.totalTrades ?? 0) === 0
            if (isNewUser && typeof onNewUser === 'function') {
                onNewUser()
            }
            return isNewUser // 신규 유저 여부
        }
        if (typeof onNewUser === 'function') {
            onNewUser()
        }
        return true // 저장 데이터 없음 = 신규 유저
    }, [onNewUser, setIfChanged, setSettings])

    // 게임 저장
    const saveGameState = useCallback(() => {
        return persistGameState('수동 저장')
    }, [persistGameState])

    // 초기화
    useEffect(() => {
        loadGameState()
        setIfChanged(setIsInitialized, true)
        return () => { }
    }, [loadGameState, setIfChanged])

    useEffect(() => {
        isInitializedRef.current = isInitialized
    }, [isInitialized])

    useEffect(() => {
        persistGameStateRef.current = persistGameState
    }, [persistGameState])

    useLayoutEffect(() => {
        stocksRef.current = stocks
        cashRef.current = cash
        portfolioRef.current = portfolio
        shortPositionsRef.current = shortPositions
        creditUsedRef.current = creditUsed
        creditInterestRef.current = creditInterest
        tradeHistoryRef.current = tradeHistory
        pendingOrdersRef.current = pendingOrders
        unlockedAchievementsRef.current = unlockedAchievements
        unlockedSkillsRef.current = unlockedSkills
        totalXpRef.current = totalXp
        totalTradesRef.current = totalTrades
        winStreakRef.current = winStreak
        maxWinStreakRef.current = maxWinStreak
        totalProfitRef.current = totalProfit
        dailyTradesRef.current = dailyTrades
        dailyProfitRef.current = dailyProfit
        newsRef.current = news
        missionProgressRef.current = missionProgress
        completedMissionsRef.current = completedMissions
        totalDividendsRef.current = totalDividends
        assetHistoryRef.current = assetHistory
        watchlistRef.current = watchlist
        alertsRef.current = alerts
        gameStartTimeRef.current = gameStartTime
        currentDayRef.current = currentDay
        settingsRef.current = settings
    }, [
        stocks,
        cash,
        portfolio,
        shortPositions,
        creditUsed,
        creditInterest,
        tradeHistory,
        pendingOrders,
        unlockedAchievements,
        unlockedSkills,
        totalXp,
        totalTrades,
        winStreak,
        maxWinStreak,
        totalProfit,
        dailyTrades,
        dailyProfit,
        news,
        missionProgress,
        completedMissions,
        totalDividends,
        assetHistory,
        watchlist,
        alerts,
        gameStartTime,
        currentDay,
        settings
    ])

    // 자동 저장 (5초마다)
    useEffect(() => {
        const timer = setInterval(() => {
            if (persistGameStateRef.current) {
                persistGameStateRef.current('자동 저장')
            }
        }, AUTO_SAVE_INTERVAL)
        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                if (persistGameStateRef.current) {
                    persistGameStateRef.current('탭 비활성화 저장')
                }
            }
        }

        const handleBeforeUnload = () => {
            if (persistGameStateRef.current) {
                persistGameStateRef.current('탭 종료 저장')
            }
        }

        window.addEventListener('visibilitychange', handleVisibilityChange)
        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => {
            window.removeEventListener('visibilitychange', handleVisibilityChange)
            window.removeEventListener('beforeunload', handleBeforeUnload)
        }
    }, [])

    return {
        // 상태
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
        totalDividends, setTotalDividends,
        gameStartTime, setGameStartTime,
        currentDay, setCurrentDay,
        // 함수
        saveGameState,
        loadGameState
    }
}

export default useGameState
