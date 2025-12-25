/**
 * 커스텀 훅 테스트
 * src/hooks/*.js 테스트
 */

import { renderHook, act } from '@testing-library/react'
import { useDebouncedValue, useThrottle, useStableValue } from '../../hooks/useOptimization'

describe('useOptimization hooks', () => {
    beforeEach(() => {
        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    describe('useDebouncedValue', () => {
        test('디바운스 후 값이 업데이트됨', () => {
            const { result, rerender } = renderHook(
                ({ value, delay }) => useDebouncedValue(value, delay),
                { initialProps: { value: 'initial', delay: 300 } }
            )

            expect(result.current).toBe('initial')

            // 값 변경
            rerender({ value: 'updated', delay: 300 })

            // 아직 디바운스 중
            expect(result.current).toBe('initial')

            // 디바운스 완료 후
            act(() => {
                jest.advanceTimersByTime(300)
            })

            expect(result.current).toBe('updated')
        })

        test('연속된 변경은 마지막 값만 반영', () => {
            const { result, rerender } = renderHook(
                ({ value, delay }) => useDebouncedValue(value, delay),
                { initialProps: { value: 'a', delay: 300 } }
            )

            rerender({ value: 'b', delay: 300 })
            act(() => { jest.advanceTimersByTime(100) })

            rerender({ value: 'c', delay: 300 })
            act(() => { jest.advanceTimersByTime(100) })

            rerender({ value: 'd', delay: 300 })
            act(() => { jest.advanceTimersByTime(100) })

            // 아직 원래 값 유지
            expect(result.current).toBe('a')

            // 300ms 후 마지막 값으로 업데이트
            act(() => { jest.advanceTimersByTime(300) })
            expect(result.current).toBe('d')
        })
    })

    describe('useThrottle', () => {
        test('쓰로틀 간격 내 호출은 무시됨', () => {
            const callback = jest.fn()
            const { result } = renderHook(() => useThrottle(callback, 100))

            // 첫 번째 호출
            act(() => { result.current() })
            expect(callback).toHaveBeenCalledTimes(1)

            // 바로 다음 호출은 무시
            act(() => { result.current() })
            expect(callback).toHaveBeenCalledTimes(1)

            // 100ms 후 호출 가능
            act(() => { jest.advanceTimersByTime(100) })
            expect(callback).toHaveBeenCalledTimes(2) // 예약된 호출 실행
        })
    })

    describe('useStableValue', () => {
        test('동일한 값은 같은 참조 유지', () => {
            const obj1 = { a: 1, b: 2 }
            const { result, rerender } = renderHook(
                ({ value }) => useStableValue(value),
                { initialProps: { value: obj1 } }
            )

            const firstRef = result.current

            // 같은 구조의 새 객체
            const obj2 = { a: 1, b: 2 }
            rerender({ value: obj2 })

            // 같은 참조 유지
            expect(result.current).toBe(firstRef)
        })

        test('다른 값은 새 참조', () => {
            const obj1 = { a: 1, b: 2 }
            const { result, rerender } = renderHook(
                ({ value }) => useStableValue(value),
                { initialProps: { value: obj1 } }
            )

            const firstRef = result.current

            // 다른 구조의 객체
            const obj2 = { a: 1, b: 3 }
            rerender({ value: obj2 })

            // 새 참조
            expect(result.current).not.toBe(firstRef)
            expect(result.current).toEqual(obj2)
        })
    })
})
