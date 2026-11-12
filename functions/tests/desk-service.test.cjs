const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { initializeApp, deleteApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { getAuth } = require('firebase-admin/auth')
const { deskService, syncSession, riskSweep } = require('../lib/desk/service')
const { createAccount } = require('../lib/desk/broker')
if (
  !/^127\.0\.0\.1:\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST || '') ||
  !/^127\.0\.0\.1:\d+$/.test(process.env.FIREBASE_AUTH_EMULATOR_HOST || '')
)
  throw new Error('These tests require local Firestore and Auth emulators.')
const app = initializeApp({ projectId: 'demo-stockdesk' }, 'desk-tests'),
  db = getFirestore(app),
  auth = getAuth(app)
const admin = { uid: 'operator', member: true, admin: true },
  alice = { uid: 'alice', member: true, admin: false },
  bob = { uid: 'bob', member: true, admin: false }
const start = 1800000000000
const call = (actor, data, at = start) =>
  deskService(
    db,
    actor,
    ['order', 'basket', 'cancel'].includes(data.op) ? { seasonId, ...data } : data,
    at
  )
const profile = (name = 'investor', publicRanking = true) => ({
  displayName: name,
  country: 'KR',
  region: '울산',
  ageBand: '25-34',
  publicRanking,
})
let seasonId, operatorToken, aliceToken
const token = async (uid, claims) => {
  await auth.createUser({
    uid,
    email: uid + '@example.test',
    emailVerified: true,
    password: 'Only-emulator-password-123',
  })
  if (claims) await auth.setCustomUserClaims(uid, claims)
  const response = await fetch(
    'http://' +
      process.env.FIREBASE_AUTH_EMULATOR_HOST +
      '/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: uid + '@example.test',
        password: 'Only-emulator-password-123',
        returnSecureToken: true,
      }),
    }
  )
  return (await response.json()).idToken
}
before(async () => {
  await fetch(
    'http://' +
      process.env.FIRESTORE_EMULATOR_HOST +
      '/emulator/v1/projects/demo-stockdesk/databases/(default)/documents',
    { method: 'DELETE' }
  )
  await fetch(
    'http://' +
      process.env.FIREBASE_AUTH_EMULATOR_HOST +
      '/emulator/v1/projects/demo-stockdesk/accounts',
    { method: 'DELETE' }
  )
  operatorToken = await token('operator', { admin: true })
  aliceToken = await token('alice')
  const created = await call(admin, {
    op: 'adminSeason',
    action: 'create',
    revision: 0,
    reason: 'test season',
    title: 'Test market',
    tickMs: 1000,
  })
  seasonId = created.id
  for (const actor of [alice, bob]) {
    await call(actor, { op: 'profile', profile: profile(actor.uid) })
    await call(actor, { op: 'join' })
  }
})
after(() => deleteApp(app))
test('membership and admin claims are enforced independently of supplied fields', async () => {
  await assert.rejects(
    call({ uid: null, member: false, admin: false }, { op: 'join', admin: true }),
    { code: 'unauthenticated' }
  )
  await assert.rejects(
    call({ uid: 'anon', member: false, admin: false }, { op: 'profile', profile: profile() }),
    { code: 'permission-denied' }
  )
  await assert.rejects(call(alice, { op: 'adminSeason', action: 'create', admin: true }), {
    code: 'permission-denied',
  })
  const publicData = await call({ uid: null, member: false, admin: false }, { op: 'bootstrap' })
  assert.equal(JSON.stringify(publicData).includes('seed'), false)
})
test('server owns cash, prices and time; request replay is idempotent', async () => {
  const request = {
    op: 'order',
    revision: 0,
    requestId: 'first-order',
    order: { instrumentId: 'nova', type: 'market', side: 'buy', quantity: 2 },
    cash: 1e12,
    tick: 999999,
    seed: 'client-seed',
    price: 1,
  }
  const one = await call(alice, request)
  assert.equal(one.account.positions[0].quantity, 2)
  assert.equal(one.account.tick, 0)
  assert.ok(one.account.cash < 10000000)
  assert.equal(JSON.stringify(one).includes('seed'), false)
  await assert.rejects(call(alice, { ...request, seasonId: 'another-season' }), {
    code: 'failed-precondition',
  })
  const repeat = await call(alice, request)
  assert.equal(repeat.duplicate, true)
  assert.deepEqual(repeat.account, one.account)
  await assert.rejects(call(alice, { ...request, order: { ...request.order, quantity: 3 } }), {
    code: 'invalid-argument',
  })
})
test('concurrent revision commits only one conflicting trade and join never resets wealth', async () => {
  const before = await call(bob, { op: 'join' })
  const request = {
    op: 'order',
    revision: before.revision,
    order: { instrumentId: 'index', type: 'market', side: 'buy', quantity: 1 },
  }
  const outcomes = await Promise.allSettled([
    call(bob, { ...request, requestId: 'race-a' }),
    call(bob, { ...request, requestId: 'race-b' }),
  ])
  assert.equal(outcomes.filter((r) => r.status === 'fulfilled').length, 1)
  const joined = await call(bob, { op: 'join' })
  assert.equal(joined.account.positions[0].quantity, 1)
})
test('kill switch rejects risk additions and preserves cancel/reduce-only exits', async () => {
  await call(admin, {
    op: 'adminFlags',
    revision: 1,
    newOrdersEnabled: false,
    message: 'maintenance',
    reason: 'test stop',
  })
  const session = await call(alice, { op: 'sync' })
  await assert.rejects(
    call(alice, {
      op: 'order',
      requestId: 'blocked',
      revision: session.revision,
      order: { instrumentId: 'gold', type: 'market', side: 'buy', quantity: 1 },
    }),
    { code: 'failed-precondition' }
  )
  const closed = await call(alice, {
    op: 'order',
    requestId: 'close-allowed',
    revision: session.revision,
    order: { instrumentId: 'nova', type: 'market', side: 'sell', quantity: 2, reduceOnly: true },
  })
  assert.equal(closed.account.positions.length, 0)
  await call(admin, {
    op: 'adminFlags',
    revision: 2,
    newOrdersEnabled: true,
    message: '',
    reason: 'test resume',
  })
})
test('suspended traders remain settled but cannot trade or appear in rankings', async () => {
  await call(admin, {
    op: 'adminModerate',
    action: 'suspend',
    targetUid: 'bob',
    reason: 'investigation',
  })
  const settled = await syncSession(db, 'bob', start + 60000)
  assert.equal(settled.account.tick, 60)
  await assert.rejects(
    call(
      bob,
      {
        op: 'order',
        requestId: 'suspended',
        revision: settled.revision,
        order: { instrumentId: 'gold', type: 'market', side: 'buy', quantity: 1 },
      },
      start + 60000
    ),
    { code: 'permission-denied' }
  )
  await riskSweep(db, start + 60000)
  const ranks = await call(alice, { op: 'leaderboard' }, start + 60000)
  assert.ok(!ranks.entries.some((r) => r.uid === 'bob'))
  await call(
    admin,
    { op: 'adminModerate', action: 'restore', targetUid: 'bob', reason: 'resolved' },
    start + 60000
  )
})
test('leaderboard uses one snapshot, enforces cohort size and immediately respects consent', async () => {
  for (let i = 0; i < 3; i++) {
    const actor = { uid: 'cohort' + i, member: true, admin: false }
    await call(actor, { op: 'profile', profile: profile(actor.uid) }, start + 60000)
    await call(actor, { op: 'join' }, start + 60000)
  }
  await riskSweep(db, start + 120000)
  const ranks = await call(
    alice,
    { op: 'leaderboard', country: 'KR', region: '울산', ageBand: '25-34' },
    start + 120000
  )
  assert.equal(ranks.entries.length, 5)
  assert.ok(ranks.entries.every((r) => r.tick === 120))
  await call(alice, { op: 'profile', profile: profile('alice', false) }, start + 120000)
  const hidden = await call(alice, { op: 'leaderboard', country: 'KR' }, start + 120000)
  assert.equal(hidden.cohortPending, true)
  assert.equal(hidden.entries.length, 0)
  const global = await call(alice, { op: 'leaderboard' }, start + 120000)
  assert.ok(!global.entries.some((r) => r.uid === 'alice'))
  const daily = await call(alice, { op: 'leaderboard', period: 'day' }, start + 120000)
  assert.equal(daily.entries.length, 0)
  await assert.rejects(
    call(alice, { op: 'profile', profile: { ...profile(), country: 'US' } }, start + 120000),
    { code: 'failed-precondition' }
  )
})
test('reports are private, duplicate limited, resolved with an audit trail', async () => {
  const report = await call(
    alice,
    {
      op: 'report',
      targetUid: 'bob',
      category: 'suspicious-trading',
      detail: 'Please inspect this trade.',
    },
    start + 120000
  )
  await assert.rejects(
    call(
      alice,
      { op: 'report', targetUid: 'bob', category: 'other', detail: 'duplicate' },
      start + 120000
    ),
    { code: 'resource-exhausted' }
  )
  await assert.rejects(call(bob, { op: 'adminOverview' }), { code: 'permission-denied' })
  await call(
    admin,
    {
      op: 'adminModerate',
      action: 'resolve',
      targetUid: 'bob',
      reportId: report.id,
      reason: 'no issue found',
    },
    start + 120000
  )
  const overview = await call(admin, { op: 'adminOverview' }, start + 120000)
  assert.equal(overview.reports.length, 0)
  assert.ok(overview.audit.some((a) => a.action === 'resolve' && a.reason === 'no issue found'))
})
test('risk sweep excludes terminal old accounts from the processing queue', async () => {
  const batch = db.batch()
  for (let i = 0; i < 105; i++)
    batch.set(db.doc('deskAccounts/old-' + i), {
      seasonId: 'old',
      account: { ...createAccount('sandbox'), status: 'completed' },
      updatedAt: 0,
      revision: 0,
      receipts: [],
    })
  await batch.commit()
  const result = await riskSweep(db, start + 180000)
  assert.equal(result.updated, 5)
  assert.equal(result.failed, 0)
})
test('closing season freezes the clock, settles pending orders, and prevents late trades', async () => {
  await call(
    admin,
    { op: 'adminSeason', action: 'close', revision: 3, reason: 'end of test' },
    start + 200000
  )
  const session = await call(bob, { op: 'sync' }, start + 900000)
  assert.equal(session.account.tick, 200)
  assert.equal(session.account.status, 'completed')
  assert.equal(session.account.orders.length, 0)
  await assert.rejects(
    call(
      bob,
      {
        op: 'order',
        requestId: 'too-late',
        revision: session.revision,
        order: { instrumentId: 'index', type: 'market', side: 'sell', quantity: 1 },
      },
      start + 900000
    ),
    { code: 'failed-precondition' }
  )
})
test('Firestore rules block direct account, private seed, reports and leaderboard access', async () => {
  for (const path of [
    'deskAccounts/alice',
    'deskSeasons/' + seasonId,
    'deskReports/anything',
    'deskStandings/' + seasonId,
  ]) {
    const url =
      'http://' +
      process.env.FIRESTORE_EMULATOR_HOST +
      '/v1/projects/demo-stockdesk/databases/(default)/documents/' +
      path
    const read = await fetch(url, { headers: { Authorization: 'Bearer ' + aliceToken } })
    assert.equal(read.status, 403, path)
    const write = await fetch(url, {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + aliceToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { cash: { integerValue: '999999999' } } }),
    })
    assert.equal(write.status, 403, path)
  }
})
test('real callable transport rejects missing auth and forged admin claims', async () => {
  const endpoint = 'http://127.0.0.1:5201/demo-stockdesk/us-central1/deskApi'
  const request = async (data, bearer) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(bearer ? { Authorization: 'Bearer ' + bearer } : {}),
      },
      body: JSON.stringify({ data }),
    })
    return response.json()
  }
  assert.equal((await request({ op: 'join' })).error.status, 'UNAUTHENTICATED')
  assert.equal(
    (await request({ op: 'adminOverview', admin: true }, aliceToken)).error.status,
    'PERMISSION_DENIED'
  )
  const result = await request({ op: 'adminOverview' }, operatorToken)
  assert.ok(result.result?.control, JSON.stringify(result))
  await auth.updateUser('alice', { disabled: true })
  assert.equal((await request({ op: 'bootstrap' }, aliceToken)).error.status, 'UNAUTHENTICATED')
})
