/**
 * 커스텀 훅 테스트
 */

import { renderHook, act } from '@testing-library/react'
import { useToast } from '../hooks/useToast'
import { useFeedback } from '../hooks/useFeedback'

describe('useToast', () => {
    test('초기 상태는 빈 배열', () => {
        const { result } = renderHook(() => useToast())
        expect(result.current.toasts).toEqual([])
    })

    test('addToast로 토스트 추가', () => {
        const { result } = renderHook(() => useToast())

        act(() => {
            result.current.addToast('테스트 메시지', 'success')
        })

        expect(result.current.toasts).toHaveLength(1)
        expect(result.current.toasts[0].message).toBe('테스트 메시지')
        expect(result.current.toasts[0].type).toBe('success')
    })

    test('removeToast로 토스트 제거', () => {
        const { result } = renderHook(() => useToast())

        let toastId
        act(() => {
            toastId = result.current.addToast('테스트 메시지', 'info')
        })

        expect(result.current.toasts).toHaveLength(1)

        act(() => {
            result.current.removeToast(toastId)
        })

        expect(result.current.toasts).toHaveLength(0)
    })

    test('showNotification은 addToast 래퍼', () => {
        const { result } = renderHook(() => useToast())

        act(() => {
            result.current.showNotification('알림 메시지', 'warning')
        })

        expect(result.current.toasts).toHaveLength(1)
        expect(result.current.toasts[0].type).toBe('warning')
    })
})

describe('useFeedback', () => {
    test('초기 상태는 빈 배열', () => {
        const { result } = renderHook(() => useFeedback())
        expect(result.current.feedbackItems).toEqual([])
    })

    test('addFeedback으로 피드백 추가', () => {
        const { result } = renderHook(() => useFeedback())

        act(() => {
            result.current.addFeedback('+100만원', 'profit', 500, 300)
        })

        expect(result.current.feedbackItems).toHaveLength(1)
        expect(result.current.feedbackItems[0].text).toBe('+100만원')
        expect(result.current.feedbackItems[0].type).toBe('profit')
        expect(result.current.feedbackItems[0].x).toBe(500)
        expect(result.current.feedbackItems[0].y).toBe(300)
    })

    test('removeFeedback으로 피드백 제거', () => {
        const { result } = renderHook(() => useFeedback())

        let feedbackId
        act(() => {
            feedbackId = result.current.addFeedback('-50만원', 'loss')
        })

        expect(result.current.feedbackItems).toHaveLength(1)

        act(() => {
            result.current.removeFeedback(feedbackId)
        })

        expect(result.current.feedbackItems).toHaveLength(0)
    })
})
