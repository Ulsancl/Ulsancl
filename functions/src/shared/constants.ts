// @ts-nocheck
/**
 * AUTO-GENERATED - Combined constants for server
 */

// From src/constants/stocks.js
/**
 * 주식 종목 데이터
 * 45개 국내 주식 종목 정의
 */

export const INITIAL_STOCKS = [
    // IT/기술 섹터
    { id: 1, name: '삼성전자', code: 'SEC', price: 72000, basePrice: 72000, color: '#1E88E5', sector: 'tech', fundamentals: { marketCap: 450, pe: 12.5, eps: 5760, yield: 2.1, revenue: 250, profit: 45, debtRatio: 25 } },
    { id: 3, name: 'SK하이닉스', code: 'SKH', price: 135000, basePrice: 135000, color: '#43A047', sector: 'tech', fundamentals: { marketCap: 98, pe: 18.2, eps: 7417, yield: 1.2, revenue: 40, profit: 8, debtRatio: 55 } },
    { id: 5, name: 'NAVER', code: 'NVR', price: 215000, basePrice: 215000, color: '#00C853', sector: 'tech', fundamentals: { marketCap: 35, pe: 35.5, eps: 6056, yield: 0.5, revenue: 9.5, profit: 1.5, debtRatio: 40 } },
    { id: 6, name: '카카오', code: 'KKO', price: 52000, basePrice: 52000, color: '#FFE812', sector: 'tech', fundamentals: { marketCap: 23, pe: 42.1, eps: 1235, yield: 0.1, revenue: 8.2, profit: 0.6, debtRatio: 45 } },
    { id: 36, name: '카카오뱅크', code: 'KKB', price: 28000, basePrice: 28000, color: '#FFCD00', sector: 'tech', fundamentals: { marketCap: 13, pe: 28.5, eps: 982, yield: 0.3, revenue: 2.5, profit: 0.5, debtRatio: 15 } },

    // 에너지/배터리 섹터
    { id: 2, name: 'LG에너지솔루션', code: 'LGE', price: 420000, basePrice: 420000, color: '#8E24AA', sector: 'energy', fundamentals: { marketCap: 95, pe: 65.2, eps: 6441, yield: 0.0, revenue: 35, profit: 1.8, debtRatio: 85 } },
    { id: 11, name: '삼성SDI', code: 'SDI', price: 380000, basePrice: 380000, color: '#673AB7', sector: 'energy', fundamentals: { marketCap: 26, pe: 15.5, eps: 24516, yield: 0.5, revenue: 22, profit: 1.6, debtRatio: 65 } },
    { id: 12, name: 'SK이노베이션', code: 'SKI', price: 125000, basePrice: 125000, color: '#FF5722', sector: 'energy', fundamentals: { marketCap: 11, pe: 12.8, eps: 9765, yield: 1.5, revenue: 65, profit: 1.2, debtRatio: 120 } },
    { id: 37, name: '에코프로비엠', code: 'ECO', price: 195000, basePrice: 195000, color: '#7C4DFF', sector: 'energy', fundamentals: { marketCap: 19, pe: 55.4, eps: 3519, yield: 0.2, revenue: 7, profit: 0.4, debtRatio: 110 } },

    // 자동차/모빌리티 섹터
    { id: 4, name: '현대자동차', code: 'HMC', price: 195000, basePrice: 195000, color: '#FB8C00', sector: 'auto', fundamentals: { marketCap: 41, pe: 5.5, eps: 35454, yield: 5.8, revenue: 160, profit: 15, debtRatio: 180 } },
    { id: 13, name: '기아', code: 'KIA', price: 85000, basePrice: 85000, color: '#EF5350', sector: 'auto', fundamentals: { marketCap: 34, pe: 4.8, eps: 17708, yield: 6.2, revenue: 100, profit: 11, debtRatio: 90 } },
    { id: 14, name: '현대모비스', code: 'MOB', price: 245000, basePrice: 245000, color: '#FF7043', sector: 'auto', fundamentals: { marketCap: 23, pe: 6.5, eps: 37692, yield: 4.1, revenue: 55, profit: 3.5, debtRatio: 45 } },

    // 바이오/헬스케어 섹터
    { id: 7, name: '셀트리온', code: 'CTR', price: 178000, basePrice: 178000, color: '#E91E63', sector: 'bio', fundamentals: { marketCap: 38, pe: 38.5, eps: 4623, yield: 0.8, revenue: 2.5, profit: 0.8, debtRatio: 35 } },
    { id: 10, name: '삼성바이오로직스', code: 'SBL', price: 780000, basePrice: 780000, color: '#009688', sector: 'bio', fundamentals: { marketCap: 55, pe: 65.2, eps: 11963, yield: 0.0, revenue: 3.8, profit: 1.1, debtRatio: 55 } },
    { id: 15, name: '유한양행', code: 'YHN', price: 72000, basePrice: 72000, color: '#26C6DA', sector: 'bio', fundamentals: { marketCap: 5.8, pe: 28.5, eps: 2526, yield: 1.5, revenue: 1.9, profit: 0.2, debtRatio: 25 } },
    { id: 38, name: '녹십자', code: 'GCC', price: 125000, basePrice: 125000, color: '#00ACC1', sector: 'bio', fundamentals: { marketCap: 1.5, pe: 22.1, eps: 5656, yield: 1.2, revenue: 1.7, profit: 0.1, debtRatio: 60 } },
    { id: 39, name: '한미약품', code: 'HMP', price: 285000, basePrice: 285000, color: '#0097A7', sector: 'bio', fundamentals: { marketCap: 3.7, pe: 35.4, eps: 8050, yield: 0.8, revenue: 1.4, profit: 0.15, debtRatio: 85 } },

    // 철강/소재 섹터
    { id: 8, name: '포스코홀딩스', code: 'PKX', price: 385000, basePrice: 385000, color: '#607D8B', sector: 'steel', fundamentals: { marketCap: 32, pe: 11.5, eps: 33478, yield: 2.8, revenue: 75, profit: 4.5, debtRatio: 35 } },
    { id: 16, name: '현대제철', code: 'HDS', price: 35000, basePrice: 35000, color: '#78909C', sector: 'steel', fundamentals: { marketCap: 4.6, pe: 5.8, eps: 6034, yield: 3.5, revenue: 25, profit: 1.1, debtRatio: 85 } },

    // 금융 섹터
    { id: 9, name: 'KB금융', code: 'KB', price: 68000, basePrice: 68000, color: '#795548', sector: 'finance', fundamentals: { marketCap: 28, pe: 5.2, eps: 13076, yield: 5.5, revenue: 85, profit: 5.2, debtRatio: 900 } },
    { id: 17, name: '신한지주', code: 'SHN', price: 45000, basePrice: 45000, color: '#5D4037', sector: 'finance', fundamentals: { marketCap: 23, pe: 4.8, eps: 9375, yield: 6.2, revenue: 65, profit: 4.8, debtRatio: 850 } },
    { id: 18, name: '삼성생명', code: 'SLF', price: 78000, basePrice: 78000, color: '#8D6E63', sector: 'finance', fundamentals: { marketCap: 15, pe: 8.5, eps: 9176, yield: 4.5, revenue: 35, profit: 1.8, debtRatio: 650 } },
    { id: 40, name: '하나금융지주', code: 'HNA', price: 52000, basePrice: 52000, color: '#6D4C41', sector: 'finance', fundamentals: { marketCap: 15, pe: 4.2, eps: 12380, yield: 6.8, revenue: 55, profit: 3.8, debtRatio: 880 } },

    // 유통/소비재 섹터
    { id: 19, name: '삼성물산', code: 'SCT', price: 125000, basePrice: 125000, color: '#00BCD4', sector: 'retail', fundamentals: { marketCap: 23, pe: 14.5, eps: 8620, yield: 1.8, revenue: 42, profit: 2.8, debtRatio: 75 } },
    { id: 20, name: '롯데쇼핑', code: 'LTS', price: 92000, basePrice: 92000, color: '#F44336', sector: 'retail', fundamentals: { marketCap: 2.6, pe: 12.5, eps: 7360, yield: 3.2, revenue: 14, profit: 0.3, debtRatio: 180 } },
    { id: 21, name: 'CJ제일제당', code: 'CJ1', price: 340000, basePrice: 340000, color: '#FF6F00', sector: 'retail', fundamentals: { marketCap: 5.1, pe: 9.8, eps: 34693, yield: 1.5, revenue: 29, profit: 0.8, debtRatio: 140 } },
    { id: 41, name: '아모레퍼시픽', code: 'AMP', price: 145000, basePrice: 145000, color: '#FF4081', sector: 'retail', fundamentals: { marketCap: 8.5, pe: 45.2, eps: 3207, yield: 0.8, revenue: 4.2, profit: 0.2, debtRatio: 25 } },
    { id: 42, name: 'LG생활건강', code: 'LGH', price: 420000, basePrice: 420000, color: '#E040FB', sector: 'retail', fundamentals: { marketCap: 6.5, pe: 25.5, eps: 16470, yield: 1.8, revenue: 6.8, profit: 0.4, debtRatio: 35 } },

    // 건설/인프라 섹터
    { id: 22, name: '삼성엔지니어링', code: 'SEG', price: 32000, basePrice: 32000, color: '#4CAF50', sector: 'construction', fundamentals: { marketCap: 6.2, pe: 11.2, eps: 2857, yield: 1.5, revenue: 10, profit: 0.6, debtRatio: 220 } },
    { id: 23, name: '현대건설', code: 'HEC', price: 42000, basePrice: 42000, color: '#2E7D32', sector: 'construction', fundamentals: { marketCap: 4.6, pe: 8.5, eps: 4941, yield: 1.8, revenue: 25, profit: 0.5, debtRatio: 110 } },
    { id: 24, name: 'GS건설', code: 'GSC', price: 18500, basePrice: 18500, color: '#388E3C', sector: 'construction', fundamentals: { marketCap: 1.5, pe: -15.5, eps: -1193, yield: 0.0, revenue: 12, profit: -0.2, debtRatio: 250 } },

    // 통신 섹터
    { id: 25, name: 'SK텔레콤', code: 'SKT', price: 52000, basePrice: 52000, color: '#E91E63', sector: 'telecom', fundamentals: { marketCap: 11, pe: 9.8, eps: 5306, yield: 6.8, revenue: 17, profit: 1.2, debtRatio: 140 } },
    { id: 26, name: 'KT', code: 'KT', price: 38000, basePrice: 38000, color: '#C2185B', sector: 'telecom', fundamentals: { marketCap: 9.9, pe: 8.2, eps: 4634, yield: 5.5, revenue: 26, profit: 1.1, debtRatio: 120 } },
    { id: 27, name: 'LG유플러스', code: 'LGU', price: 12000, basePrice: 12000, color: '#AD1457', sector: 'telecom', fundamentals: { marketCap: 5.2, pe: 8.5, eps: 1411, yield: 5.8, revenue: 14, profit: 0.7, debtRatio: 150 } },

    // 엔터테인먼트/미디어 섹터
    { id: 28, name: 'HYBE', code: 'HYB', price: 235000, basePrice: 235000, color: '#9C27B0', sector: 'entertainment', fundamentals: { marketCap: 9.8, pe: 48.5, eps: 4845, yield: 0.0, revenue: 2.2, profit: 0.3, debtRatio: 45 } },
    { id: 29, name: 'JYP엔터', code: 'JYP', price: 78000, basePrice: 78000, color: '#7B1FA2', sector: 'entertainment', fundamentals: { marketCap: 2.8, pe: 25.4, eps: 3070, yield: 0.5, revenue: 0.5, profit: 0.15, debtRatio: 15 } },
    { id: 30, name: 'CJ ENM', code: 'ENM', price: 72000, basePrice: 72000, color: '#6A1B9A', sector: 'entertainment', fundamentals: { marketCap: 1.5, pe: -25.5, eps: -2823, yield: 0.0, revenue: 4.5, profit: -0.1, debtRatio: 160 } },
    { id: 43, name: 'SM엔터테인먼트', code: 'SME', price: 95000, basePrice: 95000, color: '#AB47BC', sector: 'entertainment', fundamentals: { marketCap: 2.2, pe: 28.5, eps: 3333, yield: 1.2, revenue: 0.9, profit: 0.1, debtRatio: 35 } },

    // 게임/콘텐츠 섹터
    { id: 31, name: '엔씨소프트', code: 'NCS', price: 185000, basePrice: 185000, color: '#3F51B5', sector: 'game', fundamentals: { marketCap: 4.0, pe: 18.2, eps: 10164, yield: 1.8, revenue: 1.8, profit: 0.4, debtRatio: 25 } },
    { id: 32, name: '넷마블', code: 'NMB', price: 52000, basePrice: 52000, color: '#303F9F', sector: 'game', fundamentals: { marketCap: 4.4, pe: -45.5, eps: -1142, yield: 0.0, revenue: 2.5, profit: -0.2, debtRatio: 65 } },
    { id: 33, name: '크래프톤', code: 'KFT', price: 195000, basePrice: 195000, color: '#1976D2', sector: 'game', fundamentals: { marketCap: 9.5, pe: 15.5, eps: 12580, yield: 0.0, revenue: 1.9, profit: 0.7, debtRatio: 15 } },
    { id: 44, name: '펄어비스', code: 'PAB', price: 42000, basePrice: 42000, color: '#1565C0', sector: 'game', fundamentals: { marketCap: 2.7, pe: 125.5, eps: 334, yield: 0.0, revenue: 0.4, profit: 0.02, debtRatio: 10 } },

    // 반도체 장비 섹터
    { id: 34, name: '삼성전기', code: 'SEM', price: 158000, basePrice: 158000, color: '#0097A7', sector: 'semiconductor', fundamentals: { marketCap: 11, pe: 14.5, eps: 10896, yield: 1.5, revenue: 9.5, profit: 0.9, debtRatio: 45 } },
    { id: 35, name: 'DB하이텍', code: 'DBH', price: 42000, basePrice: 42000, color: '#00838F', sector: 'semiconductor', fundamentals: { marketCap: 1.8, pe: 7.5, eps: 5600, yield: 2.5, revenue: 1.5, profit: 0.3, debtRatio: 25 } },
    { id: 45, name: '한미반도체', code: 'HMS', price: 78000, basePrice: 78000, color: '#006064', sector: 'semiconductor', fundamentals: { marketCap: 7.5, pe: 55.5, eps: 1405, yield: 0.5, revenue: 0.4, profit: 0.1, debtRatio: 15 } },
]

