/**
 * 업적 시스템 상수
 * 게임 내 달성 가능한 업적 정의
 */

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
