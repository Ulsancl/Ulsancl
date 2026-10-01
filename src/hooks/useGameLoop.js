/**
 * useGameLoop - 게임 루프 오케스트레이터
 * 각 기능별 서브 모듈을 조율하여 주기적으로 게임 상태를 업데이트한다.
 * 
 * 리팩토링 후 558줄 → ~150줄로 축소
 */

import { useEffect, useLayoutEffect, useRef } from 'react'
import {
    updateMarketState,
    generateMarketEvent,
    applyEventEffect,
    startNewTradingDay,
    calculateGameDate,
    GAME_START_YEAR,
    DAYS_PER_YEAR,
    getActiveGlobalEvent,
    checkAlerts
} from '../engine'
import { calculateAssets } from '../utils/index.js'

// 서브 모듈 import
import {
    usePriceUpdater,
    useNewsGenerator,
    useOrderProcessor,
    useCreditManager,
    useDividendManager,
    useCrisisManager
} from './gameLoop'

// 상수
const PRICE_RESET_DELAY = 500
const ASSET_HISTORY_INTERVAL = 10000

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
    currentDay = 1,
    isInitialized = true,
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
    onTick,
    onObservation,
    recordTrade,
    updateInterval = 1000
}) => {
    // Refs
    const lastDayRef = useRef(currentDay)
    const lastSeasonYearRef = useRef(GAME_START_YEAR - 1)
    const sessionRef = useRef(null)
    const priceResetTimeoutRef = useRef(null)
    const lastAssetHistoryRef = useRef(0)
    const gameTimeRef = useRef(null)
    const gameStartTimeRef = useRef(gameStartTime)
    const stocksRef = useRef(stocks)
    const alertsRef = useRef(alerts)
    const pendingOrdersRef = useRef(pendingOrders)
    const marketStateRef = useRef(marketState)
    const cashRef = useRef(cash)
    const portfolioRef = useRef(portfolio)
    const shortPositionsRef = useRef(shortPositions)
    const creditUsedRef = useRef(creditUsed)
    const creditInterestRef = useRef(creditInterest)
    const marginCallActiveRef = useRef(marginCallActive)
    const unlockedSkillsRef = useRef(unlockedSkills)
    const showNotificationRef = useRef(showNotification)
    const playSoundRef = useRef(playSound)
    const onTickRef = useRef(onTick)
    const onObservationRef = useRef(onObservation)

    const { tick: updatePricesTick } = usePriceUpdater({
        setPriceHistory, setPriceChanges
    })
    const { tick: generateNewsTick } = useNewsGenerator({
        setNews, showNotification, playSound
    })
    const { tick: processOrdersTick } = useOrderProcessor({
        setTradeHistory,
        setTotalTrades, setDailyTrades, setTotalProfit, setDailyProfit, setWinStreak,
        showNotification, playSound, recordTrade
    })
    const { checkMarginCall, processShortPositions, processDailyInterest } = useCreditManager({
        cash, portfolio,
        creditUsed, creditInterest,
        marginCallActive,
        shortPositions,
        showNotification, playSound, formatNumber
    })
    const { tick: processDividendsTick } = useDividendManager({
        setCash, setTotalDividends, showNotification, formatNumber
    })
    const { tick: processCrisisTick } = useCrisisManager({
        setActiveCrisis, setCrisisAlert, setCrisisHistory, showNotification, playSound
    })

    const updatePricesTickRef = useRef(updatePricesTick)
    const generateNewsTickRef = useRef(generateNewsTick)
    const processOrdersTickRef = useRef(processOrdersTick)
    const checkMarginCallRef = useRef(checkMarginCall)
    const processShortPositionsRef = useRef(processShortPositions)
    const processDailyInterestRef = useRef(processDailyInterest)
    const processDividendsTickRef = useRef(processDividendsTick)
    const processCrisisTickRef = useRef(processCrisisTick)
    // Saved currentDay is the last processed trading day, not the wall-clock day.
    // Restore it once per session so a same-day reload cannot reset statistics or charge interest twice.
    useLayoutEffect(() => {
        if (!isInitialized) {
            sessionRef.current = null
            return
        }
        if (sessionRef.current?.gameStartTime === gameStartTime) return
        const savedDay = Number.isInteger(currentDay) && currentDay > 0 ? currentDay : 1
        sessionRef.current = { gameStartTime }
        lastDayRef.current = savedDay
        lastSeasonYearRef.current = GAME_START_YEAR + Math.floor((savedDay - 1) / DAYS_PER_YEAR) - 1
        gameTimeRef.current = null
        lastAssetHistoryRef.current = 0
        if (priceResetTimeoutRef.current) clearTimeout(priceResetTimeoutRef.current)
    }, [currentDay, gameStartTime, isInitialized])
    // Sync refs
    useLayoutEffect(() => {
        gameStartTimeRef.current = gameStartTime
        stocksRef.current = stocks
        alertsRef.current = alerts
        pendingOrdersRef.current = pendingOrders
        marketStateRef.current = marketState
        cashRef.current = cash
        portfolioRef.current = portfolio
        shortPositionsRef.current = shortPositions
        creditUsedRef.current = creditUsed
        creditInterestRef.current = creditInterest
        marginCallActiveRef.current = marginCallActive
        unlockedSkillsRef.current = unlockedSkills
        showNotificationRef.current = showNotification
        playSoundRef.current = playSound
        onTickRef.current = onTick
        onObservationRef.current = onObservation
        updatePricesTickRef.current = updatePricesTick
        generateNewsTickRef.current = generateNewsTick
        processOrdersTickRef.current = processOrdersTick
        checkMarginCallRef.current = checkMarginCall
        processShortPositionsRef.current = processShortPositions
        processDailyInterestRef.current = processDailyInterest
        processDividendsTickRef.current = processDividendsTick
        processCrisisTickRef.current = processCrisisTick
    }, [
        gameStartTime,
        stocks,
        alerts,
        pendingOrders,
        marketState,
        cash,
        portfolio,
        shortPositions,
        creditUsed,
        creditInterest,
        marginCallActive,
        unlockedSkills,
        showNotification,
        playSound,
        onTick,
        onObservation,
        updatePricesTick,
        generateNewsTick,
        processOrdersTick,
        checkMarginCall,
        processShortPositions,
        processDailyInterest,
        processDividendsTick,
        processCrisisTick
    ])

    // 메인 게임 루프
    useEffect(() => {
        if (!isInitialized) return
        const interval = setInterval(() => {
            try {
                onTickRef.current?.()
            } catch (error) {
                console.warn('[useGameLoop] onTick callback failed:', error)
            }

            const now = Date.now()
            const currentStocks = stocksRef.current
            const currentAlerts = alertsRef.current
            const currentMarketState = marketStateRef.current
            const currentCash = cashRef.current
            const currentPortfolio = portfolioRef.current
            const currentShortPositions = shortPositionsRef.current
            const currentCreditUsed = creditUsedRef.current
            const currentCreditInterest = creditInterestRef.current
            const currentMarginCallActive = marginCallActiveRef.current
            const currentPendingOrders = pendingOrdersRef.current
            const currentUnlockedSkills = unlockedSkillsRef.current
            const showNotificationCurrent = showNotificationRef.current
            const playSoundCurrent = playSoundRef.current
            let workingStocks = currentStocks
            let workingMarketState = currentMarketState
            let workingCash = currentCash
            let workingPortfolio = currentPortfolio
            let workingShortPositions = currentShortPositions
            let workingCreditUsed = currentCreditUsed
            let workingCreditInterest = currentCreditInterest
            let workingMarginCallActive = currentMarginCallActive
            let workingPendingOrders = currentPendingOrders
            const liquidationTrades = []

            // 1. 게임 시간 업데이트
            const newGameTime = calculateGameDate(gameStartTimeRef.current, now)
            if (!gameTimeRef.current || gameTimeRef.current.day !== newGameTime.day ||
                gameTimeRef.current.hour !== newGameTime.hour ||
                gameTimeRef.current.minute !== newGameTime.minute) {
                gameTimeRef.current = newGameTime
                setGameTime(newGameTime)
            }
            const gameDay = newGameTime.day

            // 2. 시장 상태 업데이트
            const activeGlobalEvent = getActiveGlobalEvent()
            workingMarketState = updateMarketState(workingMarketState, activeGlobalEvent)

            // 3. 신규 거래일 체크
            if (gameDay > lastDayRef.current) {
                lastDayRef.current = gameDay
                setCurrentDay(gameDay)
                workingStocks = startNewTradingDay(workingStocks)
                setDailyTrades(0)
                setDailyProfit(0)
                const interestAccrued = processDailyInterestRef.current()
                if (interestAccrued > 0) {
                    workingCreditInterest += interestAccrued
                }
                showNotificationCurrent(`📅 ${newGameTime.displayDate} 거래일 시작!`, 'info')
                playSoundCurrent('news')
            }

            // 4. stockMap 생성
            let stockMap = new Map(workingStocks.map(stock => [stock.id, stock]))

            // 5. 마진콜 체크
            const marginResult = checkMarginCallRef.current(stockMap, {
                cash: workingCash,
                portfolio: workingPortfolio,
                shortPositions: workingShortPositions,
                creditUsed: workingCreditUsed,
                creditInterest: workingCreditInterest,
                marginCallActive: workingMarginCallActive
            })
            if (marginResult?.marginCallActive !== undefined) {
                workingMarginCallActive = marginResult.marginCallActive
            }
            if (marginResult?.forceLiquidation) {
                if (marginResult.cash !== undefined) workingCash = marginResult.cash
                if (marginResult.portfolio !== undefined) workingPortfolio = marginResult.portfolio
                if (marginResult.creditUsed !== undefined) workingCreditUsed = marginResult.creditUsed
                if (marginResult.creditInterest !== undefined) workingCreditInterest = marginResult.creditInterest
                liquidationTrades.push(...(marginResult.trades || []))
            }

            // 6. 뉴스 생성
            const newsResult = generateNewsTickRef.current(workingStocks, workingMarketState, newGameTime)
            if (newsResult.stocks !== workingStocks) {
                workingStocks = newsResult.stocks
                workingMarketState = newsResult.marketState
            }

            // 7. 시즌 종료 체크
            if (newGameTime.isYearEnd && lastSeasonYearRef.current < newGameTime.year) {
                lastSeasonYearRef.current = newGameTime.year
                setShowSeasonEnd(true)
                playSoundCurrent('levelUp')
            }

            // 8. 마켓 이벤트
            const event = generateMarketEvent(workingStocks)
            if (event) {
                const { stocks: eventStocks, cash: eventCash, portfolio: eventPortfolio, message } =
                    applyEventEffect(event, workingStocks, workingCash, workingPortfolio)
                workingStocks = eventStocks
                if (eventCash !== workingCash) {
                    workingCash = eventCash
                }
                if (eventPortfolio !== workingPortfolio) {
                    workingPortfolio = eventPortfolio
                }
                if (message) showNotificationCurrent(`${event.icon} ${message}`, 'info')
            }

            // 9. 위기 이벤트
            processCrisisTickRef.current(workingStocks, workingMarketState, gameDay)

            // 10. 가격 변동
            workingStocks = updatePricesTickRef.current(workingStocks, workingMarketState, gameDay, newGameTime)
            stockMap = new Map(workingStocks.map(stock => [stock.id, stock]))

            // 가격 변화 표시 리셋
            if (priceResetTimeoutRef.current) clearTimeout(priceResetTimeoutRef.current)
            priceResetTimeoutRef.current = setTimeout(() => setPriceChanges({}), PRICE_RESET_DELAY)

            // 11. 주문 처리
            const orderResult = processOrdersTickRef.current({
                pendingOrders: workingPendingOrders,
                stocks: workingStocks,
                cash: workingCash,
                portfolio: workingPortfolio,
                unlockedSkills: currentUnlockedSkills
            })
            if (orderResult) {
                workingCash = orderResult.cash
                workingPortfolio = orderResult.portfolio
                workingPendingOrders = orderResult.pendingOrders
            }

            // 12. 공매도 처리
            const shortResult = processShortPositionsRef.current(stockMap, {
                cash: workingCash,
                shortPositions: workingShortPositions
            })
            if (shortResult) {
                workingCash = shortResult.cash
                workingShortPositions = shortResult.shortPositions
                liquidationTrades.push(...(shortResult.trades || []))
            }

            // Forced settlements use the existing cash flow, without adding server replay actions.
            if (liquidationTrades.length > 0) {
                setTradeHistory(prev => [...prev, ...liquidationTrades.map(trade => ({
                    ...trade, id: `liquidation-${now}-${trade.type}-${trade.stockId}`, timestamp: now
                }))])
                setTotalTrades(prev => prev + liquidationTrades.length)
                setDailyTrades(prev => prev + liquidationTrades.length)
                const profit = liquidationTrades.reduce((sum, trade) => sum + trade.profit, 0)
                setTotalProfit(prev => prev + profit)
                setDailyProfit(prev => prev + profit)
                setWinStreak(prev => liquidationTrades.reduce((streak, trade) => trade.profit > 0 ? streak + 1 : 0, prev))
            }

            // 13. 알림 체크
            const triggeredAlerts = checkAlerts(currentAlerts, workingStocks, workingPortfolio)
            if (triggeredAlerts.length > 0) {
                const triggeredIds = new Set(triggeredAlerts.map(a => a.id))
                triggeredAlerts.forEach(alert => {
                    showNotificationCurrent(`Alert: ${alert.stockName}`, 'info')
                    playSoundCurrent('news')
                })
                setAlerts(currentAlerts.map(a => triggeredIds.has(a.id) ? { ...a, triggered: true } : a))
            }

            // 14. 배당금 처리 (1분마다)
            const dividendTotal = processDividendsTickRef.current(stockMap, now, workingPortfolio)
            if (dividendTotal > 0) {
                workingCash += dividendTotal
            }

            // 15. 자산 기록 (10초마다)
            if (now - lastAssetHistoryRef.current >= ASSET_HISTORY_INTERVAL) {
                lastAssetHistoryRef.current = now
                const { totalAssets: totalAssetsNow } = calculateAssets({
                    cash: workingCash, portfolio: workingPortfolio, shortPositions: workingShortPositions,
                    stockMap, creditUsed: workingCreditUsed, creditInterest: workingCreditInterest
                })
                setAssetHistory(prev => [...prev.slice(-100), { value: totalAssetsNow, timestamp: now, day: gameDay }])
            }

            // 16. 상태 업데이트
            if (workingStocks !== currentStocks) setStocks(workingStocks)
            if (workingMarketState !== currentMarketState) setMarketState(workingMarketState)
            if (workingCash !== currentCash) setCash(workingCash)
            if (workingPortfolio !== currentPortfolio) setPortfolio(workingPortfolio)
            if (workingShortPositions !== currentShortPositions) setShortPositions(workingShortPositions)
            if (workingPendingOrders !== currentPendingOrders) setPendingOrders(workingPendingOrders)
            if (workingCreditUsed !== currentCreditUsed) setCreditUsed(workingCreditUsed)
            if (workingCreditInterest !== currentCreditInterest) setCreditInterest(workingCreditInterest)
            if (workingMarginCallActive !== currentMarginCallActive) setMarginCallActive(workingMarginCallActive)

            // Observe every completed tick, including unchanged prices; never consume market randomness.
            try {
                onObservationRef.current?.({ stocks: workingStocks, timeMs: now, gameDay, gameTime: newGameTime })
            } catch (error) {
                console.warn('[useGameLoop] observation callback failed:', error)
            }

        }, updateInterval)

        return () => {
            clearInterval(interval)
            if (priceResetTimeoutRef.current) clearTimeout(priceResetTimeoutRef.current)
        }
    }, [
        isInitialized,
        updateInterval,
        setActiveCrisis, setAlerts, setAssetHistory, setCash, setCreditInterest, setCreditUsed, setCrisisAlert, setCrisisHistory,
        setCurrentDay, setDailyProfit, setDailyTrades, setGameTime, setMarketState, setNews, setPendingOrders,
        setPortfolio, setPriceChanges, setShortPositions, setShowSeasonEnd, setStocks, setTotalDividends, setMarginCallActive,
        setTradeHistory, setTotalTrades, setTotalProfit, setWinStreak
    ])
}

export default useGameLoop
