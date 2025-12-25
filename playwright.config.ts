import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 테스트 설정
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    testDir: './e2e',

    // 테스트 파일 패턴
    testMatch: '**/*.spec.{js,ts}',

    // 병렬 실행
    fullyParallel: true,

    // CI에서는 재시도 없음
    forbidOnly: !!process.env.CI,

    // 재시도 횟수
    retries: process.env.CI ? 2 : 0,

    // 동시 워커 수
    workers: process.env.CI ? 1 : undefined,

    // 리포터 설정
    reporter: [
        ['html', { outputFolder: 'playwright-report' }],
        ['list']
    ],

    // 글로벌 설정
    use: {
        // 기본 URL
        baseURL: 'http://localhost:7777',

        // 실패시 스크린샷
        screenshot: 'only-on-failure',

        // 비디오 녹화
        video: 'retain-on-failure',

        // 트레이스 수집
        trace: 'on-first-retry',

        // 뷰포트 설정
        viewport: { width: 1280, height: 720 },
    },

    // 프로젝트 (브라우저별)
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },
        // 모바일 테스트
        {
            name: 'Mobile Chrome',
            use: { ...devices['Pixel 5'] },
        },
        {
            name: 'Mobile Safari',
            use: { ...devices['iPhone 12'] },
        },
    ],

    // 테스트 전 개발 서버 시작
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:7777',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
    },
});
