/**
 * useOptimization - 성능 최적화를 위한 유틸리티 훅 모음
 * 메모이제이션, 지연 로딩, 배치 업데이트 등
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

/**
 * 디바운스된 값을 반환하는 훅
 * 값이 변경된 후 지정된 시간이 지나면 업데이트
 */
export const useDebouncedValue = (value, delay = 300) => {
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => clearTimeout(timer)
    }, [value, delay])

    return debouncedValue
}

/**
 * 쓰로틀된 콜백을 반환하는 훅
 * 지정된 시간 간격으로만 실행
 */
export const useThrottle = (callback, delay = 100) => {
    const lastRun = useRef(null)
    const timeoutRef = useRef(null)

    return useCallback((...args) => {
        const now = Date.now()
        if (lastRun.current === null || now - lastRun.current >= delay) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
                timeoutRef.current = null
            }
            lastRun.current = now
            callback(...args)
            return
        }

        const timeSinceLastRun = now - lastRun.current
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(() => {
            lastRun.current = Date.now()
            timeoutRef.current = null
            callback(...args)
        }, delay - timeSinceLastRun)
    }, [callback, delay])
}

/**
 * 이전 값과 비교하여 변경되었을 때만 업데이트하는 훅
 * 불필요한 리렌더링 방지
 */
export const useStableValue = (value, compareFunc = (a, b) => JSON.stringify(a) === JSON.stringify(b)) => {
    const stableRef = useRef(value)

    if (!compareFunc(stableRef.current, value)) {
        stableRef.current = value
    }

    return stableRef.current
}

/**
 * 대량의 데이터를 청크로 나누어 점진적으로 렌더링하는 훅
 */
export const useProgressiveRender = (items, chunkSize = 10, interval = 50) => {
    const [renderedItems, setRenderedItems] = useState([])
    const [isComplete, setIsComplete] = useState(false)

    useEffect(() => {
        if (!items || items.length === 0) {
            setRenderedItems([])
            setIsComplete(true)
            return
        }

        setRenderedItems([])
        setIsComplete(false)

        let currentIndex = 0
        const renderChunk = () => {
            const endIndex = Math.min(currentIndex + chunkSize, items.length)
            setRenderedItems(prev => [...prev, ...items.slice(currentIndex, endIndex)])
            currentIndex = endIndex

            if (currentIndex < items.length) {
                requestAnimationFrame(() => {
                    setTimeout(renderChunk, interval)
                })
            } else {
                setIsComplete(true)
            }
        }

        renderChunk()
    }, [items, chunkSize, interval])

    return { renderedItems, isComplete, progress: items?.length ? renderedItems.length / items.length : 1 }
}

/**
 * 애니메이션 프레임에 맞춰 상태를 업데이트하는 훅
 * 부드러운 UI 업데이트 제공
 */
export const useAnimationFrame = (callback, isActive = true) => {
    const requestRef = useRef()
    const previousTimeRef = useRef()

    const animate = useCallback((time) => {
        if (previousTimeRef.current !== undefined) {
            const deltaTime = time - previousTimeRef.current
            callback(deltaTime)
        }
        previousTimeRef.current = time
        requestRef.current = requestAnimationFrame(animate)
    }, [callback])

    useEffect(() => {
        if (isActive) {
            requestRef.current = requestAnimationFrame(animate)
        }
        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current)
            }
        }
    }, [isActive, animate])
}

/**
 * 배치 업데이트를 위한 훅
 * 여러 상태 변경을 하나로 묶어서 처리
 */
export const useBatchedUpdates = (initialState = {}) => {
    const [state, setState] = useState(initialState)
    const pendingUpdates = useRef({})
    const updateTimeout = useRef(null)

    const batchUpdate = useCallback((updates) => {
        pendingUpdates.current = { ...pendingUpdates.current, ...updates }

        if (updateTimeout.current) {
            cancelAnimationFrame(updateTimeout.current)
        }

        updateTimeout.current = requestAnimationFrame(() => {
            setState(prev => ({ ...prev, ...pendingUpdates.current }))
            pendingUpdates.current = {}
        })
    }, [])

    useEffect(() => {
        return () => {
            if (updateTimeout.current) {
                cancelAnimationFrame(updateTimeout.current)
            }
        }
    }, [])

    return [state, batchUpdate, setState]
}

