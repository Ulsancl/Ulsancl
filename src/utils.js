// 게임 저장/로드 및 유틸리티 함수

import { INITIAL_CAPITAL } from './constants'

const SAVE_KEY = 'stockTradingGame'

const MIGRATIONS = [
    {
        version: 1,
        defaults: {},
        migrate: () => {}
    },
    {
        version: 2,
        defaults: {
            shortPositions: {},
            creditUsed: 0,
            creditInterest: 0,
            pendingOrders: [],
            unlockedSkills: {},
            maxWinStreak: 0,
            totalDividends: 0,
            assetHistory: [],
            watchlist: [],
            alerts: [],
            currentDay: 1,
            gameStartTime: () => Date.now()
        },
        migrate: () => {}
    }
]
const SAVE_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version

const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value)

const toNumber = (value, fallback = 0) => {
    const num = typeof value === 'string' ? Number(value) : value
    return Number.isFinite(num) ? num : fallback
}

const normalizeVersion = (value) => {
    const num = toNumber(value, 0)
    return Number.isFinite(num) && num >= 0 ? num : 0
}

const applyDefaults = (data, defaults) => {
    Object.entries(defaults).forEach(([key, value]) => {
        if (data[key] === undefined || data[key] === null) {
            data[key] = typeof value === 'function' ? value() : value
        }
    })
}

const getDefaultSaveState = () => ({
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
    gameStartTime: Date.now(),
    currentDay: 1
})

const sanitizeSaveData = (data) => {
    const defaults = getDefaultSaveState()
    const sanitized = {
        ...data,
        cash: toNumber(data.cash, defaults.cash),
        portfolio: isPlainObject(data.portfolio) ? data.portfolio : defaults.portfolio,
        shortPositions: isPlainObject(data.shortPositions) ? data.shortPositions : defaults.shortPositions,
        creditUsed: toNumber(data.creditUsed, defaults.creditUsed),
        creditInterest: toNumber(data.creditInterest, defaults.creditInterest),
        tradeHistory: Array.isArray(data.tradeHistory) ? data.tradeHistory : defaults.tradeHistory,
        pendingOrders: Array.isArray(data.pendingOrders) ? data.pendingOrders : defaults.pendingOrders,
        unlockedAchievements: isPlainObject(data.unlockedAchievements) ? data.unlockedAchievements : defaults.unlockedAchievements,
        unlockedSkills: isPlainObject(data.unlockedSkills) ? data.unlockedSkills : defaults.unlockedSkills,
        totalXp: toNumber(data.totalXp, defaults.totalXp),
        totalTrades: toNumber(data.totalTrades, defaults.totalTrades),
        winStreak: toNumber(data.winStreak, defaults.winStreak),
        maxWinStreak: toNumber(data.maxWinStreak, defaults.maxWinStreak),
        totalProfit: toNumber(data.totalProfit, defaults.totalProfit),
        news: Array.isArray(data.news) ? data.news : defaults.news,
        missionProgress: isPlainObject(data.missionProgress) ? data.missionProgress : defaults.missionProgress,
        completedMissions: isPlainObject(data.completedMissions) ? data.completedMissions : defaults.completedMissions,
        totalDividends: toNumber(data.totalDividends, defaults.totalDividends),
        assetHistory: Array.isArray(data.assetHistory) ? data.assetHistory : defaults.assetHistory,
        watchlist: Array.isArray(data.watchlist) ? data.watchlist : defaults.watchlist,
        alerts: Array.isArray(data.alerts) ? data.alerts : defaults.alerts,
        gameStartTime: toNumber(data.gameStartTime, defaults.gameStartTime),
        currentDay: Math.max(1, Math.floor(toNumber(data.currentDay, defaults.currentDay))),
        savedAt: toNumber(data.savedAt, Date.now()),
        version: SAVE_VERSION
    }

    if (!Array.isArray(data.stocks) || data.stocks.length === 0) {
        delete sanitized.stocks
    }
    if (!isPlainObject(data.settings)) {
        delete sanitized.settings
    }

    return sanitized
}

const migrateSaveData = (rawData) => {
    const data = isPlainObject(rawData) ? { ...rawData } : {}
    let migratedVersion = normalizeVersion(data.version)

    MIGRATIONS.filter((migration) => migration.version > migratedVersion)
        .sort((a, b) => a.version - b.version)
        .forEach((migration) => {
            applyDefaults(data, migration.defaults)
            migration.migrate(data)
            migratedVersion = migration.version
        })

    if (migratedVersion < 1) {
        migratedVersion = 1
    }

    data.version = migratedVersion
    return data
}

