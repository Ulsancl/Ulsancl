import { test, expect } from '@playwright/test'
const nav = (page, name) =>
  page.getByRole('navigation', { name: '주 메뉴' }).getByRole('button', { name, exact: true })
const saved = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('marketdesk.v2') || 'null'))
test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '트레이딩', exact: true })).toBeVisible()
})
test('cash trade, costs, clock, reload, and reduce-only close preserve accounting', async ({
  page,
}) => {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.getByLabel('주문 수량').fill('10')
  await page.getByRole('button', { name: '매수 주문', exact: true }).click()
  await expect.poll(async () => (await saved(page))?.account.positions[0]?.quantity).toBe(10)
  const first = await saved(page)
  expect(first.account.cash).toBeLessThan(10000000)
  expect(first.account.fees).toBeGreaterThan(0)
  await page.getByRole('button', { name: '+30분', exact: true }).click()
  await expect.poll(async () => (await saved(page)).account.tick).toBe(first.account.tick + 30)
  await page.reload()
  await nav(page, '포트폴리오').click()
  await expect(page.getByRole('cell', { name: 'NOVA 주식 · LONG' })).toBeVisible()
  await page.getByRole('button', { name: '청산', exact: true }).click()
  await expect.poll(async () => (await saved(page)).account.positions.length).toBe(0)
  const last = await saved(page)
  expect(last.account.closedTrades).toBe(1)
  expect(last.account.cash).toBe(10000000 + last.account.realized)
  expect(errors).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
})
test('limit reserves cash, cancel releases it, and invalid quantity leaves state intact', async ({
  page,
}) => {
  await page.getByLabel('주문 유형').selectOption('limit')
  await page.getByLabel('주문 가격').fill('1')
  await page.getByRole('button', { name: '매수 주문', exact: true }).click()
  await expect.poll(async () => (await saved(page))?.account.orders.length).toBe(1)
  await page.getByRole('button', { name: '취소', exact: true }).click()
  await expect.poll(async () => (await saved(page)).account.orders.length).toBe(0)
  const old = await saved(page)
  await page.getByLabel('주문 수량').fill('1.5')
  await page.getByRole('button', { name: '매수 주문', exact: true }).click()
  expect((await saved(page)).revision).toBe(old.revision)
})
test('atomic strategy creates both legs, campaign completion earns recorded results', async ({
  page,
}) => {
  await nav(page, '전략 연구실').click()
  await page.getByRole('button', { name: '손익 범위 설계 불 콜 스프레드' }).click()
  await page.getByRole('button', { name: '전략 일괄 주문', exact: true }).click()
  await expect.poll(async () => (await saved(page))?.account.positions.length).toBe(2)
  const account = (await saved(page)).account
  expect(account.positions.map((p) => p.quantity).sort()).toEqual([-1, 1])
  await nav(page, '캠페인').click()
  await page.getByRole('button', { name: '캠페인 시작' }).nth(2).click()
  await page.getByRole('button', { name: '새 연습 시작', exact: true }).click()
  await expect(page.getByRole('heading', { name: '트레이딩', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '+1일', exact: true }).click()
  await expect.poll(async () => (await saved(page)).account.status).toBe('completed')
  await nav(page, '캠페인').click()
  await expect(page.getByText('MISSION RESULT')).toBeVisible()
})
test('corrupt save remains intact; explicit valid import recovers practice and retains legacy save', async ({
  page,
}) => {
  await page.getByRole('button', { name: '+1분', exact: true }).click()
  await expect.poll(async () => (await saved(page))?.revision).toBe(1)
  const valid = await saved(page)
  await page.evaluate(() => {
    localStorage.setItem('marketdesk.v2', '{broken')
    localStorage.setItem('stockTradingGame', 'legacy-proof')
  })
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('원본')
  await page.getByRole('button', { name: '+1분', exact: true }).click()
  expect(await page.evaluate(() => localStorage.getItem('marketdesk.v2'))).toBe('{broken')
  await nav(page, '계정 · 저장').click()
  await page.getByLabel('연습 파일 가져오기').setInputFiles({
    name: 'practice.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(valid)),
  })
  await expect(page.getByRole('status')).toContainText('연습 기록을 가져왔습니다.')
  await expect.poll(async () => (await saved(page))?.seed).toBe(valid.seed)
  await expect(page.getByRole('alert')).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('stockTradingGame'))).toBe('legacy-proof')
  expect(await page.evaluate(() => localStorage.getItem('marketdesk.v2.backup'))).toBe('{broken')
})
test('second tab cannot silently overwrite newer practice', async ({ page, context }) => {
  await page.getByRole('button', { name: '+1분', exact: true }).click()
  await expect.poll(async () => (await saved(page))?.revision).toBe(1)
  const other = await context.newPage()
  await other.goto('/')
  await expect(other.getByRole('heading', { name: '트레이딩', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '+1분', exact: true }).click()
  await expect.poll(async () => (await saved(page)).revision).toBe(2)
  await other.getByRole('button', { name: '+1분', exact: true }).click()
  await expect(other.getByRole('alert').first()).toContainText('다른 탭')
  expect((await saved(page)).revision).toBe(2)
  await other.close()
})
test('all workspaces remain reachable without server and do not invent rankings', async ({
  page,
}) => {
  for (const name of [
    '포트폴리오',
    '전략 연구실',
    '캠페인',
    '투자 일지',
    '리더보드',
    '계정 · 저장',
  ]) {
    await nav(page, name).click()
    await expect(page.getByRole('heading', { name, exact: true, level: 1 })).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
    ).toBeTruthy()
  }
  await nav(page, '리더보드').click()
  await expect(page.getByText('공개 서버 연결을 기다리고 있습니다')).toBeVisible()
  await expect(page.locator('tbody tr')).toHaveCount(0)
})
