import fs from 'fs'
import path from 'path'
import { type Page } from '@playwright/test'

const TAB_BUTTON_SELECTOR = '[data-testid="tab-btn"]'
const ACTIVE_TAB_SELECTOR = `${TAB_BUTTON_SELECTOR}[data-active="true"], ${TAB_BUTTON_SELECTOR}[aria-selected="true"]`

const captureTabDiagnostics = async (page: Page, error: unknown) => {
    const debugDir = path.join('test-results')
    const timestamp = Date.now()
    const screenshotPath = path.join(debugDir, `tab-active-timeout-${timestamp}.png`)

    try {
        fs.mkdirSync(debugDir, { recursive: true })
    } catch {
        // noop
    }

    try {
        await page.screenshot({ path: screenshotPath, fullPage: true })
    } catch {
        // noop
    }

    let contentSnippet = ''
    try {
        const content = await page.content()
        contentSnippet = content.slice(0, 3000)
    } catch {
        // noop
    }

    let tabSectionSnippet = ''
    try {
        tabSectionSnippet = await page.locator('.tab-section').first().evaluate(el => el.outerHTML)
    } catch {
        // noop
    }

    const message = error instanceof Error ? error.message : String(error)
    // eslint-disable-next-line no-console
    console.warn('[preparePage] tab activation wait failed', {
        message,
        screenshotPath,
        tabSectionSnippet,
        contentSnippet
    })
}

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
    try {
        const tabButtons = page.locator(TAB_BUTTON_SELECTOR)
        await tabButtons.first().waitFor({ state: 'visible' })
        const activeTab = page.locator(ACTIVE_TAB_SELECTOR)
        if (!(await activeTab.first().isVisible())) {
            const firstTab = tabButtons.first()
            await firstTab.scrollIntoViewIfNeeded()
            await firstTab.click({ force: true })
        }
        await page.waitForSelector(ACTIVE_TAB_SELECTOR)
    } catch (error) {
        await captureTabDiagnostics(page, error)
        throw error
    }
    await page.waitForSelector('.stock-card')
    await page.waitForSelector('.stock-card.initialized').catch(() => {})
    await page.addStyleTag({
        content: '.tutorial-overlay, .crisis-alert { display: none !important; }'
    })
    await dismissTutorial(page, 500)
}