// 초기 자본금
export const INITIAL_CAPITAL = 100000000

// 섹터 정보 (12개 섹터)
export const SECTORS = {
    tech: { name: 'IT/기술', color: '#3b82f6', icon: '💻' },
    energy: { name: '에너지/배터리', color: '#22c55e', icon: '🔋' },
    auto: { name: '자동차/모빌리티', color: '#f97316', icon: '🚗' },
    bio: { name: '바이오/헬스케어', color: '#ec4899', icon: '💊' },
    steel: { name: '철강/소재', color: '#6b7280', icon: '🔩' },
    finance: { name: '금융/보험', color: '#a855f7', icon: '🏦' },
    retail: { name: '유통/소비재', color: '#06b6d4', icon: '🛒' },
    construction: { name: '건설/인프라', color: '#84cc16', icon: '🏗️' },
    telecom: { name: '통신', color: '#f43f5e', icon: '📡' },
    entertainment: { name: '엔터테인먼트', color: '#8b5cf6', icon: '🎬' },
    game: { name: '게임/콘텐츠', color: '#6366f1', icon: '🎮' },
    semiconductor: { name: '반도체장비', color: '#14b8a6', icon: '🔬' },
}

// 배당금 설정 (연간 배당률 %)
export const DIVIDEND_RATES = {
    1: 2.5,   // 삼성전자
    2: 0.5,   // LG에너지솔루션
    3: 1.5,   // SK하이닉스
    4: 4.0,   // 현대자동차
    5: 0.3,   // NAVER
    6: 0.2,   // 카카오
    7: 0.8,   // 셀트리온
    8: 5.0,   // 포스코홀딩스
    9: 6.5,   // KB금융
    10: 0.1,  // 삼성바이오로직스
    11: 1.2,  // 삼성SDI
    12: 2.0,  // SK이노베이션
    13: 3.5,  // 기아
    14: 2.8,  // 현대모비스
    15: 1.8,  // 유한양행
    16: 4.5,  // 현대제철
    17: 7.0,  // 신한지주
    18: 5.5,  // 삼성생명
    19: 2.0,  // 삼성물산
    20: 3.0,  // 롯데쇼핑
    21: 1.5,  // CJ제일제당
    22: 2.5,  // 삼성엔지니어링
    23: 3.0,  // 현대건설
    24: 4.0,  // GS건설
    25: 4.5,  // SK텔레콤
    26: 5.0,  // KT
    27: 6.0,  // LG유플러스
    28: 0.5,  // HYBE
    29: 1.0,  // JYP엔터
    30: 0.8,  // CJ ENM
    31: 1.2,  // 엔씨소프트
    32: 0.3,  // 넷마블
    33: 0.5,  // 크래프톤
    34: 2.2,  // 삼성전기
    35: 1.8,  // DB하이텍
}

