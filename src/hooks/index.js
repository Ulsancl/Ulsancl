/**
 * Hooks module index
 */

export { useTrading } from './useTrading'
export { useGameState } from './useGameState'
export { useToast } from './useToast'
export { useFeedback } from './useFeedback'
export { useUiState } from './useUiState'
export { useGameCalculations } from './useGameCalculations'

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

export { useGameLoop } from './useGameLoop'
export { useTradeLog, calculateChecksum } from './useTradeLog'
