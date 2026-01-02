/**
 * marketState.js - market state and game time utilities
 */

import { SECTORS, MACRO_CONFIG } from '../constants'

export const SECONDS_PER_DAY = 300
export const GAME_START_YEAR = 2020
export const DAYS_PER_YEAR = 365
export const MINUTES_PER_TICK = 10

export const MARKET_OPEN_HOUR = 9
export const MARKET_CLOSE_HOUR = 16
export const MARKET_START_HOUR = MARKET_OPEN_HOUR
export const MARKET_END_HOUR = MARKET_CLOSE_HOUR

export const SEASONS = {
    spring: { months: [3, 4, 5], name: '봄', icon: '🌸' },
    summer: { months: [6, 7, 8], name: '여름', icon: '☀️' },
    autumn: { months: [9, 10, 11], name: '가을', icon: '🍂' },
    winter: { months: [12, 1, 2], name: '겨울', icon: '❄️' }
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

export const calculateGameDate = (gameStartTime, currentTime) => {
    const elapsedSeconds = Math.floor((currentTime - gameStartTime) / 1000)
    const totalDays = Math.floor(elapsedSeconds / SECONDS_PER_DAY)
    const secondsInDay = elapsedSeconds % SECONDS_PER_DAY

    let remainingDays = totalDays
    let year = GAME_START_YEAR
    let month = 1
    let day = 1

    while (remainingDays >= DAYS_PER_YEAR) {
        remainingDays -= DAYS_PER_YEAR
        year++
    }

    for (let m = 0; m < 12; m++) {
        const daysInMonth = DAYS_IN_MONTH[m]
        if (remainingDays < daysInMonth) {
            month = m + 1
            day = remainingDays + 1
            break
        }
        remainingDays -= daysInMonth
    }

    const tradingHours = MARKET_CLOSE_HOUR - MARKET_OPEN_HOUR
    const tradingMinutes = tradingHours * 60
    const totalTicks = tradingMinutes / MINUTES_PER_TICK

    const currentTick = Math.floor((secondsInDay / SECONDS_PER_DAY) * totalTicks)
    const elapsedMinutes = currentTick * MINUTES_PER_TICK
    const hour = MARKET_OPEN_HOUR + Math.floor(elapsedMinutes / 60)
    const minute = elapsedMinutes % 60

    let season = 'winter'
    for (const [seasonKey, seasonData] of Object.entries(SEASONS)) {
        if (seasonData.months.includes(month)) {
            season = seasonKey
            break
        }
    }

    const isMarketOpen = hour >= MARKET_OPEN_HOUR && hour < MARKET_CLOSE_HOUR
    const isMarketClosing = hour === 15 && minute >= 50
    const isYearEnd = month === 12 && day === 31 && hour >= 15 && minute >= 50
    const dayOfYear = totalDays % DAYS_PER_YEAR

    return {
        day: totalDays + 1,
        totalDays: totalDays + 1,
        year,
        month,
        dayOfMonth: day,
        dayOfYear: dayOfYear + 1,
        hour: Math.min(MARKET_CLOSE_HOUR, hour),
        minute,
        season,
        seasonInfo: SEASONS[season],
        isMarketOpen,
        isMarketClosing,
        isYearEnd,
        displayDate: `${year % 100}년 ${month}월 ${day}일`,
        displayTime: `${hour.toString().padStart(2, '0')}:${(Math.floor(minute / 10) * 10).toString().padStart(2, '0')}`,
        displaySeason: SEASONS[season].icon + SEASONS[season].name
    }
}

/**
 * 시장 상태 업데이트
 * @param {Object} prevState - 이전 시장 상태
 * @param {Object|null} activeGlobalEvent - 활성 글로벌 이벤트
 * @param {Object|null} rng - 시드 RNG 인스턴스 (null이면 Math.random 폴백)
 */
export const updateMarketState = (prevState, activeGlobalEvent = null, rng = null) => {
    // 랜덤 함수 래퍼
    const random = rng ? () => rng.nextFloat() : Math.random

    const macro = prevState.macro || {
        interestRate: MACRO_CONFIG.interestRate.base,
        inflation: MACRO_CONFIG.inflation.base,
        gdpGrowth: MACRO_CONFIG.gdpGrowth.base
    }

    if (random() < 0.001) {
        macro.interestRate += (random() - 0.5) * MACRO_CONFIG.interestRate.volatility
        macro.interestRate = Math.max(MACRO_CONFIG.interestRate.min, Math.min(MACRO_CONFIG.interestRate.max, macro.interestRate))
    }
    if (random() < 0.001) {
        macro.inflation += (random() - 0.5) * MACRO_CONFIG.inflation.volatility
        macro.inflation = Math.max(MACRO_CONFIG.inflation.min, Math.min(MACRO_CONFIG.inflation.max, macro.inflation))
    }
    if (random() < 0.001) {
        macro.gdpGrowth += (random() - 0.5) * MACRO_CONFIG.gdpGrowth.volatility
        macro.gdpGrowth = Math.max(MACRO_CONFIG.gdpGrowth.min, Math.min(MACRO_CONFIG.gdpGrowth.max, macro.gdpGrowth))
    }

    let macroTrendBoost = 0
    macroTrendBoost += (MACRO_CONFIG.interestRate.base - macro.interestRate) * 0.02
    macroTrendBoost += (macro.gdpGrowth - MACRO_CONFIG.gdpGrowth.base) * 0.03
    macroTrendBoost -= (macro.inflation - MACRO_CONFIG.inflation.base) * 0.01

    let newTrend = prevState.trend * 0.98 + (random() - 0.5) * 0.05 + macroTrendBoost * 0.01
    newTrend = Math.max(-0.5, Math.min(0.5, newTrend))

    let newVolatility = prevState.volatility * 0.95 + 1 * 0.05 + (random() - 0.5) * 0.1

    if (activeGlobalEvent?.volatilityBoost) {
        newVolatility *= activeGlobalEvent.volatilityBoost
    }

    if (macro.inflation > 4.0) {
        newVolatility *= 1.2
    }

    newVolatility = Math.max(0.5, Math.min(2.5, newVolatility))

    const sectorTrends = { ...prevState.sectorTrends }
    Object.keys(SECTORS).forEach(sector => {
        let current = sectorTrends[sector] || 0
        let sensitivity = 0
        if (sector === 'tech' || sector === 'bio') {
            sensitivity -= (macro.interestRate - MACRO_CONFIG.interestRate.base) * 0.05
        } else if (sector === 'finance') {
            sensitivity += (macro.interestRate - MACRO_CONFIG.interestRate.base) * 0.04
        } else if (sector === 'energy' || sector === 'steel') {
            sensitivity += (macro.inflation - MACRO_CONFIG.inflation.base) * 0.03
        }

        current = current * 0.95 + (random() - 0.5) * 0.1 + sensitivity * 0.05
        sectorTrends[sector] = Math.max(-0.5, Math.min(0.5, current))
    })

    return { trend: newTrend, volatility: newVolatility, sectorTrends, macro }
}

export const isMarketHours = (hour, minute = 0) => {
    const currentHour = hour + minute / 60
    return currentHour >= MARKET_OPEN_HOUR && currentHour < MARKET_CLOSE_HOUR
}
