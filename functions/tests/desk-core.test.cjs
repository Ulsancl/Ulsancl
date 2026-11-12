const test = require('node:test')
const assert = require('node:assert/strict')
const {
  createAccount,
  valuation,
  placeOrder,
  placeBasket,
  advanceAccount,
  cancelOrder,
  validateAccount,
  performance,
} = require('../lib/desk/broker')
const { quote, optionValue, candles } = require('../lib/desk/market')
const { TICKS_PER_DAY, INSTRUMENTS } = require('../lib/desk/model')
const market = (tick = 0, scenario = 'sandbox') => ({
  seed: 'independent-security-fixture',
  scenario,
  tick,
})
const buy = (instrumentId, quantity = 1, extra = {}) => ({
  instrumentId,
  quantity,
  side: 'buy',
  type: 'market',
  ...extra,
})
const sell = (instrumentId, quantity = 1, extra = {}) => ({
  ...buy(instrumentId, quantity, extra),
  side: 'sell',
})
function advance(a, tick) {
  while (a.tick < tick && a.status === 'active') a = advanceAccount(a, market(), tick)
  return a
}

test('prices are deterministic, independent of order history, and finite for every instrument', () => {
  for (const tick of [0, 1, 389, 390, 7800, 98280])
    for (const a of INSTRUMENTS) {
      const q = quote(a.id, market(tick))
      assert.ok(Number.isFinite(q.price) && q.price >= 0)
      assert.deepEqual(q, quote(a.id, market(tick)))
    }
  assert.notEqual(
    quote('nova', market(390)).price,
    quote('nova', { ...market(390), seed: 'other-market' }).price
  )
})
test('European pricing satisfies put-call parity and exact expiry payoff', () => {
  const c = optionValue(100, 95, 0.5, 0.2, 'call', 0.03, 0.02),
    p = optionValue(100, 95, 0.5, 0.2, 'put', 0.03, 0.02)
  assert.ok(
    Math.abs(c.price - p.price - (100 * Math.exp(-0.02 * 0.5) - 95 * Math.exp(-0.03 * 0.5))) < 1e-8
  )
  assert.equal(optionValue(80, 100, 0, 0.2, 'put').price, 20)
  assert.ok(c.delta > 0 && c.delta < 1 && p.delta < 0 && p.delta > -1)
})
test('spot round trips conserve capital except for explicit fees and adverse spread', () => {
  const start = createAccount('sandbox'),
    owned = placeOrder(start, market(), buy('nova', 10))
  assert.equal(start.positions.length, 0)
  assert.ok(valuation(owned, market()).equity < start.cash)
  const closed = placeOrder(owned, market(), sell('nova', 10))
  assert.equal(closed.positions.length, 0)
  assert.equal(closed.cash - start.cash, closed.realized)
  assert.ok(closed.cash < start.cash - closed.fees)
  assert.equal(closed.closedTrades, 1)
})
test('short proceeds are liabilities, never an immediate score windfall', () => {
  const start = createAccount('sandbox'),
    short = placeOrder(start, market(), sell('index', 20))
  assert.ok(short.cash > start.cash)
  assert.ok(valuation(short, market()).equity < start.cash)
  assert.ok(valuation(short, market()).available < start.cash)
  assert.throws(() => placeOrder(start, market(), sell('index', 1000000)), /증거금|익스포저/)
  const covered = placeOrder(short, market(), buy('index', 20, { reduceOnly: true }))
  assert.equal(covered.positions.length, 0)
})
test('futures reserve margin without paying notional and realize close P&L once', () => {
  const start = createAccount('sandbox'),
    held = placeOrder(start, market(), buy('index-future', 2))
  assert.equal(held.cash, start.cash - held.fees)
  assert.ok(valuation(held, market()).initialMargin > 100000)
  const moved = advance(held, 10),
    before = moved.cash
  const closed = placeOrder(moved, market(10), sell('index-future', 2, { reduceOnly: true }))
  assert.equal(closed.cash - before, closed.fills[0].realized)
  assert.equal(valuation(closed, market(10)).initialMargin, 0)
})
test('a vertical spread is atomic and does not reuse its protective long leg', () => {
  const a = createAccount('sandbox')
  const spread = placeBasket(a, market(), [
    sell('index-call-35000-20', 1),
    buy('index-call-40000-20', 1),
  ])
  assert.equal(valuation(spread, market()).initialMargin, 50000)
  const extra = placeOrder(spread, market(), sell('index-call-35000-20', 1))
  assert.ok(valuation(extra, market()).initialMargin > 100000)
  assert.throws(() => placeBasket(a, market(), [buy('index', 1), buy('index', 1)]), /중복/)
  assert.equal(a.positions.length, 0)
})
test('covered calls and protective puts recognize underlying collateral and hedge exposure', () => {
  const covered = placeBasket(createAccount('sandbox'), market(), [
    buy('index', 10),
    sell('index-call-35000-20', 1),
  ])
  assert.equal(valuation(covered, market()).initialMargin, 0)
  const protectedAccount = placeBasket(createAccount('sandbox'), market(), [
    buy('index', 10),
    buy('index-put-35000-20', 1),
  ])
  assert.equal(protectedAccount.hedged, true)
  assert.ok(valuation(protectedAccount, market()).deltaExposure < 350000)
})
test('options settle exactly once at their expiry without phantom principal', () => {
  let a = placeOrder(createAccount('sandbox'), market(), buy('index-put-35000-20', 1))
  const cash = a.cash
  a = advance(a, 7800)
  assert.equal(a.positions.length, 0)
  assert.equal(a.cash, cash + quote('index-put-35000-20', market(7800)).price * 10)
  const next = advance(a, 7801)
  assert.equal(next.cash, a.cash)
  assert.equal(a.fills.filter((f) => f.reason === '만기 현금 정산').length, 1)
})
test('pending orders reserve cash, honor execution limits, and cancel without a trade', () => {
  const a = placeOrder(
    createAccount('sandbox'),
    market(),
    buy('nova', 5, { type: 'limit', price: 1 })
  )
  assert.equal(a.orders.length, 1)
  assert.ok(valuation(a, market()).reservedOrders > 0)
  const later = advance(a, 10)
  assert.equal(later.trades, 0)
  assert.equal(cancelOrder(later, later.orders[0].id).orders.length, 0)
  const expired = advance(a, TICKS_PER_DAY)
  assert.equal(expired.orders.length, 0)
  assert.equal(expired.trades, 0)
})
test('marketable limits fill at or better than their limit; reduce-only cannot open a short', () => {
  const a = placeOrder(
    createAccount('sandbox'),
    market(),
    buy('nova', 2, { type: 'limit', price: 100000 })
  )
  const b = advance(a, 1)
  assert.equal(b.positions[0].quantity, 2)
  assert.ok(b.fills[0].price <= 100000)
  assert.throws(
    () => placeOrder(createAccount('sandbox'), market(), sell('nova', 2, { reduceOnly: true })),
    /청산/
  )
})
test('invalid and non-finite orders cannot mutate an account', () => {
  const a = createAccount('sandbox')
  for (const quantity of [0, -1, 0.5, NaN, Infinity, 1000001])
    assert.throws(() => placeOrder(a, market(), buy('nova', quantity)))
  assert.throws(() => placeOrder(a, market(), buy('__proto__', 1)))
  assert.equal(a.cash, 10000000)
  assert.equal(a.positions.length, 0)
})
test('work is budgeted, timestamps cannot move backwards, and stale quotes are rejected', () => {
  let a = placeOrder(createAccount('sandbox'), market(), buy('index-future', 1))
  a = advanceAccount(a, market(), 100, 5)
  assert.equal(a.tick, 5)
  assert.throws(() => advanceAccount(a, market(), 4))
  assert.throws(() => placeOrder(a, market(), buy('nova', 1)), /기준 시간/)
})
test('empty and long-only portfolios can catch up without an unbounded minute loop', () => {
  const a = advanceAccount(createAccount('sandbox'), market(), 20 * TICKS_PER_DAY, 25)
  assert.equal(a.tick, 20 * TICKS_PER_DAY)
  assert.equal(a.equityHistory.length, 21)
  assert.deepEqual(performance(a, market(a.tick)), { day: 0, week: 0, month: 0, season: 0 })
  assert.equal(performance(createAccount('sandbox'), market()).month, null)
})
test('shorts pay distributions and borrow fees; longs receive distributions', () => {
  const start = createAccount('sandbox')
  const long = advance(placeOrder(start, market(), buy('bond', 2)), 21 * TICKS_PER_DAY)
  const short = advance(placeOrder(start, market(), sell('bond', 2)), 21 * TICKS_PER_DAY)
  assert.ok(long.dividends > 0)
  assert.ok(short.dividends < 0 && short.financing > 0)
})
test('insufficient maintenance equity liquidates and does not reset wealth', () => {
  let a = placeOrder(createAccount('sandbox'), market(), buy('index-future', 10))
  a.cash = 1
  a = advanceAccount(a, market(), 1)
  assert.equal(a.positions.length, 0)
  assert.equal(a.liquidationCount, 1)
  assert.ok(a.cash < 10000)
})
test('saved accounts reject excessive arrays, prototypes, numeric corruption and unsupported versions', () => {
  const a = createAccount('sandbox')
  assert.deepEqual(validateAccount(a), a)
  for (const bad of [
    { ...a, cash: Infinity },
    { ...a, version: 999 },
    { ...a, positions: Array(65).fill({}) },
    { ...a, tick: -1 },
    JSON.parse(JSON.stringify(a).slice(0, -1) + ',"__proto__":{}}'),
  ])
    assert.throws(() => validateAccount(bad))
})
test('OHLC candles summarize only already available minutes', () => {
  const result = candles('nova', market(11), 5, 3)
  assert.equal(result.length, 3)
  assert.equal(result.at(-1).tick, 10)
  assert.equal(result.at(-1).close, quote('nova', market(11)).price)
  for (const c of result)
    assert.ok(c.high >= c.open && c.high >= c.close && c.low <= c.open && c.low <= c.close)
  assert.throws(() => candles('nova', market(), 390, 1000000))
})
test('distributions have an ex-dividend price adjustment instead of free cash', () => {
  const { spotPrice } = require('../lib/desk/market')
  const asset = INSTRUMENTS.find((a) => a.id === 'bond'),
    tick = 21 * TICKS_PER_DAY
  const ex = spotPrice(asset, market(tick)),
    gross = spotPrice({ ...asset, dividend: 0 }, market(tick))
  assert.ok(Math.abs(ex - gross * (1 - asset.dividend / 12)) <= 1)
  let a = createAccount('sandbox', tick - 1)
  a = placeOrder(a, market(tick - 1), buy('bond', 10))
  a = advanceAccount(a, market(), tick)
  assert.ok(Math.abs(a.dividends - (gross - ex) * 10) <= 11)
})
test('partially filled stop remains triggered after price returns below its stop', () => {
  let a = createAccount('sandbox')
  a.cash = 100000000
  a.initialCapital = 100000000
  a.peakEquity = a.cash
  a = placeOrder(a, market(), buy('nova', 300, { type: 'stop', price: 1 }))
  a = advanceAccount(a, market(), 1)
  assert.ok(a.orders[0]?.triggered)
  assert.ok(a.orders[0].remaining < 300)
  a.orders[0].price = 1000000000
  const before = a.orders[0].remaining
  a = advanceAccount(a, market(), 2)
  assert.ok(!a.orders.length || a.orders[0].remaining < before)
})
