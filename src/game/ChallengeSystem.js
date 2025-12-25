/**
 * ChallengeSystem - 도전과제 및 시나리오 모드
 * 특정 조건 하에서 목표 달성하는 게임 모드
 */

/**
 * 시나리오 챌린지
 */
export const SCENARIOS = {
    // 입문자 시나리오
    FIRST_MILLION: {
        id: 'first_million',
        name: '첫 100만원',
        description: '처음 100만원의 수익을 달성하세요.',
        icon: '💵',
        difficulty: 'easy',
        category: 'beginner',
        timeLimit: null,
        startingCapital: 10000000,  // 1000만원 시작
        goal: {
            type: 'profit',
            target: 1000000
        },
        rewards: {
            xp: 500,
            title: '초보 투자자'
        }
    },

    DOUBLE_UP: {
        id: 'double_up',
        name: '자산 2배 달성',
        description: '자산을 2배로 불리세요.',
        icon: '📈',
        difficulty: 'medium',
        category: 'growth',
        timeLimit: 365,  // 1년 이내
        startingCapital: 50000000,
        goal: {
            type: 'asset_multiplier',
            target: 2
        },
        rewards: {
            xp: 2000,
            title: '수익 창출자'
        }
    },

    // 극한 챌린지
    CRISIS_SURVIVOR: {
        id: 'crisis_survivor',
        name: '위기 생존자',
        description: '금융 위기 중에 자산을 보존하세요.',
        icon: '🛡️',
        difficulty: 'hard',
        category: 'special',
        timeLimit: 90,
        startingCapital: 100000000,
        specialConditions: {
            forceCrisis: 'market_crash',
            crisisDay: 1
        },
        goal: {
            type: 'asset_preservation',
            target: 0.7  // 70% 이상 보존
        },
        rewards: {
            xp: 5000,
            title: '위기 관리자',
            skill: 'crisis_resistance'
        }
    },

    BIO_MOON: {
        id: 'bio_moon',
        name: '바이오 대박',
        description: '바이오 섹터에서 500% 수익을 달성하세요.',
        icon: '🧬',
        difficulty: 'extreme',
        category: 'sector',
        timeLimit: 180,
        startingCapital: 20000000,
        restrictions: {
            allowedSectors: ['bio']
        },
        goal: {
            type: 'sector_profit_rate',
            sector: 'bio',
            target: 500
        },
        rewards: {
            xp: 10000,
            title: '바이오 전문가'
        }
    },

    CRYPTO_KING: {
        id: 'crypto_king',
        name: '코인 왕',
        description: '암호화폐로 1000% 수익을 달성하세요.',
        icon: '₿',
        difficulty: 'extreme',
        category: 'type',
        timeLimit: 365,
        startingCapital: 5000000,
        restrictions: {
            allowedTypes: ['crypto']
        },
        goal: {
            type: 'type_profit_rate',
            assetType: 'crypto',
            target: 1000
        },
        rewards: {
            xp: 15000,
            title: '코인 마스터'
        }
    },

    DIVIDEND_LIFE: {
        id: 'dividend_life',
        name: '배당으로 생활하기',
        description: '월 100만원 이상의 배당 수익을 달성하세요.',
        icon: '🏦',
        difficulty: 'hard',
        category: 'income',
        timeLimit: null,
        startingCapital: 100000000,
        goal: {
            type: 'monthly_dividend',
            target: 1000000
        },
        rewards: {
            xp: 8000,
            title: '배당 투자자'
        }
    },

    PERFECT_HUNDRED: {
        id: 'perfect_hundred',
        name: '완벽한 100거래',
        description: '100번의 거래에서 60% 이상 승률을 유지하세요.',
        icon: '🎯',
        difficulty: 'medium',
        category: 'trading',
        timeLimit: null,
        startingCapital: 50000000,
        goal: {
            type: 'win_rate',
            trades: 100,
            target: 60
        },
        rewards: {
            xp: 3000,
            title: '정밀 트레이더'
        }
    },

    SHORT_MASTER: {
        id: 'short_master',
        name: '공매도 마스터',
        description: '공매도로만 1억원을 벌어보세요.',
        icon: '🐻',
        difficulty: 'hard',
        category: 'trading',
        timeLimit: 180,
        startingCapital: 50000000,
        restrictions: {
            shortOnly: true
        },
        goal: {
            type: 'short_profit',
            target: 100000000
        },
        rewards: {
            xp: 7000,
            title: '하락장의 제왕'
        }
    },

    SECTOR_ROTATION_PRO: {
        id: 'sector_rotation_pro',
        name: '섹터 로테이션 프로',
        description: '모든 섹터에서 한 번씩 수익을 실현하세요.',
        icon: '🔄',
        difficulty: 'hard',
        category: 'diversification',
        timeLimit: 365,
        startingCapital: 100000000,
        goal: {
            type: 'all_sector_profit',
            minProfitPerSector: 1000000
        },
        rewards: {
            xp: 6000,
            title: '다각화 전문가'
        }
    },

    SPEED_RUN: {
        id: 'speed_run',
        name: '스피드런: 1억 달성',
        description: '가장 빠르게 1억 수익을 달성하세요.',
        icon: '⚡',
        difficulty: 'extreme',
        category: 'special',
        timeLimit: 30,
        startingCapital: 50000000,
        goal: {
            type: 'profit',
            target: 100000000
        },
        rewards: {
            xp: 12000,
            title: '스피드 트레이더'
        }
    },

    CONSERVATIVE: {
        id: 'conservative',
        name: '안전 투자자',
        description: '1년간 -5% 이상 손실 없이 20% 수익 달성',
        icon: '🛡️',
        difficulty: 'medium',
        category: 'risk',
        timeLimit: 365,
        startingCapital: 100000000,
        goal: {
            type: 'safe_growth',
            minReturn: 20,
            maxDrawdown: 5
        },
        rewards: {
            xp: 4000,
            title: '신중한 투자자'
        }
    }
}

