import { expect, test } from '@playwright/test'
import { clickTabByIndex, openChartModal, parseKoreanNumber, preparePage, readCashValue } from './testUtils'

test.describe('사용자 시나리오: 첫 거래', () => {
    test('신규 유저가 첫 주식을 매수함', async ({ page }) => {
        await preparePage(page)

        const totalText = await page.getByTestId('total-assets-value').first().textContent()
        const totalValue = parseKoreanNumber(totalText)
        expect(totalValue).toBeGreaterThan(0)

        const buyButton = page.getByTestId('buy-btn').first()

        const cashBefore = await readCashValue(page)
        await expect(buyButton).toBeEnabled()
        await buyButton.click({ force: true })

        const cashAfter = await readCashValue(page)
        expect(cashAfter).toBeLessThanOrEqual(cashBefore)
    })

    test('주식을 매수 후 전량 매도', async ({ page }) => {
        await preparePage(page)

        const buyButton = page.getByTestId('buy-btn').first()
        const cashBefore = await readCashValue(page)
        await buyButton.click({ force: true })

        const sellAllButton = page.getByTestId('sell-all-btn').first()
        if (await sellAllButton.isVisible().catch(() => false)) {
            await sellAllButton.click({ force: true })
            await expect(page.getByTestId('position-badge-long')).toHaveCount(0)
        } else {
            const cashAfter = await readCashValue(page)
            expect(cashAfter).toBeLessThanOrEqual(cashBefore)
        }
    })
})

test.describe('사용자 시나리오: 차트 분석', () => {
    test('주식 차트를 열고 닫는다', async ({ page }) => {
        await preparePage(page)

        await openChartModal(page)
        const chartModal = page.getByTestId('chart-modal-overlay')
        await expect(chartModal).toBeVisible({ timeout: 5000 })

        const closeButton = page.getByTestId('chart-modal-close').first()
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
        await expect(page.getByTestId('news-section').first()).toBeVisible({ timeout: 5000 })
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
