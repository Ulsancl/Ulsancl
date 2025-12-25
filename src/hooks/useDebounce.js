/**
 * useDebounce / useThrottle - 성능 최적화 훅
 */
import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * 값을 디바운스
 * @param {any} value - 디바운스할 값
 * @param {number} delay - 지연 시간 (ms)
 */
export function useDebounce(value, delay = 500) {
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(timer)
        }
    }, [value, delay])

    return debouncedValue
}

/**
 * 함수를 디바운스
 * @param {Function} fn - 디바운스할 함수
 * @param {number} delay - 지연 시간 (ms)
 */
export function useDebouncedCallback(fn, delay = 500) {
    const timeoutRef = useRef(null)

    const debouncedFn = useCallback((...args) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(() => {
            fn(...args)
        }, delay)
    }, [fn, delay])

    // 클린업
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    // 즉시 실행 및 취소 함수
    const cancel = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
    }, [])

    const flush = useCallback((...args) => {
        cancel()
        fn(...args)
    }, [cancel, fn])

    return { debouncedFn, cancel, flush }
}

/**
 * 함수를 쓰로틀
 * @param {Function} fn - 쓰로틀할 함수
 * @param {number} limit - 실행 간격 (ms)
 */
export function useThrottle(fn, limit = 300) {
    const lastRun = useRef(Date.now())
    const lastFn = useRef(null)
    const timeoutRef = useRef(null)

    const throttledFn = useCallback((...args) => {
        const now = Date.now()
        const timeSinceLastRun = now - lastRun.current

        if (timeSinceLastRun >= limit) {
            // 즉시 실행
            fn(...args)
            lastRun.current = now
        } else {
            // 대기 후 실행
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }

            lastFn.current = () => fn(...args)
            timeoutRef.current = setTimeout(() => {
                if (lastFn.current) {
                    lastFn.current()
                    lastRun.current = Date.now()
                }
            }, limit - timeSinceLastRun)
        }
    }, [fn, limit])

    // 클린업
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    return throttledFn
}

/**
 * 값을 쓰로틀
 * @param {any} value - 쓰로틀할 값
 * @param {number} limit - 업데이트 간격 (ms)
 */
export function useThrottledValue(value, limit = 300) {
    const [throttledValue, setThrottledValue] = useState(value)
    const lastRun = useRef(Date.now())
    const timeoutRef = useRef(null)

    useEffect(() => {
        const now = Date.now()
        const timeSinceLastRun = now - lastRun.current

        if (timeSinceLastRun >= limit) {
            setThrottledValue(value)
            lastRun.current = now
        } else {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }

            timeoutRef.current = setTimeout(() => {
                setThrottledValue(value)
                lastRun.current = Date.now()
            }, limit - timeSinceLastRun)
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [value, limit])

    return throttledValue
}

export default { useDebounce, useDebouncedCallback, useThrottle, useThrottledValue }
