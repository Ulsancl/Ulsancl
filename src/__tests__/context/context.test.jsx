/**
 * Context 테스트
 * src/context/GameContext.jsx 및 SettingsContext.jsx 테스트
 */

import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { GameProvider, useGameState, useGameActions } from '../../context/GameContext'
import { SettingsProvider, useSettings, useTheme, useSoundSettings } from '../../context/SettingsContext'

// GameContext 테스트용 컴포넌트
const GameTestComponent = () => {
    const state = useGameState()
    const actions = useGameActions()

    return (
        <div>
            <span data-testid="cash">{state.cash}</span>
            <span data-testid="total-trades">{state.totalTrades}</span>
            <button data-testid="update-cash" onClick={() => actions.updateCash(1000)}>Add Cash</button>
            <button data-testid="increment-trades" onClick={() => actions.incrementTrades()}>Trade</button>
        </div>
    )
}

// SettingsContext 테스트용 컴포넌트
const SettingsTestComponent = () => {
    const { settings } = useSettings()
    const { theme, toggleTheme, isDark } = useTheme()
    const { soundEnabled, toggleSound } = useSoundSettings()

    return (
        <div>
            <span data-testid="theme">{theme}</span>
            <span data-testid="is-dark">{isDark.toString()}</span>
            <span data-testid="sound-enabled">{soundEnabled.toString()}</span>
            <span data-testid="player-name">{settings.playerName}</span>
            <button data-testid="toggle-theme" onClick={toggleTheme}>Toggle Theme</button>
            <button data-testid="toggle-sound" onClick={toggleSound}>Toggle Sound</button>
        </div>
    )
}

describe('GameContext', () => {
    test('초기 상태가 올바름', () => {
        render(
            <GameProvider>
                <GameTestComponent />
            </GameProvider>
        )

        expect(screen.getByTestId('cash').textContent).toBe('100000000') // 1억
        expect(screen.getByTestId('total-trades').textContent).toBe('0')
    })

    test('updateCash 액션이 현금을 업데이트함', () => {
        render(
            <GameProvider>
                <GameTestComponent />
            </GameProvider>
        )

        const initialCash = parseInt(screen.getByTestId('cash').textContent)

        act(() => {
            screen.getByTestId('update-cash').click()
        })

        const newCash = parseInt(screen.getByTestId('cash').textContent)
        expect(newCash).toBe(initialCash + 1000)
    })

    test('incrementTrades 액션이 거래 수를 증가시킴', () => {
        render(
            <GameProvider>
                <GameTestComponent />
            </GameProvider>
        )

        expect(screen.getByTestId('total-trades').textContent).toBe('0')

        act(() => {
            screen.getByTestId('increment-trades').click()
        })

        expect(screen.getByTestId('total-trades').textContent).toBe('1')
    })

    test('Provider 없이 사용하면 에러 발생', () => {
        const consoleError = console.error
        console.error = jest.fn() // 에러 로그 억제

        expect(() => {
            render(<GameTestComponent />)
        }).toThrow('useGameState must be used within a GameProvider')

        console.error = consoleError
    })
})

describe('SettingsContext', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    test('초기 설정이 올바름', () => {
        render(
            <SettingsProvider>
                <SettingsTestComponent />
            </SettingsProvider>
        )

        expect(screen.getByTestId('theme').textContent).toBe('dark')
        expect(screen.getByTestId('is-dark').textContent).toBe('true')
        expect(screen.getByTestId('sound-enabled').textContent).toBe('true')
        expect(screen.getByTestId('player-name').textContent).toBe('투자자')
    })

    test('테마 토글이 작동함', () => {
        render(
            <SettingsProvider>
                <SettingsTestComponent />
            </SettingsProvider>
        )

        expect(screen.getByTestId('theme').textContent).toBe('dark')

        act(() => {
            screen.getByTestId('toggle-theme').click()
        })

        expect(screen.getByTestId('theme').textContent).toBe('light')
        expect(screen.getByTestId('is-dark').textContent).toBe('false')
    })

    test('사운드 토글이 작동함', () => {
        render(
            <SettingsProvider>
                <SettingsTestComponent />
            </SettingsProvider>
        )

        expect(screen.getByTestId('sound-enabled').textContent).toBe('true')

        act(() => {
            screen.getByTestId('toggle-sound').click()
        })

        expect(screen.getByTestId('sound-enabled').textContent).toBe('false')
    })

    test('Provider 없이 사용하면 에러 발생', () => {
        const consoleError = console.error
        console.error = jest.fn()

        expect(() => {
            render(<SettingsTestComponent />)
        }).toThrow('useSettings must be used within a SettingsProvider')

        console.error = consoleError
    })
})
