import { expect, type Page } from '@playwright/test'

const TAB_BUTTON_SELECTOR = '[data-testid="tab-btn"]'

export const seedGameState = async (page: Page) => {
    await page.addInitScript(() => {
        const seed = {
            version: 4,
            savedAt: Date.now(),
            totalTrades: 1
        }
        localStorage.setItem('stockTradingGame', JSON.stringify(seed))
        localStorage.removeItem('stockGameSeasonResetNoticePending')
    })
}

export const dismissTutorial = async (page: Page, timeout = 1500) => {
    const overlay = page.getByTestId('tutorial-overlay')
    try {
        await overlay.waitFor({ state: 'visible', timeout })
    } catch {
        return
    }

    const skipButton = page.getByTestId('tutorial-skip').first()
    if (await skipButton.isVisible()) {
        await skipButton.click({ force: true })
    }
}

export const dismissSeasonResetNotice = async (page: Page, timeout = 1500) => {
    const overlay = page.getByTestId('season-reset-notice-overlay')
    try {
        await overlay.waitFor({ state: 'visible', timeout })
    } catch {
        return
    }

    const confirmButton = page.getByTestId('season-reset-notice-confirm').first()
    if (await confirmButton.isVisible()) {
        await confirmButton.click({ force: true })
    } else {
        await overlay.click({ force: true })
    }

    await expect(overlay).toHaveCount(0)
}

export const clickTabByIndex = async (page: Page, index: number) => {
    const tab = page.locator(TAB_BUTTON_SELECTOR).nth(index)
    await tab.scrollIntoViewIfNeeded()
    await tab.click({ force: true })
    await page.evaluate((tabIndex) => {
        const target = document.querySelectorAll('[data-testid="tab-btn"]')[tabIndex] as HTMLElement | undefined
        target?.click()
    }, index)
    await expect.poll(async () => tab.getAttribute('aria-selected')).toBe('true')
}

export const preparePage = async (page: Page, url = '/') => {
    await seedGameState(page)
    await page.goto(url)

    await dismissSeasonResetNotice(page, 500)
    await dismissTutorial(page, 500)

    await page.addStyleTag({
        content: [
            '.tutorial-overlay, .crisis-alert { display: none !important; }',
            '.notification, .toast-container { display: none !important; }',
            '* { animation-duration: 0s !important; transition-duration: 0s !important; }'
        ].join('\n')
    })

    const tabButtons = page.locator(TAB_BUTTON_SELECTOR)
    await tabButtons.first().waitFor({ state: 'visible' })
    await expect(page.getByTestId('game-header')).toBeVisible()
    await expect(page.getByTestId('dashboard-panel')).toBeVisible()
    await expect(page.getByTestId('stock-card').first()).toBeVisible()
    await expect(page.getByTestId('buy-btn').first()).toBeVisible()

    const longModeButton = page.getByTestId('long-mode-btn')
    await longModeButton.scrollIntoViewIfNeeded()
    await longModeButton.click({ force: true })
    await expect(longModeButton).toHaveClass(/active/)

    const quantityModeButton = page.getByTestId('quantity-mode-btn')
    await quantityModeButton.scrollIntoViewIfNeeded()
    await quantityModeButton.click({ force: true })
    await expect(quantityModeButton).toHaveClass(/active/)

    const quantityInput = page.getByTestId('quantity-input').first()
    if (await quantityInput.isVisible().catch(() => false)) {
        await quantityInput.fill('1')
    }
}

export const openChartModal = async (page: Page, index = 0) => {
    const target = page.getByTestId('stock-center').nth(index)
    await target.scrollIntoViewIfNeeded()
    await target.click({ force: true })

    await page.evaluate((targetIndex) => {
        const node = document.querySelectorAll('[data-testid=\"stock-center\"]')[targetIndex] as HTMLElement | undefined
        if (!node) return
        node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
    }, index)
}

export const parseKoreanNumber = (text: string | null) => {
    if (!text) return 0

    const normalized = text.replace(/\s+/g, '').replace(/,/g, '')
    const units: Array<[RegExp, number]> = [
        [/(-?\d+(?:\.\d+)?)조/g, 1_0000_0000_0000],
        [/(-?\d+(?:\.\d+)?)억/g, 1_0000_0000],
        [/(-?\d+(?:\.\d+)?)만/g, 1_0000]
    ]

    let total = 0
    for (const [pattern, multiplier] of units) {
        let match: RegExpExecArray | null
        while ((match = pattern.exec(normalized)) !== null) {
            total += Number(match[1]) * multiplier
        }
    }

    if (total !== 0) return total

    return Number(normalized.replace(/[^\d.-]/g, '')) || 0
}

export const readCashValue = async (page: Page) => {
    const cashText = await page.getByTestId('cash-value').first().textContent()
    return parseKoreanNumber(cashText)
}
