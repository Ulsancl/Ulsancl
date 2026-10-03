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
