/**
 * useGameLoop - 게임 루프 로직 훅
 * 가격/이벤트/주문/배당 업데이트를 주기적으로 처리한다.
 */

import { useEffect, useLayoutEffect, useRef } from 'react'
import {
    updateMarketState,
    generateNews,
    applyNewsImpact,
    processOrders,
    generateMarketEvent,
    applyEventEffect,
    startNewTradingDay,
    calculateGameDate,
    generateGlobalEvent,
    generateSeasonalEvent,
    calculateAllStockPrices,
    applyCrisisImpact,
    updatePricesWithCrisis,
    getActiveCrisis,
    updateNewsEffects,
    getActiveGlobalEvent,
    checkAlerts
} from '../engine'
import { CREDIT_TRADING, DIVIDEND_RATES, SHORT_SELLING } from '../constants'
import { generateId, calculateStockValueFromMap, calculateShortValueFromMap } from '../utils/index.js'

export const useGameLoop = ({
    stocks,
    setStocks,
    cash,
    setCash,
    portfolio,
    setPortfolio,
    shortPositions,
    setShortPositions,
    creditUsed,
    setCreditUsed,
    creditInterest,
    setCreditInterest,
    marginCallActive,
    setMarginCallActive,
    setTradeHistory,
    pendingOrders,
    setPendingOrders,
    setTotalTrades,
    setDailyTrades,
    setDailyProfit,
    setTotalProfit,
    setWinStreak,
    setNews,
    alerts,
    setAlerts,
    setAssetHistory,
    setTotalDividends,
    unlockedSkills,
    gameStartTime,
    setCurrentDay,
    marketState,
    setMarketState,
    setGameTime,
    setPriceHistory,
    setPriceChanges,
    setShowSeasonEnd,
    setActiveCrisis,
    setCrisisAlert,
    setCrisisHistory,
    showNotification,
    playSound,
    formatNumber,
    updateInterval = 1000
}) => {
    const lastDayRef = useRef(1)
    const lastSeasonYearRef = useRef(2020)
    const lastDividendTimeRef = useRef(Date.now())
    const priceResetTimeoutRef = useRef(null)
    const stocksRef = useRef(stocks)
    const cashRef = useRef(cash)
    const portfolioRef = useRef(portfolio)
    const pendingOrdersRef = useRef(pendingOrders)
    const shortPositionsRef = useRef(shortPositions)
    const creditUsedRef = useRef(creditUsed)
    const creditInterestRef = useRef(creditInterest)
    const alertsRef = useRef(alerts)
    const marketStateRef = useRef(marketState)
    const unlockedSkillsRef = useRef(unlockedSkills)
    const gameStartTimeRef = useRef(gameStartTime)
    const marginCallActiveRef = useRef(marginCallActive)
    const gameTimeRef = useRef(null)
    const showNotificationRef = useRef(showNotification)
    const playSoundRef = useRef(playSound)
    const formatNumberRef = useRef(formatNumber)
    const lastProfileRef = useRef(0)

    useLayoutEffect(() => {
        stocksRef.current = stocks
        cashRef.current = cash
        portfolioRef.current = portfolio
        pendingOrdersRef.current = pendingOrders
        shortPositionsRef.current = shortPositions
        creditUsedRef.current = creditUsed
        creditInterestRef.current = creditInterest
        alertsRef.current = alerts
        marketStateRef.current = marketState
        unlockedSkillsRef.current = unlockedSkills
        gameStartTimeRef.current = gameStartTime
        marginCallActiveRef.current = marginCallActive
        showNotificationRef.current = showNotification
        playSoundRef.current = playSound
        formatNumberRef.current = formatNumber
    }, [
        alerts,
        cash,
        creditInterest,
        creditUsed,
        gameStartTime,
        marginCallActive,
        marketState,
        pendingOrders,
        portfolio,
        showNotification,
        shortPositions,
        formatNumber,
        playSound,
        stocks,
        unlockedSkills
    ])

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now()
            const currentStocks = stocksRef.current
            const currentCash = cashRef.current
            const currentPortfolio = portfolioRef.current
            const currentPendingOrders = pendingOrdersRef.current
            const currentShortPositions = shortPositionsRef.current
            const currentCreditUsed = creditUsedRef.current
            const currentCreditInterest = creditInterestRef.current
            const currentAlerts = alertsRef.current
            const currentMarketState = marketStateRef.current
            const currentUnlockedSkills = unlockedSkillsRef.current
            const currentGameStartTime = gameStartTimeRef.current
            const currentMarginCallActive = marginCallActiveRef.current
            const formatNumberCurrent = formatNumberRef.current
            const showNotificationCurrent = showNotificationRef.current
            const playSoundCurrent = playSoundRef.current
            let nextMarginCallActive = currentMarginCallActive

            // 게임 시간 업데이트
            const newGameTime = calculateGameDate(currentGameStartTime, now)
            if (!gameTimeRef.current
                || gameTimeRef.current.day !== newGameTime.day
                || gameTimeRef.current.hour !== newGameTime.hour
                || gameTimeRef.current.minute !== newGameTime.minute
                || gameTimeRef.current.season !== newGameTime.season
                || gameTimeRef.current.isMarketOpen !== newGameTime.isMarketOpen
                || gameTimeRef.current.isMarketClosing !== newGameTime.isMarketClosing
                || gameTimeRef.current.displayDate !== newGameTime.displayDate
                || gameTimeRef.current.displayTime !== newGameTime.displayTime) {
                gameTimeRef.current = newGameTime
                setGameTime(newGameTime)
            }
            const gameDay = newGameTime.day

            let workingStocks = currentStocks
            let workingCash = currentCash
            let workingPortfolio = currentPortfolio
            let workingPendingOrders = currentPendingOrders
            let workingShortPositions = currentShortPositions
            let workingCreditUsed = currentCreditUsed
            let workingCreditInterest = currentCreditInterest
            const activeGlobalEvent = getActiveGlobalEvent()
            let workingMarketState = updateMarketState(currentMarketState, activeGlobalEvent)
            updateNewsEffects()
            let workingAlerts = currentAlerts

            // 성능 측정 (개발용): 필요 시 아래 console.time을 주석 해제해서 tick 비용을 측정하세요.
            // console.time('gameLoop:tick')

            const shouldProfile = import.meta.env.DEV && now - lastProfileRef.current > 10000
            let stockMap
            let mapBuildDuration = 0

            // 신규 거래일 시작 체크
            if (gameDay > lastDayRef.current) {
                lastDayRef.current = gameDay
                setCurrentDay(gameDay)

                // 신규 거래일 dailyOpen 리셋
                workingStocks = startNewTradingDay(workingStocks)
                setDailyTrades(0)
                setDailyProfit(0)

                // 신용 거래 일일 이자 계산
                if (workingCreditUsed > 0) {
                    const dailyInterest = Math.floor(workingCreditUsed * CREDIT_TRADING.dailyInterestRate)
                    workingCreditInterest += dailyInterest
                    if (dailyInterest > 0) {
                        showNotificationCurrent(`💳 신용 이자 ${formatNumberCurrent(dailyInterest)}원 발생`, 'warning')
                    }
                }

                showNotificationCurrent(`📅 ${newGameTime.displayDate} 거래일 시작!`, 'info')
                playSoundCurrent('news')
            }

            const mapBuildStart = shouldProfile ? performance.now() : 0
            stockMap = new Map(workingStocks.map(stock => [stock.id, stock]))
            mapBuildDuration = shouldProfile ? performance.now() - mapBuildStart : 0

            // 마진콜 체크 (담보비율 30% 이하 경고, 20% 이하 강제청산)
            if (workingCreditUsed > 0) {
                const stockValueNow = calculateStockValueFromMap(stockMap, workingPortfolio)
                const shortValueNow = calculateShortValueFromMap(stockMap, workingShortPositions)
                const grossAssetsNow = workingCash + stockValueNow + shortValueNow
                const currentMarginRatio = grossAssetsNow / workingCreditUsed
                if (currentMarginRatio <= CREDIT_TRADING.liquidationMargin) {
                    // 강제 청산
                    showNotificationCurrent('⚠️ 마진콜! 담보 부족으로 포지션 강제 청산됩니다!', 'error')
                    nextMarginCallActive = true
                    // 모든 주식 매도
                    Object.keys(workingPortfolio).forEach(stockId => {
                        const holding = workingPortfolio[stockId]
                        const stock = stockMap.get(parseInt(stockId))
                        if (stock && holding.quantity > 0) {
                            const saleAmount = Math.floor(stock.price * holding.quantity * 0.95) // 5% 슬리피지
                            workingCash += saleAmount
                        }
                    })
                    workingPortfolio = {}
                    // 대출금 상환 (가능한 만큼)
                    const repayable = Math.min(workingCash, workingCreditUsed + workingCreditInterest)
                    if (repayable > 0) {
                        const interestPayment = Math.min(repayable, workingCreditInterest)
                        workingCreditInterest -= interestPayment
                        const principalPayment = repayable - interestPayment
                        workingCreditUsed = Math.max(0, workingCreditUsed - principalPayment)
                        workingCash -= repayable
                    }
                } else if (currentMarginRatio <= CREDIT_TRADING.maintenanceMargin && !currentMarginCallActive) {
                    showNotificationCurrent('⚠️ 마진콜 경고! 담보 비율이 30% 이하입니다. 추가 입금 또는 포지션 정리를 권장합니다.', 'warning')
                    nextMarginCallActive = true
                } else if (currentMarginRatio > CREDIT_TRADING.maintenanceMargin) {
                    nextMarginCallActive = false
                }
            } else if (currentMarginCallActive) {
                nextMarginCallActive = false
            }

            // 뉴스 생성 (3% 확률)
            const newNews = generateNews(workingStocks, 0.03)
            if (newNews) {
                setNews(prev => [newNews, ...prev].slice(0, 50))
                showNotificationCurrent(`📰 ${newNews.text}`, newNews.type === 'positive' ? 'success' : newNews.type === 'negative' ? 'error' : 'info')
                playSoundCurrent('news')

                const { stocks: impactedStocks, marketState: impactedMarket } = applyNewsImpact(workingStocks, newNews, workingMarketState)
                workingStocks = impactedStocks
                workingMarketState = impactedMarket
            }

            // 글로벌 특별 이벤트 체크 (매우 희귀)
            const globalEvent = generateGlobalEvent()
            if (globalEvent) {
                setNews(prev => [globalEvent, ...prev].slice(0, 50))
                const notifType = globalEvent.type === 'positive' ? 'success' : globalEvent.type === 'negative' ? 'error' : 'info'
                showNotificationCurrent(`${globalEvent.icon} 속보: ${globalEvent.text}`, notifType)
                playSoundCurrent('news')

                // 글로벌 이벤트는 전체 시장에 영향
                const { stocks: impactedStocks, marketState: impactedMarket } = applyNewsImpact(workingStocks, globalEvent, workingMarketState)
                workingStocks = impactedStocks
                workingMarketState = impactedMarket
            }

            // 계절별 특별 이벤트 (1% 확률)
            const seasonalEvent = generateSeasonalEvent(newGameTime.season, 0.01)
            if (seasonalEvent) {
                setNews(prev => [seasonalEvent, ...prev].slice(0, 50))
                const notifType = seasonalEvent.type === 'positive' ? 'success' : 'error'
                showNotificationCurrent(`${seasonalEvent.icon} 계절 뉴스: ${seasonalEvent.text}`, notifType)
                playSoundCurrent('news')

                const { stocks: impactedStocks, marketState: impactedMarket } = applyNewsImpact(workingStocks, seasonalEvent, workingMarketState)
                workingStocks = impactedStocks
                workingMarketState = impactedMarket
            }

            // 시즌 종료 체크 (1년 경과)
            if (newGameTime.isYearEnd && lastSeasonYearRef.current < newGameTime.year) {
                lastSeasonYearRef.current = newGameTime.year
                setShowSeasonEnd(true)
                playSoundCurrent('levelUp')
            }

            // 마켓 이벤트 체크
            const event = generateMarketEvent(workingStocks)
            if (event) {
                const { stocks: eventStocks, cash: eventCash, portfolio: eventPortfolio, message } =
                    applyEventEffect(event, workingStocks, workingCash, workingPortfolio)
                workingStocks = eventStocks
                workingCash = eventCash
                workingPortfolio = eventPortfolio
                if (message) {
                    showNotificationCurrent(`${event.icon} ${message}`, 'info')
                }
            }

            // 위기 이벤트 체크 (CrisisEvents 시스템 연동)
            const crisisResult = updatePricesWithCrisis(workingStocks, workingMarketState, gameDay)
            if (crisisResult.crisisEvent) {
                const { type, crisis } = crisisResult.crisisEvent

                if (type === 'crisis_started') {
                    // 위기 발생
                    setCrisisAlert(crisis)
                    setActiveCrisis(crisis)
                    setCrisisHistory(prev => [...prev, { ...crisis, startDay: gameDay }])

                    const isPositive = crisis.baseImpact && crisis.baseImpact[0] > 0
                    showNotificationCurrent(
                        `${crisis.icon} ${isPositive ? '호재' : '위기'} 발생: ${crisis.name}`,
                        isPositive ? 'success' : 'error'
                    )
                    playSoundCurrent('news')
                } else if (type === 'crisis_ended') {
                    // 위기 종료
                    setActiveCrisis(null)
                    showNotificationCurrent(`✅ ${crisis.name} 종료, 시장 정상화`, 'info')
                } else if (type === 'crisis_update') {
                    // 위기 진행 업데이트
                    setActiveCrisis(crisisResult.activeCrisis)
                }
            } else {
                // 활성 위기 상태 유지
                const currentCrisis = crisisResult.activeCrisis || getActiveCrisis(gameDay)
                setActiveCrisis(currentCrisis)
            }

            // 가격 변동 (시장 시간 체크 포함)
            const previousStocks = workingStocks
            const calculatedResults = calculateAllStockPrices(previousStocks, workingMarketState, gameDay, newGameTime)

            let newStocks = previousStocks.map(stock => {
                const result = calculatedResults[stock.id]
                const newPrice = result ? result.newPrice : stock.price

                return {
                    ...stock,
                    price: newPrice,
                    momentum: (stock.momentum || 0) * 0.95,
                    dailyHigh: Math.max(stock.dailyHigh || newPrice, newPrice),
                    dailyLow: Math.min(stock.dailyLow || newPrice, newPrice)
                }
            })
            newStocks = applyCrisisImpact(newStocks, gameDay)

            const previousPriceMap = new Map(previousStocks.map(stock => [stock.id, stock.price]))
            const newChanges = {}
            newStocks.forEach(stock => {
                const prevPrice = previousPriceMap.get(stock.id) ?? stock.price
                newChanges[stock.id] = stock.price > prevPrice ? 'up' : stock.price < prevPrice ? 'down' : 'same'
            })
            setPriceChanges(newChanges)
            if (priceResetTimeoutRef.current) {
                clearTimeout(priceResetTimeoutRef.current)
            }
            priceResetTimeoutRef.current = setTimeout(() => setPriceChanges({}), 500)

            setPriceHistory(prev => {
                const newHistory = { ...prev }
                newStocks.forEach(stock => {
                    newHistory[stock.id] = [...(newHistory[stock.id] || []).slice(-29), stock.price]
                })
                return newHistory
            })

            workingStocks = newStocks
            stockMap = new Map(workingStocks.map(stock => [stock.id, stock]))

            if (workingPendingOrders.length > 0) {
                const feeDiscountLevel = currentUnlockedSkills?.['fee_discount'] || 0
                let orderFeeRate = 0.0015
                if (feeDiscountLevel > 0) {
                    orderFeeRate *= (1 - feeDiscountLevel * 0.05)
                }

                const { executedOrders, remainingOrders, cash: newCash, portfolio: newPortfolio } =
                    processOrders(workingPendingOrders, workingStocks, workingCash, workingPortfolio, { feeRate: orderFeeRate })

                if (executedOrders.length > 0) {
                    workingCash = newCash
                    workingPortfolio = newPortfolio
                    workingPendingOrders = remainingOrders
                    const tradeCount = executedOrders.length
                    let profitDelta = 0

                    executedOrders.forEach(order => {
                        showNotificationCurrent(`🔔 ${order.stockName} ${order.type} 주문 체결!`, 'success')
                        playSoundCurrent(order.side === 'buy' ? 'buy' : 'sell')
                        setTradeHistory(prev => [...prev, { ...order, type: order.side, id: generateId(), timestamp: now }])
                        if (order.side === 'sell' && typeof order.profit === 'number') {
                            profitDelta += order.profit
                        }
                    })
                    setTotalTrades(prev => prev + tradeCount)
                    setDailyTrades(prev => prev + tradeCount)
                    if (profitDelta !== 0) {
                        setTotalProfit(prev => prev + profitDelta)
                        setDailyProfit(prev => prev + profitDelta)
                    }
                    setWinStreak(prev => {
                        let streak = prev
                        executedOrders.forEach(order => {
                            if (order.side !== 'sell') return
                            const profit = typeof order.profit === 'number' ? order.profit : 0
                            if (profit > 0) streak += 1
                            else streak = 0
                        })
                        return streak
                    })
                }
            }

            // 공매도 이자 및 강제청산
            if (Object.keys(workingShortPositions).length > 0) {
                let newCash = workingCash
                const updatedShorts = {}
                const liquidated = []

                Object.entries(workingShortPositions).forEach(([stockId, position]) => {
                    const stock = stockMap.get(parseInt(stockId))
                    if (!stock) return

                    const interest = stock.price * position.quantity * SHORT_SELLING.interestRate
                    newCash -= interest

                    const pnl = (position.entryPrice - stock.price) * position.quantity
                    const marginUsed = position.entryPrice * position.quantity * SHORT_SELLING.marginRate

                    if (pnl < -marginUsed * 0.5) {
                        liquidated.push({ stockId, position, stock, pnl })
                    } else {
                        updatedShorts[stockId] = position
                    }
                })

                if (liquidated.length > 0) {
                    liquidated.forEach(({ position, stock, pnl }) => {
                        newCash += position.entryPrice * position.quantity + pnl
                        showNotificationCurrent(`⚠️ ${stock.name} 공매도 강제청산!`, 'error')
                        playSoundCurrent('error')
                    })
                    workingShortPositions = updatedShorts
                }

                if (newCash !== workingCash) workingCash = newCash
            }

            // 알림 체크
            const triggeredAlerts = checkAlerts(workingAlerts, workingStocks, workingPortfolio)
            if (triggeredAlerts.length > 0) {
                const triggeredIds = new Set(triggeredAlerts.map(alert => alert.id))
                triggeredAlerts.forEach(alert => {
                    showNotificationCurrent(`Alert: ${alert.stockName}`, 'info')
                    playSoundCurrent('news')
                })
                workingAlerts = workingAlerts.map(a => triggeredIds.has(a.id) ? { ...a, triggered: true } : a)
            }

            if (now - lastDividendTimeRef.current > 60000) {
                let dividendTotal = 0
                Object.entries(workingPortfolio).forEach(([stockId, holding]) => {
                    const rate = DIVIDEND_RATES[parseInt(stockId)] || 0
                    const stock = stockMap.get(parseInt(stockId))
                    if (stock && rate > 0) {
                        const dividend = Math.round(stock.price * holding.quantity * (rate / 100) / 60)
                        dividendTotal += dividend
                    }
                })
                if (dividendTotal > 0) {
                    workingCash += dividendTotal
                    setTotalDividends(prev => prev + dividendTotal)
                    showNotificationCurrent(`💰 배당금 ${formatNumberCurrent(dividendTotal)}원`, 'success')
                }
                lastDividendTimeRef.current = now
            }

            const assetCalcStart = shouldProfile ? performance.now() : 0
            const stockValueNow = calculateStockValueFromMap(stockMap, workingPortfolio)
            const shortValueNow = calculateShortValueFromMap(stockMap, workingShortPositions)
            const grossAssetsNow = workingCash + stockValueNow + shortValueNow
            const totalAssetsNow = grossAssetsNow - workingCreditUsed - workingCreditInterest
            if (shouldProfile) {
                const assetCalcDuration = performance.now() - assetCalcStart
                console.info(`[profile] gameLoop map: ${mapBuildDuration.toFixed(2)}ms, assets: ${assetCalcDuration.toFixed(2)}ms`)
                lastProfileRef.current = now
            }

            if (now % 10000 < 1000) {
                setAssetHistory(prev => [...prev.slice(-100), { value: totalAssetsNow, timestamp: now, day: gameDay }])
            }

            // console.timeEnd('gameLoop:tick')

            if (workingStocks !== currentStocks) setStocks(workingStocks)
            if (workingMarketState !== currentMarketState) setMarketState(workingMarketState)
            if (nextMarginCallActive !== currentMarginCallActive) setMarginCallActive(nextMarginCallActive)
            if (workingCash !== currentCash) setCash(workingCash)
            if (workingPortfolio !== currentPortfolio) setPortfolio(workingPortfolio)
            if (workingPendingOrders !== currentPendingOrders) setPendingOrders(workingPendingOrders)
            if (workingShortPositions !== currentShortPositions) setShortPositions(workingShortPositions)
            if (workingCreditUsed !== currentCreditUsed) setCreditUsed(workingCreditUsed)
            if (workingCreditInterest !== currentCreditInterest) setCreditInterest(workingCreditInterest)
            if (workingAlerts !== currentAlerts) setAlerts(workingAlerts)
        }, updateInterval)

        return () => {
            clearInterval(interval)
            if (priceResetTimeoutRef.current) {
                clearTimeout(priceResetTimeoutRef.current)
            }
        }
    }, [
        updateInterval,
        setActiveCrisis,
        setAlerts,
        setAssetHistory,
        setCash,
        setCreditInterest,
        setCreditUsed,
        setCrisisAlert,
        setCrisisHistory,
        setCurrentDay,
        setDailyProfit,
        setDailyTrades,
        setGameTime,
        setMarginCallActive,
        setMarketState,
        setNews,
        setPendingOrders,
        setPortfolio,
        setPriceChanges,
        setPriceHistory,
        setShortPositions,
        setShowSeasonEnd,
        setStocks,
        setTotalDividends,
        setTotalProfit,
        setTotalTrades,
        setTradeHistory,
        setWinStreak
    ])
}

export default useGameLoop
