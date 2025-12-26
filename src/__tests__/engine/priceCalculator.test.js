/**
 * 가격 계산기 테스트
 * src/engine/priceCalculator.js 테스트
 */

import {
    getTickSize,
    roundToTickSize,
    startNewTradingDay,
    updateDailyRange,
    VOLATILITY_CONFIG
} from '../../engine/priceCalculator'

describe('priceCalculator', () => {
    describe('getTickSize', () => {
        test('주식 가격별 틱 사이즈 반환', () => {
            expect(getTickSize(500, 'stock')).toBe(1)
            expect(getTickSize(2000, 'stock')).toBe(5)
            expect(getTickSize(8000, 'stock')).toBe(10)
            expect(getTickSize(30000, 'stock')).toBe(50)
            expect(getTickSize(80000, 'stock')).toBe(100)
            expect(getTickSize(300000, 'stock')).toBe(500)
            expect(getTickSize(700000, 'stock')).toBe(1000)
        })

        test('코인 가격별 틱 사이즈 반환', () => {
            expect(getTickSize(5, 'crypto')).toBe(0.01)
            expect(getTickSize(50, 'crypto')).toBe(0.1)
            expect(getTickSize(500, 'crypto')).toBe(1)
            expect(getTickSize(5000, 'crypto')).toBe(5)
            expect(getTickSize(50000, 'crypto')).toBe(10)
        })

        test('채권 틱 사이즈는 항상 10', () => {
            expect(getTickSize(95000, 'bond')).toBe(10)
            expect(getTickSize(100000, 'bond')).toBe(10)
            expect(getTickSize(105000, 'bond')).toBe(10)
        })
    })

    describe('roundToTickSize', () => {
        test('가격을 올바른 틱 사이즈로 반올림', () => {
            expect(roundToTickSize(72345, 'stock')).toBe(72300)
            expect(roundToTickSize(72344, 'stock')).toBe(72300)
            expect(roundToTickSize(72351, 'stock')).toBe(72400)
        })

        test('코인 가격 반올림', () => {
            expect(roundToTickSize(123.456, 'crypto')).toBe(123)
            expect(roundToTickSize(567.8, 'crypto')).toBe(568)
        })
    })

    describe('startNewTradingDay', () => {
        test('새 거래일 시작시 dailyOpen 설정', () => {
            const stocks = [
                { id: 1, price: 10000, dailyOpen: 9500, dailyHigh: 10500, dailyLow: 9000, momentum: 0.5 },
                { id: 2, price: 20000, dailyOpen: 19000, dailyHigh: 21000, dailyLow: 18500, momentum: -0.3 }
            ]

            const result = startNewTradingDay(stocks)

            expect(result[0].dailyOpen).toBe(10000)
            expect(result[0].dailyHigh).toBe(10000)
            expect(result[0].dailyLow).toBe(10000)
            expect(result[0].prevClose).toBe(9500)
            expect(result[0].momentum).toBe(0.25) // 50% 감쇠

            expect(result[1].dailyOpen).toBe(20000)
            expect(result[1].momentum).toBe(-0.15) // 50% 감쇠
        })
    })

    describe('updateDailyRange', () => {
        test('일일 고가/저가 업데이트', () => {
            const stocks = [
                { id: 1, price: 11000, dailyHigh: 10500, dailyLow: 9500 },
                { id: 2, price: 18000, dailyHigh: 20000, dailyLow: 19000 }
            ]

            const result = updateDailyRange(stocks)

            expect(result[0].dailyHigh).toBe(11000) // 신규 고가
            expect(result[0].dailyLow).toBe(9500)   // 기존 저가 유지

            expect(result[1].dailyHigh).toBe(20000) // 기존 고가 유지
            expect(result[1].dailyLow).toBe(18000)  // 신규 저가
        })
    })

    describe('VOLATILITY_CONFIG', () => {
        test('모든 상품 유형에 대한 변동성 설정 존재', () => {
            expect(VOLATILITY_CONFIG.stock).toBeDefined()
            expect(VOLATILITY_CONFIG.etf).toBeDefined()
            expect(VOLATILITY_CONFIG.crypto).toBeDefined()
            expect(VOLATILITY_CONFIG.bond).toBeDefined()
            expect(VOLATILITY_CONFIG.commodity).toBeDefined()
        })

        test('코인 변동성이 채권보다 높음', () => {
            expect(VOLATILITY_CONFIG.crypto.base).toBeGreaterThan(VOLATILITY_CONFIG.bond.base)
            expect(VOLATILITY_CONFIG.crypto.maxDaily).toBeGreaterThan(VOLATILITY_CONFIG.bond.maxDaily)
        })
    })
})
