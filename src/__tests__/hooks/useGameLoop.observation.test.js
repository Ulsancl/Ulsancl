import { act, renderHook } from '@testing-library/react'
import { useGameLoop } from '../../hooks/useGameLoop'
import { startNewTradingDay, SECONDS_PER_DAY } from '../../engine'

let mockSettlements = []
const mockDailyInterest = jest.fn(() => 10)

jest.mock('../../engine', () => ({
    ...jest.requireActual('../../engine'),
    startNewTradingDay: jest.fn(stocks => jest.requireActual('../../engine').startNewTradingDay(stocks)),
    updateMarketState: state => state,
    generateMarketEvent: () => null,
    getActiveGlobalEvent: () => null,
    checkAlerts: () => []
}))

jest.mock('../../hooks/gameLoop', () => ({
    usePriceUpdater: () => ({ tick: stocks => stocks }),
    useNewsGenerator: () => ({ tick: (stocks, marketState) => ({ stocks, marketState }) }),
    useOrderProcessor: () => ({ tick: ({ cash, portfolio, pendingOrders }) => ({ cash, portfolio, pendingOrders }) }),
    useCreditManager: () => ({
        checkMarginCall: () => ({ marginCallActive: false }),
        processShortPositions: (_map, state) => ({ ...state, trades: mockSettlements }),
        processDailyInterest: () => mockDailyInterest()
    }),
    useDividendManager: () => ({ tick: () => 0 }),
    useCrisisManager: () => ({ tick: () => {} })
}))

function createProps() {
    const setters = Object.fromEntries([
        'Stocks', 'Cash', 'Portfolio', 'ShortPositions', 'CreditUsed', 'CreditInterest', 'MarginCallActive',
        'TradeHistory', 'PendingOrders', 'TotalTrades', 'DailyTrades', 'DailyProfit', 'TotalProfit', 'WinStreak',
        'News', 'Alerts', 'AssetHistory', 'TotalDividends', 'CurrentDay', 'MarketState', 'GameTime',
        'PriceHistory', 'PriceChanges', 'ShowSeasonEnd', 'ActiveCrisis', 'CrisisAlert', 'CrisisHistory'
    ].map(name => [`set${name}`, jest.fn()]))
    return {
        ...setters,
        stocks: [{ id: 1, name: 'A', price: 10000 }], cash: 85000, portfolio: {},
        shortPositions: { 1: { quantity: 1, entryPrice: 10000, margin: 15000 } },
        creditUsed: 0, creditInterest: 0, marginCallActive: false,
        pendingOrders: [], alerts: [], unlockedSkills: {}, gameStartTime: Date.now(), currentDay: 1, isInitialized: true,
        marketState: { trend: 0, volatility: 1, sectorTrends: {} },
        showNotification: jest.fn(), playSound: jest.fn(), formatNumber: String,
        onTick: jest.fn(), onObservation: jest.fn(), recordTrade: jest.fn()
    }
}

