/**
 * useCreditManager - 신용 거래 및 마진콜 관리 훅
 * useGameLoop에서 분리된 모듈
 */

import { useCallback, useRef, useLayoutEffect } from 'react'
import { CREDIT_TRADING, SHORT_SELLING } from '../../constants'
import { calculateStockValueFromMap, calculateShortValueFromMap } from '../../utils/index.js'

export const useCreditManager = ({
    cash,
    portfolio,
    creditUsed,
    creditInterest,
    marginCallActive,
    shortPositions,
    showNotification,
    playSound,
    formatNumber
}) => {
    const cashRef = useRef(cash)
    const portfolioRef = useRef(portfolio)
    const creditUsedRef = useRef(creditUsed)
    const creditInterestRef = useRef(creditInterest)
    const marginCallActiveRef = useRef(marginCallActive)
    const shortPositionsRef = useRef(shortPositions)
    const showNotificationRef = useRef(showNotification)
    const playSoundRef = useRef(playSound)
    const formatNumberRef = useRef(formatNumber)

    useLayoutEffect(() => {
        cashRef.current = cash
        portfolioRef.current = portfolio
        creditUsedRef.current = creditUsed
        creditInterestRef.current = creditInterest
        marginCallActiveRef.current = marginCallActive
        shortPositionsRef.current = shortPositions
        showNotificationRef.current = showNotification
        playSoundRef.current = playSound
        formatNumberRef.current = formatNumber
    }, [cash, portfolio, creditUsed, creditInterest, marginCallActive, shortPositions, showNotification, playSound, formatNumber])

    // 마진콜 체크
    const checkMarginCall = useCallback((stockMap, overrides = {}) => {
        const currentCreditUsed = overrides.creditUsed ?? creditUsedRef.current
        const currentCash = overrides.cash ?? cashRef.current
        const currentPortfolio = overrides.portfolio ?? portfolioRef.current
        const currentShortPositions = overrides.shortPositions ?? shortPositionsRef.current
        const currentMarginCallActive = overrides.marginCallActive ?? marginCallActiveRef.current
        const currentCreditInterest = overrides.creditInterest ?? creditInterestRef.current
        const showNotificationCurrent = showNotificationRef.current

        if (currentCreditUsed <= 0) {
            return { marginCallActive: false }
        }

        const stockValueNow = calculateStockValueFromMap(stockMap, currentPortfolio)
        const shortValueNow = calculateShortValueFromMap(stockMap, currentShortPositions)
        const grossAssetsNow = currentCash + stockValueNow + shortValueNow
        const currentMarginRatio = grossAssetsNow / currentCreditUsed

        if (currentMarginRatio <= CREDIT_TRADING.liquidationMargin) {
            // 강제 청산
            showNotificationCurrent('⚠️ 마진콜! 담보 부족으로 포지션 강제 청산됩니다!', 'error')

            let workingCash = currentCash
            Object.keys(currentPortfolio).forEach(stockId => {
                const holding = currentPortfolio[stockId]
                const stock = stockMap.get(parseInt(stockId))
                if (stock && holding.quantity > 0) {
                    const saleAmount = Math.floor(stock.price * holding.quantity * 0.95)
                    workingCash += saleAmount
                }
            })

            const repayable = Math.min(workingCash, currentCreditUsed + currentCreditInterest)
            let newCreditUsed = currentCreditUsed
            let newCreditInterest = currentCreditInterest
            if (repayable > 0) {
                const interestPayment = Math.min(repayable, currentCreditInterest)
                const principalPayment = repayable - interestPayment
                newCreditInterest = currentCreditInterest - interestPayment
                newCreditUsed = Math.max(0, currentCreditUsed - principalPayment)
                workingCash -= repayable
            }

            return {
                marginCallActive: true,
                forceLiquidation: true,
                cash: workingCash,
                portfolio: {},
                creditUsed: newCreditUsed,
                creditInterest: newCreditInterest
            }
        } else if (currentMarginRatio <= CREDIT_TRADING.maintenanceMargin) {
            if (!currentMarginCallActive) {
                showNotificationCurrent('⚠️ 마진콜 경고! 담보 비율이 30% 이하입니다.', 'warning')
            }
            return { marginCallActive: true }
        } else if (currentMarginRatio > CREDIT_TRADING.maintenanceMargin) {
            return { marginCallActive: false }
        }

        return { marginCallActive: currentMarginCallActive }
    }, [])

    // 공매도 이자 및 강제청산
    const processShortPositions = useCallback((stockMap, overrides = {}) => {
        const currentShortPositions = overrides.shortPositions ?? shortPositionsRef.current
        const currentCash = overrides.cash ?? cashRef.current
        const showNotificationCurrent = showNotificationRef.current
        const playSoundCurrent = playSoundRef.current

        if (Object.keys(currentShortPositions).length === 0) {
            return { cash: currentCash, shortPositions: currentShortPositions }
        }

        let newCash = currentCash
        const updatedShorts = {}
        const liquidated = []

        Object.entries(currentShortPositions).forEach(([stockId, position]) => {
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
                const marginReturn = typeof position.margin === 'number'
                    ? position.margin
                    : position.entryPrice * position.quantity * SHORT_SELLING.marginRate
                newCash += marginReturn + pnl
                showNotificationCurrent(`⚠️ ${stock.name} 공매도 강제청산!`, 'error')
                playSoundCurrent('error')
            })
            return { cash: newCash, shortPositions: updatedShorts }
        }

        return { cash: newCash, shortPositions: currentShortPositions }
    }, [])

    // 일일 이자 계산 (새 거래일 시작 시 호출)
    const processDailyInterest = useCallback(() => {
        const currentCreditUsed = creditUsedRef.current
        const formatNumberCurrent = formatNumberRef.current
        const showNotificationCurrent = showNotificationRef.current

        if (currentCreditUsed > 0) {
            const dailyInterest = Math.floor(currentCreditUsed * CREDIT_TRADING.dailyInterestRate)
            if (dailyInterest > 0) {
                showNotificationCurrent(`💳 신용 이자 ${formatNumberCurrent(dailyInterest)}원 발생`, 'warning')
            }
            return dailyInterest
        }
        return 0
    }, [])

    return { checkMarginCall, processShortPositions, processDailyInterest }
}

export default useCreditManager
