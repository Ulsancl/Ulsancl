/**
 * PortfolioAnalyzer - 포트폴리오 분석 시스템
 * 위험 분석, 섹터 분산도, 성과 분석 등
 */

import { SECTORS } from '../constants'

/**
 * 포트폴리오 섹터 분포 계산
 */
export const calculateSectorDistribution = (portfolio, stocks) => {
    const distribution = {}
    let totalValue = 0

    Object.entries(portfolio).forEach(([stockId, holding]) => {
        const stock = stocks.find(s => s.id === parseInt(stockId))
        if (!stock) return

        const value = stock.price * holding.quantity
        totalValue += value

        const sector = stock.sector || 'other'
        if (!distribution[sector]) {
            distribution[sector] = { value: 0, stocks: [], count: 0 }
        }
        distribution[sector].value += value
        distribution[sector].stocks.push({
            stock,
            value,
            quantity: holding.quantity,
            avgCost: holding.totalCost / holding.quantity
        })
        distribution[sector].count++
    })

    // 비율 계산
    Object.keys(distribution).forEach(sector => {
        distribution[sector].percentage = totalValue > 0
            ? (distribution[sector].value / totalValue) * 100
            : 0
        distribution[sector].sectorInfo = SECTORS[sector] || { name: sector, color: '#666', icon: '📊' }
    })

    return { distribution, totalValue }
}

/**
 * 포트폴리오 집중도 분석 (허핀달-허쉬만 지수 스타일)
 */
export const calculateConcentrationRisk = (portfolio, stocks) => {
    const { distribution, totalValue } = calculateSectorDistribution(portfolio, stocks)

    if (totalValue === 0) return { score: 0, level: 'none', message: '포트폴리오가 비어있습니다.' }

    // 허핀달 지수 계산 (각 섹터 비중의 제곱 합)
    let hhi = 0
    Object.values(distribution).forEach(sector => {
        const share = sector.percentage / 100
        hhi += share * share
    })

    // 0~1 스케일 (1 = 완전 집중, 0 = 완전 분산)
    const score = Math.round(hhi * 100)

    let level, message
    if (score > 70) {
        level = 'high'
        message = '⚠️ 포트폴리오가 특정 섹터에 과도하게 집중되어 있습니다.'
    } else if (score > 40) {
        level = 'medium'
        message = '📊 적절한 분산이지만 추가 분산을 고려해보세요.'
    } else {
        level = 'low'
        message = '✅ 포트폴리오가 잘 분산되어 있습니다.'
    }

    return { score, level, message, hhi }
}

/**
 * 베타 계수 계산 (시장 대비 변동성)
 */
export const calculatePortfolioBeta = (portfolio, stocks) => {
    if (Object.keys(portfolio).length === 0) return 1

    let weightedBeta = 0
    let totalValue = 0

    Object.entries(portfolio).forEach(([stockId, holding]) => {
        const stock = stocks.find(s => s.id === parseInt(stockId))
        if (!stock) return

        const value = stock.price * holding.quantity
        totalValue += value

        // 섹터별 기본 베타 (시뮬레이션)
        const sectorBeta = {
            tech: 1.3,
            bio: 1.5,
            energy: 1.4,
            auto: 1.2,
            finance: 1.1,
            steel: 1.0,
            retail: 0.9,
            telecom: 0.7,
            construction: 1.1,
            entertainment: 1.4,
            game: 1.5,
            semiconductor: 1.6
        }

        const beta = sectorBeta[stock.sector] || 1.0
        // 암호화폐는 높은 베타
        const typeBeta = stock.type === 'crypto' ? 2.5 : stock.type === 'bond' ? 0.3 : 1.0

        weightedBeta += value * beta * typeBeta
    })

    return totalValue > 0 ? weightedBeta / totalValue : 1
}

/**
 * VaR (Value at Risk) 계산 - 간이 버전
 */
export const calculateVaR = (portfolio, stocks, confidence = 0.95) => {
    if (Object.keys(portfolio).length === 0) return { value: 0, percentage: 0 }

    let totalValue = 0
    let weightedVolatility = 0

    Object.entries(portfolio).forEach(([stockId, holding]) => {
        const stock = stocks.find(s => s.id === parseInt(stockId))
        if (!stock) return

        const value = stock.price * holding.quantity
        totalValue += value

        // 일일 변동성 추정 (타입별)
        const dailyVol = {
            stock: 0.02,
            etf: 0.015,
            crypto: 0.08,
            bond: 0.005,
            commodity: 0.025
        }

        const vol = dailyVol[stock.type] || 0.02
        weightedVolatility += value * vol
    })

    if (totalValue === 0) return { value: 0, percentage: 0 }

    const portfolioVol = weightedVolatility / totalValue

    // Z-score for confidence level
    const zScore = confidence === 0.99 ? 2.33 : confidence === 0.95 ? 1.65 : 1.28

    const varPercentage = portfolioVol * zScore * 100
    const varValue = totalValue * portfolioVol * zScore

    return {
        value: Math.round(varValue),
        percentage: varPercentage.toFixed(2),
        message: `${confidence * 100}% 신뢰수준에서 하루 최대 손실 예상: ${varPercentage.toFixed(2)}%`
    }
}

