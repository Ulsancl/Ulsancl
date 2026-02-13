/**
 * useLocalStorage - 로컬 스토리지 동기화 훅
 * 자동 직렬화/역직렬화 및 에러 핸들링
 */
import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react'

export function useLocalStorage(key, initialValue) {
    // 초기값 lazy 초기화
    const [storedValue, setStoredValue] = useState(() => {
        if (typeof window === 'undefined') {
            return initialValue
        }

        try {
            const item = window.localStorage.getItem(key)
            return item ? JSON.parse(item) : initialValue
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error)
            return initialValue
        }
    })

    // ref로 최신 값 추적 (의존성 문제 해결)
    const storedValueRef = useRef(storedValue)
    useLayoutEffect(() => {
        storedValueRef.current = storedValue
    }, [storedValue])

    // 값 저장 - storedValue 의존성 제거로 안정적인 참조 보장
    const setValue = useCallback((value) => {
        if (typeof window === 'undefined') {
            console.warn('localStorage is not available')
            return
        }

        try {
            // ref에서 최신 값 읽기
            const valueToStore = value instanceof Function ? value(storedValueRef.current) : value
            setStoredValue(valueToStore)
            window.localStorage.setItem(key, JSON.stringify(valueToStore))

            // 다른 탭에 변경 알림
            window.dispatchEvent(new StorageEvent('storage', {
                key,
                newValue: JSON.stringify(valueToStore)
            }))
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error)
        }
    }, [key])

    // 값 삭제
    const removeValue = useCallback(() => {
        try {
            window.localStorage.removeItem(key)
            setStoredValue(initialValue)
        } catch (error) {
            console.warn(`Error removing localStorage key "${key}":`, error)
        }
    }, [key, initialValue])

    // 다른 탭의 변경 감지
    useEffect(() => {
        const handleStorageChange = (event) => {
            if (event.key === null || event.key === key) {
                if (event.newValue == null) {
                    setStoredValue(initialValue)
                    return
                }
                setStoredValue(JSON.parse(event.newValue))
            }
        }

        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [key, initialValue])

    return [storedValue, setValue, removeValue]
}

/**
 * useSessionStorage - 세션 스토리지 훅
 */
export function useSessionStorage(key, initialValue) {
    // 초기값 lazy 초기화
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.sessionStorage.getItem(key)
            return item ? JSON.parse(item) : initialValue
        } catch {
            return initialValue
        }
    })

    // ref로 최신 값 추적 (의존성 문제 해결)
    const storedValueRef = useRef(storedValue)
    useLayoutEffect(() => {
        storedValueRef.current = storedValue
    }, [storedValue])

    const setValue = useCallback((value) => {
        try {
            // ref에서 최신 값 읽기
            const valueToStore = value instanceof Function ? value(storedValueRef.current) : value
            setStoredValue(valueToStore)
            window.sessionStorage.setItem(key, JSON.stringify(valueToStore))
        } catch (error) {
            console.warn(`Error setting sessionStorage key "${key}":`, error)
        }
    }, [key])


    return [storedValue, setValue]
}

export default { useLocalStorage, useSessionStorage }
