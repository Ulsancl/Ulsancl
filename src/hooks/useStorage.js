/**
 * useLocalStorage - 로컬 스토리지 동기화 훅
 * 자동 직렬화/역직렬화 및 에러 핸들링
 */
import { useState, useEffect, useCallback } from 'react'

export function useLocalStorage(key, initialValue) {
    // 초기값 가져오기
    const readValue = useCallback(() => {
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
    }, [key, initialValue])

    const [storedValue, setStoredValue] = useState(readValue)

    // 값 저장
    const setValue = useCallback((value) => {
        if (typeof window === 'undefined') {
            console.warn('localStorage is not available')
            return
        }

        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value
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
    }, [key, storedValue])

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
            if (event.key === key && event.newValue) {
                setStoredValue(JSON.parse(event.newValue))
            }
        }

        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [key])

    return [storedValue, setValue, removeValue]
}

/**
 * useSessionStorage - 세션 스토리지 훅
 */
export function useSessionStorage(key, initialValue) {
    const readValue = useCallback(() => {
        try {
            const item = window.sessionStorage.getItem(key)
            return item ? JSON.parse(item) : initialValue
        } catch {
            return initialValue
        }
    }, [key, initialValue])

    const [storedValue, setStoredValue] = useState(readValue)

    const setValue = useCallback((value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value
            setStoredValue(valueToStore)
            window.sessionStorage.setItem(key, JSON.stringify(valueToStore))
        } catch (error) {
            console.warn(`Error setting sessionStorage key "${key}":`, error)
        }
    }, [key, storedValue])

    return [storedValue, setValue]
}

export default { useLocalStorage, useSessionStorage }
