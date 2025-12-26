/**
 * Utils 모듈 인덱스
 * 기존 utils.js와 새로운 유틸리티들을 함께 export
 */

// 기존 유틸리티 재export
export {
    saveGame,
    loadGame,
    resetGame,
    setupAutoSave,
    formatNumber,
    formatPercent,
    formatCompact,
    formatTime,
    formatDate,
    randomRange,
    randomInt,
    randomChoice,
    deepClone,
    debounce,
    generateId,
    calculateLevel,
    saveToLeaderboard,
    getLeaderboard,
    generateCandleData
} from '../utils'

// 계산 유틸리티
export {
    calculateStockValue,
    calculateShortValue,
    calculateStockValueFromMap,
    calculateShortValueFromMap,
    calculateAssets,
    safeNumber,
    formatProfitRate
} from './calculations'