describe('completed tick observations and financial snapshots', () => {
    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(1000000)
        mockSettlements = []
        jest.clearAllMocks()
    })
    afterEach(() => {
        jest.useRealTimers()
        jest.restoreAllMocks()
    })

    test('observes unchanged prices once per real loop tick using the latest callback without timer churn or RNG', () => {
        const interval = jest.spyOn(global, 'setInterval')
        const random = jest.spyOn(Math, 'random')
        const props = createProps()
        const { rerender, unmount } = renderHook(next => useGameLoop(next), { initialProps: props })
        act(() => jest.advanceTimersByTime(1000))
        const secondObserver = jest.fn()
        rerender({ ...props, onObservation: secondObserver })
        act(() => jest.advanceTimersByTime(2500))
        expect(interval).toHaveBeenCalledTimes(1)
        expect(props.onTick).toHaveBeenCalledTimes(3)
        expect(props.onObservation).toHaveBeenCalledTimes(1)
        expect(secondObserver).toHaveBeenCalledTimes(2)
        const samples = [...props.onObservation.mock.calls, ...secondObserver.mock.calls].map(call => call[0])
        expect(samples.map(sample => sample.timeMs)).toEqual([1001000, 1002000, 1003000])
        samples.forEach(sample => expect(sample).toMatchObject({ stocks: props.stocks, gameDay: 1, gameTime: { day: 1 } }))
        expect(random).not.toHaveBeenCalled()
        unmount()
        act(() => jest.advanceTimersByTime(2000))
        expect(secondObserver).toHaveBeenCalledTimes(2)
    })

    test('asset history uses collateral-inclusive equity and observer errors cannot interrupt its commit', () => {
        const warning = jest.spyOn(console, 'warn').mockImplementation(() => {})
        const props = createProps()
        props.onObservation = () => { throw new Error('readout fixture failure') }
        const { unmount } = renderHook(() => useGameLoop(props))
        act(() => jest.advanceTimersByTime(1000))
        expect(props.setAssetHistory).toHaveBeenCalledTimes(1)
        expect(props.setAssetHistory.mock.calls[0][0]([])).toEqual([{ value: 100000, timestamp: 1001000, day: 1 }])
        expect(warning).toHaveBeenCalledTimes(1)
        unmount()
    })

    test('forced settlement is recorded once in local realized statistics without a synthetic server action', () => {
        mockSettlements = [{ type: 'cover', stockId: 1, quantity: 1, price: 18000, total: 7000, profit: -8000, marginReturned: 15000, reason: 'short-liquidation' }]
        const props = createProps()
        const { unmount } = renderHook(() => useGameLoop(props))
        act(() => jest.advanceTimersByTime(1000))
        expect(props.setTradeHistory).toHaveBeenCalledTimes(1)
        expect(props.setTradeHistory.mock.calls[0][0]([])).toEqual([{
            ...mockSettlements[0], id: 'liquidation-1001000-cover-1', timestamp: 1001000
        }])
        expect(props.setTotalTrades.mock.calls[0][0](4)).toBe(5)
        expect(props.setDailyTrades.mock.calls[0][0](2)).toBe(3)
        expect(props.setTotalProfit.mock.calls[0][0](1000)).toBe(-7000)
        expect(props.setDailyProfit.mock.calls[0][0](2000)).toBe(-6000)
        expect(props.setWinStreak.mock.calls[0][0](4)).toBe(0)
        expect(props.recordTrade).not.toHaveBeenCalled()
        unmount()
    })

    test('waits for restore and preserves same-day statistics, prices and interest before processing the next day once', () => {
        const props = { ...createProps(), isInitialized: false }
        const { rerender, unmount } = renderHook(next => useGameLoop(next), { initialProps: props })
        act(() => jest.advanceTimersByTime(2000))
        expect(props.onTick).not.toHaveBeenCalled()
        expect(props.setAssetHistory).not.toHaveBeenCalled()
        const restored = { ...props, isInitialized: true, currentDay: 2, gameStartTime: Date.now() - 310000 }
        rerender(restored)
        act(() => jest.advanceTimersByTime(1000))
        expect(props.onObservation).toHaveBeenCalledTimes(1)
        expect(props.onObservation.mock.calls[0][0].gameDay).toBe(2)
        expect(startNewTradingDay).not.toHaveBeenCalled()
        expect(props.setDailyTrades).not.toHaveBeenCalled()
        expect(props.setDailyProfit).not.toHaveBeenCalled()
        expect(mockDailyInterest).not.toHaveBeenCalled()
        act(() => {
            jest.setSystemTime(restored.gameStartTime + 2 * SECONDS_PER_DAY * 1000 - 1000)
            jest.advanceTimersByTime(1000)
        })
        expect(startNewTradingDay).toHaveBeenCalledTimes(1)
        expect(props.setDailyTrades).toHaveBeenCalledWith(0)
        expect(props.setDailyProfit).toHaveBeenCalledWith(0)
        expect(props.setCurrentDay).toHaveBeenCalledWith(3)
        expect(props.setCreditInterest).toHaveBeenCalledWith(10)
        rerender({ ...restored, currentDay: 3, creditInterest: 10 })
        act(() => jest.advanceTimersByTime(2000))
        expect(mockDailyInterest).toHaveBeenCalledTimes(1)
        unmount()
    })

    test('an offline gap keeps the existing one-transition policy and a new session processes day two again', () => {
        const props = { ...createProps(), currentDay: 2, gameStartTime: Date.now() - 4 * SECONDS_PER_DAY * 1000 }
        const { rerender, unmount } = renderHook(next => useGameLoop(next), { initialProps: props })
        act(() => jest.advanceTimersByTime(2000))
        expect(props.setCurrentDay).toHaveBeenCalledTimes(1)
        expect(props.setCurrentDay).toHaveBeenCalledWith(5)
        expect(mockDailyInterest).toHaveBeenCalledTimes(1)
        const reset = { ...props, currentDay: 1, gameStartTime: Date.now() }
        rerender(reset)
        act(() => jest.advanceTimersByTime(1000))
        expect(mockDailyInterest).toHaveBeenCalledTimes(1)
        act(() => {
            jest.setSystemTime(reset.gameStartTime + SECONDS_PER_DAY * 1000 - 1000)
            jest.advanceTimersByTime(1000)
        })
        expect(props.setCurrentDay).toHaveBeenLastCalledWith(2)
        expect(mockDailyInterest).toHaveBeenCalledTimes(2)
        expect(startNewTradingDay).toHaveBeenCalledTimes(2)
        unmount()
    })

    test('the first model year can finish once and a reset re-arms its season notification', () => {
        const endOffset = (364 * SECONDS_PER_DAY + 294) * 1000
        const props = { ...createProps(), currentDay: 365, gameStartTime: Date.now() - endOffset }
        const { rerender, unmount } = renderHook(next => useGameLoop(next), { initialProps: props })
        act(() => jest.advanceTimersByTime(2000))
        expect(props.setShowSeasonEnd).toHaveBeenCalledTimes(1)
        const reset = { ...props, currentDay: 1, gameStartTime: Date.now() }
        rerender(reset)
        act(() => jest.advanceTimersByTime(1000))
        expect(props.setShowSeasonEnd).toHaveBeenCalledTimes(1)
        act(() => {
            jest.setSystemTime(reset.gameStartTime + endOffset)
            jest.advanceTimersByTime(2000)
        })
        expect(props.setShowSeasonEnd).toHaveBeenCalledTimes(2)
        unmount()
    })
})
