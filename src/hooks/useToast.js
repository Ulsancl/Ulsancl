/**
 * useToast - 토스트 알림 관리 훅
 */
import { useState, useCallback } from 'react'
import { generateId } from '../utils'

export const useToast = () => {
    const [toasts, setToasts] = useState([])

    const addToast = useCallback((message, type = 'info', subMessage = null, duration = 3000) => {
        const id = generateId()
        setToasts(prev => [...prev, { id, message, type, subMessage, duration }])
        return id
    }, [])

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    // Legacy wrapper for backward compatibility
    const showNotification = useCallback((message, type = 'success') => {
        addToast(message, type)
    }, [addToast])

    return {
        toasts,
        setToasts,
        addToast,
        removeToast,
        showNotification
    }
}

export default useToast
