// 게임 저장/로드 및 유틸리티 함수

const SAVE_KEY = 'stockTradingGame'

// 게임 상태 저장
export const saveGame = (gameState) => {
    try {
        const saveData = {
            ...gameState,
            savedAt: Date.now(),
            version: '1.0'
        }
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData))
        return true
    } catch (error) {
        console.error('게임 저장 실패:', error)
        return false
    }
}

// 게임 상태 로드
export const loadGame = () => {
    try {
        const saved = localStorage.getItem(SAVE_KEY)
        if (!saved) return null

        const data = JSON.parse(saved)
        console.log('게임 로드 성공:', new Date(data.savedAt).toLocaleString())
        return data
    } catch (error) {
        console.error('게임 로드 실패:', error)
        return null
    }
}

// 게임 리셋
export const resetGame = () => {
    localStorage.removeItem(SAVE_KEY)
}

// 자동 저장 설정
export const setupAutoSave = (getState, interval = 10000) => {
    return setInterval(() => {
        const state = getState()
        saveGame(state)
    }, interval)
}

// 숫자 포맷
export const formatNumber = (num) => {
    return new Intl.NumberFormat('ko-KR').format(num)
}

// 퍼센트 포맷
export const formatPercent = (num) => {
    const sign = num >= 0 ? '+' : ''
    return `${sign}${num.toFixed(2)}%`
}

// 금액 압축 포맷
export const formatCompact = (num) => {
    const absNum = Math.abs(num)
    const sign = num < 0 ? '-' : ''

    if (absNum >= 1000000000000) {
        return `${sign}${(absNum / 1000000000000).toFixed(2)}조`
    } else if (absNum >= 100000000) {
        return `${sign}${(absNum / 100000000).toFixed(2)}억`
    } else if (absNum >= 10000) {
        return `${sign}${(absNum / 10000).toFixed(0)}만`
    }
    return formatNumber(num)
}

// 시간 포맷
export const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    })
}

// 날짜 포맷
export const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// 랜덤 범위 값
export const randomRange = (min, max) => {
    return Math.random() * (max - min) + min
}

// 랜덤 정수
export const randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

// 랜덤 배열 요소
export const randomChoice = (arr) => {
    return arr[Math.floor(Math.random() * arr.length)]
}

// 깊은 복사
export const deepClone = (obj) => {
    return JSON.parse(JSON.stringify(obj))
}

// 디바운스
export const debounce = (func, wait) => {
    let timeout
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout)
            func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
    }
}

// UUID 생성
export const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 경험치로 레벨 계산
export const calculateLevel = (xp, levels) => {
    for (let i = levels.length - 1; i >= 0; i--) {
        if (xp >= levels[i].minXp) {
            const currentLevel = levels[i]
            const nextLevel = levels[i + 1]
            const progress = nextLevel
                ? ((xp - currentLevel.minXp) / (nextLevel.minXp - currentLevel.minXp)) * 100
                : 100
            return { ...currentLevel, progress: Math.min(100, progress), xpToNext: nextLevel ? nextLevel.minXp - xp : 0 }
        }
    }
    return { ...levels[0], progress: 0, xpToNext: levels[1]?.minXp || 0 }
}

// 리더보드 저장/로드
const LEADERBOARD_KEY = 'stockGameLeaderboard'

export const saveToLeaderboard = (score) => {
    try {
        const existing = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || '[]')
        existing.push(score)
        existing.sort((a, b) => b.totalAssets - a.totalAssets)
        const top10 = existing.slice(0, 10)
        localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(top10))
        return top10
    } catch (error) {
        return []
    }
}

export const getLeaderboard = () => {
    try {
        return JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || '[]')
    } catch {
        return []
    }
}

// 캔들 데이터 생성 (시뮬레이션)
export const generateCandleData = (currentPrice, count, volatility) => {
    let data = []
    let price = currentPrice
    const now = Date.now()

    // 역순으로 데이터 생성
    for (let i = 0; i < count; i++) {
        // 변동폭
        const change = price * volatility * (Math.random() - 0.5)
        const open = price - change
        const high = Math.max(open, price) + (open * volatility * Math.random() * 0.5)
        const low = Math.min(open, price) - (open * volatility * Math.random() * 0.5)

        data.unshift({
            index: i,
            time: now - ((count - i) * 60000),
            open: Math.round(open),
            close: Math.round(price),
            high: Math.round(high),
            low: Math.round(low),
            price: Math.round(price)
        })

        price = open
    }
    return data
}
