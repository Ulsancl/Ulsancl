import { renderHook, act } from '@testing-library/react'
import { useTrading } from '../../hooks/useTrading'

const createBaseProps = (overrides = {}) => {
    const defaultSetters = {
        setCash: jest.fn(),
        setPortfolio: jest.fn(),
        setShortPositions: jest.fn(),
        setCreditUsed: jest.fn(),
        setCreditInterest: jest.fn(),
        setTradeHistory: jest.fn(),
        setTotalTrades: jest.fn(),
        setDailyTrades: jest.fn(),
        setDailyProfit: jest.fn(),
        setTotalProfit: jest.fn(),
        setWinStreak: jest.fn(),
        setPendingOrders: jest.fn(),
    }

    return {
        cash: 1_000_000,
        portfolio: {},
        shortPositions: {},
        creditUsed: 0,
        creditInterest: 0,
        unlockedSkills: {},
        currentLeverage: { multiplier: 1, marginRate: 1 },
        canUseCredit: true,
        canShortSell: true,
        availableCredit: 500_000,
        showNotification: jest.fn(),
        playSound: jest.fn(),
        addActionFeedback: jest.fn(),
        recordTrade: jest.fn(),
        formatNumber: (num) => `${num}`,
        formatCompact: (num) => `${num}`,
        ...defaultSetters,
        ...overrides
    }
}

describe('useTrading input guards', () => {
    test('ignores invalid buy quantity without changing state', () => {
        const props = createBaseProps()
        const stock = { id: 1, name: '테스트', price: 10000 }
        const { result } = renderHook(() => useTrading(props))

        let handled
        act(() => {
            handled = result.current.handleBuy(stock, 1.5)
        })

        expect(handled).toBe(false)
        expect(props.setCash).not.toHaveBeenCalled()
        expect(props.setPortfolio).not.toHaveBeenCalled()
        expect(props.setTradeHistory).not.toHaveBeenCalled()
        expect(props.recordTrade).not.toHaveBeenCalled()
        expect(props.showNotification).toHaveBeenCalled()
    })

    test('processes valid buy and records trade', () => {
        const props = createBaseProps()
        const stock = { id: 7, name: '샘플', price: 25000 }
        const { result } = renderHook(() => useTrading(props))

        let handled
        act(() => {
            handled = result.current.handleBuy(stock, 2)
        })

        expect(handled).toBe(true)
        expect(props.setCash).toHaveBeenCalledTimes(1)
        expect(props.setPortfolio).toHaveBeenCalledTimes(1)
        expect(props.setTradeHistory).toHaveBeenCalledTimes(1)
        expect(props.recordTrade).toHaveBeenCalledWith('BUY', '7', 2, { orderType: 'market' })

        const cashUpdater = props.setCash.mock.calls[0][0]
        expect(cashUpdater(1_000_000)).toBeLessThan(1_000_000)

        const portfolioUpdater = props.setPortfolio.mock.calls[0][0]
        const nextPortfolio = portfolioUpdater({})
        expect(nextPortfolio[7].quantity).toBe(2)
    })

    test('ignores invalid credit borrow amount', () => {
        const props = createBaseProps()
        const { result } = renderHook(() => useTrading(props))

        let handled
        act(() => {
            handled = result.current.handleBorrowCredit(0)
        })

        expect(handled).toBe(false)
        expect(props.setCreditUsed).not.toHaveBeenCalled()
        expect(props.setCash).not.toHaveBeenCalled()
        expect(props.showNotification).toHaveBeenCalled()
    })
})
