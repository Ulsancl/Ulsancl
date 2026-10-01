import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { preview } from 'vite'
import { chromium } from 'playwright'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const output = path.join(root, 'output/offline-browser')
await fs.mkdir(output, { recursive: true })
const report = { checks: [], errors: [], screenshots: [] }
const legacySource = `self.addEventListener('install',e=>e.waitUntil(caches.open('stock-game-v1').then(c=>c.put('/index.html',new Response('LEGACY_STOCK_CACHE')))));self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch',e=>{if(e.request.mode==='navigate')e.respondWith(caches.open('stock-game-v1').then(c=>c.match('/index.html')))});`
const legacyFixture = { name: 'legacy-worker-fixture', configurePreviewServer(server) {
  server.middlewares.use((request, response, next) => {
    if (request.url?.split('?')[0] !== '/legacy-stock-worker.js') return next()
    response.setHeader('Content-Type', 'application/javascript')
    response.setHeader('Cache-Control', 'no-store')
    response.end(legacySource)
  })
} }
const server = await preview({ root, plugins: [legacyFixture], preview: { host: '127.0.0.1', port: 5265, strictPort: true } })
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
const page = await context.newPage()
page.on('pageerror', error => report.errors.push(error.message))
async function check(name, work) { await work(); report.checks.push(name); console.log(`PASS ${name}`) }
let next
try {
  // Seed an older same-scope worker, plus unrelated app cache, before first production load.
  await page.goto('http://127.0.0.1:5265/manifest.json')
  await page.evaluate(async () => {
    localStorage.setItem('stockTradingGame', JSON.stringify({ version: 4, totalTrades: 1, cash: 123456789, gameStartTime: Date.now() }))
    await (await caches.open('unrelated-app-cache')).put('/other-app-proof', new Response('retain'))
    await navigator.serviceWorker.register('/legacy-stock-worker.js')
    await navigator.serviceWorker.ready
  })
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
  await page.reload()
  assert.equal(await page.locator('body').innerText(), 'LEGACY_STOCK_CACHE')
  await check('an existing cache cannot permanently starve the new build; other app caches survive', async () => {
    // Same operation a previously cached main bundle performs: register /sw.js on startup.
    await page.evaluate(async () => { await navigator.serviceWorker.register('/sw.js') })
    await page.waitForFunction(async () => (await navigator.serviceWorker.getRegistration())?.waiting?.state === 'installed')
    const newWorker = context.serviceWorkers().find(worker => worker.url().endsWith('/sw.js'))
    assert.ok(newWorker)
    // A new tab after closing the last client activates the worker without losing a live game.
    await page.close()
    for (let attempt = 0; attempt < 100; attempt++) {
      if (await newWorker.evaluate(() => self.registration.active?.scriptURL.endsWith('/sw.js'))) break
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    next = await context.newPage()
    next.on('pageerror', error => report.errors.push(error.message))
    await next.goto('http://127.0.0.1:5265', { waitUntil: 'domcontentloaded' })
    await next.waitForFunction(() => window.stockLab?.getState().isInitialized)
    const data = await next.evaluate(async () => ({ keys: await caches.keys(), cash: window.stockLab.getState().cash, retained: await (await caches.open('unrelated-app-cache')).match('/other-app-proof').then(r => r.text()) }))
    assert.ok(!data.keys.includes('stock-game-v1'))
    assert.equal(data.retained, 'retain')
    assert.equal(data.cash, 123456789)
  })
  await check('all lazy views and saved balance load offline from the production package', async () => {
    await next.evaluate(async () => { await navigator.serviceWorker.ready })
    await context.setOffline(true)
    await next.reload({ waitUntil: 'domcontentloaded' })
    await next.waitForFunction(() => window.stockLab?.getState().isInitialized)
    assert.equal(await next.evaluate(() => window.stockLab.getState().cash), 123456789)
    await next.getByTestId('stock-center').first().click()
    await next.getByTestId('chart-modal').waitFor()
    await next.getByTestId('chart-modal-close').click()
    await next.getByTestId('total-assets-value').click()
    await next.locator('.asset-chart-panel').waitFor()
    await next.locator('.asset-chart-panel .close-btn').click()
    await next.getByTestId('open-statistics').click()
    await next.locator('.statistics-panel').waitFor()
    await next.locator('.statistics-panel .close-btn').click()
    await next.getByTestId('open-leaderboard').click()
    await next.getByText('이 배포본은 온라인 랭킹에 연결되어 있지 않습니다.', { exact: false }).waitFor()
    await next.locator('.leaderboard-panel .close-btn').click()
    await next.getByTestId('open-settings').click()
    await next.getByTestId('export-current-save').waitFor()
    await next.screenshot({ path: path.join(output, 'offline-settings.png') })
    report.screenshots.push('offline-settings.png')
  })
  await check('same-origin unrelated resources stay out of the app cache and the saved balance is retained', async () => {
    await context.setOffline(false)
    await next.evaluate(() => fetch('/unrelated-application-resource.json', { cache: 'no-store' }))
    const data = await next.evaluate(async () => ({ raw: JSON.parse(localStorage.getItem('stockTradingGame')), keys: await caches.keys() }))
    assert.equal(data.raw.version, 4)
    assert.equal(data.raw.cash, 123456789)
    assert.ok(data.keys.includes('unrelated-app-cache'))
    const cached = await next.evaluate(async () => {
      const names = (await caches.keys()).filter(name => name.startsWith('stock-game-'))
      return (await Promise.all(names.map(async name => (await (await caches.open(name)).keys()).map(request => new URL(request.url).pathname)))).flat()
    })
    assert.ok(!cached.includes('/unrelated-application-resource.json'))
    assert.deepEqual(report.errors, [])
  })
} catch (error) {
  report.failure = error.stack
  console.error(error)
  process.exitCode = 1
} finally {
  await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2))
  await context.close(); await browser.close(); await new Promise(resolve => server.httpServer.close(resolve))
}
