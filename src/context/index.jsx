/**
 * Context 모듈 인덱스
 */

export {
    GameProvider,
    useGameState,
    useGameActions,
    useGameSelector,
    ACTIONS
} from './GameContext'

export {
    SettingsProvider,
    useSettings,
    useTheme,
    useSoundSettings
} from './SettingsContext'

// 복합 Provider 컴포넌트
import React from 'react'
import { GameProvider } from './GameContext'
import { SettingsProvider } from './SettingsContext'

export function AppProviders({ children }) {
    return (
        <SettingsProvider>
            <GameProvider>
                {children}
            </GameProvider>
        </SettingsProvider>
    )
}
