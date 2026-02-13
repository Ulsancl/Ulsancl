import {
    generateNews,
    getActiveNewsEffects,
    resetNewsSystem,
    resetCrisisState,
} from '../../engine'
import { triggerCrisis, getActiveCrisis, resetCrisis } from '../../game/CrisisEvents'

const testStocks = [
    {
        id: 1,
        name: '테스트전자',
        code: 'TS1',
        sector: 'tech',
        price: 100000,
        dailyOpen: 100000,
        basePrice: 100000,
        fundamentals: {
            revenue: '10조',
            profit: '1조',
            marketCap: '100조',
            debtRatio: '20%',
            pe: '15'
        }
    }
]

describe('engine runtime reset', () => {
    beforeEach(() => {
        resetNewsSystem()
        resetCrisisState()
        resetCrisis()
    })

    test('resetNewsSystem clears active news effects', () => {
        const generated = generateNews(testStocks, 1)

        expect(generated).toBeTruthy()
        expect(getActiveNewsEffects().length).toBeGreaterThan(0)

        resetNewsSystem()

        expect(getActiveNewsEffects()).toEqual([])
    })

    test('resetCrisisState clears active crisis state', () => {
        triggerCrisis('market_crash', 5)

        expect(getActiveCrisis(6)).not.toBeNull()

        resetCrisisState()

        expect(getActiveCrisis(6)).toBeNull()
    })
})