/**
 * 일일 챌린지 (매일 변경)
 */
export const DAILY_CHALLENGES = [
    {
        id: 'daily_profit',
        name: '오늘의 수익',
        description: '오늘 5% 이상 수익 달성',
        goal: { type: 'daily_profit_rate', target: 5 },
        reward: { xp: 100, cash: 500000 }
    },
    {
        id: 'daily_trades',
        name: '활발한 거래',
        description: '오늘 10번 이상 거래',
        goal: { type: 'daily_trades', target: 10 },
        reward: { xp: 80, cash: 200000 }
    },
    {
        id: 'sector_focus',
        name: '섹터 집중',
        description: '특정 섹터에서만 거래하기',
        goal: { type: 'sector_focus', sectorCount: 1 },
        reward: { xp: 120, cash: 300000 }
    },
    {
        id: 'no_loss',
        name: '무손실 거래',
        description: '모든 거래에서 수익 실현',
        goal: { type: 'no_loss_trades' },
        reward: { xp: 150, cash: 500000 }
    },
    {
        id: 'momentum_catch',
        name: '모멘텀 포착',
        description: '10% 이상 상승한 종목 매수 후 수익 실현',
        goal: { type: 'catch_momentum', minRise: 10 },
        reward: { xp: 200, cash: 800000 }
    }
]

/**
 * 주간 챌린지
 */
export const WEEKLY_CHALLENGES = [
    {
        id: 'weekly_millionaire',
        name: '주간 백만장자',
        description: '이번 주 100만원 이상 수익',
        goal: { type: 'weekly_profit', target: 1000000 },
        reward: { xp: 500, cash: 2000000 }
    },
    {
        id: 'portfolio_diversity',
        name: '분산 투자',
        description: '5개 이상 섹터에 투자',
        goal: { type: 'sector_diversity', target: 5 },
        reward: { xp: 300, cash: 1000000 }
    },
    {
        id: 'swing_trader',
        name: '스윙 트레이더',
        description: '3일 이내 보유 후 수익 실현 3회',
        goal: { type: 'swing_trade', target: 3, holdDays: 3 },
        reward: { xp: 400, cash: 1500000 }
    }
]

/**
 * 챌린지 진행 상태 관리
 */
export class ChallengeManager {
    constructor() {
        this.activeScenario = null
        this.dailyChallenge = null
        this.weeklyChallenge = null
        this.completedChallenges = new Set()
        this.progress = {}
    }

    /**
     * 시나리오 시작
     */
    startScenario(scenarioId) {
        const scenario = SCENARIOS[scenarioId]
        if (!scenario) return null

        this.activeScenario = {
            ...scenario,
            startTime: Date.now(),
            startDay: 0,
            initialAssets: scenario.startingCapital,
            isCompleted: false,
            isFailed: false
        }

        return this.activeScenario
    }

