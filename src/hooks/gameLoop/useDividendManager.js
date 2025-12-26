/**
 * useDividendManager - 배당금 처리 로직 담당 훅
 * useGameLoop에서 분리된 모듈
 */

import { useCallback, useRef, useLayoutEffect } from 'react'
import { DIVIDEND_RATES } from '../../constants'

// 배당금 처리 주기 (1분)
const DIVIDEND_INTERVAL = 60000

export const useDividendManager = ({
    portfolio,
    setCash,
    setTotalDividends,
    showNotification,
    formatNumber
}) => {
    const portfolioRef = useRef(portfolio)
    const showNotificationRef = useRef(showNotification)
    const formatNumberRef = useRef(formatNumber)
    const lastDividendTimeRef = useRef(Date.now())

    useLayoutEffect(() => {
        portfolioRef.current = portfolio
        showNotificationRef.current = showNotification
        formatNumberRef.current = formatNumber
    }, [portfolio, showNotification, formatNumber])

    const tick = useCallback((stockMap, now) => {
        // 1분마다 배당금 처리
        if (now - lastDividendTimeRef.current < DIVIDEND_INTERVAL) {
            return 0
        }

        const currentPortfolio = portfolioRef.current
        const formatNumberCurrent = formatNumberRef.current
        const showNotificationCurrent = showNotificationRef.current

        let dividendTotal = 0
        Object.entries(currentPortfolio).forEach(([stockId, holding]) => {
            const rate = DIVIDEND_RATES[parseInt(stockId)] || 0
            const stock = stockMap.get(parseInt(stockId))
            if (stock && rate > 0) {
                const dividend = Math.round(stock.price * holding.quantity * (rate / 100) / 60)
                dividendTotal += dividend
            }
        })

        if (dividendTotal > 0) {
            setCash(prev => prev + dividendTotal)
            setTotalDividends(prev => prev + dividendTotal)
            showNotificationCurrent(`💰 배당금 ${formatNumberCurrent(dividendTotal)}원`, 'success')
        }

        lastDividendTimeRef.current = now
        return dividendTotal
    }, [setCash, setTotalDividends])

    return { tick }
}

export default useDividendManager
