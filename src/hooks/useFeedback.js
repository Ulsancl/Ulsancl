/**
 * useFeedback - 액션 피드백 관리 훅
 */
import { useState, useCallback } from 'react'
import { generateId } from '../utils'

export const useFeedback = () => {
    const [feedbackItems, setFeedbackItems] = useState([])

    const addFeedback = useCallback((text, type = 'neutral', x, y) => {
        const id = generateId()
        const finalX = x || window.innerWidth / 2
        const finalY = y || window.innerHeight / 2
        setFeedbackItems(prev => [...prev, { id, text, type, x: finalX, y: finalY }])
        return id
    }, [])

    const removeFeedback = useCallback((id) => {
        setFeedbackItems(prev => prev.filter(f => f.id !== id))
    }, [])

    return {
        feedbackItems,
        setFeedbackItems,
        addFeedback,
        removeFeedback
    }
}

export default useFeedback
