import { renderHook } from '@testing-library/react'
import { useGameLoop } from '../../hooks/useGameLoop'

const createProps = () => ({
    stocks: [{ id: 1, name: 'A', code: 'AAA', price: 1000, dailyOpen: 1000, dailyHigh: 1000, dailyLow: 1000 }],
    setStocks: jest.fn(),
    cash: 1_000_000,
    setCash: jest.fn(),
    portfolio: {},
    setPortfolio: jest.fn(),
    shortPositions: {},
    setShortPositions: jest.fn(),
    creditUsed: 0,
    setCreditUsed: jest.fn(),
    creditInterest: 0,
    setCreditInterest: jest.fn(),
    marginCallActive: false,
    setMarginCallActive: jest.fn(),
    setTradeHistory: jest.fn(),
    pendingOrders: [],
    setPendingOrders: jest.fn(),
    setTotalTrades: jest.fn(),
    setDailyTrades: jest.fn(),
    setDailyProfit: jest.fn(),
    setTotalProfit: jest.fn(),
    setWinStreak: jest.fn(),
    setNews: jest.fn(),
    alerts: [],
    setAlerts: jest.fn(),
    setAssetHistory: jest.fn(),
    setTotalDividends: jest.fn(),
    unlockedSkills: {},
    gameStartTime: Date.now(),
    setCurrentDay: jest.fn(),
    marketState: { trend: 0, volatility: 1, sectorTrends: {} },
    setMarketState: jest.fn(),
    setGameTime: jest.fn(),
    setPriceHistory: jest.fn(),
    setPriceChanges: jest.fn(),
    setShowSeasonEnd: jest.fn(),
    setActiveCrisis: jest.fn(),
    setCrisisAlert: jest.fn(),
    setCrisisHistory: jest.fn(),
    showNotification: jest.fn(),
    playSound: jest.fn(),
    formatNumber: (value) => String(value),
    onTick: jest.fn(),
    recordTrade: jest.fn(),
    updateInterval: 1000
})

describe('useGameLoop interval stability', () => {
    beforeEach(() => {
        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.useRealTimers()
        jest.restoreAllMocks()
    })

    test('does not recreate interval on non-dependency rerenders', () => {
        const setIntervalSpy = jest.spyOn(global, 'setInterval')
        const clearIntervalSpy = jest.spyOn(global, 'clearInterval')
        const props = createProps()

        const { rerender, unmount } = renderHook((nextProps) => useGameLoop(nextProps), {
            initialProps: props
        })

        expect(setIntervalSpy).toHaveBeenCalledTimes(1)
        expect(clearIntervalSpy).toHaveBeenCalledTimes(0)

        rerender({ ...props, cash: props.cash + 5000 })
        rerender({ ...props, stocks: [...props.stocks] })
        rerender({ ...props, portfolio: { 1: { quantity: 1, totalCost: 1000 } } })

        expect(setIntervalSpy).toHaveBeenCalledTimes(1)
        expect(clearIntervalSpy).toHaveBeenCalledTimes(0)

        unmount()

        expect(clearIntervalSpy).toHaveBeenCalledTimes(1)
    })
})
