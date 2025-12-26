/**
 * Skill definitions
 */

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
