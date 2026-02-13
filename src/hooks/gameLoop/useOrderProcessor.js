/**
 * useOrderProcessor - 주문 처리 훅
 * useGameLoop에서 전달받은 주문을 매 틱 처리
 */

import { useCallback, useRef, useLayoutEffect } from 'react'
import { processOrders } from '../../engine'
import { generateId } from '../../utils/index.js'

const normalizeSideToTradeType = (side) => (side === 'buy' ? 'BUY' : 'SELL')

export const useOrderProcessor = ({
    setTradeHistory,
    setTotalTrades,
    setDailyTrades,
    setTotalProfit,
    setDailyProfit,
    setWinStreak,
    showNotification,
    playSound,
    recordTrade
}) => {
    const showNotificationRef = useRef(showNotification)
    const playSoundRef = useRef(playSound)
    const recordTradeRef = useRef(recordTrade)

    useLayoutEffect(() => {
        showNotificationRef.current = showNotification
        playSoundRef.current = playSound
        recordTradeRef.current = recordTrade
    }, [showNotification, playSound, recordTrade])

    const tick = useCallback(({
        pendingOrders: currentPendingOrders,
        stocks: currentStocks,
        cash: currentCash,
        portfolio: currentPortfolio,
        unlockedSkills: currentUnlockedSkills
    }) => {
        const showNotificationCurrent = showNotificationRef.current
        const playSoundCurrent = playSoundRef.current

        if (!currentPendingOrders || currentPendingOrders.length === 0) {
            return { cash: currentCash, portfolio: currentPortfolio, pendingOrders: currentPendingOrders || [] }
        }

        // 주문 수수료
        const feeDiscountLevel = currentUnlockedSkills?.['fee_discount'] || 0
        let orderFeeRate = 0.0015
        if (feeDiscountLevel > 0) {
            orderFeeRate *= (1 - feeDiscountLevel * 0.05)
        }

        const { executedOrders, remainingOrders, cash: newCash, portfolio: newPortfolio } =
            processOrders(currentPendingOrders, currentStocks, currentCash, currentPortfolio, { feeRate: orderFeeRate })

        if (executedOrders.length > 0) {
            const now = Date.now()
            const tradeCount = executedOrders.length
            let profitDelta = 0

            executedOrders.forEach(order => {
                const actionType = normalizeSideToTradeType(order.side)

                recordTradeRef.current?.(
                    actionType,
                    String(order.stockId),
                    order.quantity,
                    {
                        orderType: order.type || 'market',
                        limitPrice: order.targetPrice
                    }
                )

                showNotificationCurrent(`?뵒 ${order.stockName} ${order.type} 주문 체결!`, 'success')
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

            return { cash: newCash, portfolio: newPortfolio, pendingOrders: remainingOrders }
        }

        return { cash: currentCash, portfolio: currentPortfolio, pendingOrders: currentPendingOrders || [] }
    }, [setDailyProfit, setDailyTrades, setTotalProfit, setTotalTrades, setTradeHistory, setWinStreak])

    return { tick }
}

export default useOrderProcessor
