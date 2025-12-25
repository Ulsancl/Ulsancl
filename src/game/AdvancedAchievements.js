/**
 * 추가 업적 - 고도화된 게임 시스템용
 */

export const ADVANCED_ACHIEVEMENTS = {
    // ===== 자동 매매 봇 관련 =====
    botActivated: {
        id: 'botActivated',
        name: '자동화 시작',
        desc: '첫 트레이딩 봇 활성화',
        icon: '🤖',
        xp: 50,
        category: 'bot'
    },
    botProfit1m: {
        id: 'botProfit1m',
        name: '봇 첫 수익',
        desc: '봇으로 100만원 수익 달성',
        icon: '🤑',
        xp: 200,
        category: 'bot'
    },
    botProfit100m: {
        id: 'botProfit100m',
        name: '봇 마스터',
        desc: '봇으로 1억원 수익 달성',
        icon: '🎛️',
        xp: 1000,
        category: 'bot'
    },
    allBotsUsed: {
        id: 'allBotsUsed',
        name: '만능 자동화',
        desc: '모든 봇 전략 사용',
        icon: '🔧',
        xp: 300,
        category: 'bot'
    },
    botStrategist: {
        id: 'botStrategist',
        name: '봇 전략가',
        desc: '봇으로 50회 이상 거래',
        icon: '📊',
        xp: 150,
        category: 'bot'
    },

    // ===== 경제 위기 관련 =====
    crisisSurvivor: {
        id: 'crisisSurvivor',
        name: '위기 생존자',
        desc: '시장 대폭락에서 손실 없이 생존',
        icon: '🛡️',
        xp: 500,
        category: 'crisis'
    },
    crisisOpportunist: {
        id: 'crisisOpportunist',
        name: '위기의 기회',
        desc: '위기 중 1억원 이상 수익',
        icon: '🎰',
        xp: 800,
        category: 'crisis'
    },
    pandemicHero: {
        id: 'pandemicHero',
        name: '팬데믹 영웅',
        desc: '팬데믹 위기에서 바이오주로 수익',
        icon: '💉',
        xp: 400,
        category: 'crisis'
    },
    flashCrashWinner: {
        id: 'flashCrashWinner',
        name: '순간 폭락 헌터',
        desc: 'Flash Crash에서 저점 매수 성공',
        icon: '⚡',
        xp: 600,
        category: 'crisis'
    },
    antiInflation: {
        id: 'antiInflation',
        name: '인플레이션 방어',
        desc: '에너지 위기 중 원자재로 수익',
        icon: '🛢️',
        xp: 350,
        category: 'crisis'
    },
    bullMarketRider: {
        id: 'bullMarketRider',
        name: '강세장 탑승자',
        desc: '강세장 이벤트 중 50% 이상 수익',
        icon: '🐂',
        xp: 300,
        category: 'crisis'
    },

    // ===== 기술적 분석 관련 =====
    goldenCrossBuyer: {
        id: 'goldenCrossBuyer',
        name: '골든 크로스 사냥꾼',
        desc: '골든 크로스 발생 시 매수 후 수익',
        icon: '✨',
        xp: 200,
        category: 'technical'
    },
    rsiMaster: {
        id: 'rsiMaster',
        name: 'RSI 마스터',
        desc: 'RSI 과매도 구간 매수 10회 성공',
        icon: '📉',
        xp: 300,
        category: 'technical'
    },
    macdTrader: {
        id: 'macdTrader',
        name: 'MACD 트레이더',
        desc: 'MACD 신호로 5회 연속 수익',
        icon: '📊',
        xp: 350,
        category: 'technical'
    },
    bollingerBounce: {
        id: 'bollingerBounce',
        name: '볼린저 바운스',
        desc: '볼린저 밴드 하단 터치 후 반등 매수 성공',
        icon: '🏀',
        xp: 250,
        category: 'technical'
    },
    supportTrader: {
        id: 'supportTrader',
        name: '지지선 트레이더',
        desc: '지지선에서 매수 후 5% 이상 수익',
        icon: '📍',
        xp: 200,
        category: 'technical'
    },
    resistanceBreaker: {
        id: 'resistanceBreaker',
        name: '저항선 돌파',
        desc: '저항선 돌파 매수 후 10% 이상 수익',
        icon: '💪',
        xp: 250,
        category: 'technical'
    },

    // ===== 포트폴리오 분석 관련 =====
    diversified: {
        id: 'diversified',
        name: '분산 투자가',
        desc: '6개 이상 섹터에 분산 투자',
        icon: '🌐',
        xp: 150,
        category: 'portfolio'
    },
    lowBeta: {
        id: 'lowBeta',
        name: '안정 추구자',
        desc: '포트폴리오 베타 0.8 이하 유지',
        icon: '🐢',
        xp: 100,
        category: 'portfolio'
    },
    highBeta: {
        id: 'highBeta',
        name: '고위험 추구자',
        desc: '포트폴리오 베타 1.5 이상 유지',
        icon: '🐆',
        xp: 150,
        category: 'portfolio'
    },
    healthyPortfolio: {
        id: 'healthyPortfolio',
        name: '건강한 포트폴리오',
        desc: '포트폴리오 건강도 A등급 달성',
        icon: '💚',
        xp: 300,
        category: 'portfolio'
    },
    varConscious: {
        id: 'varConscious',
        name: '리스크 관리자',
        desc: 'VaR 5% 이하로 리스크 관리',
        icon: '🔒',
        xp: 200,
        category: 'portfolio'
    },

    // ===== 시나리오/챌린지 관련 =====
    scenarioComplete: {
        id: 'scenarioComplete',
        name: '시나리오 완주',
        desc: '첫 시나리오 클리어',
        icon: '🎮',
        xp: 100,
        category: 'challenge'
    },
    scenario5Clear: {
        id: 'scenario5Clear',
        name: '도전자',
        desc: '5개 시나리오 클리어',
        icon: '🏅',
        xp: 500,
        category: 'challenge'
    },
    scenarioAllClear: {
        id: 'scenarioAllClear',
        name: '마스터 도전자',
        desc: '모든 시나리오 클리어',
        icon: '🏆',
        xp: 2000,
        category: 'challenge'
    },
    dailyChallengeStreak: {
        id: 'dailyChallengeStreak',
        name: '일일 도전 연속',
        desc: '7일 연속 일일 챌린지 클리어',
        icon: '📅',
        xp: 300,
        category: 'challenge'
    },
    weeklyChampion: {
        id: 'weeklyChampion',
        name: '주간 챔피언',
        desc: '4주 연속 주간 챌린지 클리어',
        icon: '🥇',
        xp: 500,
        category: 'challenge'
    },
    speedrunMaster: {
        id: 'speedrunMaster',
        name: '스피드런 마스터',
        desc: '스피드런 시나리오 20일 내 클리어',
        icon: '⏱️',
        xp: 1000,
        category: 'challenge'
    },
    extremeComplete: {
        id: 'extremeComplete',
        name: '극한 도전자',
        desc: 'Extreme 난이도 시나리오 클리어',
        icon: '🔥',
        xp: 1500,
        category: 'challenge'
    },

    // ===== 특수 조합 =====
    tripleAnalyst: {
        id: 'tripleAnalyst',
        name: '트리플 분석가',
        desc: 'RSI+MACD+볼린저 신호 모두 일치 시 거래 성공',
        icon: '🎯',
        xp: 400,
        category: 'combo'
    },
    botAndHuman: {
        id: 'botAndHuman',
        name: '인간과 기계',
        desc: '봇과 수동 거래 각각 1억 수익 달성',
        icon: '🤝',
        xp: 600,
        category: 'combo'
    },
    allAssetTypes: {
        id: 'allAssetTypes',
        name: '만능 투자자',
        desc: '주식/ETF/암호화폐/채권/원자재 모두 수익 거래',
        icon: '🌈',
        xp: 500,
        category: 'combo'
    },
    crisisHunter: {
        id: 'crisisHunter',
        name: '위기 사냥꾼',
        desc: '3가지 이상 다른 위기에서 수익',
        icon: '🎪',
        xp: 800,
        category: 'combo'
    }
}

export default ADVANCED_ACHIEVEMENTS
