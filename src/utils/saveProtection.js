// Original save text is retained before any unsupported source is replaced.
// This internal vault is separate from the public version-4 game save format.
const SAVE_KEY = 'stockTradingGame'
const VAULT_KEY = 'stockTradingGame:originals:v1'
const VERSION = 4
const states = new WeakMap()
const resetLocks = new WeakSet()
let unavailable = { mode: 'memory', reason: 'storage-unavailable', backupCount: 0 }
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const finite = value => typeof value === 'number' && Number.isFinite(value)
const optional = (value, key, predicate) => value[key] === undefined || predicate(value[key])
const byteLength = raw => [...raw].reduce((size, character) => {
    const point = character.codePointAt(0)
    return size + (point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4)
}, 0)

function context() {
    const storage = globalThis.localStorage
    if (!storage || typeof storage.getItem !== 'function') throw new Error('storage-unavailable')
    if (!states.has(storage)) states.set(storage, { mode: 'normal', reason: '', backupCount: 0 })
    return { storage, status: states.get(storage) }
}

function fail(status, reason) {
    status.mode = 'memory'
    status.reason = reason
    return false
}

function readVault(storage, status) {
    const raw = storage.getItem(VAULT_KEY)
    if (raw === null) { status.backupCount = 0; return [] }
    let data
    try { data = JSON.parse(raw) } catch { throw new Error('backup-unreadable') }
    const ids = new Set()
    if (!object(data) || data.version !== 1 || !Array.isArray(data.entries)) throw new Error('backup-unreadable')
    for (const entry of data.entries) {
        if (!object(entry) || typeof entry.id !== 'string' || ids.has(entry.id) || !finite(entry.createdAt)
            || typeof entry.reason !== 'string' || typeof entry.raw !== 'string'
            || !(entry.version === null || finite(entry.version)) || entry.bytes !== byteLength(entry.raw)) throw new Error('backup-unreadable')
        ids.add(entry.id)
    }
    status.backupCount = data.entries.length
    return data.entries
}

// Missing fields remain compatible with existing partial v4 saves. Present
// financial values and collection shapes must not require silent replacement.
export function validCurrentSave(data) {
    if (!object(data)) return false
    const numbers = ['cash', 'creditUsed', 'creditInterest', 'totalXp', 'totalTrades', 'winStreak', 'maxWinStreak', 'totalProfit', 'dailyTrades', 'dailyProfit', 'totalDividends', 'gameStartTime', 'currentDay', 'savedAt']
    if (numbers.some(key => !optional(data, key, finite))) return false
    const maps = ['portfolio', 'shortPositions', 'unlockedAchievements', 'unlockedSkills', 'missionProgress', 'completedMissions', 'settings']
    if (maps.some(key => !optional(data, key, object))) return false
    const arrays = ['stocks', 'tradeHistory', 'pendingOrders', 'news', 'assetHistory', 'watchlist', 'alerts']
    if (arrays.some(key => !optional(data, key, Array.isArray))) return false
    for (const [key, required, fields] of [['portfolio', 'totalCost', ['borrowed', 'margin']], ['shortPositions', 'entryPrice', ['margin']]]) {
        if (data[key] && Object.values(data[key]).some(position => !object(position)
            || !finite(position.quantity) || position.quantity < 0
            || !finite(position[required]) || position[required] < 0
            || fields.some(field => !optional(position, field, value => finite(value) && value >= 0)))) return false
    }
    if (data.stocks) {
        const ids = new Set()
        for (const stock of data.stocks) {
            if (!object(stock) || !(typeof stock.id === 'string' || finite(stock.id)) || ids.has(String(stock.id)) || !finite(stock.price) || stock.price <= 0) return false
            if (['basePrice', 'dailyOpen', 'dailyHigh', 'dailyLow'].some(key => !optional(stock, key, value => finite(value) && value > 0))) return false
            ids.add(String(stock.id))
        }
    }
    for (const key of ['tradeHistory', 'pendingOrders', 'news', 'assetHistory', 'alerts']) {
        if (data[key]?.some(entry => !object(entry))) return false
    }
    for (const key of ['tradeHistory', 'pendingOrders']) {
        if (data[key]?.some(entry => ['quantity', 'price', 'targetPrice', 'total', 'profit', 'timestamp']
            .some(field => !optional(entry, field, finite)))) return false
    }
    const visit = value => typeof value === 'number' ? Number.isFinite(value)
        : value && typeof value === 'object' ? Object.values(value).every(visit) : true
    return visit(data)
}

