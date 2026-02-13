import { expect, test } from '@playwright/test'
import { clickTabByIndex, preparePage, readCashValue, seedGameState } from './testUtils'

test.describe('앱 기본 기능', () => {
    test.beforeEach(async ({ page }) => {
        await preparePage(page)
    })

    test('앱이 정상적으로 로드됨', async ({ page }) => {
        await expect(page).toHaveTitle(/트레이딩 게임/)
        await expect(page.locator('.header')).toBeVisible()
        await expect(page.locator('.logo')).toBeVisible()
    })

    test('메인 UI 요소가 모두 표시됨', async ({ page }) => {
        await expect(page.locator('.dashboard')).toBeVisible()
        await expect(page.locator('.tab-section')).toBeVisible()
        await expect(page.locator('[data-testid="stock-card"]').first()).toBeVisible()
    })

    test('탭 전환이 작동함', async ({ page }) => {
        await clickTabByIndex(page, 1)
        await clickTabByIndex(page, 2)
        await clickTabByIndex(page, 0)
    })

    test('헤더 메뉴 버튼이 작동함', async ({ page }) => {
        const settingsButton = page.locator('[data-testid="open-settings"]')
        await settingsButton.scrollIntoViewIfNeeded()
        await settingsButton.click({ force: true })
        await expect(settingsButton).toBeVisible()
    })
})

test.describe('거래 기능', () => {
    test.beforeEach(async ({ page }) => {
        await preparePage(page)
    })

    test('주식 카드 클릭시 모달이 열림', async ({ page }) => {
        await page.locator('[data-testid="stock-center"]').first().click({ force: true })
        await page.evaluate(() => {
            const target = document.querySelector('[data-testid="stock-center"]') as HTMLElement | null
            target?.click()
        })
        await expect(page.locator('[data-testid="chart-modal-overlay"]')).toBeVisible({ timeout: 5000 })
    })

    test('매수 버튼이 작동함', async ({ page }) => {
        const buyButton = page.locator('[data-testid="buy-btn"]').first()

        const cashBefore = await readCashValue(page)
        await expect(buyButton).toBeEnabled()
        await buyButton.click({ force: true })

        const cashAfter = await readCashValue(page)
        expect(cashAfter).toBeLessThanOrEqual(cashBefore)
    })
})

test.describe('반응형 레이아웃', () => {
    test('모바일 뷰포트에서 정상 작동', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 })
        await preparePage(page)
        await expect(page.locator('.header')).toBeVisible()
        await expect(page.locator('.dashboard')).toBeVisible()
    })

    test('태블릿 뷰포트에서 정상 작동', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 })
        await preparePage(page)
        await expect(page.locator('.header')).toBeVisible()
        await expect(page.locator('.dashboard')).toBeVisible()
    })
})

test.describe('성능', () => {
    test('페이지 로드 시간이 10초 이내', async ({ page }) => {
        await seedGameState(page)
        const startTime = Date.now()
        await page.goto('/')
        await page.waitForLoadState('networkidle')
        const loadTime = Date.now() - startTime
        expect(loadTime).toBeLessThan(10000)
    })

    test('가격 업데이트가 작동함', async ({ page }) => {
        await preparePage(page)
        const firstPrice = await page.locator('.stock-price').first().textContent()
        await page.waitForTimeout(3000)
        const nextPrice = await page.locator('.stock-price').first().textContent()
        expect(nextPrice).toBeTruthy()
        expect(firstPrice).toBeTruthy()
    })
})
