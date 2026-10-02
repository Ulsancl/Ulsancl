import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const output = path.join(root, 'output/detail-browser')
await fs.mkdir(output, { recursive: true })
const report = { checks: [], errors: [], screenshots: [], browser: '', backend: 'default Chromium' }
const server = await createServer({ root, server: { host: '127.0.0.1', port: 5263, strictPort: true, watch: null, hmr: false }, optimizeDeps: { force: false } })
await server.listen()
const browser = await chromium.launch({ headless: true })
report.browser = browser.version()
let active
const contexts = []
const SAVE = 'stockTradingGame', VAULT = 'stockTradingGame:originals:v1'
const seed = { version: 4, cash: 100000000, totalTrades: 1, totalXp: 1000, unlockedAchievements: { firstTrade: true }, settings: { theme: 'dark', soundEnabled: false, playerName: '상세 검증' } }
const close = (actual, expected, tolerance = 1e-7) => assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`)
const state = page => page.evaluate(() => window.stockLab.getState())
const financial = value => Object.fromEntries(['cash','portfolio','shortPositions','creditUsed','creditInterest','tradeHistory','pendingOrders','totalTrades','dailyTrades','dailyProfit','totalProfit'].map(key => [key, value[key]]))
async function finishPresentation(page) {
  await page.evaluate(() => { for (const animation of document.getAnimations()) if (Number.isFinite(animation.effect?.getComputedTiming().endTime)) animation.finish() })
}
async function dismissToasts(page) {
  await finishPresentation(page)
  if (await page.locator('.crisis-close').isVisible()) await page.locator('.crisis-close').click()
  for (let count = 0; count < 12 && await page.locator('.toast-close').count(); count++) await page.locator('.toast-close').first().click()
}
async function check(name, work) {
  try { await work(); report.checks.push({ name, ok: true }); console.log(`PASS ${name}`) }
  catch (error) { report.checks.push({ name, ok: false, error: error.stack }); throw error }
  finally { await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2)) }
}
async function pause(page) { await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000)) }
async function ready(page) {
  await page.waitForFunction(() => window.stockLab?.getState().isInitialized && window.stockLab.getState().stocks.length > 0, null, { timeout: 30000 })
  for (const id of ['season-reset-notice-confirm','tutorial-skip']) {
    const button = page.getByTestId(id)
    if (await button.isVisible()) await button.click()
  }
  await page.getByTestId('stock-card').first().waitFor({ state: 'visible' })
}
async function settleModal(page, locator) {
  // React's first lazy-dialog commit is delayed by its scheduler. Allow that
  // bounded clock work after the one real click, never dispatch a second click.
  for (let attempt = 0; attempt < 20 && !(await locator.isVisible()); attempt++) {
    await page.clock.runFor(100)
    await locator.waitFor({ state: 'visible', timeout: 100 }).catch(() => {})
  }
  await locator.waitFor({ state: 'visible', timeout: 5000 })
}
async function openPage(snapshot = seed, options = {}) {
  const context = await browser.newContext({ viewport: options.mobile ? { width: 390, height: 844 } : { width: 1440, height: 1080 }, deviceScaleFactor: 1, hasTouch: Boolean(options.mobile), acceptDownloads: true, reducedMotion: 'reduce' })
  contexts.push(context)
  const page = await context.newPage(); active = page
  page.on('pageerror', error => report.errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()) })
  await page.clock.install({ time: new Date('2026-10-01T12:00:00Z') })
  await page.addInitScript(({ snapshot, raw, quota }) => {
    window.__detailDocument = crypto.randomUUID()
    if (!sessionStorage.getItem('detail-fixture-loaded')) {
      localStorage.setItem('stockTradingGame', raw ?? JSON.stringify({ ...snapshot, savedAt: Date.now(), gameStartTime: Date.now() }))
      localStorage.setItem('stockGame_settings', JSON.stringify({ theme: 'dark', soundEnabled: false }))
      localStorage.setItem('unrelated-application-data', 'retain this exactly')
      sessionStorage.setItem('detail-fixture-loaded', 'yes')
    }
    if (quota) {
      const original = Storage.prototype.setItem
      Storage.prototype.setItem = function (key, value) {
        if (key === 'stockTradingGame:originals:v1') throw new DOMException('Test storage full', 'QuotaExceededError')
        return original.call(this, key, value)
      }
    }
  }, { snapshot, raw: options.raw, quota: Boolean(options.quota) })
  await page.goto('http://127.0.0.1:5263', { waitUntil: 'domcontentloaded', timeout: 45000 })
  await ready(page); await pause(page); await dismissToasts(page)
  return page
}
async function capture(page, name, selector, keepScroll = false) {
  await dismissToasts(page)
  // A stopped test clock must not leave the screenshot halfway through a CSS
  // dialog entrance transform. Complete only finite presentation animations.
  await finishPresentation(page)
  let clip
  if (selector) {
    const locator = page.locator(selector)
    await locator.evaluate(node => node.scrollIntoView({ behavior: 'instant', block: 'center' }))
    clip = await locator.boundingBox()
    assert.ok(clip && Object.values(clip).every(Number.isFinite) && clip.width > 0 && clip.height > 0)
  } else if (!keepScroll) await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.screenshot({ path: path.join(output, name), animations: 'disabled', ...(clip ? { clip } : { fullPage: false }) })
  report.screenshots.push(name)
}
async function download(page, button, name) {
  const pending = page.waitForEvent('download')
  await button.click()
  const result = await pending
  const filename = path.join(output, name)
  await result.saveAs(filename)
  return fs.readFile(filename, 'utf8')
}
async function reload(page) {
  await page.clock.resume()
  const old = await page.evaluate(() => window.__detailDocument)
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.waitForFunction(previous => window.__detailDocument !== previous && window.stockLab?.getState().isInitialized, old, { timeout: 30000 })
  await ready(page); await pause(page)
}
function account(value) {
  const stocks = new Map(value.stocks.map(stock => [String(stock.id), stock.price]))
  let long = 0, margin = 0, pnl = 0, borrowed = 0
  for (const [id, position] of Object.entries(value.portfolio)) { long += stocks.get(id) * position.quantity; borrowed += position.borrowed || 0 }
  for (const [id, position] of Object.entries(value.shortPositions)) { margin += position.margin ?? position.entryPrice * position.quantity * 1.5; pnl += (position.entryPrice - stocks.get(id)) * position.quantity }
  close(value.stockValue, long); close(value.shortMargin, margin); close(value.shortValue, pnl); close(value.shortEquity, margin + pnl)
  close(value.leverageDebt, borrowed)
  close(value.totalAssets, value.cash + long + margin + pnl - value.creditUsed - value.creditInterest - borrowed)
}
async function assertCandles(page, observations) {
  const candles = await page.locator('g[data-open]').evaluateAll(nodes => nodes.map(node => ({ first: Number(node.dataset.firstSequence), last: Number(node.dataset.lastSequence), open: Number(node.dataset.open), high: Number(node.dataset.high), low: Number(node.dataset.low), close: Number(node.dataset.close) })))
  assert.ok(candles.length > 0)
  for (const candle of candles) {
    const source = observations.filter(point => point.sequence >= candle.first && point.sequence <= candle.last)
    assert.ok(source.length > 0)
    close(candle.open, source[0].price); close(candle.close, source.at(-1).price)
    close(candle.high, Math.max(...source.map(point => point.price))); close(candle.low, Math.min(...source.map(point => point.price)))
  }
}

try {
  const page = await openPage()
  let base = await state(page)
  const card = page.getByTestId('stock-card').first(), id = await card.getAttribute('data-stock-id')
  const stock = () => state(page).then(value => value.stocks.find(item => String(item.id) === id))
  await check('one native buy/sell changes quantity, fees and history exactly once', async () => {
    await page.getByTestId('quantity-mode-btn').click(); await page.getByTestId('quantity-input').fill('2')
    const before = await state(page), price = (await stock()).price, fee = Math.floor(price * 2 * .0015)
    await card.getByTestId('buy-btn').click()
    const bought = await state(page)
    close(bought.cash, before.cash - price * 2 - fee)
    assert.equal(bought.portfolio[id].quantity, 2); assert.equal(bought.tradeHistory.length, before.tradeHistory.length + 1)
    account(bought)
    await card.getByTestId('sell-all-btn').click()
    const sold = await state(page)
    assert.equal(sold.portfolio[id], undefined); close(sold.cash, before.cash - fee * 2)
    assert.equal(sold.tradeHistory.at(-1).type, 'sell'); close(sold.tradeHistory.at(-1).profit, -fee * 2)
    assert.equal(sold.dailyTrades, before.dailyTrades + 2); account(sold)
  })
  await check('short escrow remains equity and cover settles cash and realized history', async () => {
    await page.getByTestId('short-mode-btn').click(); await page.getByTestId('quantity-input').fill('3')
    const before = await state(page), price = (await stock()).price
    await card.getByTestId('short-btn').click()
    const opened = await state(page)
    close(opened.cash, before.cash - price * 3 * 1.5); close(opened.shortMargin, price * 3 * 1.5)
    close(opened.totalAssets, before.totalAssets); account(opened)
    await page.getByTestId('account-detail').locator('summary').click()
    const values = await page.locator('[data-account-key]').evaluateAll(nodes => Object.fromEntries(nodes.map(node => [node.dataset.accountKey, Number(node.dataset.value)])))
    close(values.shortMargin, opened.shortMargin)
    close(Object.entries(values).filter(([key]) => key !== 'totalAssets').reduce((sum, [,value]) => sum + value, 0), opened.totalAssets)
    await capture(page, 'account-equity.png')
    await card.getByTestId('cover-all-btn').click()
    const settled = await state(page), cover = settled.tradeHistory.at(-1)
    assert.equal(settled.shortPositions[id], undefined); assert.equal(cover.type, 'cover')
    close(cover.marginReturned, price * 3 * 1.5); close(cover.profit, 0); close(cover.total, cover.marginReturned)
    close(settled.cash, before.cash); assert.equal(settled.dailyTrades, before.dailyTrades + 2); account(settled)
    await page.getByTestId('open-trades').click()
    assert.match(await page.locator('[data-trade-type="cover"]').innerText(), /공매도 청산[\s\S]*청산 현금 증감[\s\S]*반환 증거금/)
    close(Number(await page.getByTestId('history-realized-profit').getAttribute('data-value')), settled.tradeHistory.filter(t => ['sell','cover'].includes(t.type)).reduce((sum, t) => sum + (t.profit || 0), 0))
    await capture(page, 'settlement-history.png', '.trade-history-panel')
    await page.locator('.trade-history-panel .close-btn').click()
  })
  await check('insufficient quantity controls and chart inspection do not place duplicate trades', async () => {
    await page.getByTestId('long-mode-btn').click(); await page.getByTestId('quantity-input').fill('1000000000')
    const before = financial(await state(page))
    assert.equal(await card.getByTestId('buy-btn').isDisabled(), true)
    await card.getByTestId('stock-center').click()
    await settleModal(page, page.getByTestId('chart-modal'))
    assert.deepEqual(financial(await state(page)), before)
    const observations = await page.evaluate(id => window.stockLab.getObservations(id), id)
    assert.ok(observations.length < 15, 'initial chart must not fabricate a long history')
    await assertCandles(page, observations)
    await page.getByRole('button', { name: '보조지표', exact: true }).click()
    assert.equal((await page.getByTestId('indicator-rsi').getAttribute('d')).trim(), '')
    assert.equal((await page.getByTestId('indicator-macd').getAttribute('d')).trim(), '')
    await page.getByTestId('chart-modal-close').click()
  })
  await check('every real interval records one observation and all OHLC groups share that source', async () => {
    const initial = await page.evaluate(id => window.stockLab.getObservations(id), id)
    await page.clock.runFor(40000)
    const observations = await page.evaluate(id => window.stockLab.getObservations(id), id)
    assert.equal(observations.length - initial.length, 40)
    assert.ok(observations.every((point, index) => index === 0 || point.sequence === observations[index-1].sequence + 1))
    await card.getByTestId('stock-center').click()
    await assertCandles(page, observations)
    for (const name of ['5회','15회','60회']) { await page.getByRole('button', { name, exact: true }).click(); await assertCandles(page, observations) }
    await page.getByRole('button', { name: '게임일', exact: true }).click(); await assertCandles(page, observations)
    await page.getByRole('button', { name: '관찰 횟수', exact: true }).click()
    assert.deepEqual(await page.evaluate(id => window.stockLab.getObservations(id), id), observations)
  })
  await check('aligned indicators, OHLC readout and keyboard crosshair select the same observed candle', async () => {
    await page.getByRole('button', { name: '보조지표', exact: true }).click()
    const svg = page.locator('.technical-chart-svg')
    await svg.focus(); await page.keyboard.press('Home')
    assert.equal(await page.getByTestId('candle-readout').getAttribute('data-first-sequence'), '0')
    assert.equal(await page.locator('[data-selected-indicator="rsi"]').getAttribute('data-value'), '')
    await page.keyboard.press('End')
    const observations = await page.evaluate(id => window.stockLab.getObservations(id), id)
    const last = observations.at(-1)
    close(Number(await page.locator('[data-ohlc="close"]').getAttribute('data-value')), last.price)
    assert.equal(await page.getByTestId('candle-readout').getAttribute('data-candle-id'), await page.getByTestId('chart-crosshair').getAttribute('data-candle-id'))
    const prices = observations.map(point => point.price)
    let gain = 0, loss = 0
    for (let i=1; i<=14; i++) { const delta = prices[i]-prices[i-1]; gain += Math.max(0,delta)/14; loss += Math.max(0,-delta)/14 }
    for (let i=15; i<prices.length; i++) { const delta = prices[i]-prices[i-1]; gain = (gain*13+Math.max(0,delta))/14; loss = (loss*13+Math.max(0,-delta))/14 }
    close(Number(await page.locator('[data-selected-indicator="rsi"]').getAttribute('data-value')), loss === 0 ? gain === 0 ? 50 : 100 : 100-100/(1+gain/loss))
    for (const name of ['rsi','macd','signal','sma5','sma20']) assert.ok((await page.getByTestId(`indicator-${name}`).getAttribute('d')).trim().startsWith('M'))
    for (const [name, firstSequence] of [['rsi',14],['macd',33],['signal',33],['sma5',4],['sma20',19]]) {
      const d = await page.getByTestId(`indicator-${name}`).getAttribute('d')
      const firstX = Number(d.trim().match(/^M([^,]+)/)[1])
      close(firstX, Number(await page.locator(`g[data-open][data-first-sequence="${firstSequence}"]`).getAttribute('data-x')))
    }
    await page.keyboard.press('ArrowLeft')
    const pinned = await page.getByTestId('candle-readout').getAttribute('data-candle-id')
    await page.clock.runFor(2000)
    assert.equal(await page.getByTestId('candle-readout').getAttribute('data-candle-id'), pinned)
    await page.getByRole('button', { name: '최신 따라가기', exact: true }).click()
    assert.equal(await page.getByRole('button', { name: '최신 따라가기', exact: true }).getAttribute('aria-pressed'), 'true')
    await capture(page, 'observed-price-indicators.png', '.chart-modal')
  })
  await check('reopening and changing theme preserve observed history and chart source', async () => {
    const observed = await page.evaluate(id => window.stockLab.getObservations(id), id)
    await page.getByTestId('chart-modal-close').click()
    await page.getByTestId('open-settings').click()
    await page.locator('.theme-btn').filter({ hasText: '라이트' }).click()
    assert.equal((await state(page)).settings.theme, 'light')
    await capture(page, 'settings-light.png', '.settings-panel')
    await page.getByRole('button', { name: '설정 닫기' }).click()
    await capture(page, 'account-light.png')
    await card.getByTestId('stock-center').click()
    assert.deepEqual(await page.evaluate(id => window.stockLab.getObservations(id), id), observed)
    await assertCandles(page, observed)
    await capture(page, 'chart-light.png', '.chart-modal')
    await page.getByTestId('chart-modal-close').click()
  })
  await check('current-save download and reload retain positions, daily counters and settings', async () => {
    await page.getByTestId('quantity-input').fill('1'); await card.getByTestId('buy-btn').click()
    const before = await state(page)
    await dismissToasts(page)
    await page.getByTestId('open-settings').click()
    const exported = JSON.parse(await download(page, page.getByTestId('export-current-save'), 'current-save.json'))
    assert.equal(exported.version, 4); assert.deepEqual(financial(exported), financial(before)); assert.equal(exported.settings.theme, 'light')
    assert.equal(await page.evaluate(() => window.stockLab.saveNow()), true)
    await reload(page)
    const after = await state(page)
    assert.deepEqual(financial(after), financial(before)); assert.equal(after.settings.theme, 'light')
    assert.ok(after.observationCounts[id] < before.observationCounts[id], 'new document starts a fresh observed series')
  })
  await check('reserved sell and buy preserve leverage metadata and repay only the sold debt share', async () => {
    const snapshot = { ...seed, stocks: base.stocks, portfolio: { [id]: { quantity: 4, totalCost: 400000, borrowed: 200000, margin: 200000, leverage: 2, firstBuyTime: 123456 } }, pendingOrders: [
      { id: 'test-sell', stockId: Number(id), type: 'market', side: 'sell', quantity: 1, targetPrice: 1 },
      { id: 'test-buy', stockId: Number(id), type: 'market', side: 'buy', quantity: 1, targetPrice: 1000000 }
    ] }
    const other = await openPage(snapshot)
    await other.clock.runFor(1100)
    const result = await state(other), holding = result.portfolio[id]
    assert.equal(result.pendingOrders.length, 0); assert.equal(holding.quantity, 4)
    close(holding.borrowed, 150000); assert.equal(holding.leverage, 2); assert.equal(holding.firstBuyTime, 123456)
    const sell = result.tradeHistory.find(t => t.type === 'sell'), buy = result.tradeHistory.find(t => t.type === 'buy')
    close(sell.borrowedRepayment, 50000); close(holding.margin, 150000 + buy.price)
    account(result)
    await other.close(); active = page
  })
  await check('asset chart uses recorded timestamps and values rather than the current account', async () => {
    const epoch = Date.parse('2026-10-01T12:00:00Z')
    const records = [{ timestamp: epoch-11000, value: 90000000 }, { timestamp: epoch-10000, value: 110000000 }, { timestamp: epoch-1000, value: 105000000 }]
    const other = await openPage({ ...seed, settings: { ...seed.settings, theme: 'light' }, assetHistory: records })
    const recorded = (await state(other)).assetHistory
    assert.deepEqual(recorded.slice(0,3), records)
    await other.getByTestId('buy-btn').first().click(); await dismissToasts(other)
    await other.getByTestId('open-asset-chart').click()
    await settleModal(other, other.locator('.asset-chart-panel'))
    const points = await other.locator('[data-asset-time]').evaluateAll(nodes => nodes.map(node => ({ time: Number(node.dataset.assetTime), value: Number(node.dataset.assetValue), x: Number(node.getAttribute('cx')) })))
    assert.deepEqual(points.map(point => ({ timestamp: point.time, value: point.value })), recorded.map(({timestamp,value}) => ({timestamp,value})))
    close((points[1].x-points[0].x)/(points.at(-1).x-points[0].x), (points[1].time-points[0].time)/(points.at(-1).time-points[0].time))
    close(Number(await other.getByTestId('last-recorded-asset').getAttribute('data-value')), recorded.at(-1).value)
    assert.notEqual(recorded.at(-1).value, (await state(other)).totalAssets)
    await other.locator('.asset-svg').focus(); await other.keyboard.press('Home')
    close(Number(await other.getByTestId('asset-selected').getAttribute('data-value')), 90000000)
    await capture(other, 'recorded-asset-time.png', '.asset-chart-panel')
    await other.close(); active = page
  })
  await check('future original is downloadable exactly before safe autosave replacement and scoped reset', async () => {
    const raw = ' \r\n{ "version": 99, "cash": 123456, "원문": "변경 금지 🚗" }\r\n'
    const other = await openPage(seed, { raw })
    assert.equal((await other.evaluate(() => window.stockLab.getStorageState())).mode, 'protected')
    await other.getByTestId('open-settings').click(); await other.locator('.save-backups summary').click()
    assert.equal(await download(other, other.getByRole('button', { name: '원문 다운로드', exact: true }), 'original-save.json'), raw)
    assert.equal(await other.evaluate(() => window.stockLab.saveNow()), true)
    const vault = await other.evaluate(key => localStorage.getItem(key), VAULT)
    assert.equal(JSON.parse(vault).entries[0].raw, raw)
    await capture(other, 'preserved-original.png', '.settings-panel')
    other.once('dialog', dialog => dialog.accept())
    await other.clock.resume()
    const navigation = other.waitForNavigation({ waitUntil: 'domcontentloaded' })
    await other.getByRole('button', { name: '🗑️ 게임 초기화', exact: true }).click()
    await navigation; await ready(other); await pause(other)
    assert.equal(await other.evaluate(key => localStorage.getItem(key), VAULT), vault)
    assert.equal(await other.evaluate(() => localStorage.getItem('unrelated-application-data')), 'retain this exactly')
    assert.equal((await state(other)).totalTrades, 0)
    await other.close(); active = page
  })
  await check('backup quota failure keeps corrupt original through autosave and refused reset, but permits download', async () => {
    const raw = '{broken, original text never overwrite'
    const other = await openPage(seed, { raw, quota: true })
    await other.clock.runFor(6000)
    assert.equal(await other.evaluate(key => localStorage.getItem(key), SAVE), raw)
    assert.equal((await other.evaluate(() => window.stockLab.getStorageState())).mode, 'memory')
    await other.getByTestId('open-settings').click()
    assert.equal(await other.getByTestId('save-status').getAttribute('data-mode'), 'memory')
    const current = JSON.parse(await download(other, other.getByTestId('export-current-save'), 'memory-only-current.json'))
    assert.equal(current.version, 4); assert.ok(Number.isFinite(current.cash))
    other.once('dialog', dialog => dialog.accept())
    await other.getByRole('button', { name: '🗑️ 게임 초기화', exact: true }).click()
    assert.match(await other.locator('.save-message').innerText(), /초기화를 중단/)
    assert.equal(await other.evaluate(key => localStorage.getItem(key), SAVE), raw)
    await capture(other, 'memory-only-protection.png', '.settings-panel')
    await other.close(); active = page
  })
  await check('mobile account and chart stay inside viewport with touch and keyboard selection', async () => {
    const other = await openPage(seed, { mobile: true })
    await other.getByTestId('account-detail').locator('summary').click()
    await other.getByTestId('account-detail').evaluate(node => node.scrollIntoView({ behavior: 'instant', block: 'center' }))
    await capture(other, 'mobile-account.png', null, true)
    const width = await other.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: innerWidth }))
    assert.ok(width.document <= width.viewport + 1, JSON.stringify(width))
    await other.clock.runFor(16000)
    await other.getByTestId('stock-center').first().click()
    await settleModal(other, other.getByTestId('chart-modal'))
    await other.getByRole('button', { name: '보조지표', exact: true }).click()
    const svg = other.locator('.technical-chart-svg')
    await svg.tap({ position: { x: 100, y: 150 } })
    assert.equal(await other.getByRole('button', { name: '최신 따라가기', exact: true }).getAttribute('aria-pressed'), 'false')
    await svg.focus(); await other.keyboard.press('Home'); await other.keyboard.press('ArrowRight')
    assert.equal(await other.getByTestId('candle-readout').getAttribute('data-first-sequence'), '1')
    const box = await other.getByTestId('chart-modal').boundingBox()
    assert.ok(box.x >= 0 && box.x + box.width <= 391)
    await capture(other, 'mobile-observed-chart.png')
    await other.getByTestId('candle-readout').evaluate(node => node.scrollIntoView({ behavior: 'instant', block: 'start' }))
    await capture(other, 'mobile-chart-readout.png')
    await svg.focus()
    await other.keyboard.press('Escape')
    assert.equal(await other.getByTestId('chart-modal').isVisible(), true, 'first Escape resets pinned candle')
    await other.keyboard.press('Escape')
    assert.equal(await other.getByTestId('chart-modal').count(), 0, 'second Escape closes dialog')
    await other.close(); active = page
  })
  assert.deepEqual(report.errors, [])
} catch (error) {
  report.failure = error.stack
  console.error(error)
  if (active && !active.isClosed()) await active.screenshot({ path: path.join(output, 'failure.png') }).catch(() => {})
  process.exitCode = 1
} finally {
  await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2))
  for (const context of contexts) await context.close().catch(() => {})
  await browser.close(); await server.close()
  console.log(`${report.checks.filter(check => check.ok).length}/${report.checks.length} detail checks passed`)
}
