import {
  Account,
  Market,
  OrderInput,
  PendingOrder,
  Fill,
  TICKS_PER_DAY,
  MAX_TICK,
  MAX_ORDERS,
  MAX_FILLS,
  DESK_VERSION,
  instrument,
  scenarioById,
  money,
  validOrder,
  finiteInteger,
} from './model'
import { quote, executionPrice } from './market'
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const sign = (side: string) => (side === 'buy' ? 1 : -1)
export function createAccount(scenario: string, startedTick = 0): Account {
  const s = scenarioById(scenario)
  finiteInteger(startedTick, 0, MAX_TICK - s.horizon, '시작 시간이 올바르지 않습니다.')
  return {
    version: DESK_VERSION,
    scenario,
    startedTick,
    tick: startedTick,
    endTick: startedTick + s.horizon,
    initialCapital: s.capital,
    cash: s.capital,
    positions: [],
    orders: [],
    fills: [],
    equityHistory: [{ tick: startedTick, equity: s.capital, benchmark: s.capital }],
    peakEquity: s.capital,
    maxDrawdown: 0,
    fees: 0,
    dividends: 0,
    financing: 0,
    realized: 0,
    trades: 0,
    closedTrades: 0,
    winningTrades: 0,
    liquidationCount: 0,
    status: 'active',
    sequence: 0,
    assetClassesTraded: [],
    longestHold: 0,
    hedged: false,
  }
}
function marginFor(account: Account, market: Market) {
  let initial = 0,
    maintenance = 0,
    liabilities = 0
  const longOptions = new Map(
    account.positions
      .filter((p) => instrument(p.instrumentId).kind === 'option' && p.quantity > 0)
      .map((p) => [p.instrumentId, p.quantity])
  )
  const shares = new Map(
    account.positions
      .filter(
        (p) => !['future', 'option'].includes(instrument(p.instrumentId).kind) && p.quantity > 0
      )
      .map((p) => [p.instrumentId, p.quantity])
  )
  for (const p of account.positions) {
    const a = instrument(p.instrumentId),
      price = quote(a.id, market).price,
      notional = Math.abs(p.quantity) * price * a.multiplier
    if (a.kind === 'future') {
      initial += notional * 0.2
      maintenance += notional * 0.12
      continue
    }
    if (p.quantity >= 0) continue
    liabilities += notional
    if (a.kind !== 'option') {
      initial += notional * 1.5
      maintenance += notional * 1.25
      continue
    }
    let remaining = -p.quantity
    if (a.right === 'call') {
      const available = shares.get(a.underlying!) || 0,
        covered = Math.min(remaining, Math.floor(available / a.multiplier))
      remaining -= covered
      shares.set(a.underlying!, available - covered * a.multiplier)
    }
    // A matching long leg can cover one short leg only. Reserve worst cash settlement.
    for (const [id, quantity] of longOptions) {
      const long = instrument(id)
      if (
        long.underlying !== a.underlying ||
        long.expiry !== a.expiry ||
        long.right !== a.right ||
        !remaining
      )
        continue
      const matched = Math.min(remaining, quantity),
        width = Math.max(
          0,
          a.right === 'call' ? long.strike! - a.strike! : a.strike! - long.strike!
        )
      initial += width * matched * a.multiplier
      maintenance += width * matched * a.multiplier
      remaining -= matched
      longOptions.set(id, quantity - matched)
    }
    if (remaining) {
      const underlying = quote(a.underlying!, market).price
      const otm = Math.max(0, a.right === 'call' ? a.strike! - underlying : underlying - a.strike!)
      const reserve =
        (price + Math.max(underlying * 0.2 - otm, underlying * 0.1)) * remaining * a.multiplier
      initial += reserve
      maintenance += reserve * 0.8
    }
  }
  return { initial: money(initial), maintenance: Math.max(0, money(maintenance - liabilities)) }
}
function orderReserve(o: PendingOrder, account: Account, market: Market): number {
  if (o.reduceOnly) return 0
  const a = instrument(o.instrumentId),
    p = account.positions.find((p) => p.instrumentId === a.id)
  const price = Math.max(o.price || 0, quote(a.id, market).price)
  if (a.kind === 'future') return price * o.remaining * a.multiplier * 0.21
  if (o.side === 'buy') return price * o.remaining * a.multiplier * 1.01
  const uncovered = Math.max(0, o.remaining - Math.max(0, p?.quantity || 0))
  return a.kind === 'option'
    ? uncovered * quote(a.underlying!, market).price * a.multiplier * 0.3
    : uncovered * price * 0.51
}
export function valuation(account: Account, market: Market) {
  let equity = account.cash,
    marketValue = 0,
    futuresPnl = 0,
    unrealized = 0,
    grossExposure = 0,
    deltaExposure = 0
  const positions = account.positions.map((p) => {
    const asset = instrument(p.instrumentId),
      q = quote(asset.id, market),
      pnl = money((q.price - p.average) * p.quantity * asset.multiplier),
      value = money(q.price * p.quantity * asset.multiplier)
    unrealized += pnl
    grossExposure += Math.abs(value)
    const delta =
      q.delta *
      p.quantity *
      asset.multiplier *
      (asset.underlying ? quote(asset.underlying, market).price : q.price)
    deltaExposure += delta
    if (asset.kind === 'future') {
      equity += pnl
      futuresPnl += pnl
    } else {
      equity += value
      marketValue += value
    }
    return { ...p, asset, price: q.price, value, pnl, delta, greeks: q }
  })
  const margin = marginFor(account, market),
    reservedOrders = money(
      account.orders.reduce((sum, o) => sum + orderReserve(o, account, market), 0)
    )
  return {
    equity: money(equity),
    cash: account.cash,
    marketValue: money(marketValue),
    unrealized: money(unrealized),
    futuresPnl,
    grossExposure: money(grossExposure),
    deltaExposure: money(deltaExposure),
    initialMargin: margin.initial,
    maintenanceMargin: margin.maintenance,
    reservedOrders,
    available: money(account.cash + futuresPnl - margin.initial - reservedOrders),
    returnRate: equity / account.initialCapital - 1,
    positions,
  }
}
function appendFill(account: Account, value: Omit<Fill, 'id'>) {
  account.fills.unshift({ id: 'fill-' + ++account.sequence, ...value })
  account.fills = account.fills.slice(0, MAX_FILLS)
}
function fill(
  account: Account,
  order: OrderInput,
  quantity: number,
  price: number,
  reason: string
): void {
  const a = instrument(order.instrumentId),
    signed = sign(order.side) * quantity,
    p = account.positions.find((p) => p.instrumentId === a.id),
    oldQty = p?.quantity || 0
  const closing =
    oldQty && Math.sign(oldQty) !== Math.sign(signed) ? Math.min(Math.abs(oldQty), quantity) : 0
  const realized = closing
    ? money((price - p!.average) * closing * Math.sign(oldQty) * a.multiplier)
    : 0
  const fee = Math.max(1, Math.ceil((price * quantity * a.multiplier * a.feeBps) / 10000))
  account.cash += a.kind === 'future' ? realized - fee : -money(signed * price * a.multiplier) - fee
  const newQty = oldQty + signed
  if (p) {
    account.longestHold = Math.max(account.longestHold, account.tick - p.openedTick)
    if (!newQty) account.positions = account.positions.filter((item) => item !== p)
    else if (Math.sign(newQty) !== Math.sign(oldQty)) {
      p.quantity = newQty
      p.average = price
      p.openedTick = account.tick
    } else {
      if (Math.sign(oldQty) === Math.sign(signed))
        p.average = (Math.abs(oldQty) * p.average + quantity * price) / Math.abs(newQty)
      p.quantity = newQty
    }
  } else
    account.positions.push({
      instrumentId: a.id,
      quantity: signed,
      average: price,
      openedTick: account.tick,
    })
  account.fees += fee
  account.realized += realized - fee
  account.trades++
  if (closing) {
    account.closedTrades++
    if (realized > fee) account.winningTrades++
  }
  if (!account.assetClassesTraded.includes(a.kind)) account.assetClassesTraded.push(a.kind)
  account.hedged ||=
    account.positions.some((p) => p.quantity > 0 && p.instrumentId === 'index') &&
    account.positions.some(
      (p) =>
        instrument(p.instrumentId).underlying === 'index' &&
        ((instrument(p.instrumentId).kind === 'future' && p.quantity < 0) ||
          (instrument(p.instrumentId).right === 'put' && p.quantity > 0))
    )
  appendFill(account, {
    tick: account.tick,
    instrumentId: a.id,
    side: order.side,
    quantity,
    price,
    fee,
    realized: realized - fee,
    reason,
  })
}
function checkOpen(account: Account, market: Market, order: OrderInput) {
  if (account.status !== 'active' || account.tick >= account.endTick)
    throw new Error('종료된 투자 기록에는 주문할 수 없습니다.')
  if (market.tick !== account.tick || market.scenario !== account.scenario)
    throw new Error('계좌와 시세의 기준 시간이 다릅니다.')
  const a = instrument(order.instrumentId)
  if (a.expiry && a.expiry <= account.tick) throw new Error('만기가 지난 파생상품입니다.')
  const current = account.positions.find((p) => p.instrumentId === a.id)?.quantity || 0
  if (
    order.reduceOnly &&
    (!current || Math.sign(current) === sign(order.side) || order.quantity > Math.abs(current))
  )
    throw new Error('청산 전용 주문은 보유 포지션을 줄이는 수량이어야 합니다.')
}
function assertRisk(before: Account, after: Account, market: Market, reducing: boolean) {
  const b = valuation(before, market),
    a = valuation(after, market)
  if (![after.cash, a.equity, a.available, a.grossExposure].every(Number.isSafeInteger))
    throw new Error('계산 가능한 금액 범위를 초과했습니다.')
  if (a.equity <= 0) throw new Error('순자산이 부족합니다.')
  if (after.positions.some((p) => Math.abs(p.quantity) > 1000000))
    throw new Error('상품별 보유 수량 한도를 초과했습니다.')
  if (a.grossExposure > after.initialCapital * 10 && !reducing)
    throw new Error('총 익스포저는 시작 자본의 10배를 넘을 수 없습니다.')
  if (
    a.available < 0 &&
    !(
      reducing &&
      a.initialMargin <= b.initialMargin &&
      a.available >= b.available - (after.fees - before.fees) - 1
    )
  )
    throw new Error('주문 가능 현금 또는 증거금이 부족합니다.')
  if (a.equity < a.maintenanceMargin && !reducing)
    throw new Error('유지 증거금 기준을 충족하지 못합니다.')
}
export function previewOrder(account: Account, market: Market, input: unknown) {
  const order = validOrder(input),
    a = instrument(order.instrumentId),
    price = executionPrice(a.id, order.side, order.quantity, market)
  return {
    price,
    fee: Math.max(1, Math.ceil((price * order.quantity * a.multiplier * a.feeBps) / 10000)),
    notional: money(price * order.quantity * a.multiplier),
    multiplier: a.multiplier,
    mark: quote(a.id, market).price,
  }
}
function capacity(id: string, market: Market) {
  const a = instrument(id)
  return Math.max(
    1,
    Math.floor(a.liquidity / (Math.max(1, quote(id, market).price) * a.multiplier * TICKS_PER_DAY))
  )
}
export function placeOrder(account: Account, market: Market, input: unknown): Account {
  const order = validOrder(input)
  checkOpen(account, market, order)
  const next = clone(account)
  if (order.type !== 'market') {
    if (next.orders.length >= MAX_ORDERS) throw new Error('미체결 주문은 최대 32개까지 가능합니다.')
    next.orders.push({
      ...order,
      id: 'order-' + ++next.sequence,
      createdTick: next.tick,
      expiresTick: Math.min(
        next.endTick,
        (Math.floor(next.tick / TICKS_PER_DAY) + 1) * TICKS_PER_DAY
      ),
      remaining: order.quantity,
    })
    assertRisk(account, next, market, order.reduceOnly === true)
    return next
  }
  const quantity = Math.min(order.quantity, capacity(order.instrumentId, market)),
    current = account.positions.find((p) => p.instrumentId === order.instrumentId)?.quantity || 0
  const reducing =
    current !== 0 && Math.sign(current) !== sign(order.side) && quantity <= Math.abs(current)
  fill(
    next,
    order,
    quantity,
    executionPrice(order.instrumentId, order.side, quantity, market),
    quantity < order.quantity ? '시장가 · 잔량 IOC 취소' : '시장가'
  )
  assertRisk(account, next, market, reducing)
  return next
}
export function placeBasket(account: Account, market: Market, inputs: unknown[]): Account {
  if (!Array.isArray(inputs) || inputs.length < 2 || inputs.length > 4)
    throw new Error('전략 주문은 2~4개 레그로 구성하세요.')
  const orders = inputs.map(validOrder),
    next = clone(account)
  if (new Set(orders.map((o) => o.instrumentId)).size !== orders.length)
    throw new Error('같은 상품을 중복 레그로 보낼 수 없습니다.')
  for (const o of orders) {
    if (o.type !== 'market') throw new Error('동시 전략 주문은 시장가만 지원합니다.')
    checkOpen(account, market, o)
    if (o.quantity > capacity(o.instrumentId, market))
      throw new Error('전략 주문 수량이 현재 모형 유동성을 초과합니다.')
    fill(
      next,
      o,
      o.quantity,
      executionPrice(o.instrumentId, o.side, o.quantity, market),
      '동시 전략 주문'
    )
  }
  const before = valuation(account, market),
    after = valuation(next, market)
  assertRisk(
    account,
    next,
    market,
    after.grossExposure <= before.grossExposure && after.initialMargin <= before.initialMargin
  )
  return next
}
export function cancelOrder(account: Account, id: string): Account {
  if (!account.orders.some((o) => o.id === id)) throw new Error('미체결 주문을 찾을 수 없습니다.')
  return { ...account, orders: account.orders.filter((o) => o.id !== id) }
}
function settle(account: Account, market: Market) {
  for (const p of [...account.positions]) {
    const a = instrument(p.instrumentId)
    if (!a.expiry || a.expiry > account.tick) continue
    const price = quote(a.id, { ...market, tick: a.expiry }).price,
      pnl = money((price - p.average) * p.quantity * a.multiplier)
    account.cash += a.kind === 'future' ? pnl : money(price * p.quantity * a.multiplier)
    account.realized += pnl
    account.closedTrades++
    if (pnl > 0) account.winningTrades++
    account.longestHold = Math.max(account.longestHold, account.tick - p.openedTick)
    appendFill(account, {
      tick: account.tick,
      instrumentId: a.id,
      side: p.quantity > 0 ? 'sell' : 'buy',
      quantity: Math.abs(p.quantity),
      price,
      fee: 0,
      realized: pnl,
      reason: '만기 현금 정산',
    })
    account.positions = account.positions.filter((item) => item !== p)
  }
  account.orders = account.orders.filter(
    (o) => !instrument(o.instrumentId).expiry || instrument(o.instrumentId).expiry! > account.tick
  )
}
function liquidate(account: Account, market: Market) {
  const v = valuation(account, market)
  if (v.equity >= v.maintenanceMargin && account.cash >= 0) return
  account.orders = []
  account.liquidationCount++
  for (const p of [...account.positions]) {
    const side = p.quantity > 0 ? 'sell' : 'buy'
    fill(
      account,
      { instrumentId: p.instrumentId, side, quantity: Math.abs(p.quantity), type: 'market' },
      Math.abs(p.quantity),
      executionPrice(p.instrumentId, side, Math.abs(p.quantity), market),
      '증거금 강제 청산'
    )
  }
  if (account.cash <= 0) account.status = 'insolvent'
}
function processOrders(account: Account, market: Market) {
  account.orders = account.orders.filter((o) => o.expiresTick > account.tick)
  for (const order of [...account.orders]) {
    const mark = quote(order.instrumentId, market).price
    const triggered =
      order.triggered ||
      (order.type === 'limit'
        ? order.side === 'buy'
          ? mark <= order.price!
          : mark >= order.price!
        : order.side === 'buy'
          ? mark >= order.price!
          : mark <= order.price!)
    if (!triggered) continue
    if (order.type === 'stop') order.triggered = true
    let quantity = Math.min(order.remaining, capacity(order.instrumentId, market))
    if (order.reduceOnly)
      quantity = Math.min(
        quantity,
        Math.abs(
          account.positions.find((p) => p.instrumentId === order.instrumentId)?.quantity || 0
        )
      )
    if (!quantity) {
      account.orders = account.orders.filter((o) => o.id !== order.id)
      continue
    }
    const price = executionPrice(order.instrumentId, order.side, quantity, market)
    if (
      order.type === 'limit' &&
      (order.side === 'buy' ? price > order.price! : price < order.price!)
    )
      continue
    const prior = clone(account),
      current = account.positions.find((p) => p.instrumentId === order.instrumentId)?.quantity || 0
    const reducing =
      current !== 0 && Math.sign(current) !== sign(order.side) && quantity <= Math.abs(current)
    if (order.reduceOnly && !reducing) {
      account.orders = account.orders.filter((o) => o.id !== order.id)
      continue
    }
    account.orders.find((o) => o.id === order.id)!.remaining -= quantity
    account.orders = account.orders.filter((o) => o.remaining > 0)
    fill(account, order, quantity, price, order.type === 'limit' ? '지정가 체결' : '스톱 체결')
    try {
      assertRisk(prior, account, market, reducing)
    } catch {
      Object.assign(account, prior)
      account.orders = account.orders.filter((o) => o.id !== order.id)
    }
  }
}
function closeDay(account: Account, market: Market) {
  let dividend = 0,
    financing = 0
  for (const p of account.positions) {
    const a = instrument(p.instrumentId),
      price = quote(a.id, market).price
    if (Math.floor(account.tick / TICKS_PER_DAY) % 21 === 0 && a.dividend)
      dividend += money(
        (((p.quantity * price) / (1 - a.dividend / 12)) * a.multiplier * a.dividend) / 12
      )
    if (p.quantity < 0 && !['future', 'option'].includes(a.kind))
      financing += Math.ceil((-p.quantity * price * a.multiplier * 0.03) / 252)
    account.longestHold = Math.max(account.longestHold, account.tick - p.openedTick)
  }
  account.cash += dividend - financing
  account.dividends += dividend
  account.financing += financing
  const equity = valuation(account, market).equity
  account.peakEquity = Math.max(account.peakEquity, equity)
  account.maxDrawdown = Math.max(account.maxDrawdown, 1 - equity / account.peakEquity)
  const benchmark = money(
    (account.initialCapital * quote('index', market).price) /
      quote('index', { ...market, tick: account.startedTick }).price
  )
  account.equityHistory.push({ tick: account.tick, equity, benchmark })
  account.equityHistory = account.equityHistory.slice(-367)
}
export function advanceAccount(
  account: Account,
  market: Omit<Market, 'tick'>,
  target: number,
  budget = 4000
): Account {
  finiteInteger(
    target,
    account.tick,
    Math.min(MAX_TICK, account.endTick),
    '진행 시간이 올바르지 않습니다.'
  )
  finiteInteger(budget, 1, 5000, '계산 예산이 올바르지 않습니다.')
  if (account.status !== 'active') return clone(account)
  if (market.scenario !== account.scenario) throw new Error('캠페인 시세가 일치하지 않습니다.')
  const next = clone(account)
  let iterations = 0
  while (next.tick < target && iterations++ < budget && next.status === 'active') {
    const simple =
      next.orders.length === 0 &&
      next.positions.every(
        (p) => p.quantity > 0 && !['future', 'option'].includes(instrument(p.instrumentId).kind)
      )
    next.tick = simple
      ? Math.min(target, (Math.floor(next.tick / TICKS_PER_DAY) + 1) * TICKS_PER_DAY)
      : next.tick + 1
    const now = { ...market, tick: next.tick }
    settle(next, now)
    if (next.tick % TICKS_PER_DAY === 0) closeDay(next, now)
    liquidate(next, now)
    if (next.status === 'active') processOrders(next, now)
    if (next.tick % TICKS_PER_DAY === 0) {
      const equity = valuation(next, now).equity
      next.equityHistory[next.equityHistory.length - 1].equity = equity
      next.peakEquity = Math.max(next.peakEquity, equity)
      next.maxDrawdown = Math.max(next.maxDrawdown, 1 - equity / next.peakEquity)
    }
  }
  if (next.tick >= next.endTick && next.status === 'active') {
    next.status = 'completed'
    next.orders = []
  }
  const v = valuation(next, { ...market, tick: next.tick })
  if (!Number.isSafeInteger(v.equity) || !Number.isSafeInteger(next.cash))
    throw new Error('계좌 계산 범위를 초과했습니다.')
  return next
}
export function performance(account: Account, market: Market) {
  const v = valuation(account, market),
    past = (days: number): number | null => {
      const tick = account.tick - days * TICKS_PER_DAY
      if (tick < account.startedTick) return null
      const p = [...account.equityHistory].reverse().find((p) => p.tick <= tick)
      return p && p.equity > 0 ? v.equity / p.equity - 1 : null
    }
  return { day: past(1), week: past(5), month: past(20), season: v.returnRate }
}
export function objectives(account: Account, market: Market) {
  const v = valuation(account, market),
    s = scenarioById(account.scenario),
    intraday = account.scenario === 'intraday'
  return [
    {
      id: 'learn',
      title: intraday ? '왕복 거래 5회' : '3개 자산군 거래',
      current: intraday ? account.closedTrades : account.assetClassesTraded.length,
      target: intraday ? 5 : 3,
      complete: intraday ? account.closedTrades >= 5 : account.assetClassesTraded.length >= 3,
    },
    {
      id: 'return',
      title: '목표 수익률 ' + (s.target * 100).toFixed(1) + '%',
      current: v.returnRate * 100,
      target: s.target * 100,
      complete: v.returnRate >= s.target,
    },
    {
      id: 'risk',
      title:
        account.scenario === 'hedge'
          ? '보호 헤지 실행 · 강제 청산 0회'
          : '낙폭 ' + Math.round(s.drawdownLimit * 100) + '% 이내',
      current: account.maxDrawdown * 100,
      target: s.drawdownLimit * 100,
      complete:
        account.liquidationCount === 0 &&
        account.maxDrawdown <= s.drawdownLimit &&
        (account.scenario !== 'hedge' || account.hedged),
    },
  ]
}
export function validateAccount(value: unknown): Account {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('계좌 데이터가 올바르지 않습니다.')
  const a = value as Account
  const known = new Set(Object.keys(createAccount('foundation')))
  if (Object.keys(a).some((key) => !known.has(key)))
    throw new Error('저장에 지원하지 않는 항목이 있습니다.')
  if (a.version !== DESK_VERSION) throw new Error('지원하지 않는 저장 버전입니다.')
  scenarioById(a.scenario)
  for (const k of ['startedTick', 'tick', 'endTick'] as const)
    finiteInteger(a[k], 0, MAX_TICK, '저장된 시간이 올바르지 않습니다.')
  if (
    a.startedTick > a.tick ||
    a.tick > a.endTick ||
    !['active', 'completed', 'insolvent'].includes(a.status)
  )
    throw new Error('저장된 진행 상태가 올바르지 않습니다.')
  for (const k of [
    'initialCapital',
    'cash',
    'peakEquity',
    'fees',
    'dividends',
    'financing',
    'realized',
    'trades',
    'closedTrades',
    'winningTrades',
    'liquidationCount',
    'sequence',
    'longestHold',
  ] as const)
    if (typeof a[k] !== 'number' || !Number.isSafeInteger(a[k]) || Math.abs(a[k]) > 1000000000000)
      throw new Error('저장된 금액 또는 통계가 올바르지 않습니다.')
  if (
    a.initialCapital !== scenarioById(a.scenario).capital ||
    [
      'fees',
      'financing',
      'trades',
      'closedTrades',
      'winningTrades',
      'liquidationCount',
      'sequence',
      'longestHold',
    ].some((k) => (a[k as keyof Account] as number) < 0) ||
    !Number.isFinite(a.maxDrawdown) ||
    a.maxDrawdown < 0 ||
    a.maxDrawdown > 100 ||
    typeof a.hedged !== 'boolean'
  )
    throw new Error('저장된 위험 지표가 올바르지 않습니다.')
  if (
    !Array.isArray(a.positions) ||
    a.positions.length > 64 ||
    new Set(a.positions.map((p) => p.instrumentId)).size !== a.positions.length
  )
    throw new Error('보유 상품 목록이 올바르지 않습니다.')
  for (const p of a.positions) {
    instrument(p.instrumentId)
    finiteInteger(p.quantity, -1000000, 1000000, '보유 수량 오류')
    if (!p.quantity || !Number.isFinite(p.average) || p.average <= 0 || p.average > 10000000000)
      throw new Error('평균 단가 오류')
    finiteInteger(p.openedTick, a.startedTick, a.tick, '보유 시각 오류')
  }
  if (!Array.isArray(a.orders) || a.orders.length > MAX_ORDERS)
    throw new Error('미체결 주문 수 오류')
  for (const o of a.orders) {
    validOrder(o)
    if (!/^order-\d+$/.test(o.id)) throw new Error('주문 식별자 오류')
    finiteInteger(o.remaining, 1, o.quantity, '잔량 오류')
    finiteInteger(o.createdTick, a.startedTick, a.tick, '주문 시각 오류')
    finiteInteger(o.expiresTick, a.tick, a.endTick, '주문 유효 기간 오류')
  }
  if (
    !Array.isArray(a.fills) ||
    a.fills.length > MAX_FILLS ||
    !Array.isArray(a.equityHistory) ||
    a.equityHistory.length > 367 ||
    !Array.isArray(a.assetClassesTraded) ||
    a.assetClassesTraded.length > 8
  )
    throw new Error('저장 기록 크기 오류')
  for (const f of a.fills) {
    instrument(f.instrumentId)
    if (
      !['buy', 'sell'].includes(f.side) ||
      typeof f.reason !== 'string' ||
      f.reason.length > 120 ||
      typeof f.id !== 'string' ||
      f.id.length > 80
    )
      throw new Error('체결 기록 오류')
    finiteInteger(f.quantity, 1, 1000000, '체결 수량 오류')
    for (const k of ['price', 'fee', 'realized'] as const)
      if (!Number.isSafeInteger(f[k])) throw new Error('체결 금액 오류')
    finiteInteger(f.tick, a.startedTick, a.tick, '체결 시각 오류')
  }
  let last = -1
  for (const p of a.equityHistory) {
    finiteInteger(p.tick, a.startedTick, a.tick, '평가 시각 오류')
    if (p.tick < last || !Number.isSafeInteger(p.equity) || !Number.isSafeInteger(p.benchmark))
      throw new Error('평가 기록 오류')
    last = p.tick
  }
  const allowed = new Set(['stock', 'etf', 'bond', 'commodity', 'crypto', 'fx', 'future', 'option'])
  if (a.assetClassesTraded.some((k) => !allowed.has(k))) throw new Error('거래 자산군 오류')
  return clone(a)
}