// From src/constants/trading.js
/**
 * 거래 설정 상수
 * 주문 유형, 레버리지, 공매도, 신용거래 등
 */

// 주문 유형
export const ORDER_TYPES = {
    MARKET: 'market',      // 시장가
    LIMIT: 'limit',        // 지정가
    STOP_LOSS: 'stopLoss', // 손절
    TAKE_PROFIT: 'takeProfit', // 익절
}

// 시장 시간
export const MARKET_HOURS = {
    preMarket: { start: 8, end: 9, volatilityMultiplier: 0.5 },
    open: { start: 9, end: 9.5, volatilityMultiplier: 1.5 },
    regular: { start: 9.5, end: 15, volatilityMultiplier: 1.0 },
    close: { start: 15, end: 15.5, volatilityMultiplier: 1.3 },
    afterMarket: { start: 15.5, end: 18, volatilityMultiplier: 0.3 },
}

// 레버리지 옵션
export const LEVERAGE_OPTIONS = [
    { id: '1x', multiplier: 1, name: '1x (일반)', minLevel: 1, marginRate: 0 },
    { id: '2x', multiplier: 2, name: '2x 레버리지', minLevel: 7, marginRate: 0.5 },
    { id: '3x', multiplier: 3, name: '3x 레버리지', minLevel: 8, marginRate: 0.33 },
]

