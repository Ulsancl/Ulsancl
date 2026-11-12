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
const token = async (uid, claims, emailVerified = true) => {
  await auth.createUser({
    uid,
    email: uid + '@example.test',
    emailVerified,
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
  const publicData = await call(alice, { op: 'bootstrap' })
  assert.equal(JSON.stringify(publicData).includes('seed'), false)
})
test('unauthenticated reads do no database work; authenticated reads cannot bypass the UID quota', async () => {
  const untouched = new Proxy(
    {},
    {
      get() {
        throw new Error('unexpected database access')
      },
    }
  )
  for (const op of ['bootstrap', 'leaderboard']) {
    await assert.rejects(
      deskService(untouched, { uid: null, member: false, admin: false }, { op }, start),
      { code: 'unauthenticated' }
    )
  }
  const actor = { uid: 'read-limited', member: false, admin: false }
  await db.doc('deskLimits/' + actor.uid).set({ bucket: Math.floor(start / 60000), count: 120 })
  for (const op of ['bootstrap', 'leaderboard'])
    await assert.rejects(call(actor, { op }), { code: 'resource-exhausted' })
  await db.doc('deskLimits/' + actor.uid).delete()
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
  for (const op of ['bootstrap', 'leaderboard'])
    assert.equal((await request({ op })).error.status, 'UNAUTHENTICATED')
  assert.equal(
    (await request({ op: 'adminOverview', admin: true }, aliceToken)).error.status,
    'PERMISSION_DENIED'
  )
  const result = await request({ op: 'adminOverview' }, operatorToken)
  assert.ok(result.result?.control, JSON.stringify(result))
  await auth.updateUser('alice', { disabled: true })
  assert.equal((await request({ op: 'bootstrap' }, aliceToken)).error.status, 'UNAUTHENTICATED')
})

test('account erasure requires recent identity and fences only the caller, including unverified accounts', async () => {
  const uid = 'privacy-owner'
  await auth.createUser({ uid, email: 'privacy-owner@example.test', emailVerified: false })
  const actor = { uid, member: false, admin: false, authTime: start / 1000 }
  await db.doc('deskProfiles/' + uid).set(profile('private-name'))
  await db.doc('deskAccounts/' + uid).set({ seasonId, account: createAccount('sandbox') })
  await assert.rejects(
    call(
      { ...actor, authTime: start / 1000 - 301 },
      { op: 'deleteAccount', confirmation: 'DELETE' }
    ),
    { code: 'unauthenticated' }
  )
  await assert.rejects(call(actor, { op: 'deleteAccount', confirmation: 'wrong' }), {
    code: 'invalid-argument',
  })
  const requested = await call(actor, {
    op: 'deleteAccount',
    confirmation: 'DELETE',
    targetUid: 'bob',
  })
  assert.equal(requested.accepted, true)
  assert.equal((await db.doc('deskAccounts/' + uid).get()).exists, false)
  assert.equal((await db.doc('deskDeletions/bob').get()).exists, false)
  assert.equal((await db.doc('deskProfiles/' + uid).get()).data().publicRanking, false)
  await assert.rejects(
    call({ ...actor, member: true }, { op: 'profile', profile: profile('resurrect') }),
    { code: 'failed-precondition' }
  )
  await assert.rejects(syncSession(db, uid, start), { code: 'failed-precondition' })
  assert.equal((await call(actor, { op: 'deleteAccount', confirmation: 'DELETE' })).accepted, true)
  await db.doc('deskLimits/' + uid).set({ bucket: Math.floor(start / 60000), count: 120 })
  await assert.rejects(call(actor, { op: 'deleteAccount', confirmation: 'DELETE' }), {
    code: 'resource-exhausted',
  })
})

test('durable deletion retries failures and erases auth, historical records, rankings and associated reports', async () => {
  const { processDeletion, privacySweep } = require('../lib/desk/deletion')
  const uid = 'privacy-owner'
  const otherRow = { uid: 'unrelated', returns: { season: 1 } }
  await db.doc('deskSeasons/privacy-unrelated-season').set({ id: 'privacy-unrelated-season' })
  const unaffected = db.doc('deskStandings/privacy-unrelated-season')
  await unaffected.set({ rows: [otherRow] })
  const before = (await unaffected.get()).updateTime
  await db.doc('deskStandings/' + seasonId).set({ rows: [{ uid }, otherRow] })
  await db.doc('deskLeaderboard/' + seasonId + '/entries/' + uid).set({ uid })
  await db.doc('deskArchive/' + seasonId + '_' + uid).set({ seasonId })
  await db
    .doc('deskReports/privacy-report')
    .set({ reporterUid: uid, targetUid: 'unrelated', detail: 'erase me' })
  await db.doc('deskAudit/privacy-audit').set({ actorUid: 'operator', target: uid })
  await assert.rejects(
    processDeletion(
      db,
      {
        deleteUser: async () => {
          throw Object.assign(new Error('temporary'), { code: 'auth/internal-error' })
        },
      },
      uid,
      start
    )
  )
  assert.equal((await db.doc('deskDeletions/' + uid).get()).data().state, 'pending')
  assert.equal(await processDeletion(db, auth, uid, start), true)
  assert.equal(await processDeletion(db, auth, uid, start), true)
  await assert.rejects(auth.getUser(uid), { code: 'auth/user-not-found' })
  for (const path of [
    'deskProfiles/' + uid,
    'deskArchive/' + seasonId + '_' + uid,
    'deskLeaderboard/' + seasonId + '/entries/' + uid,
    'deskReports/privacy-report',
    'deskAudit/privacy-audit',
  ])
    assert.equal((await db.doc(path).get()).exists, false, path)
  assert.deepEqual((await db.doc('deskStandings/' + seasonId).get()).data().rows, [otherRow])
  assert.ok(
    (await unaffected.get()).updateTime.isEqual(before),
    'unrelated standings must not be rewritten'
  )
  await unaffected.delete()
  await db.doc('deskSeasons/privacy-unrelated-season').delete()
  const receipt = (await db.doc('deskDeletions/' + uid).get()).data()
  assert.equal(receipt.state, 'complete')
  await call(
    { uid, member: false, admin: false, authTime: start / 1000 },
    { op: 'deleteAccount', confirmation: 'DELETE' }
  )
  assert.equal(
    (await db.doc('deskLimits/' + uid).get()).exists,
    false,
    'late retry must not recreate erased metadata'
  )
  assert.deepEqual(Object.keys(receipt).sort(), [
    'completedAt',
    'expiresAt',
    'requestedAt',
    'state',
  ])
  await privacySweep(db, auth, start + 31 * 86400000)
  assert.equal((await db.doc('deskDeletions/' + uid).get()).exists, false)
})

test('actual callable accepts a recently signed-in account deletion without trusting a target uid', async () => {
  const bearer = await token('privacy-callable')
  const endpoint = 'http://127.0.0.1:5201/demo-stockdesk/us-central1/deskApi'
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + bearer },
    body: JSON.stringify({
      data: { op: 'deleteAccount', confirmation: 'DELETE', targetUid: 'operator' },
    }),
  })
  assert.deepEqual((await response.json()).result, { accepted: true })
  assert.equal((await db.doc('deskDeletions/operator').get()).exists, false)
  assert.equal((await db.doc('deskDeletions/privacy-callable').get()).data().state, 'complete')
  const { processDeletion } = require('../lib/desk/deletion')
  await processDeletion(db, auth, 'privacy-callable')
  await assert.rejects(auth.getUser('privacy-callable'), { code: 'auth/user-not-found' })
})

