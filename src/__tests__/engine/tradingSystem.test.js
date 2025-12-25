/**
 * 거래 시스템 테스트
 * src/engine/tradingSystem.js 테스트
 */

import { processOrders, checkAchievements } from '../../engine/tradingSystem'

describe('tradingSystem', () => {
    describe('processOrders', () => {
        const stocks = [
            { id: 1, name: '삼성전자', price: 72000 },
            { id: 2, name: 'SK하이닉스', price: 135000 }
        ]

        test('지정가 매수 주문 체결', () => {
            const orders = [
                {
                    id: 'order1',
                    stockId: 1,
                    type: 'limit',
                    side: 'buy',
                    targetPrice: 73000, // 현재가 72000보다 높으므로 체결
                    quantity: 10
                }
            ]

            const result = processOrders(orders, stocks, 1000000, {})

            expect(result.executedOrders.length).toBe(1)
            expect(result.remainingOrders.length).toBe(0)
            expect(result.cash).toBe(1000000 - 72000 * 10) // 720000 차감
            expect(result.portfolio[1].quantity).toBe(10)
        })

        test('지정가 매수 주문 미체결 (가격 불충족)', () => {
            const orders = [
                {
                    id: 'order1',
                    stockId: 1,
                    type: 'limit',
                    side: 'buy',
                    targetPrice: 70000, // 현재가 72000보다 낮으므로 미체결
                    quantity: 10
                }
            ]

            const result = processOrders(orders, stocks, 1000000, {})

            expect(result.executedOrders.length).toBe(0)
            expect(result.remainingOrders.length).toBe(1)
            expect(result.cash).toBe(1000000) // 변동 없음
        })

        test('손절 주문 체결', () => {
            const orders = [
                {
                    id: 'order1',
                    stockId: 1,
                    type: 'stopLoss',
                    side: 'sell',
                    targetPrice: 75000, // 현재가 72000보다 높으므로 체결
                    quantity: 5
                }
            ]

            const portfolio = {
                1: { quantity: 10, totalCost: 700000 }
            }

            const result = processOrders(orders, stocks, 100000, portfolio)

            expect(result.executedOrders.length).toBe(1)
            expect(result.cash).toBe(100000 + 72000 * 5) // 360000 추가
            expect(result.portfolio[1].quantity).toBe(5) // 5주 남음
        })

        test('잔고 부족시 매수 주문 미체결', () => {
            const orders = [
                {
                    id: 'order1',
                    stockId: 1,
                    type: 'limit',
                    side: 'buy',
                    targetPrice: 73000,
                    quantity: 100 // 7,200,000원 필요
                }
            ]

            const result = processOrders(orders, stocks, 1000000, {}) // 잔고 1,000,000원

            expect(result.executedOrders.length).toBe(0)
            expect(result.remainingOrders.length).toBe(1)
        })
    })

    describe('checkAchievements', () => {
        test('첫 거래 업적 해금', () => {
            const gameState = {
                totalTrades: 1,
                totalProfit: 0,
                totalAssets: 100000000,
                portfolio: {},
                tradeHistory: [],
                winStreak: 0
            }

            const achievements = {
                firstTrade: { id: 'firstTrade', name: '첫 거래', xp: 100 }
            }

            const unlocks = checkAchievements(gameState, {}, achievements)

            expect(unlocks.length).toBe(1)
            expect(unlocks[0].id).toBe('firstTrade')
        })

        test('이미 해금된 업적은 중복 해금 안됨', () => {
            const gameState = {
                totalTrades: 10,
                totalProfit: 0,
                totalAssets: 100000000,
                portfolio: {},
                tradeHistory: [],
                winStreak: 0
            }

            const unlockedAchievements = { firstTrade: true }

            const achievements = {
                firstTrade: { id: 'firstTrade', name: '첫 거래', xp: 100 },
                trader10: { id: 'trader10', name: '10회 거래', xp: 200 }
            }

            const unlocks = checkAchievements(gameState, unlockedAchievements, achievements)

            expect(unlocks.length).toBe(1)
            expect(unlocks[0].id).toBe('trader10')
        })

        test('수익 업적 해금', () => {
            const gameState = {
                totalTrades: 50,
                totalProfit: 1500000, // 150만원 수익
                totalAssets: 101500000,
                portfolio: {},
                tradeHistory: [],
                winStreak: 0
            }

            const achievements = {
                firstProfit: { id: 'firstProfit', name: '첫 수익', xp: 100 },
                profit1m: { id: 'profit1m', name: '100만원 수익', xp: 500 }
            }

            const unlocks = checkAchievements(gameState, {}, achievements)

            expect(unlocks.length).toBe(2)
            expect(unlocks.map(u => u.id)).toContain('firstProfit')
            expect(unlocks.map(u => u.id)).toContain('profit1m')
        })

        test('분산 투자 업적 해금', () => {
            const gameState = {
                totalTrades: 10,
                totalProfit: 0,
                totalAssets: 100000000,
                portfolio: {
                    1: { quantity: 10, totalCost: 1000000 },
                    2: { quantity: 5, totalCost: 500000 },
                    3: { quantity: 8, totalCost: 800000 },
                    4: { quantity: 15, totalCost: 1500000 },
                    5: { quantity: 3, totalCost: 300000 }
                },
                tradeHistory: [],
                winStreak: 0
            }

            const achievements = {
                diversified: { id: 'diversified', name: '분산 투자', xp: 300 }
            }

            const unlocks = checkAchievements(gameState, {}, achievements)

            expect(unlocks.length).toBe(1)
            expect(unlocks[0].id).toBe('diversified')
        })
    })
})