// 공매도 설정
export const SHORT_SELLING = {
    interestRate: 0.00005, // 초당 이자율 (더 낮게 조정)
    marginRate: 1.5,       // 증거금 비율 (150%)
    liquidationRate: 1.3,  // 강제청산 비율 (130%)
    minLevel: 3,           // 최소 레벨 (3으로 완화)
}

// 신용 거래 설정
export const CREDIT_TRADING = {
    // 신용 한도 (총 자산 대비 배율)
    creditLimit: {
        level1: 0,      // 레벨 1: 신용거래 불가
        level2: 0,      // 레벨 2: 신용거래 불가
        level3: 0.5,    // 레벨 3: 자산의 50%까지 대출 가능
        level4: 0.8,    // 레벨 4: 자산의 80%까지 대출 가능
        level5: 1.0,    // 레벨 5: 자산의 100%까지 대출 가능
        level6: 1.2,    // 레벨 6 이상: 자산의 120%까지 대출 가능
    },
    // 이자율 (일일 이율)
    dailyInterestRate: 0.0005,  // 일 0.05% (연 약 18%)
    // 유지 증거금률 - 이 비율 아래로 떨어지면 마진콜
    maintenanceMargin: 0.3,     // 30%
    // 강제 청산 비율 - 이 비율 아래로 떨어지면 자동 청산
    liquidationMargin: 0.2,    // 20%
    // 신용 거래 가능 최소 레벨
    minLevel: 3,
    // 신용 거래 수수료
    borrowFee: 0.001,          // 0.1% 대출 수수료
}

