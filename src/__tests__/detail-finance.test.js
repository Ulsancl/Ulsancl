import { useMemo, useState } from 'react'
import { act, renderHook } from '@testing-library/react'
import { calculateAssets, calculateShortMargin, calculateShortValue, getShortPositionMargin } from '../utils/calculations'
import { useTrading } from '../hooks/useTrading'
import { useGameCalculations } from '../hooks/useGameCalculations'
import { useCreditManager } from '../hooks/gameLoop/useCreditManager'
import { processOrders } from '../engine/tradingSystem'
import { SHORT_SELLING } from '../constants'

const stock = (price = 10000) => ({ id: 1, name: 'Fixture', type: 'stock', price })
const baseState = () => ({
    cash: 100000, portfolio: {}, shortPositions: {}, creditUsed: 0, creditInterest: 0,
    tradeHistory: [], pendingOrders: [], totalTrades: 0, dailyTrades: 0,
    totalProfit: 0, dailyProfit: 0, winStreak: 0
})

function useLedgerFixture(options = {}) {
    const [state, setState] = useState(() => ({ ...baseState(), ...options.initial }))
    const setters = useMemo(() => Object.fromEntries(Object.keys(baseState()).map(key => [
        `set${key[0].toUpperCase()}${key.slice(1)}`,
        value => setState(previous => ({ ...previous, [key]: typeof value === 'function' ? value(previous[key]) : value }))
    ])), [])
    const trading = useTrading({
        ...state, ...setters, unlockedSkills: options.skills || {},
        currentLeverage: options.leverage || { multiplier: 1, marginRate: 1 },
        canShortSell: true, canUseCredit: true, availableCredit: 100000,
        showNotification: () => {}, formatNumber: String, formatCompact: String,
        recordTrade: options.recordTrade
    })
    return { state, trading }
}

const freeze = value => {
    Object.values(value).forEach(child => { if (child && typeof child === 'object') freeze(child) })
    return Object.freeze(value)
}

