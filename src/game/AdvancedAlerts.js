/**
 * AdvancedAlerts - 고급 알림 시스템
 * 가격, 기술적 분석, 뉴스 기반 알림
 */

import { calculateRSI, calculateMACD, analyzeTrend } from './TechnicalAnalysis'

/**
 * 알림 타입
 */
export const ALERT_TYPES = {
    // 가격 알림
    PRICE_ABOVE: { id: 'price_above', name: '가격 상승', icon: '📈', description: '목표 가격 도달' },
    PRICE_BELOW: { id: 'price_below', name: '가격 하락', icon: '📉', description: '목표 가격 이하' },
    PRICE_CHANGE_PERCENT: { id: 'price_change', name: '변동률', icon: '📊', description: '일일 변동률 도달' },

    // 기술적 분석 알림
    RSI_OVERSOLD: { id: 'rsi_oversold', name: 'RSI 과매도', icon: '🔻', description: 'RSI 30 이하' },
    RSI_OVERBOUGHT: { id: 'rsi_overbought', name: 'RSI 과매수', icon: '🔺', description: 'RSI 70 이상' },
    GOLDEN_CROSS: { id: 'golden_cross', name: '골든 크로스', icon: '✨', description: '단기>장기 이동평균' },
    DEATH_CROSS: { id: 'death_cross', name: '데드 크로스', icon: '💀', description: '단기<장기 이동평균' },
    MACD_BULLISH: { id: 'macd_bullish', name: 'MACD 매수 신호', icon: '🐂', description: 'MACD 골든크로스' },
    MACD_BEARISH: { id: 'macd_bearish', name: 'MACD 매도 신호', icon: '🐻', description: 'MACD 데드크로스' },

    // 포지션 알림
    PROFIT_TARGET: { id: 'profit_target', name: '수익 목표', icon: '🎯', description: '목표 수익률 달성' },
    STOP_LOSS: { id: 'stop_loss', name: '손절선', icon: '🛑', description: '손절 기준 도달' },

    // 뉴스/이벤트 알림
    NEWS_RELATED: { id: 'news_related', name: '관련 뉴스', icon: '📰', description: '종목 관련 뉴스 발생' },
    SECTOR_NEWS: { id: 'sector_news', name: '섹터 뉴스', icon: '📢', description: '섹터 관련 뉴스 발경' },
    CRISIS_ALERT: { id: 'crisis_alert', name: '위기 경보', icon: '⚠️', description: '경제 위기 발생' },

    // 거래량 알림
    VOLUME_SPIKE: { id: 'volume_spike', name: '거래량 급증', icon: '📊', description: '평균 대비 거래량 급증' }
}

/**
 * 알림 생성
 */
export const createAlert = ({
    stockId,
    type,
    value,
    message,
    enabled = true,
    oneTime = false,
    expiresAt = null
}) => {
    return {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        stockId,
        type,
        value,
        message: message || ALERT_TYPES[type]?.description,
        enabled,
        oneTime,
        expiresAt,
        triggeredAt: null,
        createdAt: Date.now()
    }
}

/**
 * 알림 체크
 */
export const checkAlerts = (alerts, stocks, portfolio, priceHistory, news) => {
    const triggeredAlerts = []

    for (const alert of alerts) {
        if (!alert.enabled) continue
        if (alert.expiresAt && Date.now() > alert.expiresAt) continue
        if (alert.triggeredAt && alert.oneTime) continue

        const stock = stocks.find(s => s.id === alert.stockId)
        if (!stock && alert.stockId) continue

        const isTriggered = checkAlertCondition(alert, stock, portfolio, priceHistory, news)

        if (isTriggered) {
            triggeredAlerts.push({
                ...alert,
                stock,
                triggeredAt: Date.now()
            })
        }
    }

    return triggeredAlerts
}

/**
 * 개별 알림 조건 체크
 */