// 게임 상태 저장
export const saveGame = (gameState) => {
    try {
        const saveData = sanitizeSaveData({
            ...gameState,
            savedAt: Date.now(),
            version: SAVE_VERSION
        })
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData))
        return true
    } catch (error) {
        console.error('게임 저장 실패:', error)
        return false
    }
}

// 게임 상태 로드
export const loadGame = () => {
    try {
        const saved = localStorage.getItem(SAVE_KEY)
        if (!saved) return null

        let data = JSON.parse(saved)
        if (!isPlainObject(data)) return null
        data = sanitizeSaveData(migrateSaveData(data))
        console.log('게임 로드 성공:', new Date(data.savedAt).toLocaleString())
        return data
    } catch (error) {
        console.error('게임 로드 실패:', error)
        return null
    }
}

// 게임 리셋
export const resetGame = () => {
    localStorage.removeItem(SAVE_KEY)
}

// 자동 저장 설정
export const setupAutoSave = (getState, interval = 10000) => {
    return setInterval(() => {
        const state = getState()
        saveGame(state)
    }, interval)
}

// 숫자 포맷
export const formatNumber = (num) => {
    return new Intl.NumberFormat('ko-KR').format(num)
}

// 퍼센트 포맷
export const formatPercent = (num) => {
    const sign = num >= 0 ? '+' : ''
    return `${sign}${num.toFixed(2)}%`
}

// 금액 압축 포맷
export const formatCompact = (num) => {
    const absNum = Math.abs(num)
    const sign = num < 0 ? '-' : ''

    if (absNum >= 1000000000000) {
        return `${sign}${(absNum / 1000000000000).toFixed(2)}조`
    } else if (absNum >= 100000000) {
        return `${sign}${(absNum / 100000000).toFixed(2)}억`
    } else if (absNum >= 10000) {
        return `${sign}${(absNum / 10000).toFixed(0)}만`
    }
    return formatNumber(num)
}

// 시간 포맷
export const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    })
}

// 날짜 포맷
export const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// 랜덤 범위 값
export const randomRange = (min, max) => {
    return Math.random() * (max - min) + min
}

// 랜덤 정수
export const randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

// 랜덤 배열 요소
export const randomChoice = (arr) => {
    return arr[Math.floor(Math.random() * arr.length)]
}

// 깊은 복사
export const deepClone = (obj) => {
    return JSON.parse(JSON.stringify(obj))
}

// 디바운스
export const debounce = (func, wait) => {
    let timeout
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout)
            func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
    }
}

// UUID 생성
export const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 경험치로 레벨 계산
export const calculateLevel = (xp, levels) => {
    for (let i = levels.length - 1; i >= 0; i--) {
        if (xp >= levels[i].minXp) {
            const currentLevel = levels[i]
            const nextLevel = levels[i + 1]
            const progress = nextLevel
                ? ((xp - currentLevel.minXp) / (nextLevel.minXp - currentLevel.minXp)) * 100
                : 100
            return { ...currentLevel, progress: Math.min(100, progress), xpToNext: nextLevel ? nextLevel.minXp - xp : 0 }
        }
    }
    return { ...levels[0], progress: 0, xpToNext: levels[1]?.minXp || 0 }
}

// 리더보드 저장/로드
const LEADERBOARD_KEY = 'stockGameLeaderboard'

export const saveToLeaderboard = (score) => {
    try {
        const existing = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || '[]')
        existing.push(score)
        existing.sort((a, b) => b.totalAssets - a.totalAssets)
        const top10 = existing.slice(0, 10)
        localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(top10))
        return top10
    } catch (error) {
        return []
    }
}

export const getLeaderboard = () => {
    try {
        return JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || '[]')
    } catch {
        return []
    }
}

// 캔들 데이터 생성 (시뮬레이션)
export const generateCandleData = (currentPrice, count, volatility) => {
    let data = []
    let price = currentPrice
    const now = Date.now()

    // 역순으로 데이터 생성
    for (let i = 0; i < count; i++) {
        // 변동폭
        const change = price * volatility * (Math.random() - 0.5)
        const open = price - change
        const high = Math.max(open, price) + (open * volatility * Math.random() * 0.5)
        const low = Math.min(open, price) - (open * volatility * Math.random() * 0.5)

        data.unshift({
            index: i,
            time: now - ((count - i) * 60000),
            open: Math.round(open),
            close: Math.round(price),
            high: Math.round(high),
            low: Math.round(low),
            price: Math.round(price)
        })

        price = open
    }
    return data
}
