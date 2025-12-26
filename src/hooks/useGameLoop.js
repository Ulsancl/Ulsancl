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
    getActiveGlobalEvent,
    checkAlerts
} from '../engine'
import { calculateStockValueFromMap, calculateShortValueFromMap } from '../utils/index.js'

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
    // Refs
    const lastDayRef = useRef(1)
    const lastSeasonYearRef = useRef(2020)
    const priceResetTimeoutRef = useRef(null)
    const gameTimeRef = useRef(null)
    const gameStartTimeRef = useRef(gameStartTime)
    const stocksRef = useRef(stocks)
    const alertsRef = useRef(alerts)
    const marketStateRef = useRef(marketState)
    const cashRef = useRef(cash)
    const portfolioRef = useRef(portfolio)
    const shortPositionsRef = useRef(shortPositions)
    const creditUsedRef = useRef(creditUsed)
    const creditInterestRef = useRef(creditInterest)
    const showNotificationRef = useRef(showNotification)
    const playSoundRef = useRef(playSound)
    const formatNumberRef = useRef(formatNumber)

    // Sync refs
    useLayoutEffect(() => {
        gameStartTimeRef.current = gameStartTime
        stocksRef.current = stocks
        alertsRef.current = alerts
        marketStateRef.current = marketState
        cashRef.current = cash
        portfolioRef.current = portfolio
        shortPositionsRef.current = shortPositions
        creditUsedRef.current = creditUsed
        creditInterestRef.current = creditInterest
        showNotificationRef.current = showNotification
        playSoundRef.current = playSound
        formatNumberRef.current = formatNumber
    }, [gameStartTime, stocks, alerts, marketState, cash, portfolio, shortPositions, creditUsed, creditInterest, showNotification, playSound, formatNumber])

    // 서브 모듈 초기화
    const priceUpdater = usePriceUpdater({
        stocks, setStocks, marketState, setPriceHistory, setPriceChanges
    })

    const newsGenerator = useNewsGenerator({
        stocks, marketState, setNews, showNotification, playSound
    })

    const orderProcessor = useOrderProcessor({
        pendingOrders, setPendingOrders, stocks, cash, setCash,
        portfolio, setPortfolio, unlockedSkills, setTradeHistory,
        setTotalTrades, setDailyTrades, setTotalProfit, setDailyProfit, setWinStreak,
        showNotification, playSound
    })

    const creditManager = useCreditManager({
        cash, setCash, portfolio, setPortfolio,
        creditUsed, setCreditUsed, creditInterest, setCreditInterest,
        marginCallActive, setMarginCallActive,
        shortPositions, setShortPositions,
        showNotification, playSound, formatNumber
    })

    const dividendManager = useDividendManager({
        portfolio, setCash, setTotalDividends, showNotification, formatNumber
    })

    const crisisManager = useCrisisManager({
        setActiveCrisis, setCrisisAlert, setCrisisHistory, showNotification, playSound
    })

    // 메인 게임 루프
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now()
            const currentStocks = stocksRef.current
            const currentAlerts = alertsRef.current
            const currentMarketState = marketStateRef.current
            const showNotificationCurrent = showNotificationRef.current
            const playSoundCurrent = playSoundRef.current
            const formatNumberCurrent = formatNumberRef.current

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
            let workingMarketState = updateMarketState(currentMarketState, activeGlobalEvent)
            let workingStocks = currentStocks

            // 3. 신규 거래일 체크
            if (gameDay > lastDayRef.current) {
                lastDayRef.current = gameDay
                setCurrentDay(gameDay)
                workingStocks = startNewTradingDay(workingStocks)
                setDailyTrades(0)
                setDailyProfit(0)
                creditManager.processDailyInterest()
                showNotificationCurrent(`📅 ${newGameTime.displayDate} 거래일 시작!`, 'info')
                playSoundCurrent('news')
            }

            // 4. stockMap 생성
            let stockMap = new Map(workingStocks.map(stock => [stock.id, stock]))

            // 5. 마진콜 체크
            creditManager.checkMarginCall(stockMap)

            // 6. 뉴스 생성
            const newsResult = newsGenerator.tick(newGameTime)
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
                    applyEventEffect(event, workingStocks, cashRef.current, portfolioRef.current)
                workingStocks = eventStocks
                if (eventCash !== cashRef.current) setCash(eventCash)
                if (eventPortfolio !== portfolioRef.current) setPortfolio(eventPortfolio)
                if (message) showNotificationCurrent(`${event.icon} ${message}`, 'info')
            }

            // 9. 위기 이벤트
            crisisManager.tick(workingStocks, workingMarketState, gameDay)

            // 10. 가격 변동
            workingStocks = priceUpdater.tick(gameDay, newGameTime)
            stockMap = new Map(workingStocks.map(stock => [stock.id, stock]))

            // 가격 변화 표시 리셋
            if (priceResetTimeoutRef.current) clearTimeout(priceResetTimeoutRef.current)
            priceResetTimeoutRef.current = setTimeout(() => setPriceChanges({}), PRICE_RESET_DELAY)

            // 11. 주문 처리
            orderProcessor.tick()

            // 12. 공매도 처리
            creditManager.processShortPositions(stockMap)

            // 13. 알림 체크
            const triggeredAlerts = checkAlerts(currentAlerts, workingStocks, portfolioRef.current)
            if (triggeredAlerts.length > 0) {
                const triggeredIds = new Set(triggeredAlerts.map(a => a.id))
                triggeredAlerts.forEach(alert => {
                    showNotificationCurrent(`Alert: ${alert.stockName}`, 'info')
                    playSoundCurrent('news')
                })
                setAlerts(currentAlerts.map(a => triggeredIds.has(a.id) ? { ...a, triggered: true } : a))
            }

            // 14. 배당금 처리 (1분마다)
            dividendManager.tick(stockMap, now)

            // 15. 자산 기록 (10초마다)
            if (now % ASSET_HISTORY_INTERVAL < updateInterval) {
                const stockValueNow = calculateStockValueFromMap(stockMap, portfolioRef.current)
                const shortValueNow = calculateShortValueFromMap(stockMap, shortPositionsRef.current)
                const grossAssetsNow = cashRef.current + stockValueNow + shortValueNow
                const totalAssetsNow = grossAssetsNow - creditUsedRef.current - creditInterestRef.current
                setAssetHistory(prev => [...prev.slice(-100), { value: totalAssetsNow, timestamp: now, day: gameDay }])
            }

            // 16. 상태 업데이트
            if (workingStocks !== currentStocks) setStocks(workingStocks)
            if (workingMarketState !== currentMarketState) setMarketState(workingMarketState)

        }, updateInterval)

        return () => {
            clearInterval(interval)
            if (priceResetTimeoutRef.current) clearTimeout(priceResetTimeoutRef.current)
        }
    }, [
        updateInterval,
        priceUpdater, newsGenerator, orderProcessor, creditManager, dividendManager, crisisManager,
        setActiveCrisis, setAlerts, setAssetHistory, setCash, setCrisisAlert, setCrisisHistory,
        setCurrentDay, setDailyProfit, setDailyTrades, setGameTime, setMarketState, setNews,
        setPortfolio, setPriceChanges, setShowSeasonEnd, setStocks, setTotalDividends
    ])
}

export default useGameLoop