const checkAlertCondition = (alert, stock, portfolio, priceHistory, news) => {
    const history = stock ? priceHistory[stock.id] : null

    switch (alert.type) {
        case 'PRICE_ABOVE':
            return stock && stock.price >= alert.value

        case 'PRICE_BELOW':
            return stock && stock.price <= alert.value

        case 'PRICE_CHANGE_PERCENT':
            if (!stock || !stock.dailyOpen) return false
            const changePercent = ((stock.price - stock.dailyOpen) / stock.dailyOpen) * 100
            return Math.abs(changePercent) >= alert.value

        case 'RSI_OVERSOLD':
            if (!history || history.length < 15) return false
            const rsiOversold = calculateRSI(history)
            return rsiOversold && rsiOversold[rsiOversold.length - 1] <= (alert.value || 30)

        case 'RSI_OVERBOUGHT':
            if (!history || history.length < 15) return false
            const rsiOverbought = calculateRSI(history)
            return rsiOverbought && rsiOverbought[rsiOverbought.length - 1] >= (alert.value || 70)

        case 'GOLDEN_CROSS':
            if (!history || history.length < 25) return false
            const trendGolden = analyzeTrend(history)
            return trendGolden.goldenCross

        case 'DEATH_CROSS':
            if (!history || history.length < 25) return false
            const trendDeath = analyzeTrend(history)
            return trendDeath.deathCross

        case 'MACD_BULLISH':
            if (!history || history.length < 35) return false
            const macdBull = calculateMACD(history)
            if (!macdBull || macdBull.histogram.length < 2) return false
            return macdBull.histogram[macdBull.histogram.length - 2] < 0 &&
                macdBull.histogram[macdBull.histogram.length - 1] > 0

        case 'MACD_BEARISH':
            if (!history || history.length < 35) return false
            const macdBear = calculateMACD(history)
            if (!macdBear || macdBear.histogram.length < 2) return false
            return macdBear.histogram[macdBear.histogram.length - 2] > 0 &&
                macdBear.histogram[macdBear.histogram.length - 1] < 0

        case 'PROFIT_TARGET': {
            if (!stock || !portfolio[stock.id]) return false
            const holding = portfolio[stock.id]
            const avgCost = holding.totalCost / holding.quantity
            const profitRate = ((stock.price - avgCost) / avgCost) * 100
            return profitRate >= alert.value
        }

        case 'STOP_LOSS':
            if (!stock || !portfolio[stock.id]) return false
            const holdingLoss = portfolio[stock.id]
            const avgCostLoss = holdingLoss.totalCost / holdingLoss.quantity
            const lossRate = ((stock.price - avgCostLoss) / avgCostLoss) * 100
            return lossRate <= -Math.abs(alert.value)

        case 'NEWS_RELATED':
            const recentNews = news.filter(n =>
                Date.now() - n.timestamp < 60000 && // 1분 이내
                n.stockId === alert.stockId
            )
            return recentNews.length > 0

        case 'SECTOR_NEWS':
            if (!stock) return false
            const sectorNews = news.filter(n =>
                Date.now() - n.timestamp < 60000 &&
                n.sector === stock.sector
            )
            return sectorNews.length > 0

        default:
            return false
    }
}

/**
 * 스마트 알림 - 자동 생성
 */
export const generateSmartAlerts = (portfolio, stocks, priceHistory) => {
    const smartAlerts = []

    Object.entries(portfolio).forEach(([stockId]) => {
        const stock = stocks.find(s => s.id === parseInt(stockId))
        if (!stock) return
// 자동 익절선 (15%)
        smartAlerts.push(createAlert({
            stockId: stock.id,
            type: 'PROFIT_TARGET',
            value: 15,
            message: `${stock.name} 15% 수익 목표 도달`,
            oneTime: true
        }))

        // 자동 손절선 (8%)
        smartAlerts.push(createAlert({
            stockId: stock.id,
            type: 'STOP_LOSS',
            value: 8,
            message: `${stock.name} 8% 손절선 도달`,
            oneTime: true
        }))

        // 기술적 분석 알림
        const history = priceHistory[stock.id]
        if (history && history.length > 15) {
            smartAlerts.push(createAlert({
                stockId: stock.id,
                type: 'RSI_OVERBOUGHT',
                value: 70,
                message: `${stock.name} RSI 과매수 - 매도 고려`,
                oneTime: false
            }))
        }
    })

    return smartAlerts
}

/**
 * 알림 그룹화
 */
export const groupAlertsByStock = (alerts, stocks) => {
    const grouped = {}

    alerts.forEach(alert => {
        const stock = stocks.find(s => s.id === alert.stockId)
        const key = stock ? stock.name : '전체'

        if (!grouped[key]) {
            grouped[key] = {
                stock,
                alerts: []
            }
        }
        grouped[key].alerts.push(alert)
    })

    return grouped
}

export default {
    ALERT_TYPES,
    createAlert,
    checkAlerts,
    generateSmartAlerts,
    groupAlertsByStock
}