test('unverified empty identities are erased inline without waiting for the seasonal queue', async () => {
  const uid = 'privacy-unverified-empty'
  const bearer = await token(uid, undefined, false)
  const response = await fetch('http://127.0.0.1:5201/demo-stockdesk/us-central1/deskApi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + bearer },
    body: JSON.stringify({ data: { op: 'deleteAccount', confirmation: 'DELETE' } }),
  })
  assert.deepEqual((await response.json()).result, { accepted: true })
  await assert.rejects(auth.getUser(uid), { code: 'auth/user-not-found' })
  assert.equal((await db.doc('deskDeletions/' + uid).get()).data().state, 'complete')
  assert.equal((await db.doc('deskLimits/' + uid).get()).exists, false)
})

test('nonparticipants never enumerate seasons, and clients cannot reset participation evidence', async () => {
  const { processDeletion } = require('../lib/desk/deletion')
  const noSeasonScans = new Proxy(db, {
    get(target, key) {
      if (key === 'collection')
        return (name) => {
          assert.notEqual(name, 'deskSeasons', 'empty identities must not enumerate every season')
          return target.collection(name)
        }
      const value = Reflect.get(target, key)
      return typeof value === 'function' ? value.bind(target) : value
    },
  })
  for (const hasProfile of [false, true]) {
    const uid = 'privacy-no-history-' + hasProfile
    const actor = { uid, member: hasProfile, admin: false, authTime: start / 1000 }
    if (hasProfile) await call(actor, { op: 'profile', profile: profile(uid) })
    // A verified reporter can have associated records without a trading profile.
    await db.doc('deskReports/' + uid).set({ reporterUid: uid, detail: 'remove own data' })
    await call(actor, { op: 'deleteAccount', confirmation: 'DELETE', hasJoinedSeason: true })
    const job = (await db.doc('deskDeletions/' + uid).get()).data()
    assert.equal(job.state, 'identity-pending')
    assert.equal(job.seasonsDone, true)
    assert.equal(await processDeletion(noSeasonScans, auth, uid, start), true)
    assert.equal((await db.doc('deskReports/' + uid).get()).exists, false)
    assert.equal((await db.doc('deskProfiles/' + uid).get()).exists, false)
  }
  assert.equal((await db.doc('deskProfiles/bob').get()).data().hasJoinedSeason, true)
  await call(bob, { op: 'profile', profile: { ...profile('bob'), hasJoinedSeason: false } })
  assert.equal((await db.doc('deskProfiles/bob').get()).data().hasJoinedSeason, true)
})

test('empty-identity backlog cannot consume the worker quota for existing game-data deletion', async () => {
  const { requestDeletion, privacySweep } = require('../lib/desk/deletion')
  const uid = 'z-privacy-participant'
  await db.doc('deskProfiles/' + uid).set({ ...profile(uid), hasJoinedSeason: true })
  await requestDeletion(db, uid, start / 1000, start)
  // A legitimate deletion that has finished its seasonal phase is waiting for cleanup.
  await db.doc('deskDeletions/' + uid).update({ seasonsDone: true })
  const identities = Array.from({ length: 21 }, (_, i) => 'a-privacy-empty-' + i)
  for (const id of identities) await requestDeletion(db, id, start / 1000, start)
  const result = await privacySweep(db, auth, start)
  assert.equal((await db.doc('deskDeletions/' + uid).get()).data().state, 'complete')
  assert.equal(result.failed, 0)
  assert.equal(result.scanned, 21)
  const pending = await db
    .collection('deskDeletions')
    .where('state', '==', 'identity-pending')
    .get()
  assert.equal(pending.size, 1)
  for (const id of [...identities, uid]) await db.doc('deskDeletions/' + id).delete()
})