    /**
     * 진행 상황 업데이트
     */
    updateProgress(gameState, currentDay) {
        if (!this.activeScenario) return null

        const scenario = this.activeScenario
        const { goal, timeLimit, startDay } = scenario

        // 시간 제한 체크
        if (timeLimit && currentDay - startDay > timeLimit) {
            scenario.isFailed = true
            scenario.failReason = '시간 초과'
            return { status: 'failed', reason: '시간 초과' }
        }

        // 목표 달성 체크
        const result = this.checkGoal(goal, gameState, scenario)

        if (result.completed) {
            scenario.isCompleted = true
            scenario.completionDay = currentDay
            this.completedChallenges.add(scenario.id)
            return { status: 'completed', reward: scenario.rewards }
        }

        return { status: 'in_progress', progress: result.progress }
    }

    /**
     * 목표 달성 체크
     */
    checkGoal(goal, gameState, scenario) {
        const { totalAssets, profit, winRate, sectorProfits, typeProfits, monthlyDividend, maxDrawdown } = gameState

        switch (goal.type) {
            case 'profit':
                return {
                    completed: profit >= goal.target,
                    progress: (profit / goal.target) * 100
                }

            case 'asset_multiplier':
                const multiplier = totalAssets / scenario.initialAssets
                return {
                    completed: multiplier >= goal.target,
                    progress: (multiplier / goal.target) * 100
                }

            case 'asset_preservation':
                const preservation = totalAssets / scenario.initialAssets
                return {
                    completed: preservation >= goal.target,
                    progress: preservation * 100
                }

            case 'sector_profit_rate':
                const sectorProfit = sectorProfits?.[goal.sector] || 0
                const sectorRate = (sectorProfit / scenario.initialAssets) * 100
                return {
                    completed: sectorRate >= goal.target,
                    progress: (sectorRate / goal.target) * 100
                }

            case 'type_profit_rate':
                const typeProfit = typeProfits?.[goal.assetType] || 0
                const typeRate = (typeProfit / scenario.initialAssets) * 100
                return {
                    completed: typeRate >= goal.target,
                    progress: (typeRate / goal.target) * 100
                }

            case 'monthly_dividend':
                return {
                    completed: monthlyDividend >= goal.target,
                    progress: (monthlyDividend / goal.target) * 100
                }

            case 'win_rate':
                const { totalTrades, wins } = gameState
                if (totalTrades < goal.trades) {
                    return { completed: false, progress: (totalTrades / goal.trades) * 50 }
                }
                const currentWinRate = (wins / totalTrades) * 100
                return {
                    completed: currentWinRate >= goal.target && totalTrades >= goal.trades,
                    progress: 50 + (currentWinRate / goal.target) * 50
                }

            case 'safe_growth':
                const returnRate = ((totalAssets - scenario.initialAssets) / scenario.initialAssets) * 100
                if (maxDrawdown > goal.maxDrawdown) {
                    return { completed: false, progress: 0, failed: true }
                }
                return {
                    completed: returnRate >= goal.minReturn,
                    progress: (returnRate / goal.minReturn) * 100
                }

            default:
                return { completed: false, progress: 0 }
        }
    }

    /**
     * 일일 챌린지 선택
     */
    generateDailyChallenge() {
        const randomIndex = Math.floor(Math.random() * DAILY_CHALLENGES.length)
        this.dailyChallenge = {
            ...DAILY_CHALLENGES[randomIndex],
            date: new Date().toISOString().split('T')[0],
            progress: 0,
            isCompleted: false
        }
        return this.dailyChallenge
    }

    /**
     * 주간 챌린지 선택
     */
    generateWeeklyChallenge() {
        const randomIndex = Math.floor(Math.random() * WEEKLY_CHALLENGES.length)
        this.weeklyChallenge = {
            ...WEEKLY_CHALLENGES[randomIndex],
            week: this.getWeekNumber(new Date()),
            progress: 0,
            isCompleted: false
        }
        return this.weeklyChallenge
    }

    getWeekNumber(date) {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
        const days = Math.floor((date - firstDayOfYear) / (24 * 60 * 60 * 1000))
        return Math.ceil((days + firstDayOfYear.getDay() + 1) / 7)
    }

    /**
     * 상태 저장/로드
     */
    serialize() {
        return {
            activeScenario: this.activeScenario,
            dailyChallenge: this.dailyChallenge,
            weeklyChallenge: this.weeklyChallenge,
            completedChallenges: Array.from(this.completedChallenges)
        }
    }

    deserialize(data) {
        if (!data) return
        this.activeScenario = data.activeScenario
        this.dailyChallenge = data.dailyChallenge
        this.weeklyChallenge = data.weeklyChallenge
        this.completedChallenges = new Set(data.completedChallenges || [])
    }
}

export default {
    SCENARIOS,
    DAILY_CHALLENGES,
    WEEKLY_CHALLENGES,
    ChallengeManager
}