// 알림 타입
export const ALERT_TYPES = {
    price_above: { id: 'price_above', name: '목표가 도달', icon: '📈', description: '설정 가격 이상 도달 시' },
    price_below: { id: 'price_below', name: '손절가 도달', icon: '📉', description: '설정 가격 이하 도달 시' },
    profit_rate: { id: 'profit_rate', name: '수익률 도달', icon: '💰', description: '목표 수익률 도달 시' },
    loss_rate: { id: 'loss_rate', name: '손실률 도달', icon: '⚠️', description: '손실 한도 도달 시' },
    news: { id: 'news', name: '뉴스 알림', icon: '📰', description: '보유 종목 뉴스 발생 시' },
}

// 통계 지표
export const STATISTICS_METRICS = [
    { id: 'totalReturn', name: '총 수익률', format: 'percent' },
    { id: 'winRate', name: '승률', format: 'percent' },
    { id: 'avgProfit', name: '평균 수익', format: 'currency' },
    { id: 'avgLoss', name: '평균 손실', format: 'currency' },
    { id: 'profitFactor', name: '손익비', format: 'ratio' },
    { id: 'maxDrawdown', name: '최대 낙폭(MDD)', format: 'percent' },
    { id: 'sharpeRatio', name: '샤프 비율', format: 'ratio' },
    { id: 'totalTrades', name: '총 거래 횟수', format: 'number' },
    { id: 'avgHoldingTime', name: '평균 보유 시간', format: 'time' },
]

