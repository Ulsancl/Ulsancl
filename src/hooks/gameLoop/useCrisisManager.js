/**
 * useCrisisManager - 위기 이벤트 관리 훅
 * useGameLoop에서 분리된 모듈
 */

import { useCallback, useRef, useLayoutEffect } from 'react'
import { updatePricesWithCrisis, getActiveCrisis } from '../../engine'

export const useCrisisManager = ({
    setActiveCrisis,
    setCrisisAlert,
    setCrisisHistory,
    showNotification,
    playSound
}) => {
    const showNotificationRef = useRef(showNotification)
    const playSoundRef = useRef(playSound)

    useLayoutEffect(() => {
        showNotificationRef.current = showNotification
        playSoundRef.current = playSound
    }, [showNotification, playSound])

    const tick = useCallback((stocks, marketState, gameDay) => {
        const showNotificationCurrent = showNotificationRef.current
        const playSoundCurrent = playSoundRef.current

        const crisisResult = updatePricesWithCrisis(stocks, marketState, gameDay)

        if (crisisResult.crisisEvent) {
            const { type, crisis } = crisisResult.crisisEvent

            if (type === 'crisis_started') {
                setCrisisAlert(crisis)
                setActiveCrisis(crisis)
                setCrisisHistory(prev => [...prev, { ...crisis, startDay: gameDay }])

                const isPositive = crisis.baseImpact && crisis.baseImpact[0] > 0
                showNotificationCurrent(
                    `${crisis.icon} ${isPositive ? '호재' : '위기'} 발생: ${crisis.name}`,
                    isPositive ? 'success' : 'error'
                )
                playSoundCurrent('news')
            } else if (type === 'crisis_ended') {
                setActiveCrisis(null)
                showNotificationCurrent(`✅ ${crisis.name} 종료, 시장 정상화`, 'info')
            } else if (type === 'crisis_update') {
                setActiveCrisis(crisisResult.activeCrisis)
            }
        } else {
            const currentCrisis = crisisResult.activeCrisis || getActiveCrisis(gameDay)
            setActiveCrisis(currentCrisis)
        }

        return crisisResult
    }, [setActiveCrisis, setCrisisAlert, setCrisisHistory])

    return { tick }
}

export default useCrisisManager
