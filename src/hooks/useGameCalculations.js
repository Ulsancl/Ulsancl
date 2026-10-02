import { useMemo } from 'react'
import {
  CREDIT_TRADING,
  LEVERAGE_OPTIONS,
  LEVELS,
  SHORT_SELLING,
  SKILLS
} from '../constants'
import { calculateLevel } from '../utils'
import { calculateAssets } from '../utils/calculations'

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

  const assets = useMemo(() => calculateAssets({
    cash, portfolio, shortPositions, stockMap: stocksById,
    creditUsed, creditInterest, levelInfo, initialCapital
  }), [cash, portfolio, shortPositions, stocksById, creditUsed, creditInterest, levelInfo, initialCapital])
  const currentLeverage = LEVERAGE_OPTIONS.find(l => l.id === leverage) || LEVERAGE_OPTIONS[0]

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
    ...assets,
    currentLeverage,
    availableSkillPoints
  }
}

export default useGameCalculations
