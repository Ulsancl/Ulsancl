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
