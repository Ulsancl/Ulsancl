import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createRequire } from 'node:module'
import { createServer } from 'vite'
import { chromium } from 'playwright'
const require = createRequire(new URL('../functions/package.json', import.meta.url))
const { initializeApp, deleteApp } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { getFirestore } = require('firebase-admin/firestore')
const { deskService, riskSweep } = require('./lib/desk/service.js')
if (
  process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8282' ||
  process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:9299'
)
  throw new Error('Local demo-stockdesk emulators required.')
const app = initializeApp({ projectId: 'demo-stockdesk' }, 'browser-tests'),
  db = getFirestore(app),
  auth = getAuth(app)
const operator = { uid: 'web-operator', admin: true, member: true }
const password = 'Only-emulator-password-123'
for (const uid of ['web-player', 'web-operator']) {
  await auth
    .getUser(uid)
    .then(() => auth.deleteUser(uid))
    .catch(() => {})
  await auth.createUser({ uid, email: uid + '@example.test', emailVerified: true, password })
}
await auth.setCustomUserClaims(operator.uid, { admin: true })
let boot = await deskService(db, operator, { op: 'bootstrap' })
if (boot.season?.state === 'active') {
  await deskService(db, operator, {
    op: 'adminSeason',
    action: 'close',
    revision: boot.control.revision,
    reason: 'browser fixture reset',
  })
  boot = await deskService(db, operator, { op: 'bootstrap' })
}
await deskService(db, operator, {
  op: 'adminSeason',
  action: 'create',
  revision: boot.control.revision,
  title: 'Browser verification season',
  tickMs: 10000,
  reason: 'browser fixture',
})
await db.doc('deskAccounts/web-player').delete()
await db.doc('deskProfiles/web-player').delete()
process.env.VITE_DESK_EMULATORS = 'true'
const server = await createServer({ server: { host: '127.0.0.1', port: 5274, strictPort: true } })
await server.listen()
const browser = await chromium.launch({ headless: true }),
  context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }),
  page = await context.newPage()
page.setDefaultTimeout(15000)
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
const output = new URL('../output/desk-online/', import.meta.url)
await fs.mkdir(output, { recursive: true })
const nav = (name) =>
  page.getByRole('navigation', { name: '주 메뉴' }).getByRole('button', { name, exact: true })
async function login(uid) {
  await nav('계정 · 저장').click()
  await page.getByLabel('이메일', { exact: true }).fill(uid + '@example.test')
  await page.getByLabel('비밀번호', { exact: true }).fill(password)
  await page.getByRole('button', { name: '이메일 로그인', exact: true }).click()
  await page.getByText('인증된 계정', { exact: true }).waitFor()
}
try {
  await page.goto('http://127.0.0.1:5274/')
  await login('web-player')
  await page.getByLabel('닉네임', { exact: true }).fill('검증 투자자')
  await page.getByLabel('국가', { exact: true }).selectOption('KR')
  await page.getByLabel('연령대', { exact: true }).selectOption('25-34')
  await page.getByRole('textbox', { name: /^지역/ }).fill('울산')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: '프로필 저장', exact: true }).click()
  await page.getByText('프로필을 저장했습니다.', { exact: true }).waitFor()
  await page.getByRole('button', { name: '공개 시즌 참가 / 이어하기', exact: true }).click()
  await page.getByText('서버 검증 시즌', { exact: true }).waitFor()
  assert.equal(await page.getByRole('button', { name: '+1일', exact: true }).count(), 0)
  await nav('트레이딩').click()
  await page.getByLabel('주문 수량').fill('2')
  await page.getByRole('button', { name: '매수 주문', exact: true }).click()
  await page.getByText('서버에서 주문을 처리했습니다.', { exact: true }).waitFor()
  let stored = (await db.doc('deskAccounts/web-player').get()).data()
  assert.equal(stored.account.positions[0].quantity, 2)
  assert.ok(stored.account.cash < 10000000)
  await page.screenshot({ path: new URL('online-trading.png', output).pathname, fullPage: true })
  await riskSweep(db)
  await nav('리더보드').click()
  await page.getByRole('cell', { name: '검증 투자자', exact: true }).waitFor()
  await nav('계정 · 저장').click()
  await page.getByRole('checkbox').uncheck()
  await page.getByRole('button', { name: '프로필 저장', exact: true }).click()
  await page.getByText('프로필을 저장했습니다.', { exact: true }).waitFor()
  const rankings = await deskService(db, operator, { op: 'leaderboard' })
  assert.ok(!rankings.entries.some((r) => r.uid === 'web-player'))
  await page.getByRole('button', { name: '로그아웃', exact: true }).click()
  await page.getByRole('button', { name: '이메일 로그인', exact: true }).waitFor()
  await login('web-operator')
  await nav('운영 콘솔').click()
  await page.getByRole('heading', { name: '운영 현황', exact: true }).waitFor()
  await page
    .getByLabel('감사 기록 사유', { exact: true })
    .fill('Browser verifies the emergency switch')
  await page.getByRole('button', { name: '신규 주문 일시 중지', exact: true }).click()
  await page.getByRole('button', { name: '확인하고 적용', exact: true }).click()
  await page.getByText('운영 변경을 적용하고 감사 기록에 저장했습니다.', { exact: true }).waitFor()
  assert.equal((await db.doc('deskControl/current').get()).data().newOrdersEnabled, false)
  await page.screenshot({ path: new URL('operator-console.png', output).pathname, fullPage: true })
  assert.deepEqual(errors, [])
  console.log(
    'PASS verified login → profile → public join → authoritative trade → snapshot ranking → consent withdrawal → operator kill switch'
  )
} catch (error) {
  console.error(error)
  await page.screenshot({ path: new URL('failure.png', output).pathname, fullPage: true })
  throw error
} finally {
  await browser.close()
  await server.close()
  await deleteApp(app)
}
