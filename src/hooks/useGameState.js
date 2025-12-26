/**
 * useGameState - 게임 상태 저장/로드 관리 커스텀 훅
 */

import { useState, useEffect, useCallback } from 'react'
import { saveGame, loadGame } from '../utils'
import { INITIAL_CAPITAL } from '../constants'

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

    // 주식 데이터
    const [stocks, setStocks] = useState(allProducts)

    // 자금 관련
    const [cash, setCash] = useState(INITIAL_CAPITAL)
    const [portfolio, setPortfolio] = useState({})
    const [shortPositions, setShortPositions] = useState({})

    // 신용 거래
    const [creditUsed, setCreditUsed] = useState(0)
    const [creditInterest, setCreditInterest] = useState(0)
    const [marginCallActive, setMarginCallActive] = useState(false)

    // 거래 기록
    const [tradeHistory, setTradeHistory] = useState([])
    const [pendingOrders, setPendingOrders] = useState([])

    // 업적/레벨
    const [unlockedAchievements, setUnlockedAchievements] = useState({})
    const [unlockedSkills, setUnlockedSkills] = useState({})
    const [totalXp, setTotalXp] = useState(0)

    // 통계
    const [totalTrades, setTotalTrades] = useState(0)
    const [winStreak, setWinStreak] = useState(0)
    const [maxWinStreak, setMaxWinStreak] = useState(0)
    const [totalProfit, setTotalProfit] = useState(0)
    const [dailyTrades, setDailyTrades] = useState(0)
    const [dailyProfit, setDailyProfit] = useState(0)

    // 미션
    const [missionProgress, setMissionProgress] = useState({})
    const [completedMissions, setCompletedMissions] = useState({})

    // 기타
    const [news, setNews] = useState([])
    const [assetHistory, setAssetHistory] = useState([])
    const [watchlist, setWatchlist] = useState([])
    const [alerts, setAlerts] = useState([])
    const [totalDividends, setTotalDividends] = useState(0)

    // 시간 관련
    const [gameStartTime, setGameStartTime] = useState(Date.now())
    const [currentDay, setCurrentDay] = useState(1)

    // 게임 로드
    const loadGameState = useCallback(() => {
        const saved = loadGame()
        if (saved) {
            if (saved.stocks) setStocks(saved.stocks)
            setCash(saved.cash ?? INITIAL_CAPITAL)
            setPortfolio(saved.portfolio ?? {})
            setShortPositions(saved.shortPositions ?? {})
            setCreditUsed(saved.creditUsed ?? 0)
            setCreditInterest(saved.creditInterest ?? 0)
            setTradeHistory(saved.tradeHistory ?? [])
            setPendingOrders(saved.pendingOrders ?? [])
            setUnlockedAchievements(saved.unlockedAchievements ?? {})
            setUnlockedSkills(saved.unlockedSkills ?? {})
            setTotalXp(saved.totalXp ?? 0)
            setTotalTrades(saved.totalTrades ?? 0)
            setWinStreak(saved.winStreak ?? 0)
            setTotalProfit(saved.totalProfit ?? 0)
            setNews(saved.news ?? [])
            setMissionProgress(saved.missionProgress ?? {})
            setCompletedMissions(saved.completedMissions ?? {})
            setTotalDividends(saved.totalDividends ?? 0)
            setMaxWinStreak(saved.maxWinStreak ?? 0)
            setAssetHistory(saved.assetHistory ?? [])
            setWatchlist(saved.watchlist ?? [])
            setAlerts(saved.alerts ?? [])
            setGameStartTime(saved.gameStartTime ?? Date.now())
            setCurrentDay(saved.currentDay ?? 1)
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
    }, [onNewUser, setSettings])

    // 게임 저장
    const saveGameState = useCallback(() => {
        const payload = {
            stocks, cash, portfolio, shortPositions,
            creditUsed, creditInterest,
            tradeHistory, pendingOrders,
            unlockedAchievements, unlockedSkills, totalXp,
            totalTrades, winStreak, maxWinStreak, totalProfit,
            news, missionProgress, completedMissions,
            totalDividends, assetHistory,
            watchlist, alerts, gameStartTime, currentDay
        }
        if (settings !== undefined) {
            payload.settings = settings
        }
        saveGame(payload)
    }, [stocks, cash, portfolio, shortPositions, creditUsed, creditInterest, tradeHistory, pendingOrders, unlockedAchievements, unlockedSkills, totalXp, totalTrades, winStreak, maxWinStreak, totalProfit, news, missionProgress, completedMissions, totalDividends, assetHistory, watchlist, alerts, gameStartTime, currentDay, settings])

    // 초기화
    useEffect(() => {
        const isNewUser = loadGameState()
        setIsInitialized(true)
        return () => { }
    }, [loadGameState])

    // 자동 저장 (5초마다)
    useEffect(() => {
        if (!isInitialized) return
        const timer = setInterval(saveGameState, 5000)
        return () => clearInterval(timer)
    }, [isInitialized, saveGameState])

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
