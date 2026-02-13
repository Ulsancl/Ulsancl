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
    const overlay = page.locator('.tutorial-overlay')
    try {
        await overlay.waitFor({ state: 'visible', timeout })
    } catch {
        return
    }

    const skipButton = page.locator('.tutorial-overlay .btn-skip, .tutorial-overlay button').first()
    if (await skipButton.isVisible()) {
        await skipButton.click({ force: true })
    }
}

export const dismissSeasonResetNotice = async (page: Page, timeout = 1500) => {
    const overlay = page.locator('.season-reset-notice-overlay')
    try {
        await overlay.waitFor({ state: 'visible', timeout })
    } catch {
        return
    }

    const confirmButton = overlay.locator('button').first()
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
    await page.waitForSelector('[data-testid="stock-card"]')
    await page.waitForSelector('[data-testid="buy-btn"]')

    const tradeModeSection = page.locator('.trade-mode-toggle').first()
    await tradeModeSection.scrollIntoViewIfNeeded()
    await tradeModeSection.locator('.mode-btn').first().click({ force: true })

    const amountModeSection = page.locator('.trade-mode-toggle').nth(1)
    await amountModeSection.scrollIntoViewIfNeeded()
    await amountModeSection.locator('.mode-btn').first().click({ force: true })

    const quantityInput = page.locator('.quantity-input').first()
    if (await quantityInput.isVisible().catch(() => false)) {
        await quantityInput.fill('1')
    }
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
    const cashText = await page.locator('.stat-cash .stat-value').first().textContent()
    return parseKoreanNumber(cashText)
}
