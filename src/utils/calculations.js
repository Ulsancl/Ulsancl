/**
 * 자산 계산 유틸리티
 * NaN 안전 계산 및 파생 값 계산
 */

import { INITIAL_CAPITAL, CREDIT_TRADING } from '../constants'

/**
 * 주식 가치 계산
 * @param {Object} portfolio - 포트폴리오 객체 { stockId: { quantity, totalCost, ... } }
 * @param {Array} stocks - 주식 배열
 * @returns {number} 총 주식 가치
 */
export const calculateStockValue = (portfolio, stocks) => {
    if (!portfolio || !stocks) return 0

    return Object.entries(portfolio).reduce((total, [stockId, holding]) => {
        const stock = stocks.find(s => s.id === parseInt(stockId))
        const value = stock ? stock.price * holding.quantity : 0
        return total + (isNaN(value) ? 0 : value)
    }, 0)
}

/**
 * 공매도 손익 계산
 * @param {Object} shortPositions - 공매도 포지션 객체
 * @param {Array} stocks - 주식 배열
 * @returns {number} 공매도 손익
 */
export const calculateShortValue = (shortPositions, stocks) => {
    if (!shortPositions || !stocks) return 0

    return Object.entries(shortPositions).reduce((total, [stockId, position]) => {
        const stock = stocks.find(s => s.id === parseInt(stockId))
        if (!stock) return total
        const pnl = (position.entryPrice - stock.price) * position.quantity
        return total + (isNaN(pnl) ? 0 : pnl)
    }, 0)
}

/**
 * Map 기반 주식 가치 계산
 * @param {Map<number, Object>} stockMap - 주식 Map (id -> stock)
 * @param {Object} portfolio - 보유 수량 맵
 * @returns {number}
 */
export const calculateStockValueFromMap = (stockMap, portfolio) => {
    if (!portfolio || !stockMap) return 0

    return Object.entries(portfolio).reduce((total, [stockId, holding]) => {
        const stock = stockMap.get(parseInt(stockId))
        if (!stock) return total
        const value = stock.price * holding.quantity
        return total + (isNaN(value) ? 0 : value)
    }, 0)
}

/**
 * Map 기반 공매도 손익 계산
 * @param {Map<number, Object>} stockMap - 주식 Map (id -> stock)
 * @param {Object} shortPositions - 공매도 포지션 맵
 * @returns {number}
 */
export const calculateShortValueFromMap = (stockMap, shortPositions) => {
    if (!shortPositions || !stockMap) return 0

    return Object.entries(shortPositions).reduce((total, [stockId, position]) => {
        const stock = stockMap.get(parseInt(stockId))
        if (!stock) return total
        const pnl = (position.entryPrice - stock.price) * position.quantity
        return total + (isNaN(pnl) ? 0 : pnl)
    }, 0)
}

/**
 * 안전한 숫자 반환 (NaN 방지)
 * @param {number} value - 숫자 값
 * @param {number} defaultValue - 기본값
 * @returns {number} 안전한 숫자
 */
export const safeNumber = (value, defaultValue = 0) => {
    return isNaN(value) || value === null || value === undefined ? defaultValue : value
}

/**
 * 전체 자산 계산
 * @param {Object} params - 계산에 필요한 파라미터들
 * @returns {Object} 계산된 자산 정보
 */
export const calculateAssets = ({
    cash,
    portfolio,
    shortPositions,
    stocks,
    creditUsed = 0,
    creditInterest = 0,
    levelInfo = { level: 1 }
}) => {
    const safeCash = safeNumber(cash)
    const safeCreditUsed = safeNumber(creditUsed)
    const safeCreditInterest = safeNumber(creditInterest)

    const stockValue = calculateStockValue(portfolio, stocks)
    const shortValue = calculateShortValue(shortPositions, stocks)

    // 총 자산 (부채 제외)
    const grossAssets = safeCash + stockValue + shortValue

    // 순 자산 (부채 차감)
    const totalAssets = grossAssets - safeCreditUsed - safeCreditInterest

    // 수익률
    const profitRate = INITIAL_CAPITAL > 0
        ? ((totalAssets - INITIAL_CAPITAL) / INITIAL_CAPITAL) * 100
        : 0

    // 신용 거래 관련
    const marginRatio = safeCreditUsed > 0 ? (grossAssets / safeCreditUsed) : Infinity
    const creditLimitRatio = CREDIT_TRADING.creditLimit[`level${Math.min(levelInfo?.level || 1, 6)}`] || 0
    const maxCreditLimit = Math.floor(grossAssets * creditLimitRatio)
    const availableCredit = Math.max(0, maxCreditLimit - safeCreditUsed)
    const totalDebt = safeCreditUsed + safeCreditInterest

    return {
        stockValue,
        shortValue,
        grossAssets,
        totalAssets,
        profitRate,
        marginRatio,
        creditLimitRatio,
        maxCreditLimit,
        availableCredit,
        totalDebt,
        safeCash,
        safeCreditUsed,
        safeCreditInterest
    }
}

/**
 * 수익률 포맷팅
 * @param {number} rate - 수익률
 * @returns {string} 포맷된 수익률
 */
export const formatProfitRate = (rate) => {
    const sign = rate >= 0 ? '+' : ''
    return `${sign}${rate.toFixed(2)}%`
}

export default {
    calculateStockValue,
    calculateShortValue,
    calculateStockValueFromMap,
    calculateShortValueFromMap,
    calculateAssets,
    safeNumber,
    formatProfitRate
}
