/**
 * priceCalculator.js - 가격 계산 모듈
 * 주식/코인/ETF 등의 가격 변동 로직
 */

import { SECTORS, MACRO_CONFIG } from '../constants'
import { randomRange, randomInt, generateId } from '../utils'

// 상품 타입별 변동성 설정
export const VOLATILITY_CONFIG = {
    stock: {
        base: 0.0015,
        maxDaily: 0.15,
        typical: 0.03,
        momentum: 0.4,
    },
    etf: {
        base: 0.001,
        maxDaily: 0.10,
        typical: 0.02,
        momentum: 0.3,
    },
    crypto: {
        base: 0.012,
        maxDaily: 0.50,
        typical: 0.15,
        momentum: 1.2,
    },
    bond: {
        base: 0.0002,
        maxDaily: 0.02,
        typical: 0.005,
        momentum: 0.15,
    },
    commodity: {
        base: 0.002,
        maxDaily: 0.10,
        typical: 0.03,
        momentum: 0.4,
    }
}

/**
 * 호가 단위 (틱 사이즈) 계산
 */
export const getTickSize = (price, type = 'stock') => {
    if (type === 'crypto') {
        if (price < 10) return 0.01
        if (price < 100) return 0.1
        if (price < 1000) return 1
        if (price < 10000) return 5
        if (price < 100000) return 10
        if (price < 1000000) return 50
        if (price < 10000000) return 100
        return 500
    }

    if (type === 'commodity') {
        if (price < 1000) return 1
        if (price < 10000) return 5
        if (price < 100000) return 10
        return 50
    }

    if (type === 'bond') {
        return 10
    }

    // 주식/ETF
    if (price < 1000) return 1
    if (price < 5000) return 5
    if (price < 10000) return 10
    if (price < 50000) return 50
    if (price < 100000) return 100
    if (price < 500000) return 500
    return 1000
}

/**
 * 가격을 호가 단위에 맞게 반올림
 */
export const roundToTickSize = (price, type = 'stock') => {
    const tickSize = getTickSize(price, type)
    return Math.round(price / tickSize) * tickSize
}

/**
 * 현실적인 가격 변동 계산
 */
export const calculatePriceChange = (
    stock,
    marketState = {},
    gameDay = 0,
    activeNewsEffects = [],
    activeGlobalEvent = null
) => {
    const { trend = 0, volatility = 1, sectorTrends = {} } = marketState
    const type = stock.type || 'stock'
    const config = VOLATILITY_CONFIG[type] || VOLATILITY_CONFIG.stock

    // 기본 랜덤 워크
    const randomFactor = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5
    let baseChange = randomFactor * config.base

    // 시장 트렌드 영향
    baseChange += trend * config.base * 0.5

    // 섹터 트렌드 영향
    const sectorTrend = sectorTrends[stock.sector] || 0
    baseChange += sectorTrend * config.base * 0.8

    // 변동성 조절
    let volMultiplier = volatility
    if (stock.fundamentals) {
        if (stock.fundamentals.pe) {
            const peFactor = 1 + (stock.fundamentals.pe - 20) * 0.005
            volMultiplier *= Math.max(0.8, Math.min(1.5, peFactor))
        }

        if (stock.fundamentals.marketCap) {
            const cap = stock.fundamentals.marketCap
            if (cap > 50) volMultiplier *= 0.9
            else if (cap > 20) volMultiplier *= 0.95
            else if (cap < 5) volMultiplier *= 1.15
        }

        if (stock.fundamentals.debtRatio && stock.fundamentals.debtRatio > 150) {
            volMultiplier *= 1.1
            if (trend < 0) baseChange -= 0.0003
        }

        if (stock.fundamentals.yield) {
            if (stock.fundamentals.yield > 3.0) volMultiplier *= 0.92
            const interestRate = (marketState.macro?.interestRate) || 3.5
            if (stock.fundamentals.yield > interestRate + 1.5) baseChange += 0.0001
        }
    }
    baseChange *= volMultiplier

    // 모멘텀
    if (stock.momentum) {
        baseChange += stock.momentum * config.momentum * config.base
    }

    // 뉴스 효과
    activeNewsEffects.forEach(effect => {
        let impactMultiplier = 0
        if (effect.targetStockId === stock.id) impactMultiplier = 1
        else if (effect.targetSector === stock.sector) impactMultiplier = 0.5
        else if (effect.marketWide) impactMultiplier = 0.3
        baseChange += effect.currentImpact * impactMultiplier * 0.1
    })

    // 글로벌 이벤트 영향
    if (activeGlobalEvent) {
        baseChange += activeGlobalEvent.currentImpact * 0.05
        if (activeGlobalEvent.sectors?.[stock.sector]) {
            baseChange += activeGlobalEvent.sectors[stock.sector] * activeGlobalEvent.intensity * 0.02
        }
    }

    // ETF 특수 처리
    if (type === 'etf') {
        if (stock.category === 'leverage') baseChange *= (stock.multiplier || 2)
        else if (stock.category === 'inverse') baseChange *= (stock.multiplier || -1)
    }

    // 일일 변동폭 제한
    const dailyOpen = stock.dailyOpen || stock.basePrice
    const dailyChange = ((stock.price * (1 + baseChange)) - dailyOpen) / dailyOpen
    if (Math.abs(dailyChange) > config.maxDaily) baseChange = 0

    let newPrice = stock.price * (1 + baseChange)

    // 틱 사이즈 적용
    const tickSize = getTickSize(stock.price, type)
    const roundedPrice = roundToTickSize(newPrice, type)

    if (roundedPrice === stock.price && baseChange !== 0) {
        const moveChance = type === 'crypto' ? 0.6 : (type === 'bond' ? 0.25 : 0.45)
        if (Math.random() < moveChance) {
            newPrice = stock.price + (baseChange > 0 ? tickSize : -tickSize)
        } else {
            newPrice = stock.price
        }
    } else {
        newPrice = roundedPrice
    }

    const minPrice = type === 'crypto' ? 0.01 : (type === 'bond' ? 90000 : (type === 'commodity' ? 1 : 100))
    return Math.max(minPrice, newPrice)
}

/**
 * 새 거래일 시작
 */
export const startNewTradingDay = (stocks) => {
    return stocks.map(stock => ({
        ...stock,
        dailyOpen: stock.price,
        dailyHigh: stock.price,
        dailyLow: stock.price,
        prevClose: stock.dailyOpen || stock.basePrice,
        momentum: (stock.momentum || 0) * 0.5,
    }))
}

/**
 * 일일 고가/저가 업데이트
 */
export const updateDailyRange = (stocks) => {
    return stocks.map(stock => ({
        ...stock,
        dailyHigh: Math.max(stock.dailyHigh || stock.price, stock.price),
        dailyLow: Math.min(stock.dailyLow || stock.price, stock.price),
    }))
}
