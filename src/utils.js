// Save/load helpers and common utilities for the game

import { INITIAL_CAPITAL } from './constants'

const SAVE_KEY = 'stockTradingGame'
const SEASON_RESET_NOTICE_KEY = 'stockGameSeasonResetNoticePending'

const markSeasonResetNoticePending = () => {
    try {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(SEASON_RESET_NOTICE_KEY, '1')
        }
    } catch {
        // noop
    }
}

export const consumeSeasonResetNotice = () => {
    try {
        if (typeof window === 'undefined') return false
        const isPending = window.localStorage.getItem(SEASON_RESET_NOTICE_KEY) === '1'
        if (isPending) {
            window.localStorage.removeItem(SEASON_RESET_NOTICE_KEY)
            return true
        }
    } catch {
        // noop
    }
    return false
}

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
    },
    {
        version: 3,
        defaults: {},
        resetToDefaults: true,
        migrate: () => {}
    },
    {
        version: 4,
        defaults: {},
        resetToDefaults: true,
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

export const getDefaultSaveState = () => ({
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
            if (migration.resetToDefaults) {
                const resetState = getDefaultSaveState()
                Object.keys(data).forEach((key) => {
                    delete data[key]
                })
                Object.assign(data, resetState)
                markSeasonResetNoticePending()
            } else {
                applyDefaults(data, migration.defaults)
                migration.migrate(data)
            }
            migratedVersion = migration.version
        })

    if (migratedVersion < 1) {
        migratedVersion = 1
    }

    data.version = migratedVersion
    return data
}

// Save game state
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
        console.error('Save game failed:', error)
        return false
    }
}

// Load game state
export const loadGame = () => {
    try {
        const saved = localStorage.getItem(SAVE_KEY)
        if (!saved) return null

        let data = JSON.parse(saved)
        if (!isPlainObject(data)) return null
        data = sanitizeSaveData(migrateSaveData(data))
        return data
    } catch (error) {
        console.error('Load game failed:', error)
        return null
    }
}

// Reset saved state
export const resetGame = () => {
    localStorage.removeItem(SAVE_KEY)
}

// Configure auto-save interval
export const setupAutoSave = (getState, interval = 10000) => {
    return setInterval(() => {
        const state = getState()
        saveGame(state)
    }, interval)
}

// Number formatter
export const formatNumber = (num) => {
    return new Intl.NumberFormat('ko-KR').format(num)
}

// Percent formatter
export const formatPercent = (num) => {
    const sign = num >= 0 ? '+' : ''
    return `${sign}${num.toFixed(2)}%`
}

// Compact money formatter
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

// Time formatter
export const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    })
}

// Date formatter
export const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// Random float in range
export const randomRange = (min, max) => {
    return Math.random() * (max - min) + min
}

// Random integer in range
export const randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

// Random element from array
export const randomChoice = (arr) => {
    return arr[Math.floor(Math.random() * arr.length)]
}

// Deep clone object
export const deepClone = (obj) => {
    return JSON.parse(JSON.stringify(obj))
}

// Debounce helper
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

// ID generator
export const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Calculate player level from XP table
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

// Generate OHLC candle data for chart simulation
export const generateCandleData = (currentPrice, count, volatility) => {
    let data = []
    let price = currentPrice
    const now = Date.now()

    // Build candle data backward in time
    for (let i = 0; i < count; i++) {
        // Price swing simulation
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
