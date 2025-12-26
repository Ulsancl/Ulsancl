/**
 * usePriceUpdater - 가격 변동 로직 담당 훅
 * useGameLoop에서 분리된 모듈
 */

import { useCallback, useRef, useLayoutEffect } from 'react'
import { calculateAllStockPrices, applyCrisisImpact } from '../../engine'

export const usePriceUpdater = ({
    stocks,
    setStocks,
    marketState,
    setPriceHistory,
    setPriceChanges
}) => {
    const stocksRef = useRef(stocks)
    const marketStateRef = useRef(marketState)

    useLayoutEffect(() => {
        stocksRef.current = stocks
        marketStateRef.current = marketState
    }, [stocks, marketState])

    const tick = useCallback((gameDay, gameTime) => {
        const currentStocks = stocksRef.current
        const currentMarketState = marketStateRef.current

        // 가격 계산
        const calculatedResults = calculateAllStockPrices(
            currentStocks,
            currentMarketState,
            gameDay,
            gameTime
        )

        let newStocks = currentStocks.map(stock => {
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

        // 위기 영향 적용
        newStocks = applyCrisisImpact(newStocks, gameDay)

        // 가격 변화 방향 계산
        const previousPriceMap = new Map(currentStocks.map(s => [s.id, s.price]))
        const newChanges = {}
        newStocks.forEach(stock => {
            const prevPrice = previousPriceMap.get(stock.id) ?? stock.price
            newChanges[stock.id] = stock.price > prevPrice ? 'up' : stock.price < prevPrice ? 'down' : 'same'
        })

        setPriceChanges(newChanges)

        // 가격 히스토리 업데이트
        setPriceHistory(prev => {
            const newHistory = { ...prev }
            newStocks.forEach(stock => {
                newHistory[stock.id] = [...(newHistory[stock.id] || []).slice(-29), stock.price]
            })
            return newHistory
        })

        return newStocks
    }, [setPriceChanges, setPriceHistory])

    return { tick }
}

export default usePriceUpdater
