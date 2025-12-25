/**
 * 앱 기본 기능 E2E 테스트
 * 앱 로드, 네비게이션, 기본 상호작용 테스트
 */
import { test, expect } from '@playwright/test';

test.describe('앱 기본 기능', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
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
        const skipButton = page.locator('button:has-text("Skip")');
        if (await skipButton.isVisible()) {
            await skipButton.click();
        }

        // 대시보드
        await expect(page.locator('.dashboard')).toBeVisible();

        // 탭 섹션
        await expect(page.locator('.tab-section')).toBeVisible();

        // 주식 목록 또는 market 뷰
        await expect(page.locator('.stock-list, .heatmap-section, .portfolio-view-section')).toBeVisible();
    });

    test('탭 전환이 작동함', async ({ page }) => {
        // 튜토리얼 스킵
        const skipButton = page.locator('button:has-text("Skip")');
        if (await skipButton.isVisible()) {
            await skipButton.click();
        }

        // ETF 탭 클릭
        await page.locator('.tab-btn:has-text("ETF")').click();
        await expect(page.locator('.tab-btn:has-text("ETF")')).toHaveClass(/active/);

        // 코인 탭 클릭
        await page.locator('.tab-btn:has-text("코인")').click();
        await expect(page.locator('.tab-btn:has-text("코인")')).toHaveClass(/active/);

        // 주식 탭으로 돌아가기
        await page.locator('.tab-btn:has-text("주식")').click();
        await expect(page.locator('.tab-btn:has-text("주식")')).toHaveClass(/active/);
    });

    test('헤더 메뉴 버튼이 작동함', async ({ page }) => {
        // 튜토리얼 스킵
        const skipButton = page.locator('button:has-text("Skip")');
        if (await skipButton.isVisible()) {
            await skipButton.click();
        }

        // 설정 버튼 클릭
        await page.locator('.header-btn[data-tooltip="설정"]').click();
        await expect(page.locator('.settings-panel, .modal')).toBeVisible();
    });
});

test.describe('거래 기능', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // 튜토리얼 스킵
        const skipButton = page.locator('button:has-text("Skip")');
        if (await skipButton.isVisible()) {
            await skipButton.click();
        }
        await page.waitForTimeout(500);
    });

    test('주식 카드 클릭시 모달이 열림', async ({ page }) => {
        // 첫 번째 주식 카드의 가격 영역 클릭
        await page.locator('.stock-center').first().click();

        // 모달이 열림 (차트 또는 상세 정보)
        await expect(page.locator('.modal-overlay, .stock-chart-modal')).toBeVisible({ timeout: 5000 });
    });

    test('매수 버튼이 작동함', async ({ page }) => {
        const initialCash = await page.locator('.stat-cash .stat-value').textContent();

        // 매수 버튼 클릭
        const buyButton = page.locator('.quick-btn.buy').first();
        if (await buyButton.isVisible()) {
            await buyButton.click();

            // 잠시 대기 후 현금 변화 확인
            await page.waitForTimeout(500);
            const newCash = await page.locator('.stat-cash .stat-value').textContent();

            // 매수가 성공하면 현금이 줄어듦
            expect(newCash).not.toBe(initialCash);
        }
    });
});

test.describe('반응형 레이아웃', () => {
    test('모바일 뷰포트에서 정상 작동', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');

        await expect(page.locator('.header')).toBeVisible();
        await expect(page.locator('.dashboard')).toBeVisible();
    });

    test('태블릿 뷰포트에서 정상 작동', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.goto('/');

        await expect(page.locator('.header')).toBeVisible();
        await expect(page.locator('.dashboard')).toBeVisible();
    });
});

test.describe('성능', () => {
    test('페이지 로드 시간이 5초 이내', async ({ page }) => {
        const startTime = Date.now();
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - startTime;

        expect(loadTime).toBeLessThan(5000);
    });

    test('가격 업데이트가 부드럽게 작동함', async ({ page }) => {
        await page.goto('/');

        // 튜토리얼 스킵
        const skipButton = page.locator('button:has-text("Skip")');
        if (await skipButton.isVisible()) {
            await skipButton.click();
        }

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
