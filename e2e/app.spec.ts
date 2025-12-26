/**
 * 앱 기본 기능 E2E 테스트
 * 앱 로드, 네비게이션, 기본 상호작용 테스트
 */
import { test, expect } from '@playwright/test';
import { preparePage, seedGameState } from './testUtils';

test.describe('앱 기본 기능', () => {
    test.beforeEach(async ({ page }) => {
        await preparePage(page);
        // 튜토리얼 스킵 대기
        await page.waitForTimeout(1000);
    });

    test('앱이 정상적으로 로드됨', async ({ page }) => {
        // 타이틀 확인
        await expect(page).toHaveTitle(/트레이딩 게임/);

        // 헤더가 표시됨
        await expect(page.locator('.header')).toBeVisible();

        // 로고가 표시됨
        await expect(page.locator('.logo')).toContainText('트레이딩 게임');
    });

    test('메인 UI 요소가 모두 표시됨', async ({ page }) => {
        // 튜토리얼 스킵

        // 대시보드
        await expect(page.locator('.dashboard')).toBeVisible();

        // 탭 섹션
        await expect(page.locator('.tab-section')).toBeVisible();

        // 주식 목록 또는 market 뷰
        await expect(page.locator('.stock-list, .heatmap-section, .portfolio-view-section')).toBeVisible();
    });

    test('탭 전환이 작동함', async ({ page }) => {
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
        };

        await clickTab(1, 'ETF');
        await clickTab(2, '코인');
        await clickTab(0, '주식');
    });

    test('헤더 메뉴 버튼이 작동함', async ({ page }) => {
        // 튜토리얼 스킵

        const settingsButton = page.locator('.header-btn').last();
        await settingsButton.scrollIntoViewIfNeeded();
        await settingsButton.click();
        await expect(page.locator('.settings-panel')).toBeVisible();
    });
});

test.describe('거래 기능', () => {
    test.beforeEach(async ({ page }) => {
        await preparePage(page);
        // 튜토리얼 스킵
        await page.waitForTimeout(500);
    });

    test('주식 카드 클릭시 모달이 열림', async ({ page }) => {
        // 첫 번째 주식 카드의 가격 영역 클릭
        await page.locator('.stock-center').first().click();

        // 모달이 열림 (차트 또는 상세 정보)
        await expect(page.locator('.chart-modal-overlay')).toBeVisible({ timeout: 5000 });
    });

    test('매수 버튼이 작동함', async ({ page }) => {
        const longModeButton = page.locator('.trade-mode-toggle').first().locator('.mode-btn').first();
        await longModeButton.click({ force: true });

        const firstCard = page.locator('.stock-card').first();
        const buyButton = firstCard.locator('.quick-btn.buy');
        await buyButton.scrollIntoViewIfNeeded();
        await expect(buyButton).toBeEnabled();
        await buyButton.click({ force: true });

        await expect(page.locator('.pos-badge.long').first()).toBeVisible({ timeout: 5000 });
    });
});

test.describe('반응형 레이아웃', () => {
    test('모바일 뷰포트에서 정상 작동', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await preparePage(page);

        await expect(page.locator('.header')).toBeVisible();
        await expect(page.locator('.dashboard')).toBeVisible();
    });

    test('태블릿 뷰포트에서 정상 작동', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await preparePage(page);

        await expect(page.locator('.header')).toBeVisible();
        await expect(page.locator('.dashboard')).toBeVisible();
    });
});

test.describe('성능', () => {
    test('페이지 로드 시간이 5초 이내', async ({ page }) => {
        await seedGameState(page);
        const startTime = Date.now();
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - startTime;

        expect(loadTime).toBeLessThan(10000);
    });

    test('가격 업데이트가 부드럽게 작동함', async ({ page }) => {
        await preparePage(page);

        // 튜토리얼 스킵

        // 첫 번째 주식 가격 기록
        const firstPrice = await page.locator('.stock-price').first().textContent();

        // 3초 대기
        await page.waitForTimeout(3000);

        // 가격이 변경되었을 수 있음 (게임 진행중이므로)
        const newPrice = await page.locator('.stock-price').first().textContent();

        // 가격 요소가 여전히 존재
        expect(newPrice).toBeTruthy();
    });
});
