/**
 * CrisisEvents - 경제 위기 이벤트 시스템
 * 금융 위기, 블랙 스완, 시장 폭락 등 특별 이벤트
 */

/**
 * 위기 타입 정의
 */
export const CRISIS_TYPES = {
    MARKET_CRASH: {
        id: 'market_crash',
        name: '시장 대폭락',
        icon: '📉',
        duration: [5, 15],  // 5~15일 지속
        severity: 'extreme',
        baseImpact: [-0.15, -0.30],  // 15~30% 하락
        recoveryRate: 0.02,  // 일일 2% 회복
        probability: 0.001   // 0.1% 확률
    },
    BANKING_CRISIS: {
        id: 'banking_crisis',
        name: '은행 위기',
        icon: '🏦',
        duration: [7, 20],
        severity: 'high',
        baseImpact: [-0.10, -0.25],
        affectedSectors: ['finance'],
        sectorMultiplier: 2.0,
        recoveryRate: 0.015,
        probability: 0.002
    },
    TECH_BUBBLE: {
        id: 'tech_bubble',
        name: 'IT 버블 붕괴',
        icon: '💻',
        duration: [10, 30],
        severity: 'high',
        baseImpact: [-0.20, -0.40],
        affectedSectors: ['tech', 'game', 'semiconductor'],
        sectorMultiplier: 1.8,
        recoveryRate: 0.01,
        probability: 0.002
    },
    ENERGY_CRISIS: {
        id: 'energy_crisis',
        name: '에너지 위기',
        icon: '⛽',
        duration: [15, 45],
        severity: 'medium',
        baseImpact: [-0.08, -0.15],
        affectedSectors: ['energy', 'auto', 'steel'],
        benefitSectors: ['bio'],  // 친환경 수혜
        sectorMultiplier: 1.5,
        recoveryRate: 0.01,
        probability: 0.003
    },
    PANDEMIC: {
        id: 'pandemic',
        name: '팬데믹',
        icon: '🦠',
        duration: [30, 90],
        severity: 'extreme',
        baseImpact: [-0.15, -0.35],
        affectedSectors: ['entertainment', 'retail', 'auto'],
        benefitSectors: ['bio', 'tech', 'game'],
        sectorMultiplier: 1.5,
        recoveryRate: 0.008,
        probability: 0.0005
    },
    FLASH_CRASH: {
        id: 'flash_crash',
        name: '순간 폭락 (Flash Crash)',
        icon: '⚡',
        duration: [1, 2],  // 1~2일 (빠른 회복)
        severity: 'high',
        baseImpact: [-0.10, -0.20],
        recoveryRate: 0.10,  // 빠른 회복
        probability: 0.005
    },
    CURRENCY_CRISIS: {
        id: 'currency_crisis',
        name: '외환 위기',
        icon: '💱',
        duration: [20, 60],
        severity: 'extreme',
        baseImpact: [-0.20, -0.40],
        affectedSectors: ['finance', 'retail'],
        benefitSectors: ['steel', 'semiconductor'],  // 수출주 수혜
        sectorMultiplier: 1.3,
        recoveryRate: 0.012,
        probability: 0.001
    },
    REAL_ESTATE_CRISIS: {
        id: 'real_estate_crisis',
        name: '부동산 붕괴',
        icon: '🏠',
        duration: [30, 90],
        severity: 'high',
        baseImpact: [-0.12, -0.25],
        affectedSectors: ['construction', 'finance', 'steel'],
        sectorMultiplier: 2.0,
        recoveryRate: 0.008,
        probability: 0.002
    },
    CRYPTO_CRASH: {
        id: 'crypto_crash',
        name: '암호화폐 붕괴',
        icon: '₿',
        duration: [5, 20],
        severity: 'high',
        baseImpact: [-0.40, -0.70],  // 암호화폐에 적용
        affectedTypes: ['crypto'],
        recoveryRate: 0.03,
        probability: 0.01  // 암호화폐는 변동성이 크므로 확률 높음
    }
}

/**
 * 호재 이벤트
 */
export const BOOM_EVENTS = {
    BULL_MARKET: {
        id: 'bull_market',
        name: '강세장 시작',
        icon: '🐂',
        duration: [10, 30],
        severity: 'positive',
        baseImpact: [0.10, 0.25],
        probability: 0.003
    },
    GOVERNMENT_STIMULUS: {
        id: 'government_stimulus',
        name: '정부 경기 부양책',
        icon: '💵',
        duration: [15, 45],
        severity: 'positive',
        baseImpact: [0.08, 0.15],
        affectedSectors: ['construction', 'steel', 'energy'],
        sectorMultiplier: 1.5,
        probability: 0.005
    },
    FOREIGN_INVESTMENT: {
        id: 'foreign_investment',
        name: '외국인 자금 유입',
        icon: '🌏',
        duration: [10, 30],
        severity: 'positive',
        baseImpact: [0.05, 0.12],
        affectedSectors: ['tech', 'semiconductor', 'bio'],
        sectorMultiplier: 1.3,
        probability: 0.008
    },
    RATE_CUT: {
        id: 'rate_cut',
        name: '금리 인하',
        icon: '📉',
        duration: [20, 60],
        severity: 'positive',
        baseImpact: [0.05, 0.10],
        affectedSectors: ['construction', 'finance', 'retail'],
        sectorMultiplier: 1.4,
        probability: 0.01
    }
}

/**
 * 활성 위기 처리
 */
