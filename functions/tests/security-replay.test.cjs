const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
    calculatePortfolioValue,
    executeTrade,
    replayGame
} = require('../lib/replay/engine.js');
const {
    submitScore,
    validateTradeLogs,
    isScoreSubmissionEnabled
} = require('../lib/verification/submitScore.js');

const trade = (type, quantity) => ({ tick: 0, type, stockId: '1', quantity });
const { validateSeasonForReplay, readActiveSeason } = require('../lib/verification/season.js');
const { calculateChecksum } = require('../lib/verification/submitScore.js');

test('canonical season timing, duration and private seed placement are mandatory', () => {
    const season = { active: true, initialCapital: 1000, gameDuration: 10,
        startDate: { toMillis: () => 100 }, endDate: { toMillis: () => 200 } };
    const meta = { initialCapital: 1000, totalTicks: 10 };
    assert.equal(validateSeasonForReplay(season, meta, 150), true);
    for (const totalTicks of [1, 9, 11, 120001, Infinity]) {
        assert.equal(validateSeasonForReplay(season, { ...meta, totalTicks }, 150), false);
    }
    for (const now of [99, 200, 201]) assert.equal(validateSeasonForReplay(season, meta, now), false);
    assert.equal(validateSeasonForReplay({ ...season, seed: 'exposed' }, meta, 150), false);
    assert.equal(validateSeasonForReplay({ ...season, active: false }, meta, 150), false);
});

test('public season projection never returns legacy seeds or unknown fields', async () => {
    const query = { where() { return this; }, orderBy() { return this; }, limit() { return this; },
        async get() { return { empty: false, docs: [{ id: 'season', data: () => ({ name: 'Season',
            active: true, initialCapital: 1000, gameDuration: 10, seed: 'private fixture',
            otherSecret: 'private fixture', startDate: { toMillis: () => 100 }, endDate: { toMillis: () => 200 } }) }] }; } };
    const result = await readActiveSeason({ collection: () => query });
    assert.deepEqual(Object.keys(result).sort(), ['active', 'endDate', 'gameDuration', 'id', 'initialCapital', 'name', 'startDate']);
    assert.equal(JSON.stringify(result).includes('private fixture'), false);
});

test('season closure during replay rejects the score before leaderboard or audit writes', async () => {
    const previous = process.env.UNSAFE_ALLOW_UNVERIFIED_SCORE_SUBMISSION;
    process.env.UNSAFE_ALLOW_UNVERIFIED_SCORE_SUBMISSION = 'true';
    try {
        const season = { active: true, initialCapital: 1000, gameDuration: 1,
            startDate: { toMillis: () => Date.now() - 10000 }, endDate: { toMillis: () => Date.now() + 10000 } };
        const snapshot = data => ({ exists: true, data: () => data });
        const writes = [];
        const db = {
            doc(path) { return { path, get: async () => snapshot(path.startsWith('seasonSecrets/') ? { seed: 'test-seed' } : season) }; },
            async runTransaction(callback) {
                return callback({
                    get: async ref => ref.path.startsWith('rateLimits/') ? { exists: false } :
                        snapshot(ref.path.startsWith('seasonSecrets/') ? { seed: 'test-seed' } : { ...season, active: false }),
                    set: ref => writes.push(ref.path), update: ref => writes.push(ref.path)
                });
            },
            collection() { assert.fail('No leaderboard access after season closure'); }
        };
        const meta = { seasonId: 'test-season', engineVersion: '3.0.0', clientVersion: '3.0.0',
            initialCapital: 1000, totalTicks: 1, startedAt: 0, endedAt: 1 };
        const result = await submitScore({ meta, tradeLogs: [], checksum: calculateChecksum(meta, []) }, 'test-user', db);
        assert.equal(result.errorCode, 'SEASON_ENDED');
        assert.deepEqual(writes, ['rateLimits/test-user']);
    } finally {
        if (previous === undefined) delete process.env.UNSAFE_ALLOW_UNVERIFIED_SCORE_SUBMISSION;
        else process.env.UNSAFE_ALLOW_UNVERIFIED_SCORE_SUBMISSION = previous;
    }
});

test('replay itself rejects non-finite ticks, capital, and trade quantities', () => {
    for (const totalTicks of [Infinity, NaN, 120001, .5]) {
        assert.equal(replayGame('seed', [], { initialCapital: 1000, totalTicks }).valid, false);
    }
    for (const quantity of [Infinity, NaN, .5, Number.MAX_SAFE_INTEGER + 1]) {
        assert.equal(executeTrade(trade('SHORT', quantity), [{ id: '1', price: 100 }], new Map(), new Map(), 1000).success, false);
    }
});

test('malformed version values are rejected without throwing or reaching the database', async () => {
    const result = await submitScore({ meta: { engineVersion: 123 }, tradeLogs: [], checksum: '' }, 'test-user', null);
    assert.equal(result.errorCode, 'INVALID_VERSION');
});

