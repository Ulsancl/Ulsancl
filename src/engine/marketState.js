/**
 * marketState.js - 시장 상태 모듈
 * 시장 트렌드, 거시경제 지표, 시간 관리
 */

import { SECTORS, MACRO_CONFIG, MARKET_HOURS } from '../constants'

// 시간 상수
export const GAME_SPEED = 60 // 실제 1초 = 게임 60초 (1분)
export const SECONDS_PER_MINUTE = 60
export const MINUTES_PER_HOUR = 60
export const HOURS_PER_DAY = 24
export const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * MINUTES_PER_HOUR
export const SECONDS_PER_DAY = SECONDS_PER_HOUR * HOURS_PER_DAY

// 시장 시간
export const MARKET_START_HOUR = MARKET_HOURS?.start || 9
export const MARKET_END_HOUR = MARKET_HOURS?.end || 15.5

// 계절 정보
const SEASONS = ['봄', '여름', '가을', '겨울']
const SEASON_ICONS = ['🌸', '☀️', '🍂', '❄️']

/**
 * 게임 날짜/시간 계산
 */
export const calculateGameDate = (gameStartTime, currentTime) => {
    const elapsedSeconds = Math.floor((currentTime - gameStartTime) / 1000)
    const gameSeconds = elapsedSeconds * GAME_SPEED

    const day = Math.floor(gameSeconds / SECONDS_PER_DAY) + 1
    const daySeconds = gameSeconds % SECONDS_PER_DAY
    const hour = Math.floor(daySeconds / SECONDS_PER_HOUR)
    const minute = Math.floor((daySeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE)

    // 시장 시간 체크
    const marketHour = hour + minute / 60
    const isMarketOpen = marketHour >= MARKET_START_HOUR && marketHour < MARKET_END_HOUR

    // 년도 및 계절 계산 (1년 = 365일)
    const year = 2020 + Math.floor((day - 1) / 365)
    const dayOfYear = ((day - 1) % 365) + 1
    const month = Math.ceil(dayOfYear / 30)
    const seasonIndex = Math.floor((month - 1) / 3) % 4

    // 연말 체크 (12월 마지막 주)
    const isYearEnd = dayOfYear >= 355

    return {
        day,
        hour,
        minute,
        isMarketOpen,
        year,
        month,
        dayOfYear,
        season: SEASONS[seasonIndex],
        seasonIcon: SEASON_ICONS[seasonIndex],
        isYearEnd,
        displayDate: `D+${day}`,
        displayTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        displaySeason: `${SEASON_ICONS[seasonIndex]} ${year}년 ${month}월`
    }
}

/**
 * 시장 상태 업데이트
 */
export const updateMarketState = (prevState, activeGlobalEvent = null) => {
    // 거시 경제 지표 업데이트
    const macro = prevState.macro || {
        interestRate: MACRO_CONFIG.interestRate.base,
        inflation: MACRO_CONFIG.inflation.base,
        gdpGrowth: MACRO_CONFIG.gdpGrowth.base
    }

    // 확률적 변화 (0.1% 확률)
    if (Math.random() < 0.001) {
        macro.interestRate += (Math.random() - 0.5) * MACRO_CONFIG.interestRate.volatility
        macro.interestRate = Math.max(MACRO_CONFIG.interestRate.min, Math.min(MACRO_CONFIG.interestRate.max, macro.interestRate))
    }
    if (Math.random() < 0.001) {
        macro.inflation += (Math.random() - 0.5) * MACRO_CONFIG.inflation.volatility
        macro.inflation = Math.max(MACRO_CONFIG.inflation.min, Math.min(MACRO_CONFIG.inflation.max, macro.inflation))
    }
    if (Math.random() < 0.001) {
        macro.gdpGrowth += (Math.random() - 0.5) * MACRO_CONFIG.gdpGrowth.volatility
        macro.gdpGrowth = Math.max(MACRO_CONFIG.gdpGrowth.min, Math.min(MACRO_CONFIG.gdpGrowth.max, macro.gdpGrowth))
    }

    // 거시 경제 영향 계산
    let macroTrendBoost = 0
    macroTrendBoost += (MACRO_CONFIG.interestRate.base - macro.interestRate) * 0.02
    macroTrendBoost += (macro.gdpGrowth - MACRO_CONFIG.gdpGrowth.base) * 0.03
    macroTrendBoost -= (macro.inflation - MACRO_CONFIG.inflation.base) * 0.01

    let newTrend = prevState.trend * 0.98 + (Math.random() - 0.5) * 0.05 + macroTrendBoost * 0.01
    newTrend = Math.max(-0.5, Math.min(0.5, newTrend))

    let newVolatility = prevState.volatility * 0.95 + 1 * 0.05 + (Math.random() - 0.5) * 0.1

    // 글로벌 이벤트 영향
    if (activeGlobalEvent?.volatilityBoost) {
        newVolatility *= activeGlobalEvent.volatilityBoost
    }

    // 인플레이션 영향
    if (macro.inflation > 4.0) {
        newVolatility *= 1.2
    }

    newVolatility = Math.max(0.5, Math.min(2.5, newVolatility))

    // 섹터 트렌드
    const sectorTrends = { ...prevState.sectorTrends }
    Object.keys(SECTORS).forEach(sector => {
        let current = sectorTrends[sector] || 0

        // 섹터별 거시경제 민감도
        let sensitivity = 0
        if (sector === 'tech' || sector === 'bio') {
            sensitivity -= (macro.interestRate - MACRO_CONFIG.interestRate.base) * 0.05
        } else if (sector === 'finance') {
            sensitivity += (macro.interestRate - MACRO_CONFIG.interestRate.base) * 0.04
        } else if (sector === 'energy' || sector === 'steel') {
            sensitivity += (macro.inflation - MACRO_CONFIG.inflation.base) * 0.03
        }

        current = current * 0.95 + (Math.random() - 0.5) * 0.1 + sensitivity * 0.05
        sectorTrends[sector] = Math.max(-0.5, Math.min(0.5, current))
    })

    return { trend: newTrend, volatility: newVolatility, sectorTrends, macro }
}

/**
 * 시장 시간 내 여부 체크
 */
export const isMarketHours = (hour, minute = 0) => {
    const currentHour = hour + minute / 60
    return currentHour >= MARKET_START_HOUR && currentHour < MARKET_END_HOUR
}
