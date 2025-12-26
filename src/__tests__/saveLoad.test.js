import { loadGame, saveGame } from '../utils'

const createStorageMock = () => {
    let store = {}
    return {
        getItem: jest.fn((key) => store[key] ?? null),
        setItem: jest.fn((key, value) => {
            store[key] = value
        }),
        removeItem: jest.fn((key) => {
            delete store[key]
        }),
        clear: jest.fn(() => {
            store = {}
        })
    }
}

describe('save/load migration', () => {
    let storage

    beforeEach(() => {
        storage = createStorageMock()
        Object.defineProperty(window, 'localStorage', {
            value: storage,
            writable: true
        })
        global.localStorage = storage
    })

    test('migrates legacy saves sequentially to latest version', () => {
        const legacySave = {
            version: 0,
            cash: 5000
        }
        storage.getItem.mockReturnValue(JSON.stringify(legacySave))

        const data = loadGame()

        expect(data.version).toBe(2)
        expect(data.cash).toBe(5000)
        expect(data.shortPositions).toEqual({})
        expect(data.creditUsed).toBe(0)
        expect(data.pendingOrders).toEqual([])
        expect(typeof data.gameStartTime).toBe('number')
        expect(data.currentDay).toBe(1)
    })

    test('saves and loads data without regression', () => {
        const saved = saveGame({ cash: 12345 })

        expect(saved).toBe(true)
        expect(storage.setItem).toHaveBeenCalledTimes(1)

        const loaded = loadGame()

        expect(loaded.cash).toBe(12345)
        expect(loaded.version).toBe(2)
        expect(typeof loaded.savedAt).toBe('number')
    })
})
