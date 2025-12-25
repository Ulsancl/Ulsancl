/**
 * useTrading - 거래 관련 로직을 담당하는 커스텀 훅
 * App.jsx에서 분리하여 코드 유지보수성 향상
 */

import { useCallback } from 'react'
import { generateId } from '../utils'
import { SHORT_SELLING, CREDIT_TRADING } from '../constants'

export const useTrading = ({
    cash, setCash,
    portfolio, setPortfolio,
    shortPositions, setShortPositions,
    creditUsed, setCreditUsed,
    creditInterest, setCreditInterest,
    tradeHistory, setTradeHistory,
    totalTrades, setTotalTrades,
    dailyTrades, setDailyTrades,
    dailyProfit, setDailyProfit,
    totalProfit, setTotalProfit,
    winStreak, setWinStreak,
    unlockedSkills,
    currentLeverage,
    canUseCredit,
    availableCredit,
    grossAssets,
    showNotification,
    playSound,
    addActionFeedback,
    formatNumber,
    formatCompact
}) => {

    // 매수
    const handleBuy = useCallback((stock, qty) => {
        const leverageMultiplier = currentLeverage?.multiplier || 1
        const effectiveQty = qty * leverageMultiplier
        const rawTotal = stock.price * qty

        // 수수료 계산 (기본 0.15%)
        let feeRate = 0.0015
        const feeDiscountLevel = unlockedSkills?.['fee_discount'] || 0
        if (feeDiscountLevel > 0) {
            feeRate *= (1 - feeDiscountLevel * 0.05)
        }
        const fee = Math.floor(rawTotal * feeRate)
        const total = rawTotal + fee

        if (total > cash) {
            showNotification('잔고가 부족합니다!', 'error')
            playSound?.('error')
            return false
        }

        setCash(prev => prev - total)
        setPortfolio(prev => {
            const existing = prev[stock.id] || { quantity: 0, totalCost: 0 }
            return {
                ...prev,
                [stock.id]: {
                    quantity: existing.quantity + effectiveQty,
                    totalCost: existing.totalCost + total,
                    leverage: leverageMultiplier > 1 ? leverageMultiplier : (existing.leverage || 1),
                    firstBuyTime: existing.firstBuyTime || Date.now()
                }
            }
        })

        const trade = {
            id: generateId(),
            type: 'buy',
            stockId: stock.id,
            quantity: effectiveQty,
            price: stock.price,
            total,
            timestamp: Date.now()
        }
        setTradeHistory(prev => [...prev, trade])
        setTotalTrades(prev => prev + 1)
        setDailyTrades(prev => prev + 1)
        playSound?.('buy')
        showNotification(`${stock.name} ${effectiveQty}주 매수`, 'success')

        addActionFeedback?.(`-${formatCompact(total)}`, 'loss', window.innerWidth / 2, window.innerHeight / 2)
        return true
    }, [cash, currentLeverage, unlockedSkills, showNotification, playSound, setCash, setPortfolio, setTradeHistory, setTotalTrades, setDailyTrades, addActionFeedback, formatCompact])

    // 매도
    const handleSell = useCallback((stock, qty) => {
        const holding = portfolio[stock.id]
        if (!holding || holding.quantity < qty) {
            showNotification('보유 수량이 부족합니다!', 'error')
            playSound?.('error')
            return false
        }

        const rawTotal = stock.price * qty
        let feeRate = 0.0015
        const feeDiscountLevel = unlockedSkills?.['fee_discount'] || 0
        if (feeDiscountLevel > 0) {
            feeRate *= (1 - feeDiscountLevel * 0.05)
        }
        const fee = Math.floor(rawTotal * feeRate)
        const proceeds = rawTotal - fee

        const avgCost = holding.totalCost / holding.quantity
        const costBasis = avgCost * qty
        const profit = proceeds - costBasis

        setCash(prev => prev + proceeds)
        setPortfolio(prev => {
            const newQty = holding.quantity - qty
            if (newQty <= 0) {
                const { [stock.id]: _, ...rest } = prev
                return rest
            }
            return {
                ...prev,
                [stock.id]: {
                    ...holding,
                    quantity: newQty,
                    totalCost: holding.totalCost - costBasis
                }
            }
        })

        const trade = {
            id: generateId(),
            type: 'sell',
            stockId: stock.id,
            quantity: qty,
            price: stock.price,
            total: proceeds,
            profit,
            timestamp: Date.now()
        }
        setTradeHistory(prev => [...prev, trade])
        setTotalTrades(prev => prev + 1)
        setDailyTrades(prev => prev + 1)
        setTotalProfit(prev => prev + profit)
        setDailyProfit(prev => prev + profit)

        if (profit > 0) {
            setWinStreak(prev => prev + 1)
            playSound?.('sell')
            showNotification(`${stock.name} ${qty}주 매도 (+${formatCompact(profit)})`, 'success')
            addActionFeedback?.(`+${formatCompact(profit)}`, 'profit', window.innerWidth / 2, window.innerHeight / 2)
        } else {
            setWinStreak(0)
            playSound?.('sell')
            showNotification(`${stock.name} ${qty}주 매도 (${formatCompact(profit)})`, 'warning')
            addActionFeedback?.(`${formatCompact(profit)}`, 'loss', window.innerWidth / 2, window.innerHeight / 2)
        }
        return true
    }, [portfolio, unlockedSkills, showNotification, playSound, setCash, setPortfolio, setTradeHistory, setTotalTrades, setDailyTrades, setTotalProfit, setDailyProfit, setWinStreak, addActionFeedback, formatCompact])

    // 신용 거래 - 대출
    const handleBorrowCredit = useCallback((amount) => {
        if (!canUseCredit) {
            showNotification('신용 거래는 레벨 3부터 가능합니다!', 'error')
            return false
        }

        if (amount <= 0) {
            showNotification('대출 금액을 입력하세요!', 'error')
            return false
        }

        if (amount > availableCredit) {
            showNotification(`대출 한도 초과! 가용 한도: ${formatNumber(availableCredit)}원`, 'error')
            return false
        }

        const fee = Math.floor(amount * CREDIT_TRADING.borrowFee)
        const netAmount = amount - fee

        setCreditUsed(prev => prev + amount)
        setCash(prev => prev + netAmount)
        showNotification(`${formatNumber(amount)}원 대출 실행 (수수료 ${formatNumber(fee)}원)`, 'info')
        playSound?.('buy')
        return true
    }, [canUseCredit, availableCredit, showNotification, playSound, setCreditUsed, setCash, formatNumber])

    // 신용 거래 - 상환
    const handleRepayCredit = useCallback((amount) => {
        if (creditUsed <= 0 && creditInterest <= 0) {
            showNotification('상환할 대출이 없습니다!', 'error')
            return false
        }

        const totalDebtNow = creditUsed + creditInterest
        const repayAmount = Math.min(amount, totalDebtNow, cash)

        if (repayAmount <= 0) {
            showNotification('상환할 금액이 부족합니다!', 'error')
            return false
        }

        let remaining = repayAmount
        if (creditInterest > 0) {
            const interestPayment = Math.min(remaining, creditInterest)
            setCreditInterest(prev => prev - interestPayment)
            remaining -= interestPayment
        }
        if (remaining > 0 && creditUsed > 0) {
            const principalPayment = Math.min(remaining, creditUsed)
            setCreditUsed(prev => prev - principalPayment)
        }

        setCash(prev => prev - repayAmount)
        showNotification(`${formatNumber(repayAmount)}원 상환 완료`, 'success')
        playSound?.('sell')
        return true
    }, [creditUsed, creditInterest, cash, showNotification, playSound, setCreditInterest, setCreditUsed, setCash, formatNumber])

    // MAX 매수
    const handleBuyMax = useCallback((stock) => {
        const maxQty = Math.floor(cash / stock.price)
        if (maxQty > 0) {
            handleBuy(stock, maxQty)
        }
    }, [cash, handleBuy])

    // 전량 매도
    const handleSellAll = useCallback((stock) => {
        const holding = portfolio[stock.id]
        if (holding?.quantity > 0) {
            handleSell(stock, holding.quantity)
        }
    }, [portfolio, handleSell])

    return {
        handleBuy,
        handleSell,
        handleBuyMax,
        handleSellAll,
        handleBorrowCredit,
        handleRepayCredit
    }
}

export default useTrading
