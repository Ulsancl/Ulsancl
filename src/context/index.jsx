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

export {
    ModalProvider,
    useModal,
    useModalState,
    MODAL_NAMES
} from './ModalContext'

// 복합 Provider 컴포넌트
import React from 'react'
import { GameProvider } from './GameContext'
import { SettingsProvider } from './SettingsContext'
import { ModalProvider } from './ModalContext'

export function AppProviders({ children }) {
    return (
        <SettingsProvider>
            <ModalProvider>
                <GameProvider>
                    {children}
                </GameProvider>
            </ModalProvider>
        </SettingsProvider>
    )
}

