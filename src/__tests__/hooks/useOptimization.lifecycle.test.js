import { act, renderHook } from '@testing-library/react'
import { useThrottle, useProgressiveRender, useAnimationFrame, useConditionalMemo } from '../../hooks/useOptimization'

beforeEach(() => jest.useFakeTimers())
afterEach(() => jest.useRealTimers())

test('cancels a pending throttled callback when the consumer unmounts', () => {
    const callback = jest.fn()
    const { result, unmount } = renderHook(() => useThrottle(callback, 100))
    act(() => { result.current('first'); result.current('trailing') })
    expect(callback).toHaveBeenCalledTimes(1)
    unmount()
    act(() => jest.advanceTimersByTime(200))
    expect(callback.mock.calls).toEqual([['first']])
})

test('a new progressive list cannot receive chunks from the previous list', () => {
    const oldItems = Array.from({ length: 20 }, (_, i) => 'old-' + i)
    const newItems = ['new-1', 'new-2', 'new-3']
    const { result, rerender, unmount } = renderHook(({ items }) => useProgressiveRender(items, 2, 50), {
        initialProps: { items: oldItems }
    })
    act(() => jest.advanceTimersByTime(1))
    rerender({ items: newItems })
    act(() => jest.advanceTimersByTime(1000))
    expect(result.current.renderedItems).toEqual(newItems)
    expect(result.current.isComplete).toBe(true)
    expect(result.current.progress).toBe(1)
    unmount()
    expect(jest.getTimerCount()).toBe(0)
})

test('animation time starts fresh after a pause', () => {
    const callback = jest.fn()
    const { rerender, unmount } = renderHook(({ active }) => useAnimationFrame(callback, active), {
        initialProps: { active: true }
    })
    act(() => jest.advanceTimersByTime(48))
    rerender({ active: false })
    const count = callback.mock.calls.length
    act(() => jest.advanceTimersByTime(5000))
    expect(callback).toHaveBeenCalledTimes(count)
    rerender({ active: true })
    act(() => jest.advanceTimersByTime(48))
    expect(callback.mock.calls.slice(count).every(([delta]) => delta <= 32)).toBe(true)
    unmount()
    expect(jest.getTimerCount()).toBe(0)
})


test('conditional memo caches undefined after being enabled', () => {
    const factory = jest.fn(() => undefined)
    const { rerender } = renderHook(({ enabled }) => useConditionalMemo(factory, [], enabled), {
        initialProps: { enabled: false }
    })
    expect(factory).not.toHaveBeenCalled()
    rerender({ enabled: true })
    rerender({ enabled: true })
    expect(factory).toHaveBeenCalledTimes(1)
})

test('a callback update does not restart the active animation clock', () => {
    const first = jest.fn(), next = jest.fn()
    const { rerender, unmount } = renderHook(({ callback }) => useAnimationFrame(callback), {
        initialProps: { callback: first }
    })
    act(() => jest.advanceTimersByTime(48))
    rerender({ callback: next })
    act(() => jest.advanceTimersByTime(16))
    expect(next).toHaveBeenCalledWith(16)
    unmount()
})