/**
 * 수익률 성과 분석
 */
export const analyzePerformance = (tradeHistory, portfolio, stocks, initialCapital) => {
    if (tradeHistory.length === 0) {
        return {
            totalTrades: 0,
            winRate: 0,
            avgProfit: 0,
            avgLoss: 0,
            profitFactor: 0,
            bestTrade: null,
            worstTrade: null
        }
    }

    let wins = 0
    let losses = 0
    let totalProfit = 0
    let totalLoss = 0
    let bestTrade = null
    let worstTrade = null

    const sellTrades = tradeHistory.filter(t => t.type === 'sell' || t.type === 'cover')

    sellTrades.forEach(trade => {
        if (trade.profit > 0) {
            wins++
            totalProfit += trade.profit
            if (!bestTrade || trade.profit > bestTrade.profit) {
                bestTrade = trade
            }
        } else if (trade.profit < 0) {
            losses++
            totalLoss += Math.abs(trade.profit)
            if (!worstTrade || trade.profit < worstTrade.profit) {
                worstTrade = trade
            }
        }
    })

    const totalSells = wins + losses
    const winRate = totalSells > 0 ? (wins / totalSells) * 100 : 0
    const avgProfit = wins > 0 ? totalProfit / wins : 0
    const avgLoss = losses > 0 ? totalLoss / losses : 0
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0

    // 샤프 비율 근사 (간이 버전)
    let currentValue = 0
    Object.entries(portfolio).forEach(([stockId, holding]) => {
        const stock = stocks.find(s => s.id === parseInt(stockId))
        if (stock) currentValue += stock.price * holding.quantity
    })

    const totalReturn = ((currentValue - initialCapital) / initialCapital) * 100

    return {
        totalTrades: tradeHistory.length,
        sellTrades: totalSells,
        wins,
        losses,
        winRate: winRate.toFixed(1),
        avgProfit: Math.round(avgProfit),
        avgLoss: Math.round(avgLoss),
        profitFactor: profitFactor === Infinity ? '∞' : profitFactor.toFixed(2),
        bestTrade,
        worstTrade,
        totalReturn: totalReturn.toFixed(2)
    }
}

/**
 * 포트폴리오 건강도 점수 계산 (0-100)
 */
export const calculatePortfolioHealth = (portfolio, stocks, tradeHistory) => {
    const scores = {
        diversification: 0,
        risk: 0,
        performance: 0,
        balance: 0
    }

    // 1. 분산도 점수 (25점)
    const concentration = calculateConcentrationRisk(portfolio, stocks)
    scores.diversification = Math.max(0, 25 - (concentration.score / 4))

    // 2. 리스크 점수 (25점)
    const beta = calculatePortfolioBeta(portfolio, stocks)
    if (beta >= 0.8 && beta <= 1.2) {
        scores.risk = 25
    } else if (beta < 0.8) {
        scores.risk = 20 // 너무 보수적
    } else {
        scores.risk = Math.max(0, 25 - (beta - 1.2) * 10) // 고위험
    }

    // 3. 성과 점수 (25점)
    const performance = analyzePerformance(tradeHistory, portfolio, stocks, 100000000)
    const winRate = parseFloat(performance.winRate)
    scores.performance = Math.min(25, winRate * 0.5)

    // 4. 균형 점수 (25점) - 현금 비율
    let portfolioValue = 0
    Object.entries(portfolio).forEach(([stockId, holding]) => {
        const stock = stocks.find(s => s.id === parseInt(stockId))
        if (stock) portfolioValue += stock.price * holding.quantity
    })

    // 적정 투자 비율 체크 (너무 많이 투자하거나 적게 투자하면 감점)
    const investmentRatio = portfolioValue / 100000000
    if (investmentRatio >= 0.4 && investmentRatio <= 0.8) {
        scores.balance = 25
    } else if (investmentRatio < 0.4) {
        scores.balance = 15 // 너무 보수적
    } else {
        scores.balance = 15 // 과투자
    }

    const totalScore = Math.round(
        scores.diversification + scores.risk + scores.performance + scores.balance
    )

    let grade, message
    if (totalScore >= 80) {
        grade = 'A'
        message = '🌟 우수한 포트폴리오입니다!'
    } else if (totalScore >= 60) {
        grade = 'B'
        message = '👍 양호한 포트폴리오입니다.'
    } else if (totalScore >= 40) {
        grade = 'C'
        message = '📊 개선이 필요합니다.'
    } else {
        grade = 'D'
        message = '⚠️ 포트폴리오 재검토가 필요합니다.'
    }

    return { totalScore, scores, grade, message }
}

export default {
    calculateSectorDistribution,
    calculateConcentrationRisk,
    calculatePortfolioBeta,
    calculateVaR,
    analyzePerformance,
    calculatePortfolioHealth
}
