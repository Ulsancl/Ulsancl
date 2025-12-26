import { type Page } from '@playwright/test'

export const seedGameState = async (page: Page) => {
    await page.addInitScript(() => {
        const seed = {
            version: 2,
            savedAt: Date.now(),
            totalTrades: 1
        }
        localStorage.setItem('stockTradingGame', JSON.stringify(seed))
    })
}

export const dismissTutorial = async (page: Page, timeout = 2000) => {
    const overlay = page.locator('.tutorial-overlay')
    try {
        await overlay.waitFor({ state: 'visible', timeout })
    } catch {
        return
    }

    const skipButton = page.locator('.tutorial-overlay .btn-skip, .tutorial-overlay button:has-text("Skip")')
    if (await skipButton.isVisible()) {
        await skipButton.click()
    }
}

export const preparePage = async (page: Page, url = '/') => {
    await seedGameState(page)
    await page.goto(url)
    await page.waitForSelector('.tab-btn.active')
    await page.waitForSelector('.stock-card')
    await page.waitForSelector('.stock-card.initialized').catch(() => {})
    await page.addStyleTag({
        content: '.tutorial-overlay, .crisis-alert { display: none !important; }'
    })
    await dismissTutorial(page, 500)
}
