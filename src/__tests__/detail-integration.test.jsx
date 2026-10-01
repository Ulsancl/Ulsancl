import { act, renderHook } from '@testing-library/react'
import { buildIllustrativeOrderBook } from '../components/OrderBook'
import { useMarketObservations, MAX_MARKET_OBSERVATIONS } from '../hooks/useMarketObservations'
import { useGameState } from '../hooks/useGameState'
import { getTickSize } from '../engine/priceCalculator'

describe('observed market history', () => {
    const stocks = [{ id: 'coin', price: .015 }]
    const props = { stocks, gameStartTime: 1000, isInitialized: true }
    const tick = (price, n) => ({ stocks: [{ id: 'coin', price }], timeMs: 2000 + n, gameDay: 1, gameTime: { hour: 9, minute: 0 } })
    test('waits for loaded data and records unchanged prices without random draws', () => {
        const { result, rerender } = renderHook(useMarketObservations, { initialProps: { ...props, isInitialized: false } })
        act(() => result.current.recordObservation(tick(.015, 0)))
        expect(result.current.observations).toEqual({})
        rerender(props)
        const random = jest.spyOn(Math, 'random')
        act(() => result.current.recordObservation(tick(.015, 1)))
        expect(result.current.observations.coin.map(p => p.price)).toEqual([.015, .015])
        expect(result.current.observations.coin.map(p => p.sequence)).toEqual([0, 1])
        expect(random).not.toHaveBeenCalled()
        random.mockRestore()
    })
    test('caps history without changing retained sequence IDs or past values', () => {
        const { result } = renderHook(useMarketObservations, { initialProps: props })
        const initial = result.current.observations.coin
        act(() => {
            for (let n = 1; n <= MAX_MARKET_OBSERVATIONS + 5; n++) result.current.recordObservation(tick(n, n))
        })
        expect(initial).toHaveLength(1)
        expect(initial[0].price).toBe(.015)
        expect(result.current.observations.coin).toHaveLength(MAX_MARKET_OBSERVATIONS)
        expect(result.current.observations.coin[0].sequence).toBe(6)
        expect(result.current.observations.coin.at(-1).price).toBe(MAX_MARKET_OBSERVATIONS + 5)
    })
    test('new season starts with current observed snapshot instead of generated history', () => {
        const { result, rerender } = renderHook(useMarketObservations, { initialProps: props })
        act(() => result.current.recordObservation(tick(.03, 1)))
        rerender({ ...props, gameStartTime: 5000, stocks: [{ id: 'coin', price: .02 }] })
        expect(result.current.observations.coin).toHaveLength(1)
        expect(result.current.observations.coin[0]).toMatchObject({ sequence: 0, price: .02 })
    })
})

describe('illustrative order depth', () => {
    test.each([['stock', 4995], ['stock', 5000], ['stock', 49950], ['stock', 50000], ['crypto', 9.99], ['commodity', 9995]])('each %s level uses its own price-band tick at %s', (type, price) => {
        const { asks, bids } = buildIllustrativeOrderBook({ id: 1, type }, price)
        for (const level of [...asks, ...bids]) {
            const ticks = level.price / getTickSize(level.price, type)
            expect(ticks).toBeCloseTo(Math.round(ticks), 7)
        }
    })
    test.each([['crypto', .015, .02, .01], ['stock', 50001, 50100, 50000], ['bond', 99000, 99010, 98990], ['commodity', 10005, 10010, 10000]])(
        '%s shows strictly separated positive levels around %s', (type, price, ask, bid) => {
            const book = buildIllustrativeOrderBook({ id: 'example', type }, price)
            expect(book.asks.at(-1).price).toBe(ask)
            expect(book.bids[0].price).toBe(bid)
            expect(book.asks.every(p => p.price > price)).toBe(true)
            expect(book.bids.every(p => p.price > 0 && p.price < price)).toBe(true)
            expect(new Set(book.asks.map(p => p.price)).size).toBe(book.asks.length)
            expect(new Set(book.bids.map(p => p.price)).size).toBe(book.bids.length)
        })
    test('minimum coin has no negative bid and repeated display has no random consumption', () => {
        const random = jest.spyOn(Math, 'random')
        const stock = { id: 4, type: 'crypto' }
        const book = buildIllustrativeOrderBook(stock, .01)
        expect(book.bids).toEqual([])
        expect(buildIllustrativeOrderBook(stock, .01)).toEqual(book)
        expect(random).not.toHaveBeenCalled()
        random.mockRestore()
    })
})

test('saved daily settlement counts and profit survive load and next save', () => {
    const values = new Map([['stockTradingGame', JSON.stringify({ version: 4, totalTrades: 3, dailyTrades: 2, dailyProfit: -450 })]])
    Object.defineProperty(window, 'localStorage', { configurable: true, writable: true, value: {
        getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key)
    } })
    const products = [{ id: 1, price: 100 }]
    const { result } = renderHook(() => useGameState(products))
    expect(result.current.dailyTrades).toBe(2)
    expect(result.current.dailyProfit).toBe(-450)
    act(() => result.current.saveGameState())
    expect(JSON.parse(values.get('stockTradingGame'))).toMatchObject({ dailyTrades: 2, dailyProfit: -450 })
})
