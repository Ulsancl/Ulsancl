// Actual mobile web UI captures. Confirm/replace with the final Play-installed TWA.
import { chromium } from 'playwright'
import { preview } from 'vite'
import { mkdir } from 'node:fs/promises'
const output = 'docs/play/screenshots'
await mkdir(output, { recursive: true })
const server = await preview({ preview: { host: '127.0.0.1', port: 5267, strictPort: true } })
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({
    viewport: { width: 360, height: 640 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
  })
  await page.goto('http://127.0.0.1:5267/')
  await page.getByRole('heading', { name: '트레이딩', exact: true }).waitFor()
  await page.getByLabel('주문 수량').fill('5')
  await page.getByRole('button', { name: '매수 주문', exact: true }).click()
  await page.getByRole('button', { name: '+30분', exact: true }).click()
  const close = page.getByRole('button', { name: '알림 닫기' })
  if (await close.isVisible()) await close.click()
  const nav = page.getByRole('navigation', { name: '주 메뉴' })
  for (const [name, file] of [
    ['트레이딩', '01-trading'],
    ['포트폴리오', '02-portfolio'],
    ['캠페인', '03-campaigns'],
    ['전략 연구실', '04-strategies'],
  ]) {
    await nav.getByRole('button', { name, exact: true }).click()
    await page.getByRole('heading', { name, exact: true, level: 1 }).waitFor()
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({ path: output + '/' + file + '.png', animations: 'disabled' })
  }
  console.log(
    'Captured 4 actual mobile web screens at 1080×1920; no overlay claims or fabricated rankings.'
  )
} finally {
  await browser.close()
  await new Promise((resolve) => server.httpServer.close(resolve))
}
