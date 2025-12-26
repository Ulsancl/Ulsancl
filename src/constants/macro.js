/**
 * Macro economy settings
 */

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
