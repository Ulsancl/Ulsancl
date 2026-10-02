/**
 * useTrading - 거래 관련 로직을 담당하는 커스텀 훅
 * App.jsx에서 분리하여 코드 유지보수성 향상
 */

import { useCallback } from 'react'
import { generateId } from '../utils'
import { SHORT_SELLING, CREDIT_TRADING } from '../constants'
import { getShortPositionMargin } from '../utils/calculations'

const normalizePositiveInteger = (value) => {
    const numericValue = Number(value)
    if (!Number.isFinite(numericValue)) return null
    if (!Number.isInteger(numericValue)) return null
    if (numericValue <= 0) return null
    return numericValue
}

export const useTrading = ({
    cash, setCash,
    portfolio, setPortfolio,
    shortPositions, setShortPositions,
    creditUsed, setCreditUsed,
    creditInterest, setCreditInterest,
    setTradeHistory,
    setTotalTrades,
    setDailyTrades,
    setDailyProfit,
    setTotalProfit,
    setWinStreak,
    unlockedSkills,
    currentLeverage,
    canUseCredit,
    canShortSell,
    availableCredit,
    setPendingOrders,
    showNotification,
    playSound,
    addActionFeedback,
    recordTrade,
    formatNumber,
    formatCompact
}) => {

    // 매수
    const handleBuy = useCallback((stock, qty) => {
        const normalizedQty = normalizePositiveInteger(qty)
        if (!normalizedQty) {
            showNotification('유효한 수량을 입력하세요!', 'error')
            playSound?.('error')
            return false
        }

        const leverageMultiplier = currentLeverage?.multiplier || 1
        const effectiveQty = normalizedQty * leverageMultiplier
        const notional = stock.price * effectiveQty

        // 수수료 계산 (기본 0.15%)
        let feeRate = 0.0015
        const feeDiscountLevel = unlockedSkills?.['fee_discount'] || 0
        if (feeDiscountLevel > 0) {
            feeRate *= (1 - feeDiscountLevel * 0.05)
        }
        const fee = Math.floor(notional * feeRate)
        const marginRate = leverageMultiplier > 1
            ? (currentLeverage?.marginRate ?? (1 / leverageMultiplier))
            : 1
        const marginRequired = notional * marginRate
        const cashRequired = marginRequired + fee
        const borrowed = Math.max(0, notional - marginRequired)

        if (cashRequired > cash) {
            showNotification('잔고가 부족합니다!', 'error')
            playSound?.('error')
            return false
        }

        setCash(prev => prev - cashRequired)
        setPortfolio(prev => {
            const existing = prev[stock.id] || { quantity: 0, totalCost: 0, borrowed: 0, margin: 0 }
            return {
                ...prev,
                [stock.id]: {
                    quantity: existing.quantity + effectiveQty,
                    totalCost: existing.totalCost + notional + fee,
                    borrowed: (existing.borrowed || 0) + borrowed,
                    margin: (existing.margin || 0) + marginRequired,
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
            total: notional + fee,
            timestamp: Date.now()
        }
        setTradeHistory(prev => [...prev, trade])
        recordTrade?.('BUY', String(stock.id), effectiveQty, { orderType: 'market' })
        setTotalTrades(prev => prev + 1)
        setDailyTrades(prev => prev + 1)
        playSound?.('buy')
        showNotification(`${stock.name} ${effectiveQty}주 매수`, 'success')

        addActionFeedback?.(`-${formatCompact(cashRequired)}`, 'loss', window.innerWidth / 2, window.innerHeight / 2)
        return true
    }, [cash, currentLeverage, unlockedSkills, showNotification, playSound, setCash, setPortfolio, setTradeHistory, setTotalTrades, setDailyTrades, addActionFeedback, recordTrade, formatCompact])

    // 매도
    const handleSell = useCallback((stock, qty) => {
        const normalizedQty = normalizePositiveInteger(qty)
        if (!normalizedQty) {
            showNotification('유효한 수량을 입력하세요!', 'error')
            playSound?.('error')
            return false
        }

        const holding = portfolio[stock.id]
        if (!holding || holding.quantity < normalizedQty) {
            showNotification('보유 수량이 부족합니다!', 'error')
            playSound?.('error')
            return false
        }

        const rawTotal = stock.price * normalizedQty
        let feeRate = 0.0015
        const feeDiscountLevel = unlockedSkills?.['fee_discount'] || 0
        if (feeDiscountLevel > 0) {
            feeRate *= (1 - feeDiscountLevel * 0.05)
        }
        const fee = Math.floor(rawTotal * feeRate)
        const proceeds = rawTotal - fee

        const avgCost = holding.totalCost / holding.quantity
        const costBasis = avgCost * normalizedQty
        const profit = proceeds - costBasis

        const borrowedTotal = typeof holding.borrowed === 'number' ? holding.borrowed : 0
        const marginTotal = typeof holding.margin === 'number' ? holding.margin : 0
        const borrowedPerShare = holding.quantity > 0 ? borrowedTotal / holding.quantity : 0
        const marginPerShare = holding.quantity > 0 ? marginTotal / holding.quantity : 0
        const borrowedRepayment = borrowedPerShare * normalizedQty
        const marginReturn = marginPerShare * normalizedQty
        const netProceeds = proceeds - borrowedRepayment

        setCash(prev => prev + netProceeds)
        setPortfolio(prev => {
            const newQty = holding.quantity - normalizedQty
            if (newQty <= 0) {
                const { [stock.id]: _, ...rest } = prev
                return rest
            }
            return {
                ...prev,
                [stock.id]: {
                    ...holding,
                    quantity: newQty,
                    totalCost: holding.totalCost - costBasis,
                    borrowed: Math.max(0, borrowedTotal - borrowedRepayment),
                    margin: Math.max(0, marginTotal - marginReturn)
                }
            }
        })

        const trade = {
            id: generateId(),
            type: 'sell',
            stockId: stock.id,
            quantity: normalizedQty,
            price: stock.price,
            total: proceeds,
            profit,
            borrowedRepayment,
            timestamp: Date.now()
        }
        setTradeHistory(prev => [...prev, trade])
        recordTrade?.('SELL', String(stock.id), normalizedQty, { orderType: 'market' })
        setTotalTrades(prev => prev + 1)
        setDailyTrades(prev => prev + 1)
        setTotalProfit(prev => prev + profit)
        setDailyProfit(prev => prev + profit)

        if (profit > 0) {
            setWinStreak(prev => prev + 1)
            playSound?.('sell')
            showNotification(`${stock.name} ${normalizedQty}주 매도 (+${formatCompact(profit)})`, 'success')
            addActionFeedback?.(`+${formatCompact(profit)}`, 'profit', window.innerWidth / 2, window.innerHeight / 2)
        } else {
            setWinStreak(0)
            playSound?.('sell')
            showNotification(`${stock.name} ${normalizedQty}주 매도 (${formatCompact(profit)})`, 'warning')
            addActionFeedback?.(`${formatCompact(profit)}`, 'loss', window.innerWidth / 2, window.innerHeight / 2)
        }
        return true
    }, [portfolio, unlockedSkills, showNotification, playSound, setCash, setPortfolio, setTradeHistory, setTotalTrades, setDailyTrades, setTotalProfit, setDailyProfit, setWinStreak, addActionFeedback, recordTrade, formatCompact])

    // 공매도
    const handleShortSell = useCallback((stock, qty) => {
        const normalizedQty = normalizePositiveInteger(qty)
        if (!normalizedQty) {
            showNotification('유효한 수량을 입력하세요!', 'error')
            playSound?.('error')
            return false
        }

        if (!canShortSell) {
            showNotification(`공매도는 Lv.${SHORT_SELLING.minLevel} 이상 필요!`, 'error')
            playSound?.('error')
            return false
        }

        const marginRequired = stock.price * normalizedQty * SHORT_SELLING.marginRate
        if (marginRequired > cash) {
            showNotification('증거금이 부족합니다!', 'error')
            playSound?.('error')
            return false
        }

        setCash(prev => prev - marginRequired)
        setShortPositions(prev => {
                const existing = prev[stock.id]
            if (existing) {
                const totalQty = existing.quantity + normalizedQty
                const avgPrice = (existing.entryPrice * existing.quantity + stock.price * normalizedQty) / totalQty
                return {
                    ...prev,
                    [stock.id]: { ...existing, quantity: totalQty, entryPrice: avgPrice, margin: getShortPositionMargin(existing) + marginRequired, openTime: existing.openTime }
                }
            }
            return {
                ...prev,
                [stock.id]: { quantity: normalizedQty, entryPrice: stock.price, margin: marginRequired, openTime: Date.now() }
            }
        })

        const trade = { id: generateId(), type: 'short', stockId: stock.id, quantity: normalizedQty, price: stock.price, total: marginRequired, timestamp: Date.now() }
        setTradeHistory(prev => [...prev, trade])
        recordTrade?.('SHORT', String(stock.id), normalizedQty, { orderType: 'market' })
        setTotalTrades(prev => prev + 1)
        setDailyTrades(prev => prev + 1)
        playSound?.('sell')
        showNotification(`🐻 ${stock.name} ${normalizedQty}주 공매도`, 'info')
        return true
    }, [canShortSell, cash, showNotification, playSound, setCash, setShortPositions, setTradeHistory, setTotalTrades, setDailyTrades, recordTrade])

    // 공매도 청산
    const handleCoverShort = useCallback((stock, qty) => {
        const normalizedQty = normalizePositiveInteger(qty)
        if (!normalizedQty) {
            showNotification('유효한 수량을 입력하세요!', 'error')
            playSound?.('error')
            return false
        }

        const position = shortPositions[stock.id]
        if (!position || normalizedQty > position.quantity) {
            showNotification('공매도 포지션이 부족합니다!', 'error')
            playSound?.('error')
            return false
        }

        const pnl = (position.entryPrice - stock.price) * normalizedQty
        const marginTotal = getShortPositionMargin(position)
        const marginReturn = (marginTotal / position.quantity) * normalizedQty

        setCash(prev => prev + marginReturn + pnl)
        setShortPositions(prev => {
            const remainingQty = position.quantity - normalizedQty
            if (remainingQty <= 0) {
                const updated = { ...prev }
                delete updated[stock.id]
                return updated
            }
            return {
                ...prev,
                [stock.id]: { ...position, quantity: remainingQty, margin: marginTotal - marginReturn }
            }
        })

        const timestamp = Date.now()
        setTradeHistory(prev => [...prev, {
            id: `cover-${timestamp}-${stock.id}-${position.quantity}`,
            type: 'cover', stockId: stock.id, quantity: normalizedQty,
            price: stock.price, total: marginReturn + pnl, profit: pnl,
            marginReturned: marginReturn, timestamp
        }])
        setTotalTrades(prev => prev + 1)
        setDailyTrades(prev => prev + 1)
        recordTrade?.('COVER', String(stock.id), normalizedQty, { orderType: 'market' })
        setTotalProfit(prev => prev + pnl)
        setDailyProfit(prev => prev + pnl)

        if (pnl > 0) setWinStreak(prev => prev + 1)
        else setWinStreak(0)

        playSound?.('buy')
        showNotification(`🐻 ${stock.name} 청산 (${pnl >= 0 ? '+' : ''}${formatCompact(pnl)})`, pnl >= 0 ? 'success' : 'error')
        return true
    }, [shortPositions, showNotification, playSound, setCash, setShortPositions, setTradeHistory, setTotalTrades, setDailyTrades, setTotalProfit, setDailyProfit, setWinStreak, recordTrade, formatCompact])

    // 신용 거래 - 대출
    const handleBorrowCredit = useCallback((amount) => {
        const normalizedAmount = normalizePositiveInteger(amount)

        if (!canUseCredit) {
            showNotification('신용 거래는 레벨 3부터 가능합니다!', 'error')
            return false
        }

        if (!normalizedAmount) {
            showNotification('대출 금액을 입력하세요!', 'error')
            return false
        }

        if (normalizedAmount > availableCredit) {
            showNotification(`대출 한도 초과! 가용 한도: ${formatNumber(availableCredit)}원`, 'error')
            return false
        }

        const fee = Math.floor(normalizedAmount * CREDIT_TRADING.borrowFee)
        const netAmount = normalizedAmount - fee

        setCreditUsed(prev => prev + normalizedAmount)
        setCash(prev => prev + netAmount)
        showNotification(`${formatNumber(normalizedAmount)}원 대출 실행 (수수료 ${formatNumber(fee)}원)`, 'info')
        playSound?.('buy')
        return true
    }, [canUseCredit, availableCredit, showNotification, playSound, setCreditUsed, setCash, formatNumber])

    // 신용 거래 - 상환
    const handleRepayCredit = useCallback((amount) => {
        const normalizedAmount = normalizePositiveInteger(amount)

        if (creditUsed <= 0 && creditInterest <= 0) {
            showNotification('상환할 대출이 없습니다!', 'error')
            return false
        }

        if (!normalizedAmount) {
            showNotification('상환 금액을 입력하세요!', 'error')
            return false
        }

        const totalDebtNow = creditUsed + creditInterest
        const repayAmount = Math.min(normalizedAmount, totalDebtNow, cash)

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
        const leverageMultiplier = currentLeverage?.multiplier || 1
        const marginRate = leverageMultiplier > 1
            ? (currentLeverage?.marginRate ?? (1 / leverageMultiplier))
            : 1

        let feeRate = 0.0015
        const feeDiscountLevel = unlockedSkills?.['fee_discount'] || 0
        if (feeDiscountLevel > 0) {
            feeRate *= (1 - feeDiscountLevel * 0.05)
        }

        const unitCashRequired = stock.price * leverageMultiplier * (marginRate + feeRate)
        const maxQty = unitCashRequired > 0 ? Math.floor(cash / unitCashRequired) : 0
        if (maxQty > 0) {
            handleBuy(stock, maxQty)
        }
    }, [cash, currentLeverage, unlockedSkills, handleBuy])

    // 전량 매도
    const handleSellAll = useCallback((stock) => {
        const holding = portfolio[stock.id]
        if (holding?.quantity > 0) {
            handleSell(stock, holding.quantity)
        }
    }, [portfolio, handleSell])

    const handlePlaceOrder = useCallback((order) => {
        setPendingOrders(prev => [...prev, { ...order, id: generateId() }])
        showNotification(`${order.type} 주문 등록됨`, 'info')
    }, [setPendingOrders, showNotification])

    const handleCancelOrder = useCallback((order) => {
        setPendingOrders(prev => prev.filter(o => o.id !== order.id))
        showNotification('주문 취소됨', 'info')
    }, [setPendingOrders, showNotification])

    return {
        handleBuy,
        handleSell,
        handleBuyMax,
        handleSellAll,
        handleShortSell,
        handleCoverShort,
        handlePlaceOrder,
        handleCancelOrder,
        handleBorrowCredit,
        handleRepayCredit
    }
}

export default useTrading
