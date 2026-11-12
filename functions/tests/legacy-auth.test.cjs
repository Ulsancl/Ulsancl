const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { initializeApp, deleteApp, getApp } = require('firebase-admin/app')
const { getFirestore, Timestamp } = require('firebase-admin/firestore')
const { getAuth } = require('firebase-admin/auth')

if (
  !/^127\.0\.0\.1:\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST || '') ||
  !/^127\.0\.0\.1:\d+$/.test(process.env.FIREBASE_AUTH_EMULATOR_HOST || '')
) throw new Error('These tests require local Firestore and Auth emulators.')
process.env.GCLOUD_PROJECT = 'demo-stockdesk'
const app = initializeApp({ projectId: 'demo-stockdesk' }, 'legacy-auth-tests')
const auth = getAuth(app), db = getFirestore(app)
const { submitGameScore, createSeason, endSeason } = require('../lib/index')
const origin = 'http://127.0.0.1:5201/demo-stockdesk/us-central1/'
const season = {
  name: 'Authentication regression',
  startDate: '2026-11-01T00:00:00Z',
  endDate: '2026-12-01T00:00:00Z',
}
const issueToken = async (uid, claims) => {
  await auth.createUser({ uid, email: uid + '@example.test', password: 'Only-emulator-password-123' })
  if (claims) await auth.setCustomUserClaims(uid, claims)
  const response = await fetch('http://' + process.env.FIREBASE_AUTH_EMULATOR_HOST +
    '/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: uid + '@example.test', password: 'Only-emulator-password-123', returnSecureToken: true }),
  })
  const result = await response.json()
  assert.equal(typeof result.idToken, 'string')
  return result.idToken
}
const request = async (endpoint, token, body) => {
  const response = await fetch(origin + endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: JSON.stringify(body),
  })
  return { status: response.status, body: await response.json() }
}
const callable = (uid, token) => submitGameScore.run({}, {
  app: { appId: 'emulator-test-app' },
  auth: { uid, token: {} },
  rawRequest: { get: (name) => name.toLowerCase() === 'authorization' ? 'Bearer ' + token : undefined },
})

before(async () => {
  await fetch('http://' + process.env.FIRESTORE_EMULATOR_HOST +
    '/emulator/v1/projects/demo-stockdesk/databases/(default)/documents', { method: 'DELETE' })
  await fetch('http://' + process.env.FIREBASE_AUTH_EMULATOR_HOST +
    '/emulator/v1/projects/demo-stockdesk/accounts', { method: 'DELETE' })
})
after(async () => { await deleteApp(app); await deleteApp(getApp()) })

test('legacy admin endpoints allow an active admin and reject anonymous, ordinary and malformed credentials', async () => {
  const adminToken = await issueToken('legacy-active-admin', { admin: true })
  const userToken = await issueToken('legacy-ordinary-user')
  const created = await request('createSeason', adminToken, season)
  assert.equal(created.status, 200)
  assert.equal((await db.doc('seasons/' + created.body.seasonId).get()).data().createdBy, 'legacy-active-admin')
  const body = { seasonId: created.body.seasonId }
  for (const [endpoint, input] of [['createSeason', season], ['endSeason', body]]) {
    assert.equal((await request(endpoint, null, input)).status, 401)
    assert.equal((await request(endpoint, 'not-a-token', input)).status, 401)
    assert.equal((await request(endpoint, userToken, input)).status, 403)
  }
  assert.equal((await request('endSeason', adminToken, body)).status, 200)
  assert.equal((await db.doc('seasons/' + body.seasonId).get()).data().active, false)
})

for (const state of ['disabled', 'revoked', 'deleted']) {
  test(`legacy writes reject an already issued token after the account is ${state}`, async () => {
    const uid = 'legacy-' + state
    const token = await issueToken(uid, { admin: true })
    const target = db.doc('seasons/auth-target-' + state)
    await target.set({ ...season, startDate: Timestamp.now(), endDate: Timestamp.now(), active: true })
    if (state === 'disabled') await auth.updateUser(uid, { disabled: true })
    if (state === 'deleted') await auth.deleteUser(uid)
    if (state === 'revoked') {
      // Move the revocation boundary beyond the token's second-resolution auth_time.
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())
      const until = (payload.auth_time + 1) * 1000 - Date.now() + 20
      if (until > 0) await new Promise(resolve => setTimeout(resolve, until))
      await auth.revokeRefreshTokens(uid)
    }
    const oldCount = (await db.collection('seasons').get()).size
    const created = await request('createSeason', token, season)
    const closed = await request('endSeason', token, { seasonId: target.id })
    assert.equal(created.status, 401, 'stale admin token must not create a season')
    assert.equal(closed.status, 401, 'stale admin token must not close a season')
    assert.equal((await db.collection('seasons').get()).size, oldCount)
    assert.equal((await target.get()).data().active, true)
    await assert.rejects(callable(uid, token), { code: 'unauthenticated' })
    assert.equal((await db.doc('rateLimits/' + uid).get()).exists, false)
  })
}

test('legacy callable binds the active token to its verified actor', async () => {
  const uid = 'legacy-score-user', token = await issueToken(uid)
  await assert.rejects(callable('different-actor', token), { code: 'unauthenticated' })
  // A valid identity reaches payload validation, which rejects the empty score payload.
  const result = await callable(uid, token)
  assert.equal(result.success, false)
})

test('production token verification prevents retired administrators from mutating seasons', async (t) => {
  const serviceAuth = getAuth()
  // The Auth SDK always checks revocation in emulator mode, even when the
  // application omits it. Exercise its actual production verification branch;
  // only signature verification is replaced with our already issued fixture.
  Object.defineProperty(serviceAuth, 'emulatorMode', { value: false, configurable: true })
  t.mock.method(serviceAuth.idTokenVerifier, 'verifyJWT', async token => {
    const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())
    return { ...claims, uid: claims.sub }
  })
  const invoke = async (handler, token, body) => {
    const response = {
      statusCode: 200, body: null,
      set() { return this },
      status(code) { this.statusCode = code; return this },
      json(value) { this.body = value; return this },
    }
    const headers = { authorization: 'Bearer ' + token }
    await handler({ method: 'POST', headers, body, get: name => headers[name.toLowerCase()] }, response)
    return response
  }
  try {
    const uid = 'production-retired-admin'
    const token = await issueToken(uid, { admin: true })
    const target = db.doc('seasons/production-protected')
    await target.set({ ...season, active: true })
    await auth.updateUser(uid, { disabled: true })
    const beforeCount = (await db.collection('seasons').get()).size
    const created = await invoke(createSeason, token, season)
    const ended = await invoke(endSeason, token, { seasonId: target.id })
    assert.equal(created.statusCode, 401, 'production must reject an already issued disabled-admin token')
    assert.equal(ended.statusCode, 401)
    assert.equal((await db.collection('seasons').get()).size, beforeCount)
    assert.equal((await target.get()).data().active, true)
    await assert.rejects(callable(uid, token), { code: 'unauthenticated' })
  } finally {
    delete serviceAuth.emulatorMode
  }
})
