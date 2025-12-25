/**
 * useGameLoop - 게임 루프 로직 훅
 * 가격 업데이트, 뉴스 생성, 시간 관리 등 게임 진행 로직
 */

import { useEffect, useRef, useCallback } from 'react'
import {
    calculatePriceChange,
    updateMarketState,
    generateNews,
    applyNewsImpact,
    processOrders,
    startNewTradingDay,
    updateDailyRange,
    calculateGameDate,
    SECONDS_PER_DAY,
    generateGlobalEvent
} from '../gameEngine'

/**
 * 게임 루프 훅
 * @param {Object} options - 게임 루프 옵션
 */
export function useGameLoop({
    stocks,
    setStocks,
    marketState,
    setMarketState,
    gameStartTime,
    currentDay,
    setCurrentDay,
    setGameTime,
    setPriceHistory,
    setPriceChanges,
    news,
    setNews,
    pendingOrders,
    setPendingOrders,
    cash,
    setCash,
    portfolio,
    setPortfolio,
    isPlaying = true,
    updateInterval = 1000,
    onDayChange,
    onNewsGenerated,
    onOrderExecuted,
    onPriceUpdate
}) {
    const lastDayRef = useRef(currentDay)
    const animationFrameRef = useRef(null)
    const lastUpdateRef = useRef(Date.now())

    // 가격 업데이트
    const updatePrices = useCallback(() => {
        if (!stocks || stocks.length === 0) return

        setStocks(prevStocks => {
            const newStocks = prevStocks.map(stock => {
                const newPrice = calculatePriceChange(stock, marketState, currentDay)
                return { ...stock, price: newPrice }
            })

            // 가격 변화 방향 기록
            const changes = {}
            newStocks.forEach((stock, i) => {
                if (stock.price > prevStocks[i].price) {
                    changes[stock.id] = 'up'
                } else if (stock.price < prevStocks[i].price) {
                    changes[stock.id] = 'down'
                } else {
                    changes[stock.id] = 'same'
                }
            })
            setPriceChanges(changes)

            // 가격 히스토리 업데이트
            setPriceHistory(prev => {
                const newHistory = { ...prev }
                newStocks.forEach(stock => {
                    if (!newHistory[stock.id]) {
                        newHistory[stock.id] = []
                    }
                    newHistory[stock.id] = [...newHistory[stock.id].slice(-499), stock.price]
                })
                return newHistory
            })

            // 일일 고가/저가 업데이트
            return updateDailyRange(newStocks)
        })

        onPriceUpdate?.()
    }, [stocks, marketState, currentDay, setStocks, setPriceChanges, setPriceHistory, onPriceUpdate])

    // 시장 상태 업데이트
    const updateMarket = useCallback(() => {
        setMarketState(prev => updateMarketState(prev))
    }, [setMarketState])

    // 뉴스 생성
    const generateNewsIfNeeded = useCallback(() => {
        const newsItem = generateNews(stocks, 0.03)
        if (newsItem) {
            setNews(prev => [newsItem, ...prev].slice(0, 50))
            onNewsGenerated?.(newsItem)

            // 뉴스 영향 적용
            const result = applyNewsImpact(stocks, newsItem, marketState)
            setStocks(result.stocks)
            setMarketState(result.marketState)
        }
    }, [stocks, marketState, setNews, setStocks, setMarketState, onNewsGenerated])

    // 글로벌 이벤트 체크
    const checkGlobalEvents = useCallback(() => {
        const event = generateGlobalEvent()
        if (event) {
            setNews(prev => [event, ...prev].slice(0, 50))
        }
    }, [setNews])

    // 주문 처리
    const processActiveOrders = useCallback(() => {
        if (pendingOrders.length === 0) return

        const result = processOrders(pendingOrders, stocks, cash, portfolio)

        if (result.executedOrders.length > 0) {
            setPendingOrders(result.remainingOrders)
            setCash(result.cash)
            setPortfolio(result.portfolio)
            result.executedOrders.forEach(order => {
                onOrderExecuted?.(order)
            })
        }
    }, [pendingOrders, stocks, cash, portfolio, setPendingOrders, setCash, setPortfolio, onOrderExecuted])

    // 시간 업데이트
    const updateGameTime = useCallback(() => {
        const gameDate = calculateGameDate(gameStartTime, Date.now())
        setGameTime(gameDate)

        // 새 날 체크
        if (gameDate.day !== lastDayRef.current) {
            lastDayRef.current = gameDate.day
            setCurrentDay(gameDate.day)

            // 새 거래일 시작
            setStocks(prev => startNewTradingDay(prev))
            onDayChange?.(gameDate.day)
        }

        return gameDate
    }, [gameStartTime, setGameTime, setCurrentDay, setStocks, onDayChange])

    // 메인 게임 루프
    useEffect(() => {
        if (!isPlaying) return

        const gameLoop = () => {
            const now = Date.now()
            const elapsed = now - lastUpdateRef.current

            if (elapsed >= updateInterval) {
                lastUpdateRef.current = now

                // 시간 업데이트
                const gameDate = updateGameTime()

                // 시장 시간에만 가격 업데이트
                if (gameDate.isMarketOpen !== false) {
                    updatePrices()
                    updateMarket()
                    generateNewsIfNeeded()
                    checkGlobalEvents()
                    processActiveOrders()
                }
            }

            animationFrameRef.current = requestAnimationFrame(gameLoop)
        }

        animationFrameRef.current = requestAnimationFrame(gameLoop)

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [
        isPlaying,
        updateInterval,
        updateGameTime,
        updatePrices,
        updateMarket,
        generateNewsIfNeeded,
        checkGlobalEvents,
        processActiveOrders
    ])

    return {
        updatePrices,
        updateMarket,
        generateNewsIfNeeded,
        processActiveOrders,
        updateGameTime
    }
}

export default useGameLoop