function classify(raw) {
    let data
    try { data = JSON.parse(raw) } catch { return { reason: 'invalid-json', version: null, data: null } }
    if (!object(data)) return { reason: 'invalid-save', version: null, data: null }
    const version = data.version === undefined ? 0 : data.version
    if (!Number.isInteger(version) || version < 0) return { reason: 'invalid-version', version: finite(version) ? version : null, data: null }
    if (version > VERSION) return { reason: 'future-version', version, data: null }
    if (version < VERSION) return { reason: 'legacy-version', version, data }
    return validCurrentSave(data) ? { reason: '', version, data } : { reason: 'invalid-save', version, data: null }
}

function preserve(raw, source, storage, status, entries) {
    if (!entries.some(entry => entry.raw === raw)) {
        const createdAt = Date.now()
        let suffix = entries.length
        let id = `${createdAt.toString(36)}-${suffix}`
        while (entries.some(entry => entry.id === id)) id = `${createdAt.toString(36)}-${++suffix}`
        const entry = { id, createdAt, reason: source.reason, version: source.version, bytes: byteLength(raw), raw }
        const serialized = JSON.stringify({ version: 1, entries: [...entries, entry] })
        try { storage.setItem(VAULT_KEY, serialized) } catch { return fail(status, 'backup-failed') }
        try { if (storage.getItem(VAULT_KEY) !== serialized) return fail(status, 'backup-unverified') }
        catch { return fail(status, 'backup-unverified') }
        status.backupCount = entries.length + 1
    }
    status.mode = 'protected'
    status.reason = source.reason
    return true
}

function inspect(storage, status) {
    if (resetLocks.has(storage)) {
        fail(status, 'reset-pending')
        return { canWrite: false, data: null }
    }
    const entries = readVault(storage, status)
    const raw = storage.getItem(SAVE_KEY)
    if (raw === null) {
        status.mode = entries.length ? 'protected' : 'normal'
        status.reason = entries.length ? 'retained-originals' : ''
        return { canWrite: true, data: null }
    }
    const source = classify(raw)
    if (source.reason) return { canWrite: preserve(raw, source, storage, status, entries), data: source.data }
    status.mode = entries.length ? 'protected' : 'normal'
    status.reason = entries.length ? 'retained-originals' : ''
    return { canWrite: true, data: source.data }
}

function operation(action) {
    let current
    try { current = context(); return action(current.storage, current.status) }
    catch (error) {
        fail(current?.status || unavailable, error.message === 'backup-unreadable' ? 'backup-unreadable' : 'storage-unavailable')
        return null
    }
}

export function readProtectedSave() {
    return operation((storage, status) => inspect(storage, status).data)
}

export function reportInvalidSave() {
    operation((_storage, status) => fail(status, 'invalid-current-state'))
}

export function writeProtectedSave(serialized) {
    return operation((storage, status) => {
        if (resetLocks.has(storage)) return fail(status, 'reset-pending')
        if (!inspect(storage, status).canWrite) return false
        try { storage.setItem(SAVE_KEY, serialized) } catch { return fail(status, 'save-failed') }
        try { if (storage.getItem(SAVE_KEY) !== serialized) return fail(status, 'save-unverified') }
        catch { return fail(status, 'save-unverified') }
        return true
    }) === true
}

export function resetProtectedSave() {
    return operation((storage, status) => {
        if (!inspect(storage, status).canWrite) return false
        try { storage.removeItem(SAVE_KEY) } catch { return fail(status, 'reset-failed') }
        if (storage.getItem(SAVE_KEY) !== null) return fail(status, 'reset-unverified')
        // The old React snapshot may still autosave during beforeunload. Only
        // a new document/module session may start writing the reset game.
        resetLocks.add(storage)
        fail(status, 'reset-pending')
        return true
    }) === true
}

export function getSaveStatus() {
    const result = operation((storage, status) => { readVault(storage, status); return { ...status } })
    if (result) return result
    try { return { ...context().status } } catch { return { ...unavailable } }
}

export function listSaveBackups() {
    return operation((storage, status) => readVault(storage, status).map(({ id, createdAt, reason, version, bytes }) => ({ id, createdAt, reason, version, bytes }))) || []
}

export function readSaveBackup(id) {
    let raw
    const found = operation((storage, status) => {
        const entry = readVault(storage, status).find(entry => entry.id === id)
        if (!entry) return false
        raw = entry.raw
        return true
    })
    if (!found) throw new Error('저장 원문을 읽지 못했습니다.')
    return raw
}