test('opening a short posts margin and cannot create an immediate score gain', () => {
    const stock = { id: '1', price: 100 };
    const positions = new Map();
    const opened = executeTrade(trade('SHORT', 5), [stock], new Map(), positions, 1000);
    assert.equal(opened.success, true);
    assert.equal(opened.newCash, 250); // 150% of 500 is reserved as margin.
    assert.equal(positions.get('1').margin, 750);
    assert.equal(calculatePortfolioValue([stock], new Map(), positions, opened.newCash), 1000);

    stock.price = 80;
    assert.equal(calculatePortfolioValue([stock], new Map(), positions, opened.newCash), 1100);
    const covered = executeTrade(trade('COVER', 5), [stock], new Map(), positions, opened.newCash);
    assert.equal(covered.success, true);
    assert.equal(covered.realized, 100);
    assert.equal(covered.newCash, 1100);
    assert.equal(positions.size, 0);
});

test('a short larger than available collateral is rejected without mutating state', () => {
    const stock = { id: '1', price: 100 };
    const positions = new Map();
    const result = executeTrade(trade('SHORT', 7), [stock], new Map(), positions, 1000);
    assert.equal(result.success, false);
    assert.match(result.error, /margin/i);
    assert.equal(result.newCash, 1000);
    assert.equal(positions.size, 0);
});

test('replay rejects a forged oversized opening short', () => {
    const result = replayGame('test-seed', [trade('SHORT', 10000)], {
        initialCapital: 1000,
        totalTicks: 1
    });
    assert.equal(result.valid, false);
    assert.match(result.error, /margin/i);
});

test('a one-tick replay can score an affordable opening short without a windfall', () => {
    const result = replayGame('test-seed', [trade('SHORT', 1)], {
        initialCapital: 100000000,
        totalTicks: 0
    });
    assert.equal(result.valid, true);
    assert.equal(result.finalScore, 0);
    assert.equal(result.portfolioValue, 100000000);
});

test('trade ticks and quantities must be safe integers within the replay horizon', () => {
    assert.equal(validateTradeLogs([trade('SHORT', 1)], 1).valid, true);
    assert.equal(validateTradeLogs([{ ...trade('SHORT', 1), tick: 2 }], 1).valid, false);
    assert.equal(validateTradeLogs([{ ...trade('SHORT', 1), tick: 0.5 }], 1).valid, false);
    assert.equal(validateTradeLogs([trade('SHORT', 1.5)], 1).valid, false);
    assert.equal(validateTradeLogs([trade('SHORT', Number.MAX_SAFE_INTEGER + 1)], 1).valid, false);
    assert.equal(validateTradeLogs([null], 1).valid, false);
});

test('a caller cannot request an unbounded replay before database access', async () => {
    const payload = {
        meta: {
            seasonId: 'test-season',
            engineVersion: '3.0.0',
            clientVersion: '3.0.0',
            startedAt: 0,
            endedAt: 1,
            initialCapital: 1000,
            totalTicks: 120001
        },
        tradeLogs: [],
        checksum: ''
    };
    const result = await submitScore(payload, 'test-user', null);
    assert.equal(result.success, false);
    assert.equal(result.errorCode, 'INVALID_INPUT');
    assert.match(result.error, /totalTicks/);
});

test('score submission is closed by default before database or replay work', async () => {
    const previous = process.env.UNSAFE_ALLOW_UNVERIFIED_SCORE_SUBMISSION;
    delete process.env.UNSAFE_ALLOW_UNVERIFIED_SCORE_SUBMISSION;
    try {
        const result = await submitScore({
            meta: {
                seasonId: 'test-season',
                engineVersion: '3.0.0',
                clientVersion: '3.0.0',
                startedAt: 0,
                endedAt: 1,
                initialCapital: 1000,
                totalTicks: 1
            },
            tradeLogs: [],
            checksum: '00000000'
        }, 'test-user', null);
        assert.equal(result.success, false);
        assert.equal(result.errorCode, 'SUBMISSION_DISABLED');
    } finally {
        if (previous === undefined) {
            delete process.env.UNSAFE_ALLOW_UNVERIFIED_SCORE_SUBMISSION;
        } else {
            process.env.UNSAFE_ALLOW_UNVERIFIED_SCORE_SUBMISSION = previous;
        }
    }
});

test('unsafe override requires the exact true value and still validates input', async () => {
    const previous = process.env.UNSAFE_ALLOW_UNVERIFIED_SCORE_SUBMISSION;
    try {
        for (const value of ['1', 'TRUE', 'false', '']) {
            process.env.UNSAFE_ALLOW_UNVERIFIED_SCORE_SUBMISSION = value;
            assert.equal(isScoreSubmissionEnabled(), false);
        }
        process.env.UNSAFE_ALLOW_UNVERIFIED_SCORE_SUBMISSION = 'true';
        assert.equal(isScoreSubmissionEnabled(), true);
        const result = await submitScore({
            meta: {
                seasonId: 'test-season',
                engineVersion: '3.0.0',
                clientVersion: '3.0.0',
                startedAt: 0,
                endedAt: 1,
                initialCapital: 1000,
                totalTicks: 1
            },
            tradeLogs: [{ ...trade('BUY', 1), tick: 2 }],
            checksum: '00000000'
        }, 'test-user', null);
        assert.equal(result.success, false);
        assert.equal(result.errorCode, 'INVALID_INPUT');
        assert.match(result.error, /trade log/);
    } finally {
        if (previous === undefined) {
            delete process.env.UNSAFE_ALLOW_UNVERIFIED_SCORE_SUBMISSION;
        } else {
            process.env.UNSAFE_ALLOW_UNVERIFIED_SCORE_SUBMISSION = previous;
        }
    }
});
