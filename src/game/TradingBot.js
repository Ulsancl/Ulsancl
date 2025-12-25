/**
 * TradingBot - 자동 매매 봇 시스템
 * 다양한 전략 기반 자동 거래 실행
 */

/**
 * 봇 전략 타입
 */
export const BOT_STRATEGIES = {
    MOMENTUM: {
        id: 'momentum',
        name: '모멘텀 전략',
        description: '상승 추세 종목을 매수하고, 하락 추세 종목을 매도',
        icon: '🚀',
        riskLevel: 'high',
        minLevel: 3
    },
    MEAN_REVERSION: {
        id: 'mean_reversion',
        name: '평균회귀 전략',
        description: '과매도 종목을 매수하고, 과매수 종목을 매도',
        icon: '⚖️',
        riskLevel: 'medium',
        minLevel: 2
    },
    VALUE: {
        id: 'value',
        name: '가치 투자 전략',
        description: '저평가된 우량 종목에 장기 투자',
        icon: '💎',
        riskLevel: 'low',
        minLevel: 2
    },
    DIVIDEND: {
        id: 'dividend',
        name: '배당 투자 전략',
        description: '고배당 종목 중심으로 안정적인 수익 추구',
        icon: '💰',
        riskLevel: 'low',
        minLevel: 1
    },
    SECTOR_ROTATION: {
        id: 'sector_rotation',
        name: '섹터 로테이션',
        description: '시장 상황에 따라 유망 섹터로 자금 이동',
        icon: '🔄',
        riskLevel: 'medium',
        minLevel: 4
    },
    GRID: {
        id: 'grid',
        name: '그리드 전략',
        description: '정해진 가격 간격으로 자동 분할 매수/매도',
        icon: '📊',
        riskLevel: 'medium',
        minLevel: 3
    }
}

/**
 * 모멘텀 전략 실행
 */
const executeMomentumStrategy = (stocks, portfolio, cash, priceHistory, settings) => {
    const signals = []
    const {
        buyThreshold = 0.05,    // 5% 상승 시 매수 신호
        sellThreshold = -0.03,  // 3% 하락 시 매도 신호
        maxPositionRatio = 0.1  // 최대 포지션 비율 10%
    } = settings

    stocks.forEach(stock => {
        const history = priceHistory[stock.id]
        if (!history || history.length < 10) return

        const recentPrices = history.slice(-10)
        const oldPrice = recentPrices[0]
        const currentPrice = stock.price
        const change = (currentPrice - oldPrice) / oldPrice

        const holding = portfolio[stock.id]
        const maxBuy = Math.floor((cash * maxPositionRatio) / stock.price)

        if (change > buyThreshold && !holding && maxBuy > 0) {
            // 매수 신호
            signals.push({
                type: 'buy',
                stock,
                quantity: Math.min(maxBuy, 10),
                reason: `${(change * 100).toFixed(1)}% 상승 모멘텀`,
                priority: change
            })
        } else if (change < sellThreshold && holding && holding.quantity > 0) {
            // 매도 신호
            signals.push({
                type: 'sell',
                stock,
                quantity: holding.quantity,
                reason: `${(change * 100).toFixed(1)}% 하락, 손절`,
                priority: Math.abs(change)
            })
        }
    })

    return signals.sort((a, b) => b.priority - a.priority)
}

/**
 * 평균회귀 전략 실행
 */
const executeMeanReversionStrategy = (stocks, portfolio, cash, priceHistory, settings) => {
    const signals = []
    const {
        oversoldThreshold = -0.08,   // 8% 이상 하락 시 과매도
        overboughtThreshold = 0.10,  // 10% 이상 상승 시 과매수
        maxPositionRatio = 0.08
    } = settings

    stocks.forEach(stock => {
        const history = priceHistory[stock.id]
        if (!history || history.length < 20) return

        // 20일 이동평균
        const ma20 = history.slice(-20).reduce((a, b) => a + b, 0) / 20
        const deviation = (stock.price - ma20) / ma20

        const holding = portfolio[stock.id]
        const maxBuy = Math.floor((cash * maxPositionRatio) / stock.price)

        if (deviation < oversoldThreshold && !holding && maxBuy > 0) {
            // 과매도 - 매수
            signals.push({
                type: 'buy',
                stock,
                quantity: Math.min(maxBuy, 5),
                reason: `이동평균 대비 ${(deviation * 100).toFixed(1)}% 과매도`,
                priority: Math.abs(deviation)
            })
        } else if (deviation > overboughtThreshold && holding && holding.quantity > 0) {
            // 과매수 - 매도
            signals.push({
                type: 'sell',
                stock,
                quantity: holding.quantity,
                reason: `이동평균 대비 ${(deviation * 100).toFixed(1)}% 과매수`,
                priority: deviation
            })
        }
    })

    return signals.sort((a, b) => b.priority - a.priority)
}

/**
 * 가치 투자 전략 실행
 */