let activeCrisis = null
let crisisEndDay = 0
let crisisPhase = 'onset'  // onset, peak, recovery

/**
 * 위기 이벤트 체크 및 생성
 */
export const checkAndGenerateCrisis = (currentDay, marketState) => {
    // 이미 위기 진행 중이면 새 위기 발생 X
    if (activeCrisis && currentDay < crisisEndDay) {
        return updateCrisisPhase(currentDay)
    }

    // 위기 종료 후 정상화
    if (activeCrisis && currentDay >= crisisEndDay) {
        const endedCrisis = activeCrisis
        activeCrisis = null
        crisisPhase = 'onset'
        return { type: 'crisis_ended', crisis: endedCrisis }
    }

    // 새 위기 발생 확률 체크
    const allCrises = { ...CRISIS_TYPES, ...BOOM_EVENTS }

    for (const crisis of Object.values(allCrises)) {
        // 시장이 이미 불안정하면 위기 확률 증가
        const volatilityBonus = marketState.volatility > 1.5 ? 2 : 1

        if (Math.random() < crisis.probability * volatilityBonus) {
            const duration = crisis.duration[0] +
                Math.floor(Math.random() * (crisis.duration[1] - crisis.duration[0]))

            activeCrisis = {
                ...crisis,
                startDay: currentDay,
                actualDuration: duration,
                currentImpact: crisis.baseImpact[0]
            }
            crisisEndDay = currentDay + duration
            crisisPhase = 'onset'

            return { type: 'crisis_started', crisis: activeCrisis }
        }
    }

    return null
}

/**
 * 위기 단계 업데이트
 */
const updateCrisisPhase = (currentDay) => {
    if (!activeCrisis) return null

    const progress = (currentDay - activeCrisis.startDay) / activeCrisis.actualDuration

    if (progress < 0.3) {
        crisisPhase = 'onset'  // 시작 단계 - 영향력 증가
        const impactRange = activeCrisis.baseImpact[1] - activeCrisis.baseImpact[0]
        activeCrisis.currentImpact = activeCrisis.baseImpact[0] + (impactRange * (progress / 0.3))
    } else if (progress < 0.6) {
        crisisPhase = 'peak'   // 절정 - 최대 영향력
        activeCrisis.currentImpact = activeCrisis.baseImpact[1]
    } else {
        crisisPhase = 'recovery'  // 회복 - 영향력 감소
        const recoveryProgress = (progress - 0.6) / 0.4
        activeCrisis.currentImpact = activeCrisis.baseImpact[1] * (1 - recoveryProgress * 0.8)
    }

    return {
        type: 'crisis_update',
        crisis: activeCrisis,
        phase: crisisPhase,
        daysRemaining: crisisEndDay - currentDay
    }
}

/**
 * 위기가 주가에 미치는 영향 계산
 */
export const calculateCrisisImpact = (stock, _currentDay) => {
    if (!activeCrisis) return 0

    let impact = activeCrisis.currentImpact

    // 섹터별 영향
    if (activeCrisis.affectedSectors) {
        if (activeCrisis.affectedSectors.includes(stock.sector)) {
            impact *= activeCrisis.sectorMultiplier || 1.5
        } else if (activeCrisis.benefitSectors?.includes(stock.sector)) {
            impact *= -0.5  // 수혜주는 반대로 상승
        } else {
            impact *= 0.5  // 관련 없는 섹터는 영향 줄임
        }
    }

    // 타입별 영향 (암호화폐 폭락 등)
    if (activeCrisis.affectedTypes) {
        if (activeCrisis.affectedTypes.includes(stock.type)) {
            impact *= activeCrisis.sectorMultiplier || 1.5
        } else {
            impact *= 0.1  // 다른 타입은 거의 영향 없음
        }
    }

    // 일일 변동으로 분산 (전체 영향을 한 번에 적용 X)
    const dailyImpact = impact / activeCrisis.actualDuration

    // 랜덤성 추가
    return dailyImpact * (0.5 + Math.random())
}

/**
 * 현재 활성 위기 정보
 */
export const getActiveCrisis = (currentDay = null) => {
    if (!activeCrisis) return null
    const daysRemaining = typeof currentDay === 'number'
        ? Math.max(0, crisisEndDay - currentDay)
        : Math.max(0, crisisEndDay - activeCrisis.startDay)
    return {
        ...activeCrisis,
        phase: crisisPhase,
        daysRemaining
    }
}

/**
 * 위기 강제 발생 (테스트/치트용)
 */
export const triggerCrisis = (crisisId, currentDay) => {
    const allCrises = { ...CRISIS_TYPES, ...BOOM_EVENTS }
    const crisisType = Object.values(allCrises).find(c => c.id === crisisId)

    if (!crisisType) return null

    const duration = crisisType.duration[0] +
        Math.floor(Math.random() * (crisisType.duration[1] - crisisType.duration[0]))

    activeCrisis = {
        ...crisisType,
        startDay: currentDay,
        actualDuration: duration,
        currentImpact: crisisType.baseImpact[0]
    }
    crisisEndDay = currentDay + duration
    crisisPhase = 'onset'

    return activeCrisis
}

/**
 * 위기 초기화
 */
export const resetCrisis = () => {
    activeCrisis = null
    crisisEndDay = 0
    crisisPhase = 'onset'
}

export default {
    CRISIS_TYPES,
    BOOM_EVENTS,
    checkAndGenerateCrisis,
    calculateCrisisImpact,
    getActiveCrisis,
    triggerCrisis,
    resetCrisis
}
