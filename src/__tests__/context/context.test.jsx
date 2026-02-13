/**
 * Context tests
 * SettingsContext behavior and AppProviders wiring
 */

import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { AppProviders } from '../../context'
import { SettingsProvider, useSettings, useTheme, useSoundSettings } from '../../context/SettingsContext'

const SettingsTestComponent = () => {
    const { settings } = useSettings()
    const { theme, toggleTheme, isDark } = useTheme()
    const { soundEnabled, toggleSound } = useSoundSettings()

    return (
        <div>
            <span data-testid="theme">{theme}</span>
            <span data-testid="is-dark">{isDark.toString()}</span>
            <span data-testid="sound-enabled">{soundEnabled.toString()}</span>
            <span data-testid="language">{settings.language}</span>
            <button data-testid="toggle-theme" onClick={toggleTheme}>Toggle Theme</button>
            <button data-testid="toggle-sound" onClick={toggleSound}>Toggle Sound</button>
        </div>
    )
}

describe('SettingsContext', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    test('initial settings are loaded', () => {
        render(
            <SettingsProvider>
                <SettingsTestComponent />
            </SettingsProvider>
        )

        expect(screen.getByTestId('theme').textContent).toBe('dark')
        expect(screen.getByTestId('is-dark').textContent).toBe('true')
        expect(screen.getByTestId('sound-enabled').textContent).toBe('true')
        expect(screen.getByTestId('language').textContent).toBe('ko')
    })

    test('theme toggle works', () => {
        render(
            <SettingsProvider>
                <SettingsTestComponent />
            </SettingsProvider>
        )

        act(() => {
            screen.getByTestId('toggle-theme').click()
        })

        expect(screen.getByTestId('theme').textContent).toBe('light')
        expect(screen.getByTestId('is-dark').textContent).toBe('false')
    })

    test('sound toggle works', () => {
        render(
            <SettingsProvider>
                <SettingsTestComponent />
            </SettingsProvider>
        )

        act(() => {
            screen.getByTestId('toggle-sound').click()
        })

        expect(screen.getByTestId('sound-enabled').textContent).toBe('false')
    })

    test('throws when used outside provider', () => {
        const consoleError = console.error
        console.error = jest.fn()

        expect(() => {
            render(<SettingsTestComponent />)
        }).toThrow('useSettings must be used within a SettingsProvider')

        console.error = consoleError
    })
})

describe('AppProviders', () => {
    test('renders children with current provider stack', () => {
        render(
            <AppProviders>
                <div data-testid="providers-child">ok</div>
            </AppProviders>
        )

        expect(screen.getByTestId('providers-child')).toBeInTheDocument()
    })
})
