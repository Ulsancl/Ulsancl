/**
 * 자산 계산 유틸리티 테스트
 * Jest를 사용한 단위 테스트
 */

import { calculateStockValue, calculateShortValue, safeNumber, calculateAssets } from '../utils/calculations'

describe('safeNumber', () => {
    test('정상 숫자 반환', () => {
        expect(safeNumber(100)).toBe(100)
        expect(safeNumber(0)).toBe(0)
        expect(safeNumber(-50)).toBe(-50)
    })

    test('NaN은 기본값 반환', () => {
        expect(safeNumber(NaN)).toBe(0)
        expect(safeNumber(NaN, 100)).toBe(100)
    })

    test('null/undefined는 기본값 반환', () => {
        expect(safeNumber(null)).toBe(0)
        expect(safeNumber(undefined)).toBe(0)
    })
})

describe('calculateStockValue', () => {
    const mockStocks = [
        { id: 1, price: 10000 },
        { id: 2, price: 50000 },
        { id: 3, price: 25000 }
    ]

    test('빈 포트폴리오는 0 반환', () => {
        expect(calculateStockValue({}, mockStocks)).toBe(0)
    })

    test('null 포트폴리오는 0 반환', () => {
        expect(calculateStockValue(null, mockStocks)).toBe(0)
    })

    test('단일 종목 가치 계산', () => {
        const portfolio = { 1: { quantity: 10, totalCost: 90000 } }
        expect(calculateStockValue(portfolio, mockStocks)).toBe(100000) // 10 * 10000
    })

    test('여러 종목 가치 합산', () => {
        const portfolio = {
            1: { quantity: 10, totalCost: 90000 },  // 10 * 10000 = 100000
            2: { quantity: 5, totalCost: 240000 }   // 5 * 50000 = 250000
        }
        expect(calculateStockValue(portfolio, mockStocks)).toBe(350000)
    })

    test('존재하지 않는 종목은 무시', () => {
        const portfolio = { 999: { quantity: 100, totalCost: 1000000 } }
        expect(calculateStockValue(portfolio, mockStocks)).toBe(0)
    })
})

describe('calculateShortValue', () => {
    const mockStocks = [
        { id: 1, price: 10000 },
        { id: 2, price: 50000 }
    ]

    test('빈 공매도 포지션은 0 반환', () => {
        expect(calculateShortValue({}, mockStocks)).toBe(0)
    })

    test('가격 하락시 이익 계산', () => {
        // 진입가 12000, 현재가 10000 -> 이익 2000 * 10 = 20000
        const shortPositions = {
            1: { quantity: 10, entryPrice: 12000, margin: 120000, openTime: Date.now() }
        }
        expect(calculateShortValue(shortPositions, mockStocks)).toBe(20000)
    })

    test('가격 상승시 손실 계산', () => {
        // 진입가 8000, 현재가 10000 -> 손실 -2000 * 10 = -20000
        const shortPositions = {
            1: { quantity: 10, entryPrice: 8000, margin: 80000, openTime: Date.now() }
        }
        expect(calculateShortValue(shortPositions, mockStocks)).toBe(-20000)
    })
})

describe('calculateAssets', () => {
    const mockStocks = [
        { id: 1, price: 10000 },
        { id: 2, price: 50000 }
    ]

    test('기본 자산 계산', () => {
        const result = calculateAssets({
            cash: 1000000,
            portfolio: {},
            shortPositions: {},
            stocks: mockStocks,
            creditUsed: 0,
            creditInterest: 0,
            levelInfo: { level: 1 }
        })

        expect(result.grossAssets).toBe(1000000)
        expect(result.totalAssets).toBe(1000000)
        expect(result.stockValue).toBe(0)
        expect(result.shortValue).toBe(0)
    })

    test('포트폴리오 포함 자산 계산', () => {
        const result = calculateAssets({
            cash: 500000,
            portfolio: { 1: { quantity: 50, totalCost: 450000 } }, // 50 * 10000 = 500000
            shortPositions: {},
            stocks: mockStocks,
            creditUsed: 0,
            creditInterest: 0
        })

        expect(result.stockValue).toBe(500000)
        expect(result.grossAssets).toBe(1000000) // 500000 + 500000
        expect(result.totalAssets).toBe(1000000)
    })

    test('신용 거래 반영 자산 계산', () => {
        const result = calculateAssets({
            cash: 1500000, // 대출 포함
            portfolio: {},
            shortPositions: {},
            stocks: mockStocks,
            creditUsed: 500000,
            creditInterest: 5000,
            levelInfo: { level: 3 }
        })

        expect(result.grossAssets).toBe(1500000)
        expect(result.totalAssets).toBe(995000) // 1500000 - 500000 - 5000
        expect(result.totalDebt).toBe(505000) // 500000 + 5000
    })

    test('수익률 계산', () => {
        // INITIAL_CAPITAL = 100000000 (1억)
        const result = calculateAssets({
            cash: 110000000, // 10% 수익
            portfolio: {},
            shortPositions: {},
            stocks: mockStocks,
            creditUsed: 0,
            creditInterest: 0
        })

        expect(result.profitRate).toBe(10) // 10%
    })
})
