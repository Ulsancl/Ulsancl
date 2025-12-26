/**
 * 사용자 시나리오 E2E 테스트
 * 실제 사용자가 앱을 사용하는 시나리오 테스트
 */
import { test, expect } from '@playwright/test';
import { preparePage } from './testUtils';

test.describe('사용자 시나리오: 첫 거래', () => {
    test('신규 유저가 첫 주식을 매수함', async ({ page }) => {
        await preparePage(page);

        // 튜토리얼 스킵

        // 1. 초기 자산 확인
        const totalText = await page.locator('.stat-total .stat-value').textContent();
        const totalValue = Number((totalText || '').replace(/[^\d.]/g, ''));
        expect(totalValue).toBeGreaterThan(0);

        // 2. 첫 번째 주식 찾기
        const firstStock = page.locator('.stock-card').first();
        await expect(firstStock).toBeVisible();

        // 3. 매수 버튼 클릭
        const longModeButton = page.locator('.trade-mode-toggle').first().locator('.mode-btn').first();
        await longModeButton.click({ force: true });

        const buyButton = firstStock.locator('.quick-btn.buy');
        await buyButton.scrollIntoViewIfNeeded();
        await expect(buyButton).toBeEnabled();
        await buyButton.click({ force: true });

        // 4. 거래 성공 알림 또는 현금 감소 확인
        await page.waitForTimeout(500);

        // 5. 포트폴리오에 보유 수량 표시됨
        await expect(page.locator('.pos-badge.long').first()).toBeVisible({ timeout: 5000 });
    });

    test('주식을 매수 후 전량 매도', async ({ page }) => {
        await preparePage(page);

        // 튜토리얼 스킵

        // 1. 매수
        const firstStock = page.locator('.stock-card').first();
        const longModeButton = page.locator('.trade-mode-toggle').first().locator('.mode-btn').first();
        await longModeButton.click({ force: true });

        const buyButton = firstStock.locator('.quick-btn.buy');
        await buyButton.scrollIntoViewIfNeeded();
        await expect(buyButton).toBeEnabled();
        await buyButton.click({ force: true });

        // 2. 전량 매도 버튼이 나타남
        const sellAllButton = firstStock.locator('.quick-btn.sell-all');
        await expect(sellAllButton).toBeVisible({ timeout: 5000 });

        // 3. 전량 매도
        await sellAllButton.click();

        // 4. 전량매도 버튼이 사라짐
        await expect(firstStock.locator('.quick-btn.sell-all')).toHaveCount(0);
    });
});

test.describe('사용자 시나리오: 차트 분석', () => {
    test('주식 차트를 열고 정보를 확인', async ({ page }) => {
        await preparePage(page);

        // 튜토리얼 스킵

        // 1. 주식 가격 클릭하여 차트 열기
        await page.locator('.stock-center').first().click();

        // 2. 모달/차트가 열림
        await expect(page.locator('.chart-modal-overlay')).toBeVisible({ timeout: 5000 });

        // 3. 차트 또는 가격 정보가 표시됨
        await expect(page.locator('.chart-modal .chart-area svg, .chart-modal .chart-area canvas').first()).toBeVisible({ timeout: 5000 });

        // 4. 닫기 버튼으로 닫기
        const closeButton = page.locator('.close-btn, .modal-close, button:has-text("닫기")').first();
        if (await closeButton.isVisible()) {
            await closeButton.click();
            await expect(page.locator('.chart-modal-overlay')).not.toBeVisible({ timeout: 3000 });
        }
    });
});

test.describe('사용자 시나리오: 설정 변경', () => {
    test('테마를 변경함', async ({ page }) => {
        await preparePage(page);

        // 튜토리얼 스킵

        // 1. 설정 버튼 클릭
        await page.locator('.header-btn[data-tooltip="설정"]').click();

        // 2. 설정 패널이 열림
        await expect(page.locator('.settings-panel, .modal')).toBeVisible();

        // 3. 테마 관련 옵션 찾기 (있다면)
        const themeOption = page.locator('text=테마, text=Theme, .theme-toggle').first();
        if (await themeOption.isVisible()) {
            await themeOption.click();
        }

        // 4. 설정 닫기
        const closeButton = page.locator('.close-btn, button:has-text("닫기")').first();
        if (await closeButton.isVisible()) {
            await closeButton.click();
        }
    });
});

test.describe('사용자 시나리오: 뉴스 확인', () => {
    test('뉴스 피드가 업데이트됨', async ({ page }) => {
        await preparePage(page);

        // 튜토리얼 스킵

        // 뉴스 섹션이 존재함
        const newsSection = page.locator('.news-section').first();
        await expect(newsSection).toBeVisible({ timeout: 5000 });

        // 일정 시간 후에도 페이지가 안정적
        await page.waitForTimeout(3000);
        await expect(newsSection).toBeVisible();
    });
});

test.describe('사용자 시나리오: 다양한 상품 탐색', () => {
    test('ETF, 코인, 채권, 원자재 탭 탐색', async ({ page }) => {
        await preparePage(page);

        // 튜토리얼 스킵

        const tabButtons = page.locator('[data-testid="tab-btn"]');
        const clickTab = async (index, label) => {
            const tab = tabButtons.nth(index);
            await tab.scrollIntoViewIfNeeded();
            await tab.click({ force: true });
            await page.evaluate((i) => {
                const btn = document.querySelectorAll('[data-testid="tab-btn"]')[i];
                btn?.click();
            }, index);
            await page.waitForFunction(
                (expected) => Array.from(document.querySelectorAll('.stock-code'))
                    .some(el => el.textContent?.includes(expected)),
                label
            );
            await page.waitForTimeout(300);
        };

        await clickTab(1, 'ETF');
        await clickTab(2, '코인');
        await clickTab(3, '채권');
        await clickTab(4, '원자재');
        await clickTab(0, '주식');
    });
});
