import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { calculateGameDate } from '../engine/marketState'

export const MAX_MARKET_OBSERVATIONS = 4096

// This is a bounded observation of prices the existing game actually produced.
// It never consumes randomness, changes the market clock or reconstructs a past.
export function useMarketObservations({ stocks, gameStartTime, isInitialized }) {
  const [observations, setObservations] = useState({})
  const latestStocks = useRef(stocks)
  const session = useRef({ ready: false, sequence: 0 })
  useLayoutEffect(() => { latestStocks.current = stocks }, [stocks])
  useLayoutEffect(() => {
    session.current = { ready: Boolean(isInitialized), sequence: 0 }
    if (!isInitialized) { setObservations({}); return }
    const timeMs = Date.now(), time = calculateGameDate(gameStartTime, timeMs)
    const initial = {}
    for (const stock of latestStocks.current) if (Number.isFinite(stock.price) && stock.price >= 0) {
      initial[stock.id] = [{ sequence: 0, timeMs, gameDay: time.day, gameMinute: time.hour * 60 + time.minute, price: stock.price }]
    }
    setObservations(initial)
  }, [gameStartTime, isInitialized])

  const recordObservation = useCallback(({ stocks: nextStocks, timeMs, gameDay, gameTime }) => {
    if (!session.current.ready) return
    const sequence = ++session.current.sequence
    setObservations(previous => {
      const next = { ...previous }
      for (const stock of nextStocks) if (Number.isFinite(stock.price) && stock.price >= 0) {
        const prior = previous[stock.id] || []
        next[stock.id] = [...prior.slice(-(MAX_MARKET_OBSERVATIONS - 1)), {
          sequence, timeMs, gameDay, gameMinute: gameTime.hour * 60 + gameTime.minute, price: stock.price
        }]
      }
      return next
    })
  }, [])
  return { observations, recordObservation }
}
