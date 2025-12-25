// 게임 상수 정의

// 초기 종목 데이터 (45개 종목, 다양한 섹터)
export const INITIAL_STOCKS = [
    // IT/기술 섹터
    { id: 1, name: '삼성전자', code: 'SEC', price: 72000, basePrice: 72000, color: '#1E88E5', sector: 'tech', fundamentals: { marketCap: 450, pe: 12.5, eps: 5760, yield: 2.1, revenue: 250, profit: 45, debtRatio: 25 } }, // 시총 450조
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

// 뉴스 이벤트 템플릿 (대폭 확장)
export const NEWS_TEMPLATES = {
    positive: [
        // 실적/재무 관련
        { text: '{stock} 분기 실적 예상치 상회, 어닝 서프라이즈', impact: [0.04, 0.12] },
        { text: '{stock} 영업이익률 사상 최고치 경신', impact: [0.05, 0.15] },
        { text: '{stock} 순이익 전년 대비 30% 증가', impact: [0.03, 0.10] },
        { text: '{stock} 부채비율 대폭 개선, 재무건전성 강화', impact: [0.02, 0.06] },

        // 신제품/혁신
        { text: '{stock} 혁신 신제품 출시, 시장 호평', impact: [0.05, 0.15] },
        { text: '{stock} 차세대 기술 개발 성공 발표', impact: [0.06, 0.18] },
        { text: '{stock} 글로벌 특허 획득, 기술 경쟁력 확보', impact: [0.03, 0.09] },
        { text: '{stock} AI 기반 신사업 론칭', impact: [0.04, 0.12] },

        // 수주/계약
        { text: '{stock} 대규모 수주 계약 체결', impact: [0.04, 0.12] },
        { text: '{stock} 다국적 기업과 장기 공급 계약', impact: [0.05, 0.14] },
        { text: '{stock} 정부 프로젝트 수주 성공', impact: [0.03, 0.10] },
        { text: '{stock} 신규 고객사 확보, 매출 증대 기대', impact: [0.02, 0.08] },

        // 투자/자금
        { text: '{stock} 외국인 투자자 대량 매수세', impact: [0.03, 0.09] },
        { text: '{stock} 글로벌 투자사 지분 확대', impact: [0.02, 0.07] },
        { text: '{stock} 자사주 매입 프로그램 발표', impact: [0.02, 0.06] },
        { text: '{stock} 유상증자 성공적 완료', impact: [0.01, 0.05] },

        // 배당/주주환원
        { text: '{stock} 배당금 상향 결정', impact: [0.02, 0.06] },
        { text: '{stock} 특별 배당 발표, 주주친화 경영', impact: [0.03, 0.08] },
        { text: '{stock} 중간배당 실시 결정', impact: [0.02, 0.05] },

        // 사업 확장
        { text: '{stock} 신규 시장 진출 발표', impact: [0.03, 0.09] },
        { text: '{stock} 해외 법인 설립, 글로벌 확장', impact: [0.04, 0.11] },
        { text: '{stock} M&A 성공적 완료', impact: [0.05, 0.15] },
        { text: '{stock} 핵심 자회사 IPO 추진', impact: [0.03, 0.10] },

        // 애널리스트/증권사
        { text: '{stock} 증권사 목표가 상향 조정', impact: [0.02, 0.06] },
        { text: '{stock} 투자의견 \'매수\' 상향', impact: [0.02, 0.07] },
        { text: '{stock} 글로벌 IB 추천 종목 선정', impact: [0.03, 0.08] },

        // 섹터별 호재
        { text: '{sector} 섹터 정부 지원 정책 발표', impact: [0.03, 0.08], sectorWide: true },
        { text: '{sector} 섹터 수출 호조, 업황 개선', impact: [0.02, 0.07], sectorWide: true },
        { text: '{sector} 섹터 규제 완화 기대감', impact: [0.02, 0.06], sectorWide: true },
    ],

    negative: [
        // 실적/재무 관련
        { text: '{stock} 분기 실적 예상치 하회, 어닝 쇼크', impact: [-0.12, -0.04] },
        { text: '{stock} 영업이익 적자 전환', impact: [-0.15, -0.06] },
        { text: '{stock} 순이익 전년 대비 급감', impact: [-0.10, -0.04] },
        { text: '{stock} 유동성 위기 우려 제기', impact: [-0.08, -0.03] },

        // 품질/안전 문제
        { text: '{stock} 대규모 리콜 사태 발생', impact: [-0.15, -0.06] },
        { text: '{stock} 제품 결함 발견, 판매 중단', impact: [-0.12, -0.05] },
        { text: '{stock} 안전 사고 발생, 책임 논란', impact: [-0.10, -0.04] },
        { text: '{stock} 품질 이슈로 해외 수출 차질', impact: [-0.08, -0.03] },

        // 경영진/지배구조
        { text: '{stock} CEO 돌연 사임, 경영 공백 우려', impact: [-0.10, -0.04] },
        { text: '{stock} 경영진 횡령 혐의 수사', impact: [-0.15, -0.06] },
        { text: '{stock} 내부 분쟁 심화, 경영 불안', impact: [-0.08, -0.03] },
        { text: '{stock} 대주주 지분 대량 매도', impact: [-0.06, -0.02] },

        // 법적 문제
        { text: '{stock} 대규모 소송 패소, 배상금 부담', impact: [-0.12, -0.05] },
        { text: '{stock} 공정위 과징금 부과 결정', impact: [-0.08, -0.03] },
        { text: '{stock} 회계 감리 착수, 불확실성 증가', impact: [-0.10, -0.04] },
        { text: '{stock} 세무조사 착수 소식', impact: [-0.06, -0.02] },

        // 사업 차질
        { text: '{stock} 핵심 사업 철수 결정', impact: [-0.10, -0.04] },
        { text: '{stock} 주요 고객사 이탈', impact: [-0.08, -0.03] },
        { text: '{stock} 공장 가동 중단 사태', impact: [-0.12, -0.05] },
        { text: '{stock} 공급망 차질로 생산 감소', impact: [-0.07, -0.03] },

        // 경쟁/시장
        { text: '{stock} 시장 점유율 급락', impact: [-0.08, -0.03] },
        { text: '{stock} 경쟁사에 핵심 인력 이탈', impact: [-0.06, -0.02] },
        { text: '{stock} 신규 경쟁자 진입으로 압박', impact: [-0.05, -0.02] },

        // 애널리스트/증권사
        { text: '{stock} 증권사 목표가 하향 조정', impact: [-0.04, -0.02] },
        { text: '{stock} 투자의견 \'매도\' 하향', impact: [-0.06, -0.02] },
        { text: '{stock} 신용등급 강등 위기', impact: [-0.08, -0.03] },

        // 섹터별 악재
        { text: '{sector} 섹터 규제 강화 발표', impact: [-0.06, -0.02], sectorWide: true },
        { text: '{sector} 섹터 수출 급감, 업황 악화', impact: [-0.05, -0.02], sectorWide: true },
        { text: '{sector} 섹터 구조조정 우려', impact: [-0.04, -0.02], sectorWide: true },
    ],

    market: [
        // 금리/통화정책
        { text: '한은 기준금리 인상 결정, 증시 하락 압력', impact: [-0.04, -0.01], marketWide: true },
        { text: '한은 기준금리 동결, 시장 안도', impact: [0.01, 0.03], marketWide: true },
        { text: '금리 인하 기대감 확산, 증시 상승', impact: [0.02, 0.05], marketWide: true },
        { text: '연준 긴축 시사, 글로벌 증시 하락', impact: [-0.05, -0.02], marketWide: true },
        { text: '연준 비둘기파 발언, 위험자산 선호', impact: [0.02, 0.04], marketWide: true },

        // 외국인/기관
        { text: '외국인 5거래일 연속 순매수', impact: [0.02, 0.05], marketWide: true },
        { text: '외국인 대규모 순매도, 증시 하락', impact: [-0.04, -0.02], marketWide: true },
        { text: '기관 투자자 매수세 강화', impact: [0.01, 0.04], marketWide: true },
        { text: '연기금 주식 비중 확대 결정', impact: [0.02, 0.04], marketWide: true },

        // 환율/원자재
        { text: '원/달러 환율 급등, 수출주 관심', impact: [-0.02, 0.02], marketWide: true },
        { text: '원화 강세, 내수주 반사이익 기대', impact: [-0.01, 0.02], marketWide: true },
        { text: '국제 유가 급등, 인플레이션 우려', impact: [-0.03, -0.01], marketWide: true },
        { text: '원자재 가격 안정, 비용 부담 완화', impact: [0.01, 0.03], marketWide: true },

        // 글로벌 시장
        { text: '미국 증시 사상 최고치 경신', impact: [0.02, 0.04], marketWide: true },
        { text: '미국 증시 급락, 아시아 증시 동반 하락', impact: [-0.05, -0.02], marketWide: true },
        { text: '중국 경기 부양책 발표, 아시아 증시 상승', impact: [0.02, 0.04], marketWide: true },
        { text: '유럽 경기 침체 우려, 글로벌 위험회피', impact: [-0.03, -0.01], marketWide: true },

        // 경제 지표
        { text: 'GDP 성장률 예상치 상회, 경기 낙관론', impact: [0.02, 0.04], marketWide: true },
        { text: '실업률 상승, 경기 둔화 우려', impact: [-0.03, -0.01], marketWide: true },
        { text: '소비자물가 안정, 금리 인상 부담 완화', impact: [0.01, 0.03], marketWide: true },
        { text: '제조업 PMI 위축, 경기 하방 리스크', impact: [-0.02, -0.01], marketWide: true },
    ],

    fund_positive: [
        { text: '{stock} 연간 매출 {revenue}조원 돌파 전망', impact: [0.03, 0.08] },
        { text: '{stock} 영업이익 {profit}조원 달성, 사상 최대', impact: [0.04, 0.12] },
        { text: '{stock} 시가총액 {marketCap}조원 재진입 성공', impact: [0.02, 0.06] },
        { text: '{stock} 부채비율 {debtRatio}%로 개선, 재무 안정성 확보', impact: [0.02, 0.05] },
        { text: '{stock} PER {pe}배로 저평가 매력 부각', impact: [0.03, 0.07] },
    ],

    fund_negative: [
        { text: '{stock} 매출 감소 우려, {revenue}조원 하회 예상', impact: [-0.07, -0.03] },
        { text: '{stock} 영업이익 {profit}조원에 그쳐, 시장 실망', impact: [-0.08, -0.04] },
        { text: '{stock} 시가총액 {marketCap}조원 붕괴 위기', impact: [-0.05, -0.02] },
        { text: '{stock} 부채비율 {debtRatio}%로 급증, 재무 부담 심화', impact: [-0.06, -0.03] },
        { text: '{stock} 고평가 논란, PER {pe}배 부담', impact: [-0.05, -0.02] },
    ]
}

// 업적 정의 (대폭 확장)
export const ACHIEVEMENTS = {
    // ===== 거래 관련 =====
    firstTrade: { id: 'firstTrade', name: '첫 거래', desc: '첫 번째 주식 거래 완료', icon: '🎯', xp: 10, category: 'trade' },
    trader10: { id: 'trader10', name: '활발한 트레이더', desc: '총 10회 거래 달성', icon: '📊', xp: 50, category: 'trade' },
    trader100: { id: 'trader100', name: '베테랑 트레이더', desc: '총 100회 거래 달성', icon: '💼', xp: 200, category: 'trade' },
    trader500: { id: 'trader500', name: '프로 트레이더', desc: '총 500회 거래 달성', icon: '🎖️', xp: 500, category: 'trade' },
    trader1000: { id: 'trader1000', name: '마스터 트레이더', desc: '총 1000회 거래 달성', icon: '👑', xp: 1000, category: 'trade' },
    trader5000: { id: 'trader5000', name: '레전드 트레이더', desc: '총 5000회 거래 달성', icon: '🏆', xp: 3000, category: 'trade' },

    // ===== 수익 관련 =====
    firstProfit: { id: 'firstProfit', name: '첫 수익', desc: '첫 수익 실현', icon: '💰', xp: 20, category: 'profit' },
    profit1m: { id: 'profit1m', name: '백만장자', desc: '누적 수익 100만원 달성', icon: '💵', xp: 100, category: 'profit' },
    profit10m: { id: 'profit10m', name: '천만장자', desc: '누적 수익 1000만원 달성', icon: '💎', xp: 300, category: 'profit' },
    profit100m: { id: 'profit100m', name: '억만장자', desc: '누적 수익 1억원 달성', icon: '🏆', xp: 1000, category: 'profit' },
    profit500m: { id: 'profit500m', name: '재벌급', desc: '누적 수익 5억원 달성', icon: '🏰', xp: 2500, category: 'profit' },
    profit1b: { id: 'profit1b', name: '자산왕', desc: '누적 수익 10억원 달성', icon: '👑', xp: 5000, category: 'profit' },

    // ===== 총 자산 관련 =====
    assets200m: { id: 'assets200m', name: '2억 클럽', desc: '총 자산 2억원 돌파', icon: '🎖️', xp: 200, category: 'assets' },
    assets500m: { id: 'assets500m', name: '5억 클럽', desc: '총 자산 5억원 돌파', icon: '🏅', xp: 500, category: 'assets' },
    assets1b: { id: 'assets1b', name: '10억 클럽', desc: '총 자산 10억원 돌파', icon: '🥇', xp: 1000, category: 'assets' },
    assets5b: { id: 'assets5b', name: '50억 클럽', desc: '총 자산 50억원 돌파', icon: '💫', xp: 3000, category: 'assets' },
    assets10b: { id: 'assets10b', name: '100억 달성', desc: '총 자산 100억원 돌파', icon: '🌟', xp: 5000, category: 'assets' },

    // ===== 분산 투자 =====
    diversified: { id: 'diversified', name: '분산 투자', desc: '5개 이상 종목 동시 보유', icon: '🌈', xp: 50, category: 'strategy' },
    superDiversified: { id: 'superDiversified', name: '포트폴리오 마스터', desc: '10개 이상 종목 동시 보유', icon: '🎨', xp: 150, category: 'strategy' },
    megaDiversified: { id: 'megaDiversified', name: '펀드 매니저', desc: '20개 이상 종목 동시 보유', icon: '🌐', xp: 300, category: 'strategy' },
    allSectors: { id: 'allSectors', name: '섹터 마스터', desc: '모든 섹터에 최소 1종목 보유', icon: '🏛️', xp: 500, category: 'strategy' },

    // ===== 홀딩 관련 =====
    diamondHands: { id: 'diamondHands', name: '다이아몬드 핸즈', desc: '한 종목 100초 이상 홀딩', icon: '💎', xp: 100, category: 'hold' },
    diamondHands2: { id: 'diamondHands2', name: '철벽 홀딩', desc: '한 종목 300초 이상 홀딩', icon: '🛡️', xp: 250, category: 'hold' },
    diamondHands3: { id: 'diamondHands3', name: '영원한 홀더', desc: '한 종목 600초 이상 홀딩', icon: '⚔️', xp: 500, category: 'hold' },
    paperHands: { id: 'paperHands', name: '페이퍼 핸즈?', desc: '5초 이내 매도 (손절 마스터)', icon: '📄', xp: 30, category: 'hold' },

    // ===== 데이 트레이딩 =====
    dayTrader: { id: 'dayTrader', name: '데이 트레이더', desc: '1분 내 10회 거래', icon: '⚡', xp: 150, category: 'speed' },
    speedTrader: { id: 'speedTrader', name: '번개손', desc: '10초 내 3회 거래', icon: '🌩️', xp: 100, category: 'speed' },
    flashTrader: { id: 'flashTrader', name: '플래시 트레이더', desc: '30초 내 20회 거래', icon: '⚡⚡', xp: 400, category: 'speed' },

    // ===== 시장 타이밍 =====
    perfectTiming: { id: 'perfectTiming', name: '완벽한 타이밍', desc: '뉴스 발표 직전 매수 성공', icon: '🎯', xp: 200, category: 'timing' },
    bottomFisher: { id: 'bottomFisher', name: '바닥 사냥꾼', desc: '일일 최저가 ±1% 내 매수', icon: '🎣', xp: 250, category: 'timing' },
    topSeller: { id: 'topSeller', name: '고점 탈출', desc: '일일 최고가 ±1% 내 매도', icon: '🏔️', xp: 250, category: 'timing' },
    crisisHero: { id: 'crisisHero', name: '위기의 영웅', desc: '시장 폭락 중 -10% 종목 매수 후 수익', icon: '🦸', xp: 500, category: 'timing' },

    // ===== 연속 기록 =====
    winStreak5: { id: 'winStreak5', name: '5연승', desc: '5번 연속 수익 거래', icon: '🔥', xp: 100, category: 'streak' },
    winStreak10: { id: 'winStreak10', name: '10연승', desc: '10번 연속 수익 거래', icon: '🔥🔥', xp: 300, category: 'streak' },
    winStreak20: { id: 'winStreak20', name: '20연승', desc: '20번 연속 수익 거래', icon: '🔥🔥🔥', xp: 800, category: 'streak' },
    loseStreak5: { id: 'loseStreak5', name: '인내의 시련', desc: '5번 연속 손실 후 회복', icon: '😤', xp: 150, category: 'streak' },

    // ===== 수익률 관련 =====
    profit10p: { id: 'profit10p', name: '10% 수익률', desc: '단일 거래 10% 이상 수익', icon: '📈', xp: 100, category: 'return' },
    profit50p: { id: 'profit50p', name: '50% 대박', desc: '단일 거래 50% 이상 수익', icon: '🚀', xp: 300, category: 'return' },
    profit100p: { id: 'profit100p', name: '더블 수익', desc: '단일 거래 100% 이상 수익 (2배)', icon: '💥', xp: 600, category: 'return' },
    profit500p: { id: 'profit500p', name: '5배 신화', desc: '단일 거래 500% 이상 수익', icon: '🌟', xp: 1500, category: 'return' },

    // ===== 극복/회복 =====
    comeback: { id: 'comeback', name: '기사회생', desc: '-30% 손실에서 원금 회복', icon: '🔥', xp: 300, category: 'recovery' },
    phoenix: { id: 'phoenix', name: '불사조', desc: '-50% 손실에서 원금 회복', icon: '🐦‍🔥', xp: 600, category: 'recovery' },
    immortal: { id: 'immortal', name: '불멸의 투자자', desc: '-70% 손실에서 원금 회복', icon: '⚡', xp: 1000, category: 'recovery' },
    neverGiveUp: { id: 'neverGiveUp', name: '포기란 없다', desc: '10번 연속 손실 후 수익 실현', icon: '💪', xp: 400, category: 'recovery' },

    // ===== 암호화폐 전문가 =====
    cryptoNewbie: { id: 'cryptoNewbie', name: '코인 입문', desc: '첫 암호화폐 거래', icon: '₿', xp: 30, category: 'crypto' },
    cryptoTrader: { id: 'cryptoTrader', name: '코인 트레이더', desc: '암호화폐 50회 거래', icon: '🪙', xp: 200, category: 'crypto' },
    cryptoWhale: { id: 'cryptoWhale', name: '크립토 고래', desc: '암호화폐로 1억 이상 수익', icon: '🐋', xp: 800, category: 'crypto' },
    memeKing: { id: 'memeKing', name: '밈코인 마스터', desc: '밈코인으로 500% 이상 수익', icon: '🐕', xp: 600, category: 'crypto' },
    defiMaster: { id: 'defiMaster', name: 'DeFi 마스터', desc: 'DeFi 코인 5종류 이상 거래', icon: '🏦', xp: 300, category: 'crypto' },

    // ===== ETF 전문가 =====
    etfNewbie: { id: 'etfNewbie', name: 'ETF 입문', desc: '첫 ETF 거래', icon: '📊', xp: 30, category: 'etf' },
    etfMaster: { id: 'etfMaster', name: 'ETF 마스터', desc: '10종류 이상 ETF 거래', icon: '📈', xp: 250, category: 'etf' },
    leverageKing: { id: 'leverageKing', name: '레버리지 킹', desc: '레버리지 ETF로 100% 수익', icon: '⚡', xp: 400, category: 'etf' },
    inverseWinner: { id: 'inverseWinner', name: '역발상 투자자', desc: '인버스 ETF로 수익 실현', icon: '🔄', xp: 200, category: 'etf' },

    // ===== 채권/원자재 =====
    bondTrader: { id: 'bondTrader', name: '채권 투자자', desc: '5종류 이상 채권 거래', icon: '📜', xp: 150, category: 'bond' },
    commodityTrader: { id: 'commodityTrader', name: '원자재 트레이더', desc: '5종류 이상 원자재 거래', icon: '🛢️', xp: 150, category: 'commodity' },
    goldBug: { id: 'goldBug', name: '골드버그', desc: '금으로 1000만원 이상 수익', icon: '🥇', xp: 300, category: 'commodity' },

    // ===== 섹터별 전문가 =====
    techExpert: { id: 'techExpert', name: 'IT 전문가', desc: 'IT섹터 종목 10회 수익 거래', icon: '💻', xp: 200, category: 'sector' },
    bioExpert: { id: 'bioExpert', name: '바이오 전문가', desc: '바이오섹터 종목 10회 수익 거래', icon: '💊', xp: 200, category: 'sector' },
    financeExpert: { id: 'financeExpert', name: '금융 전문가', desc: '금융섹터 종목 10회 수익 거래', icon: '🏦', xp: 200, category: 'sector' },
    energyExpert: { id: 'energyExpert', name: '에너지 전문가', desc: '에너지섹터 종목 10회 수익 거래', icon: '🔋', xp: 200, category: 'sector' },

    // ===== 대규모 거래 =====
    bigBuyer: { id: 'bigBuyer', name: '큰손', desc: '단일 거래 1억원 이상 매수', icon: '💰', xp: 200, category: 'volume' },
    megaBuyer: { id: 'megaBuyer', name: '슈퍼 큰손', desc: '단일 거래 10억원 이상 매수', icon: '💎', xp: 500, category: 'volume' },
    marketMover: { id: 'marketMover', name: '시장 주도자', desc: '단일 거래 50억원 이상 매수', icon: '🐘', xp: 1000, category: 'volume' },

    // ===== 특수 상황 =====
    newsBuyer: { id: 'newsBuyer', name: '뉴스 헌터', desc: '뉴스 발표 10초 내 거래', icon: '📰', xp: 150, category: 'special' },
    contrarian: { id: 'contrarian', name: '역발상 투자', desc: '폭락 중인 종목 매수 후 수익', icon: '🔮', xp: 300, category: 'special' },
    shortMaster: { id: 'shortMaster', name: '공매도 마스터', desc: '공매도로 1000만원 이상 수익', icon: '📉', xp: 400, category: 'special' },
    dividendLover: { id: 'dividendLover', name: '배당 수집가', desc: '배당금 100만원 이상 수령', icon: '💵', xp: 200, category: 'special' },
    dividendKing: { id: 'dividendKing', name: '배당왕', desc: '배당금 1000만원 이상 수령', icon: '👑', xp: 500, category: 'special' },

    // ===== 극한 도전 =====
    allTimeHigh: { id: 'allTimeHigh', name: '신고점 달성', desc: '총 자산 역대 최고치 갱신 10회', icon: '🏔️', xp: 300, category: 'extreme' },
    survivor: { id: 'survivor', name: '생존자', desc: '글로벌 위기 이벤트 중 수익 실현', icon: '🎖️', xp: 400, category: 'extreme' },
    perfectMonth: { id: 'perfectMonth', name: '완벽한 한 달', desc: '30일간 마이너스 없이 유지', icon: '📅', xp: 1000, category: 'extreme' },
    millionaire: { id: 'millionaire', name: '진정한 백만장자', desc: '초기 자본의 10배 달성', icon: '🌟', xp: 2000, category: 'extreme' },
    billionaire: { id: 'billionaire', name: '억만장자 클럽', desc: '초기 자본의 100배 달성', icon: '🏆', xp: 10000, category: 'extreme' },

    // ===== 히든 업적 =====
    luckyNumber: { id: 'luckyNumber', name: '럭키 세븐', desc: '7777원 수익 달성', icon: '🍀', xp: 77, category: 'hidden' },
    perfectBalance: { id: 'perfectBalance', name: '완벽한 균형', desc: '보유 종목 모두 수익률 동일', icon: '⚖️', xp: 200, category: 'hidden' },
    midnight: { id: 'midnight', name: '야행성 트레이더', desc: '자정 시간대 거래', icon: '🌙', xp: 50, category: 'hidden' },
    earlyBird: { id: 'earlyBird', name: '새벽 투자자', desc: '새벽 5시 이전 거래', icon: '🐤', xp: 50, category: 'hidden' },
}

// 레벨 시스템
export const LEVELS = [
    { level: 1, name: '초보 투자자', minXp: 0, perks: [] },
    { level: 2, name: '주린이', minXp: 50, perks: ['수수료 5% 할인'] },
    { level: 3, name: '개미 투자자', minXp: 150, perks: ['종목 6개 해금'] },
    { level: 4, name: '슈퍼개미', minXp: 300, perks: ['종목 8개 해금'] },
    { level: 5, name: '전업 투자자', minXp: 500, perks: ['모든 종목 해금', '지정가 주문'] },
    { level: 6, name: '펀드 매니저', minXp: 800, perks: ['손절/익절 주문'] },
    { level: 7, name: '헤지펀드 매니저', minXp: 1200, perks: ['레버리지 2x 해금'] },
    { level: 8, name: '투자 전문가', minXp: 1800, perks: ['레버리지 3x 해금'] },
    { level: 9, name: '월스트리트 고수', minXp: 2500, perks: ['공매도 해금'] },
    { level: 10, name: '워렌 버핏', minXp: 3500, perks: ['모든 기능 해금', 'VIP 테마'] },
]

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

// 미션 정의
export const MISSIONS = {
    daily: [
        { id: 'daily_trade_3', name: '활발한 거래', desc: '오늘 3회 이상 거래하기', target: 3, type: 'trades', reward: { xp: 20, cash: 50000 } },
        { id: 'daily_profit_1m', name: '수익 실현', desc: '오늘 100만원 이상 수익 실현', target: 1000000, type: 'profit', reward: { xp: 30, cash: 100000 } },
        { id: 'daily_buy_new', name: '새 종목 탐험', desc: '새로운 종목 1개 매수하기', target: 1, type: 'newStock', reward: { xp: 15, cash: 30000 } },
        { id: 'daily_hold_5', name: '분산 투자', desc: '5개 이상 종목 보유하기', target: 5, type: 'holdings', reward: { xp: 25, cash: 80000 } },
    ],
    weekly: [
        { id: 'weekly_trade_20', name: '주간 트레이더', desc: '이번 주 20회 이상 거래', target: 20, type: 'trades', reward: { xp: 100, cash: 500000 } },
        { id: 'weekly_profit_10m', name: '주간 수익왕', desc: '이번 주 1000만원 수익', target: 10000000, type: 'profit', reward: { xp: 200, cash: 1000000 } },
        { id: 'weekly_streak', name: '연승 기록', desc: '5연승 달성하기', target: 5, type: 'winStreak', reward: { xp: 150, cash: 300000 } },
    ],
}

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

// ETF 상품 (20개)
export const ETF_PRODUCTS = [
    // 국내 지수
    { id: 101, name: 'KODEX 200', code: 'K200', price: 35000, basePrice: 35000, color: '#2196F3', type: 'etf', category: 'index', description: 'KOSPI 200 추종' },
    { id: 102, name: 'KODEX 레버리지', code: 'K2X', price: 18000, basePrice: 18000, color: '#FF5722', type: 'etf', category: 'leverage', multiplier: 2, description: 'KOSPI 200 2배', baseStockId: 101 },
    { id: 103, name: 'KODEX 인버스', code: 'KINV', price: 5500, basePrice: 5500, color: '#9C27B0', type: 'etf', category: 'inverse', multiplier: -1, description: 'KOSPI 역방향', baseStockId: 101 },
    { id: 104, name: 'KODEX 코스닥150', code: 'KDAQ', price: 12500, basePrice: 12500, color: '#E91E63', type: 'etf', category: 'index', description: '코스닥 150' },
    { id: 105, name: 'KODEX 코스닥 레버리지', code: 'KDAQ2X', price: 8500, basePrice: 8500, color: '#FF1744', type: 'etf', category: 'leverage', multiplier: 2, description: '코스닥 2배', baseStockId: 104 },
    // 섹터 ETF
    { id: 106, name: 'KODEX 2차전지', code: 'KBAT', price: 12000, basePrice: 12000, color: '#4CAF50', type: 'etf', category: 'sector', sector: 'energy', description: '2차전지 섹터' },
    { id: 107, name: 'TIGER 반도체', code: 'TSEM', price: 28000, basePrice: 28000, color: '#00BCD4', type: 'etf', category: 'sector', sector: 'tech', description: '반도체 섹터' },
    { id: 108, name: 'KODEX 바이오', code: 'KBIO', price: 42000, basePrice: 42000, color: '#EC407A', type: 'etf', category: 'sector', sector: 'bio', description: '바이오 섹터' },
    { id: 109, name: 'TIGER 금융', code: 'TFIN', price: 15000, basePrice: 15000, color: '#8D6E63', type: 'etf', category: 'sector', sector: 'finance', description: '금융 섹터' },
    // 해외 지수
    { id: 110, name: 'TIGER 미국S&P500', code: 'TSPX', price: 15000, basePrice: 15000, color: '#1565C0', type: 'etf', category: 'index', description: 'S&P 500' },
    { id: 111, name: 'TIGER 나스닥100', code: 'TNDQ', price: 85000, basePrice: 85000, color: '#0277BD', type: 'etf', category: 'index', description: '나스닥 100' },
    { id: 112, name: 'TIGER 차이나CSI300', code: 'TCSI', price: 9500, basePrice: 9500, color: '#D32F2F', type: 'etf', category: 'index', description: '중국 CSI 300' },
    { id: 113, name: 'KODEX 일본NIKKEI225', code: 'KNIK', price: 12000, basePrice: 12000, color: '#C62828', type: 'etf', category: 'index', description: '닛케이 225' },
    { id: 114, name: 'TIGER 유로STOXX50', code: 'TEURO', price: 11000, basePrice: 11000, color: '#1565C0', type: 'etf', category: 'index', description: '유로 STOXX' },
    // 원자재/테마
    { id: 115, name: 'KODEX 골드선물', code: 'KGLD', price: 14000, basePrice: 14000, color: '#FFD700', type: 'etf', category: 'commodity', description: '금 선물' },
    { id: 116, name: 'KODEX WTI원유선물', code: 'KWTI', price: 8500, basePrice: 8500, color: '#424242', type: 'etf', category: 'commodity', description: 'WTI 원유' },
    { id: 117, name: 'TIGER AI코리아', code: 'TAIK', price: 22000, basePrice: 22000, color: '#7C4DFF', type: 'etf', category: 'theme', description: 'AI 테마' },
    { id: 118, name: 'KODEX K-방산', code: 'KDEF', price: 18000, basePrice: 18000, color: '#455A64', type: 'etf', category: 'theme', description: '방산 테마' },
    { id: 119, name: 'TIGER 미국테크TOP10', code: 'TTECH', price: 25000, basePrice: 25000, color: '#00ACC1', type: 'etf', category: 'theme', description: '빅테크 TOP10' },
    { id: 120, name: 'KODEX 배당성장', code: 'KDIV', price: 11500, basePrice: 11500, color: '#43A047', type: 'etf', category: 'dividend', description: '배당 성장' },
]

// 암호화폐 (30개) - 변동성 대폭 증가
export const CRYPTO_PRODUCTS = [
    // 메이저 코인
    { id: 201, name: '비트코인', code: 'BTC', price: 58000000, basePrice: 58000000, color: '#F7931A', type: 'crypto', volatility: 8 },
    { id: 202, name: '이더리움', code: 'ETH', price: 3200000, basePrice: 3200000, color: '#627EEA', type: 'crypto', volatility: 10 },
    { id: 203, name: '리플', code: 'XRP', price: 850, basePrice: 850, color: '#00AAE4', type: 'crypto', volatility: 12 },
    { id: 204, name: '솔라나', code: 'SOL', price: 145000, basePrice: 145000, color: '#00FFA3', type: 'crypto', volatility: 15 },
    { id: 205, name: '에이다', code: 'ADA', price: 650, basePrice: 650, color: '#0033AD', type: 'crypto', volatility: 12 },
    // 밈/알트코인
    { id: 206, name: '도지코인', code: 'DOGE', price: 120, basePrice: 120, color: '#C3A634', type: 'crypto', volatility: 25 },
    { id: 207, name: '시바이누', code: 'SHIB', price: 0.015, basePrice: 0.015, color: '#FFA000', type: 'crypto', volatility: 30 },
    { id: 208, name: '페페', code: 'PEPE', price: 0.0001, basePrice: 0.0001, color: '#4CAF50', type: 'crypto', volatility: 35 },
    { id: 209, name: '플로키', code: 'FLOKI', price: 0.0002, basePrice: 0.0002, color: '#FFD700', type: 'crypto', volatility: 30 },
    { id: 210, name: '본크', code: 'BONK', price: 0.00003, basePrice: 0.00003, color: '#FF5722', type: 'crypto', volatility: 35 },
    // DeFi 코인
    { id: 211, name: '유니스왑', code: 'UNI', price: 8500, basePrice: 8500, color: '#FF007A', type: 'crypto', volatility: 15 },
    { id: 212, name: '에이브', code: 'AAVE', price: 120000, basePrice: 120000, color: '#2EBAC6', type: 'crypto', volatility: 14 },
    { id: 213, name: '체인링크', code: 'LINK', price: 18000, basePrice: 18000, color: '#2A5ADA', type: 'crypto', volatility: 13 },
    { id: 214, name: '메이커', code: 'MKR', price: 1800000, basePrice: 1800000, color: '#1AAB9B', type: 'crypto', volatility: 12 },
    { id: 215, name: '컴파운드', code: 'COMP', price: 65000, basePrice: 65000, color: '#00D395', type: 'crypto', volatility: 14 },
    // 레이어1/2
    { id: 216, name: '폴리곤', code: 'MATIC', price: 950, basePrice: 950, color: '#8247E5', type: 'crypto', volatility: 15 },
    { id: 217, name: '아발란체', code: 'AVAX', price: 42000, basePrice: 42000, color: '#E84142', type: 'crypto', volatility: 16 },
    { id: 218, name: '니어프로토콜', code: 'NEAR', price: 5500, basePrice: 5500, color: '#00C08B', type: 'crypto', volatility: 18 },
    { id: 219, name: '아비트럼', code: 'ARB', price: 1200, basePrice: 1200, color: '#12AAFF', type: 'crypto', volatility: 18 },
    { id: 220, name: '옵티미즘', code: 'OP', price: 2800, basePrice: 2800, color: '#FF0420', type: 'crypto', volatility: 18 },
    // AI/게임 코인
    { id: 221, name: '렌더', code: 'RNDR', price: 8500, basePrice: 8500, color: '#C32AFF', type: 'crypto', volatility: 20 },
    { id: 222, name: '더샌드박스', code: 'SAND', price: 550, basePrice: 550, color: '#00ADEF', type: 'crypto', volatility: 20 },
    { id: 223, name: '엑시인피니티', code: 'AXS', price: 9500, basePrice: 9500, color: '#0055D5', type: 'crypto', volatility: 22 },
    { id: 224, name: '갈라', code: 'GALA', price: 35, basePrice: 35, color: '#000000', type: 'crypto', volatility: 25 },
    { id: 225, name: '월드코인', code: 'WLD', price: 3500, basePrice: 3500, color: '#000000', type: 'crypto', volatility: 22 },
    // 기타 알트
    { id: 226, name: '스텔라루멘', code: 'XLM', price: 150, basePrice: 150, color: '#08B5E5', type: 'crypto', volatility: 14 },
    { id: 227, name: '코스모스', code: 'ATOM', price: 12000, basePrice: 12000, color: '#2E3148', type: 'crypto', volatility: 15 },
    { id: 228, name: '알고랜드', code: 'ALGO', price: 180, basePrice: 180, color: '#000000', type: 'crypto', volatility: 16 },
    { id: 229, name: '인터넷컴퓨터', code: 'ICP', price: 15000, basePrice: 15000, color: '#3B00B9', type: 'crypto', volatility: 18 },
    { id: 230, name: '앱토스', code: 'APT', price: 12000, basePrice: 12000, color: '#2DD8A7', type: 'crypto', volatility: 20 },
]

// 채권 (18개)
export const BOND_PRODUCTS = [
    // 한국 국채
    { id: 301, name: '국고채 3년', code: 'KTB3', price: 100000, basePrice: 100000, color: '#607D8B', type: 'bond', yield: 3.5, volatility: 0.2 },
    { id: 302, name: '국고채 5년', code: 'KTB5', price: 100000, basePrice: 100000, color: '#546E7A', type: 'bond', yield: 3.8, volatility: 0.3 },
    { id: 303, name: '국고채 10년', code: 'KTB10', price: 100000, basePrice: 100000, color: '#455A64', type: 'bond', yield: 4.2, volatility: 0.5 },
    { id: 304, name: '국고채 30년', code: 'KTB30', price: 100000, basePrice: 100000, color: '#37474F', type: 'bond', yield: 4.5, volatility: 0.7 },
    { id: 305, name: '통안채 1년', code: 'MSB1', price: 100000, basePrice: 100000, color: '#78909C', type: 'bond', yield: 3.0, volatility: 0.1 },
    { id: 306, name: '통안채 2년', code: 'MSB2', price: 100000, basePrice: 100000, color: '#90A4AE', type: 'bond', yield: 3.2, volatility: 0.2 },
    // 회사채
    { id: 307, name: '회사채 AAA', code: 'CORPAAA', price: 100000, basePrice: 100000, color: '#1E88E5', type: 'bond', yield: 4.5, volatility: 0.4 },
    { id: 308, name: '회사채 AA', code: 'CORPAA', price: 100000, basePrice: 100000, color: '#1976D2', type: 'bond', yield: 5.5, volatility: 0.6 },
    { id: 309, name: '회사채 A', code: 'CORPA', price: 100000, basePrice: 100000, color: '#1565C0', type: 'bond', yield: 6.5, volatility: 0.8 },
    { id: 310, name: '회사채 BBB', code: 'CORPBBB', price: 100000, basePrice: 100000, color: '#0D47A1', type: 'bond', yield: 8.0, volatility: 1.2 },
    // 미국 국채
    { id: 311, name: '미국 국채 2년', code: 'UST2', price: 135000, basePrice: 135000, color: '#C62828', type: 'bond', yield: 4.8, volatility: 0.2 },
    { id: 312, name: '미국 국채 10년', code: 'UST10', price: 135000, basePrice: 135000, color: '#B71C1C', type: 'bond', yield: 4.5, volatility: 0.4 },
    { id: 313, name: '미국 국채 30년', code: 'UST30', price: 130000, basePrice: 130000, color: '#D32F2F', type: 'bond', yield: 4.8, volatility: 0.6 },
    // 글로벌 채권
    { id: 314, name: '일본 국채 10년', code: 'JGB10', price: 1200, basePrice: 1200, color: '#EF5350', type: 'bond', yield: 0.8, volatility: 0.3 },
    { id: 315, name: '독일 분트 10년', code: 'BUND10', price: 150000, basePrice: 150000, color: '#FFD600', type: 'bond', yield: 2.5, volatility: 0.4 },
    { id: 316, name: '영국 길트 10년', code: 'GILT10', price: 170000, basePrice: 170000, color: '#00695C', type: 'bond', yield: 4.2, volatility: 0.5 },
    { id: 317, name: '이머징마켓 채권', code: 'EMB', price: 95000, basePrice: 95000, color: '#FF6F00', type: 'bond', yield: 7.5, volatility: 1.0 },
    { id: 318, name: '하이일드 채권', code: 'HYG', price: 85000, basePrice: 85000, color: '#E65100', type: 'bond', yield: 9.0, volatility: 1.5 },
]

// 원자재 (20개)
export const COMMODITY_PRODUCTS = [
    // 귀금속
    { id: 401, name: '금', code: 'GOLD', price: 85000, basePrice: 85000, color: '#FFD700', type: 'commodity', unit: 'g', volatility: 1.5 },
    { id: 402, name: '은', code: 'SLVR', price: 1050, basePrice: 1050, color: '#C0C0C0', type: 'commodity', unit: 'g', volatility: 2.5 },
    { id: 403, name: '백금', code: 'PLAT', price: 42000, basePrice: 42000, color: '#E5E4E2', type: 'commodity', unit: 'g', volatility: 2.0 },
    { id: 404, name: '팔라듐', code: 'PALL', price: 38000, basePrice: 38000, color: '#A9A9A9', type: 'commodity', unit: 'g', volatility: 3.0 },
    // 에너지
    { id: 405, name: 'WTI 원유', code: 'WTI', price: 95000, basePrice: 95000, color: '#333333', type: 'commodity', unit: '배럴', volatility: 4.0 },
    { id: 406, name: '브렌트유', code: 'BRENT', price: 98000, basePrice: 98000, color: '#424242', type: 'commodity', unit: '배럴', volatility: 4.0 },
    { id: 407, name: '천연가스', code: 'NG', price: 3500, basePrice: 3500, color: '#26A69A', type: 'commodity', unit: 'MMBtu', volatility: 6.0 },
    { id: 408, name: 'RBOB 가솔린', code: 'RB', price: 3200, basePrice: 3200, color: '#FF7043', type: 'commodity', unit: '갤런', volatility: 5.0 },
    { id: 409, name: '난방유', code: 'HO', price: 3400, basePrice: 3400, color: '#5D4037', type: 'commodity', unit: '갤런', volatility: 5.0 },
    // 산업금속
    { id: 410, name: '구리', code: 'COPPER', price: 12000, basePrice: 12000, color: '#D4652F', type: 'commodity', unit: 'kg', volatility: 2.5 },
    { id: 411, name: '알루미늄', code: 'ALUM', price: 3500, basePrice: 3500, color: '#B0BEC5', type: 'commodity', unit: 'kg', volatility: 2.5 },
    { id: 412, name: '아연', code: 'ZINC', price: 4000, basePrice: 4000, color: '#78909C', type: 'commodity', unit: 'kg', volatility: 3.0 },
    { id: 413, name: '니켈', code: 'NICKEL', price: 25000, basePrice: 25000, color: '#546E7A', type: 'commodity', unit: 'kg', volatility: 4.0 },
    { id: 414, name: '리튬', code: 'LITH', price: 85000, basePrice: 85000, color: '#9CCC65', type: 'commodity', unit: 'kg', volatility: 5.0 },
    // 농산물
    { id: 415, name: '소맥', code: 'WHEAT', price: 8500, basePrice: 8500, color: '#F5DEB3', type: 'commodity', unit: 'bushel', volatility: 4.0 },
    { id: 416, name: '옥수수', code: 'CORN', price: 6200, basePrice: 6200, color: '#FFD54F', type: 'commodity', unit: 'bushel', volatility: 3.5 },
    { id: 417, name: '대두', code: 'SOYBEAN', price: 15000, basePrice: 15000, color: '#8D6E63', type: 'commodity', unit: 'bushel', volatility: 3.5 },
    { id: 418, name: '커피', code: 'COFFEE', price: 2500, basePrice: 2500, color: '#6D4C41', type: 'commodity', unit: 'lb', volatility: 4.0 },
    { id: 419, name: '설탕', code: 'SUGAR', price: 350, basePrice: 350, color: '#FFFFFF', type: 'commodity', unit: 'lb', volatility: 3.5 },
    { id: 420, name: '목화', code: 'COTTON', price: 1200, basePrice: 1200, color: '#ECEFF1', type: 'commodity', unit: 'lb', volatility: 3.5 },
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

// 이벤트 타입
export const MARKET_EVENTS = [
    { id: 'ipo', name: 'IPO 청약', icon: '🎉', probability: 0.005, description: '새 종목 상장!' },
    { id: 'split', name: '주식 분할', icon: '✂️', probability: 0.003, description: '주식 분할' },
    { id: 'dividend_special', name: '특별 배당', icon: '💎', probability: 0.008, description: '특별 배당금 지급' },
    { id: 'buyback', name: '자사주 매입', icon: '🔄', probability: 0.005, description: '자사주 매입 발표' },
    { id: 'merger', name: '기업 합병', icon: '🤝', probability: 0.002, description: '합병 소식' },
    { id: 'circuit_breaker', name: '서킷브레이커', icon: '⚡', probability: 0.001, description: '거래 일시 중단' },
]

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

// 🌍 시장 충격 특별 이벤트 (글로벌 이벤트) - 대폭 확장
export const GLOBAL_CRISIS_EVENTS = {
    // 악재 이벤트 (10개 카테고리)
    negative: [
        {
            id: 'pandemic',
            names: ['코로나-X 바이러스', '오미크론-델타 변이', 'H5N9 조류독감', '신종 폐렴', 'MERS-2', '원숭이두창 변이'],
            template: '🦠 {name} 팬데믹 창궐, 글로벌 증시 충격',
            impact: [-0.08, -0.15],
            duration: 30,
            sectors: { bio: 0.1, travel: -0.2, entertainment: -0.15 }
        },
        {
            id: 'war_start',
            names: ['러시아-우크라이나', '이스라엘-팔레스타인', '북한-한국', '중국-대만', '인도-파키스탄', '이란-사우디'],
            template: '⚔️ {name} 전쟁 발발! 지정학적 리스크 급증',
            impact: [-0.10, -0.20],
            duration: 40,
            sectors: { energy: 0.15, steel: 0.1, tech: -0.1, travel: -0.2 }
        },
        {
            id: 'financial_crisis',
            names: ['실리콘밸리 은행', '크레디트 스위스', '도이치뱅크', 'JP모건', 'HSBC', '골드만삭스', '중국 헝다그룹'],
            template: '🏦 {name} 파산 위기, 금융 시장 대혼란',
            impact: [-0.12, -0.18],
            duration: 35,
            sectors: { finance: -0.25 }
        },
        {
            id: 'natural_disaster',
            names: ['일본 대지진', '미국 허리케인 카테고리5', '동남아 대홍수', '호주 산불', '캘리포니아 대지진', '유럽 폭염'],
            template: '🌋 {name} 발생, 글로벌 공급망 차질',
            impact: [-0.05, -0.10],
            duration: 25,
            sectors: { auto: -0.1, tech: -0.08, construction: 0.08 }
        },
        {
            id: 'trade_war',
            names: ['미-중 무역전쟁', 'EU-중국 관세전쟁', '미-EU 통상분쟁', '한-일 무역분쟁', '미-멕시코 관세'],
            template: '📦 {name} 격화, 관세 폭탄 발효',
            impact: [-0.06, -0.12],
            duration: 30,
            sectors: { tech: -0.1, auto: -0.08, semiconductor: -0.12 }
        },
        {
            id: 'cyber_attack',
            names: ['글로벌 랜섬웨어', '금융권 해킹', '정부 기관 사이버 공격', '클라우드 서비스 마비', '암호화폐 거래소 해킹'],
            template: '💻 {name} 발생! 사이버 보안 위기',
            impact: [-0.05, -0.10],
            duration: 20,
            sectors: { tech: -0.15, finance: -0.1 }
        },
        {
            id: 'oil_crisis',
            names: ['OPEC 감산 발표', '호르무즈 해협 봉쇄 위협', '러시아 가스관 폭발', '사우디 송유관 공격', '미국 셰일 생산 중단'],
            template: '🛢️ {name}, 에너지 가격 폭등',
            impact: [-0.07, -0.12],
            duration: 30,
            sectors: { energy: 0.20, auto: -0.12, travel: -0.15 }
        },
        {
            id: 'supply_chain',
            names: ['수에즈 운하 봉쇄', '컨테이너 운임 폭등', '중국 공장 가동 중단', '반도체 공급난 심화', '글로벌 물류 마비'],
            template: '🚢 {name}, 글로벌 공급망 위기',
            impact: [-0.06, -0.11],
            duration: 25,
            sectors: { auto: -0.15, tech: -0.12, semiconductor: -0.18 }
        },
        {
            id: 'currency_crisis',
            names: ['달러 초강세', '유로화 폭락', '위안화 급락', '엔화 130 돌파', '신흥국 통화 위기'],
            template: '💵 {name}, 글로벌 환율 전쟁 우려',
            impact: [-0.05, -0.10],
            duration: 25,
            sectors: { finance: -0.1 }
        },
        {
            id: 'economic_collapse',
            names: ['중국 경제', '일본 장기침체', '유럽 경기침체', '신흥국 디폴트', '글로벌 경기 침체'],
            template: '📉 {name} 경착륙 우려 확산',
            impact: [-0.08, -0.14],
            duration: 35,
            sectors: { steel: -0.12, construction: -0.1, auto: -0.1 }
        },
    ],

    // 호재 이벤트 (10개 카테고리)
    positive: [
        {
            id: 'war_end',
            names: ['우크라이나 평화협정', '중동 휴전 합의', '한반도 비핵화 선언', '대만 해협 긴장 완화', '이란 핵합의 복원'],
            template: '🕊️ {name} 체결! 세계 평화 기대감 급증',
            impact: [0.08, 0.15],
            duration: 35,
            sectors: { energy: -0.05, travel: 0.15, entertainment: 0.1 }
        },
        {
            id: 'tech_revolution',
            names: ['AGI(범용인공지능)', '양자컴퓨터 상용화', '핵융합 발전 성공', '상온 초전도체 발견', '6G 통신 개발', '자율주행 레벨5'],
            template: '🚀 {name} 등장! 세계 패러다임 전환 예고',
            impact: [0.10, 0.20],
            duration: 40,
            sectors: { tech: 0.25, energy: 0.15, semiconductor: 0.20 }
        },
        {
            id: 'rate_cut',
            names: ['연준 금리 0.5%p 인하', 'ECB 긴급 금리 인하', '한은 기준금리 인하', '중국 MLF 금리 인하', '글로벌 동시 금리 인하'],
            template: '📉 {name} 발표! 유동성 장세 기대',
            impact: [0.05, 0.10],
            duration: 30,
            sectors: { finance: 0.08, tech: 0.1, construction: 0.08 }
        },
        {
            id: 'vaccine',
            names: ['만능 코로나 백신', '암 치료 백신', 'HIV 완치 치료제', '알츠하이머 치료제', '비만 치료 신약', '당뇨 완치제'],
            template: '💉 {name} 개발 성공! 바이오 섹터 급등',
            impact: [0.08, 0.15],
            duration: 35,
            sectors: { bio: 0.30, travel: 0.15 }
        },
        {
            id: 'stimulus',
            names: ['미국 3조 달러', '중국 5조 위안', 'EU 2조 유로', '일본 100조 엔', '한국 200조원 뉴딜'],
            template: '💰 {name} 규모 경기 부양책 발표!',
            impact: [0.07, 0.12],
            duration: 30,
            sectors: { steel: 0.1, energy: 0.08, construction: 0.15 }
        },
        {
            id: 'space_economy',
            names: ['달 자원 채굴권 합의', '화성 정착촌 건설', '소행성 광물 귀환', '우주 태양광 발전', '민간 우주여행 상용화'],
            template: '🌙 {name} 발표! 우주 경제 시대 개막',
            impact: [0.06, 0.12],
            duration: 35,
            sectors: { tech: 0.15, energy: 0.1 }
        },
        {
            id: 'trade_deal',
            names: ['미-중 무역협정', '한-EU FTA 확대', 'RCEP 효과 시작', '인도-EU 무역협정', 'CPTPP 확대'],
            template: '🤝 {name} 체결! 글로벌 교역 활성화',
            impact: [0.05, 0.10],
            duration: 30,
            sectors: { auto: 0.08, tech: 0.1 }
        },
        {
            id: 'green_deal',
            names: ['글로벌 탄소중립 합의', 'EU 그린딜 2.0', '미국 클린에너지 법안', '중국 신재생 투자 확대', 'RE100 기업 급증'],
            template: '🌿 {name} 발표! 친환경 산업 급부상',
            impact: [0.05, 0.11],
            duration: 30,
            sectors: { energy: 0.20, auto: 0.08 }
        },
        {
            id: 'crypto_etf',
            names: ['비트코인 현물 ETF', '이더리움 현물 ETF', '글로벌 암호화폐 규제 명확화', '대형 은행 스테이블코인 출시'],
            template: '₿ {name} 승인! 기관투자 본격화',
            impact: [0.04, 0.08],
            duration: 25,
            sectors: { finance: 0.1, tech: 0.08 }
        },
        {
            id: 'mega_ipo',
            names: ['OpenAI IPO', 'SpaceX IPO', 'ByteDance IPO', 'Stripe IPO', 'Shein IPO'],
            template: '🎉 {name} 발표! 사상 최대 규모 상장',
            impact: [0.04, 0.09],
            duration: 25,
            sectors: { tech: 0.15 }
        },
    ],

    // 중립/변동성 이벤트 (5개 카테고리)
    neutral: [
        {
            id: 'election',
            names: ['미국 대선', '중국 전국인민대표대회', 'EU 의회 선거', '한국 대선', '일본 총선', '브라질 대선'],
            template: '🗳️ {name} 결과 발표, 시장 변동성 확대',
            impact: [-0.03, 0.03],
            duration: 20,
            volatilityBoost: 2
        },
        {
            id: 'fomc',
            names: ['FOMC 회의', 'ECB 통화정책 회의', '한은 금통위', 'BOJ 정책회의'],
            template: '🏛️ {name} 앞두고 관망세',
            impact: [-0.02, 0.02],
            duration: 15,
            volatilityBoost: 1.5
        },
        {
            id: 'earnings_season',
            names: ['미국 어닝 시즌', '한국 기업 실적 시즌', 'FAANG 실적 발표', '반도체 빅3 실적'],
            template: '📊 {name} 시작, 개별 종목 변동성 확대',
            impact: [-0.02, 0.02],
            duration: 20,
            volatilityBoost: 1.8
        },
        {
            id: 'triple_witching',
            names: ['쿼드러플 위칭데이', '옵션 만기일', '선물 만기'],
            template: '🎯 {name} 도래, 시장 변동성 주의',
            impact: [-0.02, 0.02],
            duration: 10,
            volatilityBoost: 2.2
        },
        {
            id: 'jackson_hole',
            names: ['잭슨홀 미팅', 'IMF 세계경제전망', '다보스 포럼', 'G7 정상회의', 'G20 정상회의'],
            template: '🌐 {name} 주목, 정책 방향성 탐색',
            impact: [-0.01, 0.01],
            duration: 15,
            volatilityBoost: 1.5
        },
    ]
}

// 특별 이벤트 발생 확률 (초당) - 매우 드물게
export const GLOBAL_EVENT_PROBABILITY = 0.0005 // 약 33분에 1회 (조금 높임)

// 거시 경제 지표 설정
export const MACRO_CONFIG = {
    interestRate: { name: '기준금리', base: 3.5, min: 0.0, max: 15.0, volatility: 0.1 },
    inflation: { name: '인플레이션', base: 2.0, min: -1.0, max: 20.0, volatility: 0.1 },
    gdpGrowth: { name: 'GDP 성장률', base: 2.5, min: -5.0, max: 10.0, volatility: 0.05 },
}

// 거시 경제 이벤트 템플릿 (뉴스)
export const MACRO_EVENTS = [
    { type: 'interest_hike', text: '중앙은행 기준금리 인상 단행', impact: { interestRate: 0.25, inflation: -0.1 } },
    { type: 'interest_cut', text: '중앙은행 기준금리 인하 결정', impact: { interestRate: -0.25, inflation: 0.05 } },
    { type: 'inflation_spike', text: '소비자물가지수(CPI) 급등', impact: { inflation: 0.5, interestRate: 0.1 } },
    { type: 'gdp_surprise', text: '경제성장률 예상치 상회', impact: { gdpGrowth: 0.3 } },
    { type: 'gdp_shock', text: '경기 침체 우려 확산', impact: { gdpGrowth: -0.3, inflation: -0.2 } },
]

// 스킬 (특성) 시스템 정의
export const SKILLS = {
    tier1: [
        { id: 'fee_discount', name: '수수료 할인', description: '거래 수수료가 5% 감소합니다.', cost: 1, maxLevel: 5 },
        { id: 'xp_boost', name: '빠른 학습', description: '획득 경험치가 10% 증가합니다.', cost: 1, maxLevel: 3 },
    ],
    tier2: [
        { id: 'news_insight', name: '정보 분석가', description: '뉴스 발생 시 주가 영향력을 더 정확히 파악합니다.', cost: 2, maxLevel: 1 },
        { id: 'volatility_sense', name: '변동성 감지', description: '변동성이 클 때 경고를 받습니다.', cost: 2, maxLevel: 1 },
    ],
    tier3: [
        { id: 'market_manipulation', name: '세력의 눈', description: '주가 조작 세력의 움직임을 포착합니다 (루머 확인).', cost: 3, maxLevel: 1 },
        { id: 'predict_crash', name: '본능적 감각', description: '폭락 징조를 미리 감지할 확률이 생깁니다.', cost: 3, maxLevel: 1 },
    ]
}


// IPO 후보생 (상장 가능한 유니콘 기업들)
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
