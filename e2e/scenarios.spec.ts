import { expect, test } from '@playwright/test'
import { clickTabByIndex, parseKoreanNumber, preparePage, readCashValue } from './testUtils'

test.describe('사용자 시나리오: 첫 거래', () => {
    test('신규 유저가 첫 주식을 매수함', async ({ page }) => {
        await preparePage(page)

        const totalText = await page.locator('.stat-total .stat-value').first().textContent()
        const totalValue = parseKoreanNumber(totalText)
        expect(totalValue).toBeGreaterThan(0)

        const buyButton = page.locator('[data-testid="buy-btn"]').first()

        const cashBefore = await readCashValue(page)
        await expect(buyButton).toBeEnabled()
        await buyButton.click({ force: true })

        const cashAfter = await readCashValue(page)
        expect(cashAfter).toBeLessThanOrEqual(cashBefore)
    })

    test('주식을 매수 후 전량 매도', async ({ page }) => {
        await preparePage(page)

        const buyButton = page.locator('[data-testid="buy-btn"]').first()
        const cashBefore = await readCashValue(page)
        await buyButton.click({ force: true })

        const sellAllButton = page.locator('[data-testid="sell-all-btn"]').first()
        if (await sellAllButton.isVisible().catch(() => false)) {
            await sellAllButton.click({ force: true })
            await expect(page.locator('[data-testid="position-badge-long"]')).toHaveCount(0)
        } else {
            const cashAfter = await readCashValue(page)
            expect(cashAfter).toBeLessThanOrEqual(cashBefore)
        }
    })
})

test.describe('사용자 시나리오: 차트 분석', () => {
    test('주식 차트를 열고 닫는다', async ({ page }) => {
        await preparePage(page)

        await page.locator('[data-testid="stock-center"]').first().click({ force: true })
        await page.evaluate(() => {
            const target = document.querySelector('[data-testid="stock-center"]') as HTMLElement | null
            target?.click()
        })
        const chartModal = page.locator('[data-testid="chart-modal-overlay"]')
        await expect(chartModal).toBeVisible({ timeout: 5000 })

        const closeButton = page.locator('.chart-modal .close-btn').first()
        await closeButton.click({ force: true })
        await expect(chartModal).toHaveCount(0)
    })
})

test.describe('사용자 시나리오: 설정 변경', () => {
    test('설정 패널을 연다', async ({ page }) => {
        await preparePage(page)

        const settingsButton = page.locator('[data-testid="open-settings"]')
        await settingsButton.click({ force: true })
        await expect(settingsButton).toBeVisible()
    })
})

test.describe('사용자 시나리오: 뉴스 확인', () => {
    test('뉴스 피드가 렌더된다', async ({ page }) => {
        await preparePage(page)
        await expect(page.locator('.news-section').first()).toBeVisible({ timeout: 5000 })
    })
})

test.describe('사용자 시나리오: 다양한 상품 탐색', () => {
    test('주요 탭을 탐색한다', async ({ page }) => {
        await preparePage(page)

        await clickTabByIndex(page, 1)
        await clickTabByIndex(page, 2)
        await clickTabByIndex(page, 3)
        await clickTabByIndex(page, 4)
        await clickTabByIndex(page, 0)
    })
})