// 사운드 효과 URL (무료 사운드)
export const SOUNDS = {
    buy: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
    sell: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3',
    achievement: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
    levelUp: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
    news: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
    error: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
    click: 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3',
}

// 테마 설정
export const THEMES = {
    dark: {
        id: 'dark',
        name: '다크 모드',
        colors: {
            bgPrimary: '#0a0a0f',
            bgSecondary: '#12121a',
            bgCard: '#1a1a25',
            textPrimary: '#ffffff',
            textSecondary: '#a0a0b0',
            accent: '#6366f1',
        }
    },
    light: {
        id: 'light',
        name: '라이트 모드',
        colors: {
            bgPrimary: '#f5f5f7',
            bgSecondary: '#ffffff',
            bgCard: '#ffffff',
            textPrimary: '#1a1a1a',
            textSecondary: '#666666',
            accent: '#6366f1',
        }
    },
    neon: {
        id: 'neon',
        name: '네온 테마',
        colors: {
            bgPrimary: '#0d0221',
            bgSecondary: '#150734',
            bgCard: '#1a0a3e',
            textPrimary: '#ff00ff',
            textSecondary: '#00ffff',
            accent: '#ff00ff',
        }
    },
}

// 자동매매 봇 전략
export const BOT_STRATEGIES = [
    { id: 'momentum', name: '모멘텀', desc: '상승 추세 종목 매수', icon: '📈' },
    { id: 'meanRevert', name: '평균회귀', desc: '과매도 종목 매수', icon: '🔄' },
    { id: 'dividend', name: '배당투자', desc: '고배당 종목 매수', icon: '💰' },
    { id: 'random', name: '랜덤', desc: '랜덤하게 매매', icon: '🎲' },
]

// 타임어택 모드 설정
export const TIME_ATTACK_MODES = [
    { id: 'sprint', name: '스프린트', duration: 60, startCash: 10000000 },
    { id: 'standard', name: '스탠다드', duration: 180, startCash: 50000000 },
    { id: 'marathon', name: '마라톤', duration: 300, startCash: 100000000 },
]

// 이벤트 타입
export const MARKET_EVENTS = [
    { id: 'ipo', name: 'IPO 청약', icon: '🎉', probability: 0.005, description: '새 종목 상장!' },
    { id: 'split', name: '주식 분할', icon: '✂️', probability: 0.003, description: '주식 분할' },
    { id: 'dividend_special', name: '특별 배당', icon: '💎', probability: 0.008, description: '특별 배당금 지급' },
    { id: 'buyback', name: '자사주 매입', icon: '🔄', probability: 0.005, description: '자사주 매입 발표' },
    { id: 'merger', name: '기업 합병', icon: '🤝', probability: 0.002, description: '합병 소식' },
    { id: 'circuit_breaker', name: '서킷브레이커', icon: '⚡', probability: 0.001, description: '거래 일시 중단' },
]

export const IPO_CANDIDATES = [
    { name: '토스(비바)', code: 'TOSS', sector: 'finance', basePrice: 55000, color: '#3182F6' },
    { name: '두나무', code: 'UPBIT', sector: 'finance', basePrice: 120000, color: '#093687' },
    { name: '야놀자', code: 'YANO', sector: 'travel', basePrice: 45000, color: '#FF0055' }, // travel sector doesn't exist, map to entertainment or service
    { name: '마켓컬리', code: 'KURLY', sector: 'retail', basePrice: 25000, color: '#5F0080' },
    { name: '무신사', code: 'MUSIN', sector: 'retail', basePrice: 32000, color: '#000000' },
    { name: '직방', code: 'ZIG', sector: 'service', basePrice: 18000, color: '#FF9700' },
    { name: '당근마켓', code: 'KAR', sector: 'service', basePrice: 22000, color: '#FF6F0F' },
    { name: '빗썸', code: 'BITH', sector: 'finance', basePrice: 65000, color: '#FF8000' },
    { name: '현대오일뱅크', code: 'HOB', sector: 'energy', basePrice: 42000, color: '#004797' },
    { name: 'CJ올리브영', code: 'OLIVE', sector: 'retail', basePrice: 85000, color: '#97C00E' },
]

