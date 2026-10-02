import {
    createSaveExport, getSaveStatus, listSaveBackups, loadGame,
    readSaveBackup, resetGame, saveGame
} from '../utils'
import { INITIAL_CAPITAL } from '../constants'

const SAVE = 'stockTradingGame'
const VAULT = 'stockTradingGame:originals:v1'
const makeStorage = () => {
    const contents = new Map()
    return {
        contents,
        getItem: jest.fn(key => contents.get(key) ?? null),
        setItem: jest.fn((key, value) => contents.set(key, String(value))),
        removeItem: jest.fn(key => contents.delete(key)),
        clear: jest.fn(() => contents.clear())
    }
}

describe('original save protection', () => {
    let storage
    beforeEach(() => {
        storage = makeStorage()
        Object.defineProperty(window, 'localStorage', { value: storage, writable: true })
        global.localStorage = storage
    })

    test('preserves the exact legacy text before keeping the intentional season reset', () => {
        const raw = '  { "version": 3, "cash": 12345, "name": "원문 🚗" }\r\n'
        storage.contents.set(SAVE, raw)
        const loaded = loadGame()
        expect(loaded.cash).toBe(INITIAL_CAPITAL)
        expect(loaded.version).toBe(4)
        expect(storage.getItem(SAVE)).toBe(raw)
        const [backup] = listSaveBackups()
        expect(backup).toEqual({ id: expect.any(String), createdAt: expect.any(Number), reason: 'legacy-version', version: 3, bytes: Buffer.byteLength(raw, 'utf8') })
        expect(readSaveBackup(backup.id)).toBe(raw)
        expect(getSaveStatus()).toEqual({ mode: 'protected', reason: 'legacy-version', backupCount: 1 })
        expect(saveGame(loaded)).toBe(true)
        expect(JSON.parse(storage.getItem(SAVE)).cash).toBe(INITIAL_CAPITAL)
        expect(readSaveBackup(backup.id)).toBe(raw)
    })

    test.each([
        ['broken JSON', '{ "cash": 5000,', 'invalid-json', null],
        ['empty text', '', 'invalid-json', null],
        ['future save', '{"version":99,"cash":271828,"unknown":{"keep":true}}', 'future-version', 99],
        ['array root', '[1,2,3]', 'invalid-save', null],
        ['null root', 'null', 'invalid-save', null],
        ['invalid version', '{"version":"4","cash":12}', 'invalid-version', null],
        ['invalid cash', '{"version":4,"cash":"not money"}', 'invalid-save', 4],
        ['invalid position', '{"version":4,"portfolio":{"1":{"quantity":3}}}', 'invalid-save', 4],
        ['invalid short entry', '{"version":4,"shortPositions":{"1":{"quantity":3,"entryPrice":null}}}', 'invalid-save', 4],
        ['invalid price', '{"version":4,"stocks":[{"id":1,"price":0}]}', 'invalid-save', 4],
        ['invalid order', '{"version":4,"pendingOrders":[{"targetPrice":null}]}', 'invalid-save', 4]
    ])('%s is preserved before allowing a fresh current save', (_name, raw, reason, version) => {
        storage.contents.set(SAVE, raw)
        expect(loadGame()).toBeNull()
        const [backup] = listSaveBackups()
        expect(backup.reason).toBe(reason)
        expect(backup.version).toBe(version)
        expect(readSaveBackup(backup.id)).toBe(raw)
        expect(storage.getItem(SAVE)).toBe(raw)
        expect(saveGame({ cash: 123 })).toBe(true)
        expect(JSON.parse(storage.getItem(SAVE)).version).toBe(4)
        expect(readSaveBackup(backup.id)).toBe(raw)
    })

    test('direct save also protects a source that has not been loaded', () => {
        const raw = '{"version":8,"cash":9999999}'
        storage.contents.set(SAVE, raw)
        expect(saveGame({ cash: 50 })).toBe(true)
        expect(storage.setItem.mock.calls.map(([key]) => key)).toEqual([VAULT, SAVE])
        expect(readSaveBackup(listSaveBackups()[0].id)).toBe(raw)
    })

    test('quota failure blocks every autosave and reset until exact backup succeeds', () => {
        const raw = '{"version":2,"cash":42}'
        storage.contents.set(SAVE, raw)
        let blocked = true
        storage.setItem.mockImplementation((key, value) => {
            if (key === VAULT && blocked) throw new Error('QuotaExceededError')
            storage.contents.set(key, value)
        })
        expect(loadGame().cash).toBe(INITIAL_CAPITAL)
        expect(getSaveStatus()).toMatchObject({ mode: 'memory', reason: 'backup-failed' })
        expect(saveGame({ cash: 1 })).toBe(false)
        expect(saveGame({ cash: 2 })).toBe(false)
        expect(resetGame()).toBe(false)
        expect(storage.getItem(SAVE)).toBe(raw)
        expect(storage.setItem.mock.calls.some(([key]) => key === SAVE)).toBe(false)
        expect(storage.removeItem).not.toHaveBeenCalled()
        blocked = false
        expect(saveGame({ cash: 3 })).toBe(true)
        expect(readSaveBackup(listSaveBackups()[0].id)).toBe(raw)
        expect(getSaveStatus()).toMatchObject({ mode: 'protected', backupCount: 1 })
    })

    test('a successful setItem without a matching readback cannot authorize replacement', () => {
        const raw = 'an unreadable original'
        storage.contents.set(SAVE, raw)
        storage.setItem.mockImplementation((key, value) => {
            if (key !== VAULT) storage.contents.set(key, value)
        })
        expect(saveGame({ cash: 99 })).toBe(false)
        expect(getSaveStatus()).toMatchObject({ mode: 'memory', reason: 'backup-unverified' })
        expect(storage.getItem(SAVE)).toBe(raw)
        expect(storage.setItem.mock.calls.every(([key]) => key === VAULT)).toBe(true)
    })

    test('a readback exception leaves the original in place and a later confirmed retry recovers', () => {
        const raw = '{"version":100,"cash":123}'
        storage.contents.set(SAVE, raw)
        let failReadback = false
        storage.setItem.mockImplementation((key, value) => {
            storage.contents.set(key, value)
            if (key === VAULT) failReadback = true
        })
        storage.getItem.mockImplementation(key => {
            if (key === VAULT && failReadback) throw new Error('read denied')
            return storage.contents.get(key) ?? null
        })
        expect(saveGame({ cash: 1 })).toBe(false)
        expect(storage.contents.get(SAVE)).toBe(raw)
        failReadback = false
        expect(saveGame({ cash: 2 })).toBe(true)
        expect(listSaveBackups()).toHaveLength(1)
        expect(readSaveBackup(listSaveBackups()[0].id)).toBe(raw)
    })

    test('an unreadable existing vault is never replaced or silently discarded', () => {
        const original = '{"version":99,"cash":5}'
        const vault = '{"version":1,"entries":"damaged"}'
        storage.contents.set(SAVE, original)
        storage.contents.set(VAULT, vault)
        expect(loadGame()).toBeNull()
        expect(saveGame({ cash: 2 })).toBe(false)
        expect(resetGame()).toBe(false)
        expect(storage.contents.get(SAVE)).toBe(original)
        expect(storage.contents.get(VAULT)).toBe(vault)
        expect(storage.setItem).not.toHaveBeenCalled()
        expect(getSaveStatus()).toMatchObject({ mode: 'memory', reason: 'backup-unreadable' })
    })

    test('repeated reads deduplicate exact originals and expose detached metadata only', () => {
        const raw = '{"version":9}'
        storage.contents.set(SAVE, raw)
        loadGame()
        loadGame()
        const first = listSaveBackups()
        const originalId = first[0].id
        first[0].id = 'changed'
        first.push({ id: 'fake' })
        expect(listSaveBackups()).toHaveLength(1)
        expect(listSaveBackups()[0]).not.toHaveProperty('raw')
        expect(readSaveBackup(originalId)).toBe(raw)
        expect(() => readSaveBackup('missing')).toThrow()
        expect(storage.setItem.mock.calls.filter(([key]) => key === VAULT)).toHaveLength(1)
    })

    test('reset removes only this game save and preserves originals, settings, and unrelated data', () => {
        const raw = '{"version":88}'
        storage.contents.set(SAVE, raw)
        storage.contents.set('stockGame_settings', '{"theme":"light"}')
        storage.contents.set('another-application', 'do not delete')
        expect(resetGame()).toBe(true)
        expect(storage.getItem(SAVE)).toBeNull()
        expect(readSaveBackup(listSaveBackups()[0].id)).toBe(raw)
        expect(storage.getItem('stockGame_settings')).toBe('{"theme":"light"}')
        expect(storage.getItem('another-application')).toBe('do not delete')
        expect(storage.removeItem.mock.calls).toEqual([[SAVE]])
        expect(storage.clear).not.toHaveBeenCalled()
    })

    test('current save write and reset failures are reported without clearing existing data', () => {
        const raw = '{"version":4,"cash":123}'
        storage.contents.set(SAVE, raw)
        storage.setItem.mockImplementation(() => { throw new Error('full') })
        expect(saveGame({ cash: 50 })).toBe(false)
        expect(getSaveStatus()).toMatchObject({ mode: 'memory', reason: 'save-failed' })
        storage.removeItem.mockImplementation(() => { throw new Error('denied') })
        expect(resetGame()).toBe(false)
        expect(getSaveStatus()).toMatchObject({ mode: 'memory', reason: 'reset-failed' })
        expect(storage.contents.get(SAVE)).toBe(raw)
    })

    test('successful reset blocks stale beforeunload saves until a new module session', () => {
        storage.contents.set(SAVE, '{"version":4,"cash":123456}')
        expect(resetGame()).toBe(true)
        expect(saveGame({ cash: 123456 })).toBe(false)
        expect(getSaveStatus()).toMatchObject({ mode: 'memory', reason: 'reset-pending' })
        expect(storage.getItem(SAVE)).toBeNull()
        jest.isolateModules(() => {
            const freshDocument = require('../utils')
            expect(freshDocument.loadGame()).toBeNull()
            expect(freshDocument.saveGame({ cash: INITIAL_CAPITAL })).toBe(true)
        })
        expect(JSON.parse(storage.getItem(SAVE)).cash).toBe(INITIAL_CAPITAL)
    })

    test('a failed current-save readback is visible, and export remains available', () => {
        storage.contents.set(SAVE, '{"version":4,"cash":1}')
        storage.setItem.mockImplementation(() => {})
        expect(saveGame({ cash: 2 })).toBe(false)
        expect(getSaveStatus()).toMatchObject({ mode: 'memory', reason: 'save-unverified' })
        expect(JSON.parse(createSaveExport({ cash: 2 })).cash).toBe(2)
    })

    test('exports the current v4 schema without mutation or any storage access', () => {
        const snapshot = Object.freeze({ cash: 123.25, portfolio: Object.freeze({}), settings: Object.freeze({ playerName: '원문', theme: 'light' }) })
        const exported = JSON.parse(createSaveExport(snapshot))
        expect(exported).toMatchObject({ cash: 123.25, portfolio: {}, settings: { playerName: '원문', theme: 'light' }, version: 4 })
        expect(exported.savedAt).toEqual(expect.any(Number))
        expect(snapshot).not.toHaveProperty('version')
        expect(storage.getItem).not.toHaveBeenCalled()
        expect(storage.setItem).not.toHaveBeenCalled()
        expect(exported).not.toHaveProperty('originals')
    })

    test('invalid runtime state cannot write JSON null money or replace a valid save', () => {
        const raw = '{"version":4,"cash":100}'
        storage.contents.set(SAVE, raw)
        expect(saveGame({ cash: NaN })).toBe(false)
        expect(() => createSaveExport({ cash: Infinity })).toThrow()
        expect(getSaveStatus()).toMatchObject({ mode: 'memory', reason: 'invalid-current-state' })
        expect(storage.contents.get(SAVE)).toBe(raw)
        expect(storage.setItem).not.toHaveBeenCalled()
    })

    test('preserves current leveraged and legacy-margin-free short positions without changing accounting', () => {
        const snapshot = {
            cash: 1234.5, creditUsed: 10, creditInterest: 0.25,
            portfolio: { 1: { quantity: 2, totalCost: 200.3, borrowed: 100, margin: 100, leverage: 2 } },
            shortPositions: { 2: { quantity: 1, entryPrice: 300 } },
            tradeHistory: [{ type: 'cover', stockId: 2, quantity: 1, price: 250, total: 500, profit: 50, timestamp: 1 }],
            pendingOrders: [{ id: 'order', type: 'limit', stockId: 1, quantity: 2, targetPrice: 90 }],
            stocks: [{ id: 1, price: 100, basePrice: 100, dailyOpen: 100, dailyHigh: 100, dailyLow: 100 }]
        }
        expect(saveGame(snapshot)).toBe(true)
        expect(loadGame()).toMatchObject(snapshot)
        expect(listSaveBackups()).toEqual([])
        expect(getSaveStatus()).toEqual({ mode: 'normal', reason: '', backupCount: 0 })
    })
})