/**
 * 조건부 메모이제이션 - 특정 조건에서만 값을 재계산
 */
export const useConditionalMemo = (factory, deps, shouldUpdate = true) => {
    const valueRef = useRef()
    const depsRef = useRef(deps)

    const depsChanged = deps.some((dep, i) => dep !== depsRef.current[i])

    if (shouldUpdate && (depsChanged || valueRef.current === undefined)) {
        valueRef.current = factory()
        depsRef.current = deps
    }

    return valueRef.current
}

/**
 * 무한 스크롤을 위한 훅
 */
export const useInfiniteScroll = (loadMore, hasMore, threshold = 100) => {
    const [isLoading, setIsLoading] = useState(false)
    const containerRef = useRef(null)

    const handleScroll = useCallback(() => {
        if (!containerRef.current || isLoading || !hasMore) return

        const { scrollTop, scrollHeight, clientHeight } = containerRef.current
        const distanceToBottom = scrollHeight - scrollTop - clientHeight

        if (distanceToBottom < threshold) {
            setIsLoading(true)
            Promise.resolve(loadMore()).finally(() => {
                setIsLoading(false)
            })
        }
    }, [loadMore, hasMore, isLoading, threshold])

    useEffect(() => {
        const container = containerRef.current
        if (container) {
            container.addEventListener('scroll', handleScroll)
            return () => container.removeEventListener('scroll', handleScroll)
        }
    }, [handleScroll])

    return { containerRef, isLoading }
}

/**
 * 가시성 기반 렌더링 - 뷰포트에 있을 때만 렌더링
 */
export const useVisibilityOptimization = (rootMargin = '100px') => {
    const [isVisible, setIsVisible] = useState(false)
    const elementRef = useRef(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting)
            },
            { rootMargin }
        )

        if (elementRef.current) {
            observer.observe(elementRef.current)
        }

        return () => observer.disconnect()
    }, [rootMargin])

    return { elementRef, isVisible }
}

/**
 * 가격 히스토리 최적화 - 대량 데이터 처리
 */
export const useOptimizedPriceHistory = (history, maxPoints = 100) => {
    return useMemo(() => {
        if (!history || history.length <= maxPoints) return history

        // 데이터 다운샘플링 (LTTB 알고리즘 간소화 버전)
        const step = history.length / maxPoints
        const result = [history[0]] // 첫 점 항상 포함

        for (let i = 1; i < maxPoints - 1; i++) {
            const start = Math.floor(i * step)
            const end = Math.floor((i + 1) * step)
            const segment = history.slice(start, end)

            // 세그먼트에서 최대/최소 값 선택 (변동성 보존)
            if (segment.length > 0) {
                const max = Math.max(...segment.map(p => p.value || p))
                const min = Math.min(...segment.map(p => p.value || p))
                const avg = segment.reduce((a, p) => a + (p.value || p), 0) / segment.length

                // 변동성이 큰 쪽 선택
                const point = Math.abs(max - avg) > Math.abs(avg - min)
                    ? segment.find(p => (p.value || p) === max)
                    : segment.find(p => (p.value || p) === min)
                result.push(point || segment[Math.floor(segment.length / 2)])
            }
        }

        result.push(history[history.length - 1]) // 마지막 점 항상 포함
        return result
    }, [history, maxPoints])
}

export default {
    useDebouncedValue,
    useThrottle,
    useStableValue,
    useProgressiveRender,
    useAnimationFrame,
    useBatchedUpdates,
    useConditionalMemo,
    useInfiniteScroll,
    useVisibilityOptimization,
    useOptimizedPriceHistory
}
