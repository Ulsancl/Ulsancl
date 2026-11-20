#!/usr/bin/env node
// A fixture-only dry run. No Firebase SDK, account lookups, persistence, or trade execution.
const { createAccount, validateAccount, valuation } = require('../functions/lib/desk/broker')
const { quote } = require('../functions/lib/desk/market')
const { instrument, money } = require('../functions/lib/desk/model')

const LEGACY_REF = 'caef63a08c462e50e52e74536f9a63f7e6208957'

// Frozen maintenance part of marginFor at LEGACY_REF. Before #33, all marked
// short liabilities were subtracted at portfolio level, even when covered.
// Keep the original collateral- and spread-matching order and round once at
// the end. Current valuation is the source of truth for the new requirement.
function legacyMaintenance(account, market) {
  let gross = 0
  let shortLiabilities = 0
  const longOptions = new Map()
  const shares = new Map()
  for (const p of account.positions) {
    if (p.quantity <= 0) continue
    const { kind } = instrument(p.instrumentId)
    if (kind === 'option') longOptions.set(p.instrumentId, p.quantity)
    else if (kind !== 'future') shares.set(p.instrumentId, p.quantity)
  }
  for (const p of account.positions) {
    const a = instrument(p.instrumentId)
    const price = quote(a.id, market).price
    const notional = Math.abs(p.quantity) * price * a.multiplier
    if (a.kind === 'future') {
      gross += notional * 0.12
      continue
    }
    if (p.quantity >= 0) continue
    shortLiabilities += notional
    if (a.kind !== 'option') {
      gross += notional * 1.25
      continue
    }

    let remaining = -p.quantity
    if (a.right === 'call') {
      const available = shares.get(a.underlying) || 0
      const covered = Math.min(remaining, Math.floor(available / a.multiplier))
      remaining -= covered
      shares.set(a.underlying, available - covered * a.multiplier)
    }
    for (const [id, quantity] of longOptions) {
      const long = instrument(id)
      if (
        long.underlying !== a.underlying ||
        long.expiry !== a.expiry ||
        long.right !== a.right ||
        !remaining
      )
        continue
      const matched = Math.min(remaining, quantity)
      const width = Math.max(0, a.right === 'call' ? long.strike - a.strike : a.strike - long.strike)
      gross += width * matched * a.multiplier
      remaining -= matched
      longOptions.set(id, quantity - matched)
    }
    if (remaining) {
      const underlying = quote(a.underlying, market).price
      const otm = Math.max(0, a.right === 'call' ? a.strike - underlying : underlying - a.strike)
      const reserve =
        (price + Math.max(underlying * 0.2 - otm, underlying * 0.1)) * remaining * a.multiplier
      gross += reserve * 0.8
    }
  }
  return Math.max(0, money(gross - shortLiabilities))
}

function reasons(cash, equity, maintenance) {
  const result = []
  if (cash < 0) result.push('negative-cash')
  if (equity < maintenance) result.push('below-maintenance')
  return result
}

function syntheticFixtures() {
  // Construct stress snapshots explicitly; this is not a historical price path.
  const market = { seed: 'margin-preview-fixture-v1', scenario: 'sandbox', tick: 390 }
  const position = (instrumentId, quantity, average) => ({
    instrumentId,
    quantity,
    average,
    openedTick: 0,
  })
  const book = () => [
    position('index', 10, 35000),
    position('index-call-30000-20', -1, 5000),
    position('gold-future', 3, 230000),
  ]
  const fixture = (id, description, cash, positions = []) => ({
    id,
    description,
    market,
    account: { ...createAccount(market.scenario), cash, tick: market.tick, positions },
  })
  return [
    fixture('no-positions', 'Cash only: neither rule requires maintenance.', 10000000),
    fixture('covered-new-candidate', 'Covered index call + unrelated gold futures, equity between thresholds.', 25000, book()),
    fixture('covered-still-healthy', 'Same positions with enough cash for the new requirement.', 75000, book()),
    fixture('covered-already-below', 'Same positions with negative equity: already flagged by the old rule.', 10000, book()),
    fixture('cash-deficit', 'Long ETF with positive equity; negative cash independently triggers both rules.', -1000, [position('index', 10, 35000)]),
    fixture('spot-short-only', 'The 25% net maintenance rule for a lone short spot is unchanged.', 10000000, [position('nova', -1, 72000)]),
    fixture('vertical-with-partial-cover', 'Two short calls; shares cover one, a higher-strike long covers the other.', 10000000, [
      position('index', 10, 35000),
      position('index-call-30000-20', -2, 5000),
      position('index-call-40000-20', 1, 1000),
    ]),
  ]
}

function compareFixture(fixture) {
  const { id, description, market } = fixture
  const account = validateAccount(fixture.account)
  // Compare the same mark-to-market state at the same tick, after expiry
  // processing and before any liquidation. Legacy prices differed after expiry.
  if (
    account.status !== 'active' ||
    account.tick >= account.endTick ||
    account.tick !== market.tick ||
    account.scenario !== market.scenario ||
    account.positions.some((p) => {
      const expiry = instrument(p.instrumentId).expiry
      return expiry !== undefined && expiry <= market.tick
    })
  )
    throw new Error('Preview requires a consistent active fixture with no unsettled expiry.')

  const { equity, maintenanceMargin: current } = valuation(account, market)
  const cash = account.cash
  const legacy = legacyMaintenance(account, market)
  const before = reasons(cash, equity, legacy)
  const after = reasons(cash, equity, current)
  const classification = before.length ? (after.length ? 'both' : 'legacy-only') : (after.length ? 'new-only' : 'neither')
  return {
    id,
    description,
    scenario: market.scenario,
    tick: market.tick,
    cash,
    equity,
    legacyMaintenance: legacy,
    currentMaintenance: current,
    maintenanceChange: current - legacy,
    legacyReasons: before,
    currentReasons: after,
    classification,
  }
}

function dryRun() {
  const fixtures = syntheticFixtures().map(compareFixture)
  return {
    source: 'built-in-synthetic-fixtures',
    currency: 'KRW',
    legacyBaseCommit: LEGACY_REF,
    currentRule: 'checked-out functions/lib/desk/broker.valuation (rebuild before use)',
    newCandidates: fixtures.filter((fixture) => fixture.classification === 'new-only').map((fixture) => fixture.id),
    fixtures,
  }
}

function main(args) {
  if (args.length > 1 || (args.length === 1 && args[0] !== '--json')) {
    console.error('Usage: node scripts/desk-liquidation-preview.cjs [--json]')
    console.error('Only built-in synthetic fixtures are used; input files are not accepted.')
    return 2
  }
  const report = dryRun()
  if (args[0] === '--json') {
    console.log(JSON.stringify(report, null, 2))
    return 0
  }
  console.log('Synthetic-only liquidation preview (KRW; no account changes)')
  console.log('Legacy base: ' + report.legacyBaseCommit)
  console.log('Old: subtract marked short liabilities across the whole portfolio.')
  console.log('New: net within each position or spread; a covered call cannot offset unrelated futures.')
  console.log('New candidates: ' + (report.newCandidates.join(', ') || 'none'))
  console.table(report.fixtures.map((fixture) => ({
    fixture: fixture.id,
    cash: fixture.cash,
    equity: fixture.equity,
    old: fixture.legacyMaintenance,
    new: fixture.currentMaintenance,
    change: fixture.maintenanceChange,
    classification: fixture.classification,
  })))
  return 0
}

if (require.main === module) process.exitCode = main(process.argv.slice(2))
module.exports = { compareFixture, dryRun, syntheticFixtures }
