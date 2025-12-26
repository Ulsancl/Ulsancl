/**
 * usePriceWorker - Web Worker를 활용한 가격 계산 훅
 * 메인 스레드의 부하를 줄이고 UI 반응성 향상
 */
import { useRef, useEffect, useCallback, useState } from 'react'

/**
 * 가격 계산 Web Worker 훅
 */
export function usePriceWorker() {
    const workerRef = useRef(null)
    const callbacksRef = useRef(new Map())
    const messageIdRef = useRef(0)
    const [isReady, setIsReady] = useState(false)

    // Worker 초기화
    useEffect(() => {
        try {
            workerRef.current = new Worker(
                new URL('../workers/priceCalculator.worker.js', import.meta.url),
                { type: 'module' }
            )

            workerRef.current.onmessage = (e) => {
                const { id, type, result } = e.data

                if (type === 'READY') {
                    setIsReady(true)
                    return
                }

                const callback = callbacksRef.current.get(id)
                if (callback) {
                    callback(result)
                    callbacksRef.current.delete(id)
                }
            }

            workerRef.current.onerror = (error) => {
                console.error('Price Worker Error:', error)
            }
        } catch (error) {
            console.warn('Web Worker not supported, falling back to main thread', error)
            setIsReady(false)
        }

        return () => {
            workerRef.current?.terminate()
        }
    }, [])

    // Worker에 메시지 전송
    const sendMessage = useCallback((type, payload) => {
        return new Promise((resolve) => {
            if (!workerRef.current || !isReady) {
                // Worker가 없으면 즉시 null 반환 (폴백 사용)
                resolve(null)
                return
            }

            const id = messageIdRef.current++
            callbacksRef.current.set(id, resolve)
            workerRef.current.postMessage({ id, type, payload })

            // 타임아웃 (2초)
            setTimeout(() => {
                if (callbacksRef.current.has(id)) {
                    callbacksRef.current.delete(id)
                    resolve(null)
                }
            }, 2000)
        })
    }, [isReady])

    // 모든 주식 가격 계산
    const calculatePrices = useCallback(async (stocks, marketState, newsEffects, globalEvent) => {
        return sendMessage('CALCULATE_PRICES', {
            stocks,
            marketState,
            newsEffects,
            globalEvent
        })
    }, [sendMessage])

    // 단일 주식 가격 계산
    const calculateSinglePrice = useCallback(async (stock, marketState, newsEffects, globalEvent) => {
        return sendMessage('CALCULATE_SINGLE_PRICE', {
            stock,
            marketState,
            newsEffects,
            globalEvent
        })
    }, [sendMessage])

    // 기술적 지표 계산
    const calculateIndicators = useCallback(async (prices, period = 14) => {
        return sendMessage('CALCULATE_INDICATORS', { prices, period })
    }, [sendMessage])

    // 배치 지표 계산
    const calculateBatchIndicators = useCallback(async (priceHistories, period = 14) => {
        return sendMessage('BATCH_INDICATORS', { priceHistories, period })
    }, [sendMessage])

    return {
        isReady,
        calculatePrices,
        calculateSinglePrice,
        calculateIndicators,
        calculateBatchIndicators
    }
}

/**
 * 폴백: Worker 없이 메인 스레드에서 계산
 * (Worker 미지원 환경용)
 */
export function usePriceCalculatorFallback() {
    const calculatePrices = useCallback((stocks, _marketState) => {
        // 간단한 폴백 구현
        return stocks.map(stock => ({
            id: stock.id,
            oldPrice: stock.price,
            newPrice: stock.price // 실제로는 gameEngine의 함수 사용
        }))
    }, [])

    return {
        isReady: true,
        calculatePrices,
        calculateSinglePrice: () => null,
        calculateIndicators: () => null,
        calculateBatchIndicators: () => null
    }
}

export default usePriceWorker