describe('detail financial ledger', () => {
    test('keeps P/L, reserved collateral and short equity distinct without mutating inputs', () => {
        const positions = freeze({ 1: { quantity: 2, entryPrice: 10000, margin: 30000 } })
        const stocks = freeze([stock(12000)])
        const inputs = freeze({ cash: 70000, portfolio: {}, shortPositions: positions, stocks })
        const assets = calculateAssets(inputs)
        expect(calculateShortValue(positions, stocks)).toBe(-4000)
        expect(calculateShortMargin(positions)).toBe(30000)
        expect(assets).toMatchObject({ shortValue: -4000, shortMargin: 30000, shortEquity: 26000, totalAssets: 96000 })
        expect(calculateAssets({ ...inputs, stockMap: new Map(stocks.map(s => [s.id, s])) })).toEqual(assets)
        expect(getShortPositionMargin({ quantity: 2, entryPrice: 10000 })).toBe(30000)
        expect(getShortPositionMargin({ quantity: 2, entryPrice: 10000, margin: 0 })).toBe(0)
        expect(getShortPositionMargin({ quantity: 2, entryPrice: NaN })).toBe(0)
    })

    test.each([8000, 10000, 13000, 26000])('partial/full cover preserves marked equity at price %i', price => {
        const recordTrade = jest.fn()
        const { result } = renderHook(() => useLedgerFixture({ recordTrade }))
        act(() => result.current.trading.handleShortSell(stock(), 4))
        expect(result.current.state.cash).toBe(40000)
        expect(calculateAssets({ ...result.current.state, stocks: [stock()] }).totalAssets).toBe(100000)

        const expectedProfit = (10000 - price) * 4
        const marked = () => calculateAssets({ ...result.current.state, stocks: [stock(price)] }).totalAssets
        expect(marked()).toBe(100000 + expectedProfit)
        act(() => result.current.trading.handleCoverShort(stock(price), 2))
        expect(result.current.state.cash).toBe(70000 + expectedProfit / 2)
        expect(result.current.state.shortPositions[1]).toMatchObject({ quantity: 2, margin: 30000 })
        expect(marked()).toBe(100000 + expectedProfit)
        act(() => result.current.trading.handleCoverShort(stock(price), 2))
        expect(result.current.state.shortPositions).toEqual({})
        expect(result.current.state.cash).toBe(100000 + expectedProfit)
        expect(result.current.state).toMatchObject({ totalTrades: 3, dailyTrades: 3, totalProfit: expectedProfit, dailyProfit: expectedProfit })
        expect(result.current.state.tradeHistory.map(t => t.type)).toEqual(['short', 'cover', 'cover'])
        for (const trade of result.current.state.tradeHistory.slice(1)) {
            expect(trade).toMatchObject({ quantity: 2, price, total: 30000 + expectedProfit / 2, profit: expectedProfit / 2, marginReturned: 30000 })
        }
        expect(recordTrade.mock.calls).toEqual([
            ['SHORT', '1', 4, { orderType: 'market' }],
            ['COVER', '1', 2, { orderType: 'market' }],
            ['COVER', '1', 2, { orderType: 'market' }]
        ])
    })

    test('weighted short additions and partial cover release the actual proportional deposit', () => {
        const { result } = renderHook(() => useLedgerFixture())
        act(() => result.current.trading.handleShortSell(stock(10000), 2))
        act(() => result.current.trading.handleShortSell(stock(12000), 2))
        expect(result.current.state.shortPositions[1]).toMatchObject({ quantity: 4, entryPrice: 11000, margin: 66000 })
        act(() => result.current.trading.handleCoverShort(stock(9000), 1))
        expect(result.current.state.cash).toBe(52500)
        expect(result.current.state.shortPositions[1]).toMatchObject({ quantity: 3, entryPrice: 11000, margin: 49500 })
        expect(calculateAssets({ ...result.current.state, stocks: [stock(9000)] }).totalAssets).toBe(108000)
    })

    test('manual leveraged buy and partial sell retain exact cash, fee-inclusive cost and debt', () => {
        const { result } = renderHook(() => useLedgerFixture({ leverage: { multiplier: 2, marginRate: 0.5 } }))
        act(() => result.current.trading.handleBuy(stock(), 2))
        expect(result.current.state.cash).toBe(79940)
        expect(result.current.state.portfolio[1]).toMatchObject({ quantity: 4, totalCost: 40060, borrowed: 20000, margin: 20000 })
        act(() => result.current.trading.handleSell(stock(12000), 1))
        expect(result.current.state.cash).toBe(86922)
        expect(result.current.state.portfolio[1]).toMatchObject({ quantity: 3, totalCost: 30045, borrowed: 15000, margin: 15000 })
        expect(result.current.state.totalProfit).toBe(1967)
        expect(calculateAssets({ ...result.current.state, stocks: [stock(12000)] }).totalAssets).toBe(107922)
    })

    test('UI calculation hook uses the canonical collateral equation and custom starting capital', () => {
        const input = { stocks: [stock()], portfolio: {}, shortPositions: { 1: { quantity: 1, entryPrice: 11000, margin: 16500 } },
            cash: 83500, creditUsed: 3000, creditInterest: 50, leverage: '1x', totalXp: 0, unlockedSkills: {}, initialCapital: 100000 }
        const { result } = renderHook(() => useGameCalculations(input))
        expect(result.current).toMatchObject({ shortValue: 1000, shortMargin: 16500, shortEquity: 17500, totalAssets: 97950 })
        expect(result.current.profitRate).toBeCloseTo(-2.05, 12)
    })

    test('limit buys and partial/full limit sells preserve leveraged holding metadata and repay debt', () => {
        const original = freeze({ 1: { quantity: 4, totalCost: 40060, borrowed: 20000, margin: 20000, leverage: 2, firstBuyTime: 123 } })
        const buy = processOrders([{ id: 'buy', type: 'limit', side: 'buy', stockId: 1, targetPrice: 10000, quantity: 2 }], [stock()], 79940, original, { feeRate: 0.0015 })
        expect(buy.cash).toBe(59910)
        expect(buy.portfolio[1]).toEqual({ quantity: 6, totalCost: 60090, borrowed: 20000, margin: 40000, leverage: 2, firstBuyTime: 123 })
        const orders = [{ id: 'sell', type: 'limit', side: 'sell', stockId: 1, targetPrice: 12000, quantity: 3 }]
        const partial = processOrders(orders, [stock(12000)], buy.cash, freeze(buy.portfolio), { feeRate: 0.0015 })
        expect(partial.cash).toBe(85856)
        expect(partial.portfolio[1]).toEqual({ quantity: 3, totalCost: 30045, borrowed: 10000, margin: 20000, leverage: 2, firstBuyTime: 123 })
        expect(partial.executedOrders[0]).toMatchObject({ price: 12000, fee: 54, total: 35946, profit: 5901, borrowedRepayment: 10000 })
        const full = processOrders(orders, [stock(12000)], partial.cash, partial.portfolio, { feeRate: 0.0015 })
        expect(full.portfolio).toEqual({})
        expect(full.cash).toBe(111802)
        expect(original[1].borrowed).toBe(20000)
    })

    test('credit margin calculation counts reserved short collateral without changing thresholds', () => {
        const props = { cash: 0, portfolio: {}, creditUsed: 100000, creditInterest: 0, marginCallActive: false,
            shortPositions: { 1: { quantity: 10, entryPrice: 10000, margin: 150000 } }, showNotification: jest.fn(), playSound: jest.fn(), formatNumber: String }
        const { result } = renderHook(() => useCreditManager(props))
        expect(result.current.checkMarginCall(new Map([[1, stock()]]))).toEqual({ marginCallActive: false })
        expect(props.showNotification).not.toHaveBeenCalled()
    })

    test('credit liquidation repays attached leverage principal, preserving net assets less existing haircut', () => {
        const portfolio = freeze({ 1: { quantity: 4, totalCost: 40060, borrowed: 20000, margin: 20000 } })
        const props = { cash: 0, portfolio, creditUsed: 1000000, creditInterest: 0, marginCallActive: false,
            shortPositions: {}, showNotification: jest.fn(), playSound: jest.fn(), formatNumber: String }
        const { result } = renderHook(() => useCreditManager(props))
        const liquidation = result.current.checkMarginCall(new Map([[1, stock()]]))
        expect(liquidation).toMatchObject({ forceLiquidation: true, cash: 0, portfolio: {}, creditUsed: 982000 })
        expect(liquidation.trades).toEqual([{ type: 'sell', stockId: 1, quantity: 4, price: 10000, total: 38000, profit: -2060, borrowedRepayment: 20000, reason: 'credit-liquidation' }])
        const before = calculateAssets({ ...props, stocks: [stock()] }).totalAssets
        const after = calculateAssets({ ...props, ...liquidation, stocks: [stock()] }).totalAssets
        expect(after - before).toBe(-2000)
    })

    test('forced short cover only loses tick interest at settlement and retains unknown-price collateral', () => {
        const positions = freeze({ 1: { quantity: 2, entryPrice: 10000, margin: 30000 }, 99: { quantity: 1, entryPrice: 5, margin: 7.5 } })
        const props = { cash: 70000, portfolio: {}, shortPositions: positions, creditUsed: 0, creditInterest: 0,
            showNotification: jest.fn(), playSound: jest.fn(), formatNumber: String }
        const { result } = renderHook(() => useCreditManager(props))
        const liquidation = result.current.processShortPositions(new Map([[1, stock(18000)]]))
        expect(liquidation.cash).toBeCloseTo(84000 - 18000 * 2 * SHORT_SELLING.interestRate, 9)
        expect(liquidation.shortPositions).toEqual({ 99: positions[99] })
        expect(liquidation.trades[0]).toMatchObject({ type: 'cover', quantity: 2, price: 18000, total: 14000, profit: -16000, marginReturned: 30000, reason: 'short-liquidation' })
        expect(positions[1].quantity).toBe(2)
    })
})
