/**
 * Context module index
 */

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

import React from 'react'
import { SettingsProvider } from './SettingsContext'
import { ModalProvider } from './ModalContext'

export function AppProviders({ children }) {
    return (
        <SettingsProvider>
            <ModalProvider>
                {children}
            </ModalProvider>
        </SettingsProvider>
    )
}
