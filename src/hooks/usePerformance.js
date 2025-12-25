/**
 * usePerformance - 성능 모니터링 훅
 * 렌더링 횟수, 메모리 사용량 등 추적
 */
import { useRef, useEffect, useCallback } from 'react'

export const useRenderCount = (componentName) => {
    const renderCount = useRef(0)
    renderCount.current += 1

    if (process.env.NODE_ENV === 'development') {
        console.log(`[Render] ${componentName}: ${renderCount.current}`)
    }

    return renderCount.current
}

export const useWhyDidYouUpdate = (name, props) => {
    const previousProps = useRef()

    useEffect(() => {
        if (previousProps.current) {
            const allKeys = Object.keys({ ...previousProps.current, ...props })
            const changesObj = {}

            allKeys.forEach((key) => {
                if (previousProps.current[key] !== props[key]) {
                    changesObj[key] = {
                        from: previousProps.current[key],
                        to: props[key]
                    }
                }
            })

            if (Object.keys(changesObj).length) {
                console.log('[Why did you update]', name, changesObj)
            }
        }

        previousProps.current = props
    })
}

export const useMeasure = () => {
    const measureRef = useRef(null)

    const measure = useCallback((callback) => {
        const start = performance.now()
        callback()
        const end = performance.now()
        measureRef.current = end - start
        return measureRef.current
    }, [])

    const measureAsync = useCallback(async (callback) => {
        const start = performance.now()
        await callback()
        const end = performance.now()
        measureRef.current = end - start
        return measureRef.current
    }, [])

    return { measure, measureAsync, lastMeasure: measureRef.current }
}

export const useMemoryUsage = () => {
    const getMemory = useCallback(() => {
        if (performance.memory) {
            return {
                usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1048576),
                totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1048576),
                jsHeapSizeLimit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
            }
        }
        return null
    }, [])

    return getMemory
}

export default { useRenderCount, useWhyDidYouUpdate, useMeasure, useMemoryUsage }
