/**
 * SettingsContext - 앱 설정 Context
 * 테마, 사운드, 사용자 설정 관리
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

const SETTINGS_KEY = 'stockGame_settings'

const defaultSettings = {
    theme: 'dark',
    soundEnabled: true,
    volume: 0.5,
    playerName: '투자자',
    notifications: true,
    autoSave: true,
    compactMode: false,
    showTutorialHints: true,
    language: 'ko'
}

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState(() => {
        try {
            const saved = localStorage.getItem(SETTINGS_KEY)
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings
        } catch {
            return defaultSettings
        }
    })

    // 설정 저장
    useEffect(() => {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
        } catch {
            console.error('설정 저장 실패')
        }
    }, [settings])

    // 개별 설정 업데이트
    const updateSetting = useCallback((key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }))
    }, [])

    // 테마 토글
    const toggleTheme = useCallback(() => {
        setSettings(prev => ({
            ...prev,
            theme: prev.theme === 'dark' ? 'light' : 'dark'
        }))
    }, [])

    // 사운드 토글
    const toggleSound = useCallback(() => {
        setSettings(prev => ({
            ...prev,
            soundEnabled: !prev.soundEnabled
        }))
    }, [])

    // 볼륨 설정
    const setVolume = useCallback((volume) => {
        setSettings(prev => ({
            ...prev,
            volume: Math.max(0, Math.min(1, volume))
        }))
    }, [])

    // 설정 리셋
    const resetSettings = useCallback(() => {
        setSettings(defaultSettings)
    }, [])

    // 테마 적용
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', settings.theme)
        document.body.className = settings.theme
    }, [settings.theme])

    const value = {
        settings,
        setSettings,
        updateSetting,
        toggleTheme,
        toggleSound,
        setVolume,
        resetSettings
    }

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    )
}

export function useSettings() {
    const context = useContext(SettingsContext)
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider')
    }
    return context
}

// 편의 훅
export function useTheme() {
    const { settings, toggleTheme } = useSettings()
    return { theme: settings.theme, toggleTheme, isDark: settings.theme === 'dark' }
}

export function useSoundSettings() {
    const { settings, toggleSound, setVolume } = useSettings()
    return {
        soundEnabled: settings.soundEnabled,
        volume: settings.volume,
        toggleSound,
        setVolume
    }
}

export default { SettingsProvider, useSettings, useTheme, useSoundSettings }
