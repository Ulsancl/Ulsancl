/**
 * Determinism Tests for RNG and Game Engine
 * Verifies that game results are reproducible with the same seed
 */

import { createRng, validateDeterminism, generateSeed } from '../../engine/rng'
import { calculatePriceChange, VOLATILITY_CONFIG } from '../../engine/priceCalculator'
import { updateMarketState } from '../../engine/marketState'

describe('Deterministic RNG', () => {
    describe('createRng', () => {
        test('same seed produces identical sequence', () => {
            const seed = 'test-seed-123'
            const rng1 = createRng(seed)
            const rng2 = createRng(seed)

            for (let i = 0; i < 100; i++) {
                expect(rng1.nextFloat()).toBe(rng2.nextFloat())
            }
        })

        test('different seeds produce different sequences', () => {
            const rng1 = createRng('seed-a')
            const rng2 = createRng('seed-b')

            let identical = true
            for (let i = 0; i < 10; i++) {
                if (rng1.nextFloat() !== rng2.nextFloat()) {
                    identical = false
                    break
                }
            }
            expect(identical).toBe(false)
        })

        test('nextFloat returns values in [0, 1)', () => {
            const rng = createRng('range-test')
            for (let i = 0; i < 1000; i++) {
                const value = rng.nextFloat()
                expect(value).toBeGreaterThanOrEqual(0)
                expect(value).toBeLessThan(1)
            }
        })

        test('nextRange returns values within bounds', () => {
            const rng = createRng('range-test-2')
            for (let i = 0; i < 100; i++) {
                const value = rng.nextRange(5, 15)
                expect(value).toBeGreaterThanOrEqual(5)
                expect(value).toBeLessThanOrEqual(15)
                expect(Number.isInteger(value)).toBe(true)
            }
        })

        test('nextBool respects probability', () => {
            const rng = createRng('bool-test')
            let trueCount = 0
            const iterations = 10000

            for (let i = 0; i < iterations; i++) {
                if (rng.nextBool(0.3)) trueCount++
            }

            // Should be roughly 30% true (with some tolerance)
            const ratio = trueCount / iterations
            expect(ratio).toBeGreaterThan(0.25)
            expect(ratio).toBeLessThan(0.35)
        })

        test('nextElement selects from array', () => {
            const rng = createRng('element-test')
            const arr = ['a', 'b', 'c', 'd', 'e']

            for (let i = 0; i < 100; i++) {
                const element = rng.nextElement(arr)
                expect(arr).toContain(element)
            }
        })

        test('shuffle is deterministic', () => {
            const seed = 'shuffle-test'
            const arr1 = [1, 2, 3, 4, 5]
            const arr2 = [1, 2, 3, 4, 5]

            createRng(seed).shuffle(arr1)
            createRng(seed).shuffle(arr2)

            expect(arr1).toEqual(arr2)
        })

        test('getCallCount tracks calls', () => {
            const rng = createRng('count-test')
            expect(rng.getCallCount()).toBe(0)

            rng.nextFloat()
            expect(rng.getCallCount()).toBe(1)

            rng.nextFloat()
            rng.nextFloat()
            expect(rng.getCallCount()).toBe(3)
        })

        test('clone creates RNG at same state', () => {
            const rng1 = createRng('clone-test')

            // Advance original
            for (let i = 0; i < 50; i++) rng1.nextFloat()

            // Clone and compare subsequent values
            const rng2 = rng1.clone()

            for (let i = 0; i < 100; i++) {
                expect(rng1.nextFloat()).toBe(rng2.nextFloat())
            }
        })
    })

    describe('validateDeterminism', () => {
        test('returns true for valid seed', () => {
            expect(validateDeterminism('valid-seed')).toBe(true)
        })

        test('works with generated seeds', () => {
            const seed = generateSeed()
            expect(validateDeterminism(seed)).toBe(true)
        })
    })
})

describe('Deterministic Price Calculation', () => {
    const createMockStock = (overrides = {}) => ({
        id: 'test-stock',
        name: 'Test Corp',
        price: 50000,
        basePrice: 50000,
        dailyOpen: 50000,
        type: 'stock',
        sector: 'tech',
        momentum: 0,
        fundamentals: {
            pe: 20,
            marketCap: 30,
            debtRatio: 100,
            yield: 2
        },
        ...overrides
    })

    test('same seed produces identical price changes', () => {
        const stock = createMockStock()
        const marketState = { trend: 0, volatility: 1, sectorTrends: {} }
        const seed = 'price-test-seed'

        const prices1 = []
        const rng1 = createRng(seed)
        for (let i = 0; i < 50; i++) {
            prices1.push(calculatePriceChange(stock, marketState, 0, [], null, rng1))
        }

        const prices2 = []
        const rng2 = createRng(seed)
        for (let i = 0; i < 50; i++) {
            prices2.push(calculatePriceChange(stock, marketState, 0, [], null, rng2))
        }

        expect(prices1).toEqual(prices2)
    })

    test('without RNG (fallback mode) still works', () => {
        const stock = createMockStock()
        const marketState = { trend: 0, volatility: 1, sectorTrends: {} }

        // Should not throw
        const price = calculatePriceChange(stock, marketState, 0, [], null, null)
        expect(typeof price).toBe('number')
        expect(price).toBeGreaterThan(0)
    })
})

describe('Deterministic Market State', () => {
    test('same seed produces identical market state updates', () => {
        const seed = 'market-state-test'
        const initialState = {
            trend: 0,
            volatility: 1,
            sectorTrends: {},
            macro: null
        }

        const states1 = []
        const rng1 = createRng(seed)
        let state1 = initialState
        for (let i = 0; i < 20; i++) {
            state1 = updateMarketState(state1, null, rng1)
            states1.push({ ...state1 })
        }

        const states2 = []
        const rng2 = createRng(seed)
        let state2 = initialState
        for (let i = 0; i < 20; i++) {
            state2 = updateMarketState(state2, null, rng2)
            states2.push({ ...state2 })
        }

        for (let i = 0; i < states1.length; i++) {
            expect(states1[i].trend).toBe(states2[i].trend)
            expect(states1[i].volatility).toBe(states2[i].volatility)
        }
    })
})
