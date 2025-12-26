/**
 * Hooks 모듈 인덱스
 * 모든 커스텀 훅을 한 곳에서 export
 */

// 거래 관련
export { useTrading } from './useTrading'

// 게임 상태
export { useGameState } from './useGameState'

// UI 관련
export { useToast } from './useToast'
export { useFeedback } from './useFeedback'
export { useModals, MODAL_TYPES } from './useModals'
export { useUiState } from './useUiState'

// 성능 최적화
export { useDebounce, useDebouncedCallback, useThrottle, useThrottledValue } from './useDebounce'
export {
    useDebouncedValue,
    useThrottle as useThrottleCallback,
    useStableValue,
    useProgressiveRender,
    useAnimationFrame,
    useBatchedUpdates,
    useConditionalMemo,
    useInfiniteScroll,
    useVisibilityOptimization,
    useOptimizedPriceHistory
} from './useOptimization'

// 스토리지
export { useLocalStorage, useSessionStorage } from './useStorage'

// 성능 모니터링 (개발용)
export { useRenderCount, useWhyDidYouUpdate, useMeasure, useMemoryUsage } from './usePerformance'

// 게임 루프 및 Web Worker
export { useGameLoop } from './useGameLoop'
export { usePriceWorker, usePriceCalculatorFallback } from './usePriceWorker'
