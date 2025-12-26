import { useMemo } from 'react'
import {
  CREDIT_TRADING,
  LEVERAGE_OPTIONS,
  LEVELS,
  SHORT_SELLING,
  SKILLS
} from '../constants'
import { calculateLevel } from '../utils'

export const useGameCalculations = ({
  stocks,
  portfolio,
  shortPositions,
  cash,
  creditUsed,
  creditInterest,
  leverage,
  totalXp,
  unlockedSkills,
  initialCapital
}) => {
  const stocksById = useMemo(() => new Map(stocks.map(stock => [stock.id, stock])), [stocks])

  const levelInfo = useMemo(() => calculateLevel(totalXp, LEVELS), [totalXp])
  const canShortSell = levelInfo.level >= SHORT_SELLING.minLevel
  const canUseCredit = levelInfo.level >= CREDIT_TRADING.minLevel

  const stockValue = useMemo(() => {
    if (!portfolio) return 0
    return Object.entries(portfolio).reduce((total, [stockId, holding]) => {
      const stock = stocksById.get(parseInt(stockId))
      const val = stock ? stock.price * holding.quantity : 0
      return total + (isNaN(val) ? 0 : val)
    }, 0)
  }, [portfolio, stocksById])

  const shortValue = useMemo(() => {
    if (!shortPositions) return 0
    return Object.entries(shortPositions).reduce((total, [stockId, position]) => {
      const stock = stocksById.get(parseInt(stockId))
      if (!stock) return total
      const pnl = (position.entryPrice - stock.price) * position.quantity
      return total + (isNaN(pnl) ? 0 : pnl)
    }, 0)
  }, [shortPositions, stocksById])

  const leverageDebt = useMemo(() => {
    if (!portfolio) return 0
    return Object.values(portfolio).reduce((total, holding) => {
      const borrowed = typeof holding.borrowed === 'number' ? holding.borrowed : 0
      return total + (isNaN(borrowed) ? 0 : borrowed)
    }, 0)
  }, [portfolio])

  const safeCash = isNaN(cash) ? 0 : cash
  const safeCreditUsed = isNaN(creditUsed) ? 0 : creditUsed
  const safeCreditInterest = isNaN(creditInterest) ? 0 : creditInterest

  const grossAssets = safeCash + stockValue + shortValue
  const totalAssets = grossAssets - safeCreditUsed - safeCreditInterest - leverageDebt
  const profitRate = initialCapital > 0 ? ((totalAssets - initialCapital) / initialCapital) * 100 : 0
  const currentLeverage = LEVERAGE_OPTIONS.find(l => l.id === leverage) || LEVERAGE_OPTIONS[0]

  const marginRatio = safeCreditUsed > 0 ? (grossAssets / safeCreditUsed) : Infinity
  const creditLimitRatio = CREDIT_TRADING.creditLimit[`level${Math.min(levelInfo?.level || 1, 6)}`] || 0
  const maxCreditLimit = Math.floor(grossAssets * creditLimitRatio)
  const availableCredit = Math.max(0, maxCreditLimit - safeCreditUsed)
  const totalDebt = safeCreditUsed + safeCreditInterest + leverageDebt

  const availableSkillPoints = useMemo(() => {
    const totalPoints = Math.max(0, levelInfo.level - 1)
    const spentPoints = Object.entries(unlockedSkills).reduce((sum, [id, level]) => {
      let cost = 1
      Object.values(SKILLS).forEach(tier => {
        const found = tier.find(s => s.id === id)
        if (found) cost = found.cost
      })
      return sum + (cost * level)
    }, 0)
    return totalPoints - spentPoints
  }, [levelInfo.level, unlockedSkills])

  return {
    stocksById,
    levelInfo,
    canShortSell,
    canUseCredit,
    stockValue,
    shortValue,
    safeCash,
    safeCreditUsed,
    safeCreditInterest,
    grossAssets,
    totalAssets,
    profitRate,
    currentLeverage,
    marginRatio,
    creditLimitRatio,
    maxCreditLimit,
    availableCredit,
    totalDebt,
    leverageDebt,
    availableSkillPoints
  }
}

export default useGameCalculations
