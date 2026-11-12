import { processOrders } from '../../engine/tradingSystem'

const stock = { id: 1, price: 100, type: 'stock' }
const order = { id: 'bad-order', stockId: 1, type: 'market', side: 'buy', quantity: 1 }

describe('untrusted pending orders', () => {
    test.each([0, -1, 1.5, NaN, Infinity, '10', null])('rejects invalid quantity %s without changing assets', quantity => {
        const invalid = { ...order, quantity }
        const result = processOrders([invalid], [stock], 1000, {})
        expect(result.executedOrders).toEqual([])
        expect(result.remainingOrders).toEqual([invalid])
        expect(result.cash).toBe(1000)
        expect(result.portfolio).toEqual({})
    })
    test.each([0, -1, NaN, Infinity])('rejects invalid market price %s', price => {
        const result = processOrders([order], [{ ...stock, price }], 1000, {})
        expect(result.executedOrders).toEqual([])
        expect(result.cash).toBe(1000)
    })
    test.each([-0.1, NaN, Infinity, '0.1'])('rejects invalid fee rate %s', feeRate => {
        const result = processOrders([order], [stock], 1000, {}, { feeRate })
        expect(result.executedOrders).toEqual([])
        expect(result.cash).toBe(1000)
    })
    test('preserves malformed rows and continues valid orders', () => {
        const result = processOrders([null, order], [stock], 1000, {})
        expect(result.remainingOrders).toEqual([null])
        expect(result.executedOrders).toHaveLength(1)
        expect(result.cash).toBeLessThan(1000)
    })
    test('does not use infinite target prices to trigger orders', () => {
        const invalid = { ...order, type: 'limit', targetPrice: Infinity }
        const result = processOrders([invalid], [stock], 1000, {})
        expect(result.executedOrders).toEqual([])
        expect(result.cash).toBe(1000)
    })
    test.each(['borrowed', 'margin'])('rejects negative holding %s', field => {
        const holding = { quantity: 1, totalCost: 100, [field]: -100 }
        const result = processOrders([{ ...order, side: 'sell' }], [stock], 1000, { 1: holding })
        expect(result.executedOrders).toEqual([])
        expect(result.cash).toBe(1000)
        expect(result.portfolio[1]).toEqual(holding)
    })
    test('does not overflow cash when selling a very large holding', () => {
        const result = processOrders([{ ...order, side: 'sell' }], [{ ...stock, price: 1e308 }], 1e308, {
            1: { quantity: 1, totalCost: 100 }
        })
        expect(result.executedOrders).toEqual([])
        expect(result.cash).toBe(1e308)
    })

})