const executeValueStrategy = (stocks, portfolio, cash, settings) => {
    const signals = []
    const {
        maxPE = 15,           // PE 15 이하
        minDividendYield = 2, // 배당률 2% 이상
        maxDebtRatio = 100,   // 부채비율 100% 이하
        maxPositionRatio = 0.12
    } = settings

    // 주식만 (ETF, 암호화폐 제외)
    const eligibleStocks = stocks.filter(s => s.type === 'stock' && s.fundamentals)

    eligibleStocks.forEach(stock => {
        const { pe, yield: divYield, debtRatio } = stock.fundamentals

        const holding = portfolio[stock.id]
        const maxBuy = Math.floor((cash * maxPositionRatio) / stock.price)

        // 가치주 조건 충족
        if (pe > 0 && pe <= maxPE && divYield >= minDividendYield && debtRatio <= maxDebtRatio) {
            if (!holding && maxBuy > 0) {
                const score = (maxPE - pe) + (divYield - minDividendYield) + ((maxDebtRatio - debtRatio) / 50)
                signals.push({
                    type: 'buy',
                    stock,
                    quantity: Math.min(maxBuy, 3),
                    reason: `PE ${pe.toFixed(1)}, 배당 ${divYield}%, 부채 ${debtRatio}%`,
                    priority: score
                })
            }
        }
    })

    return signals.sort((a, b) => b.priority - a.priority).slice(0, 5)
}

/**
 * 배당 투자 전략 실행
 */
const executeDividendStrategy = (stocks, portfolio, cash, settings) => {
    const signals = []
    const {
        minDividendYield = 3,
        maxPositionRatio = 0.15
    } = settings

    const eligibleStocks = stocks.filter(s =>
        s.type === 'stock' &&
        s.fundamentals &&
        s.fundamentals.yield >= minDividendYield
    )

    // 배당률 순으로 정렬
    const sortedStocks = eligibleStocks.sort((a, b) =>
        b.fundamentals.yield - a.fundamentals.yield
    )

    sortedStocks.slice(0, 10).forEach(stock => {
        const holding = portfolio[stock.id]
        const maxBuy = Math.floor((cash * maxPositionRatio) / stock.price)

        if (!holding && maxBuy > 0) {
            signals.push({
                type: 'buy',
                stock,
                quantity: Math.min(maxBuy, 5),
                reason: `배당률 ${stock.fundamentals.yield}%`,
                priority: stock.fundamentals.yield
            })
        }
    })

    return signals.slice(0, 3)
}

/**
 * 그리드 전략 실행
 */
const executeGridStrategy = (stocks, portfolio, cash, gridSettings) => {
    const signals = []
    const {
        targetStock,
        gridSize = 0.02,      // 2% 간격
        maxGrids = 5,
        amountPerGrid = 1000000
    } = gridSettings

    if (!targetStock) return signals

    const stock = stocks.find(s => s.id === targetStock)
    if (!stock) return signals

    const holding = portfolio[stock.id]
    const currentQty = holding?.quantity || 0
    const avgCost = holding ? holding.totalCost / holding.quantity : stock.price

    // 현재 가격이 평균 단가보다 낮으면 매수
    if (currentQty < maxGrids) {
        const buyPrice = avgCost * (1 - gridSize * (currentQty + 1))
        if (stock.price <= buyPrice && cash >= amountPerGrid) {
            const qty = Math.floor(amountPerGrid / stock.price)
            signals.push({
                type: 'buy',
                stock,
                quantity: qty,
                reason: `그리드 매수 (평단 대비 ${((1 - stock.price / avgCost) * 100).toFixed(1)}% 하락)`,
                priority: 1
            })
        }
    }

    // 현재 가격이 평균 단가보다 높으면 매도
    if (currentQty > 0) {
        const sellPrice = avgCost * (1 + gridSize * 2)
        if (stock.price >= sellPrice) {
            const sellQty = Math.ceil(currentQty / 2)
            signals.push({
                type: 'sell',
                stock,
                quantity: sellQty,
                reason: `그리드 매도 (평단 대비 ${((stock.price / avgCost - 1) * 100).toFixed(1)}% 상승)`,
                priority: 1
            })
        }
    }

    return signals
}

/**
 * 봇 전략 실행 메인 함수
 */
export const executeStrategy = (strategyId, stocks, portfolio, cash, priceHistory, settings = {}) => {
    switch (strategyId) {
        case 'momentum':
            return executeMomentumStrategy(stocks, portfolio, cash, priceHistory, settings)
        case 'mean_reversion':
            return executeMeanReversionStrategy(stocks, portfolio, cash, priceHistory, settings)
        case 'value':
            return executeValueStrategy(stocks, portfolio, cash, settings)
        case 'dividend':
            return executeDividendStrategy(stocks, portfolio, cash, settings)
        case 'grid':
            return executeGridStrategy(stocks, portfolio, cash, settings)
        default:
            return []
    }
}

/**
 * 트레이딩 봇 클래스
 */
export class TradingBot {
    constructor(strategyId, settings = {}) {
        this.strategyId = strategyId
        this.strategy = BOT_STRATEGIES[strategyId.toUpperCase()]
        this.settings = settings
        this.isActive = false
        this.tradeHistory = []
        this.totalProfit = 0
        this.tradesExecuted = 0
    }

    activate() {
        this.isActive = true
    }

    deactivate() {
        this.isActive = false
    }

    generateSignals(stocks, portfolio, cash, priceHistory) {
        if (!this.isActive) return []
        return executeStrategy(this.strategyId, stocks, portfolio, cash, priceHistory, this.settings)
    }

    recordTrade(trade) {
        this.tradeHistory.push(trade)
        this.tradesExecuted++
        if (trade.profit) {
            this.totalProfit += trade.profit
        }
    }

    getStats() {
        return {
            strategy: this.strategy,
            isActive: this.isActive,
            tradesExecuted: this.tradesExecuted,
            totalProfit: this.totalProfit,
            avgProfit: this.tradesExecuted > 0 ? this.totalProfit / this.tradesExecuted : 0
        }
    }
}

export default { BOT_STRATEGIES, executeStrategy, TradingBot }
