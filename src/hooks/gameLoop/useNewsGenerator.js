/**
 * useNewsGenerator - 뉴스/이벤트 생성 로직 담당 훅
 * useGameLoop에서 분리된 모듈
 */

import { useCallback, useRef, useLayoutEffect } from 'react'
import {
    generateNews,
    applyNewsImpact,
    generateGlobalEvent,
    generateSeasonalEvent,
    updateNewsEffects
} from '../../engine'

export const useNewsGenerator = ({
    setNews,
    showNotification,
    playSound
}) => {
    const showNotificationRef = useRef(showNotification)
    const playSoundRef = useRef(playSound)

    useLayoutEffect(() => {
        showNotificationRef.current = showNotification
        playSoundRef.current = playSound
    }, [showNotification, playSound])

    const tick = useCallback((stocks, marketState, gameTime) => {
        let workingStocks = stocks
        let workingMarketState = marketState
        const showNotificationCurrent = showNotificationRef.current
        const playSoundCurrent = playSoundRef.current
        let newsGenerated = null

        // 뉴스 효과 업데이트
        updateNewsEffects()

        // 일반 뉴스 생성 (3% 확률)
        const newNews = generateNews(workingStocks, 0.03)
        if (newNews) {
            setNews(prev => [newNews, ...prev].slice(0, 50))
            showNotificationCurrent(
                `📰 ${newNews.text}`,
                newNews.type === 'positive' ? 'success' : newNews.type === 'negative' ? 'error' : 'info'
            )
            playSoundCurrent('news')

            const { stocks: impactedStocks, marketState: impactedMarket } = applyNewsImpact(
                workingStocks,
                newNews,
                workingMarketState
            )
            workingStocks = impactedStocks
            workingMarketState = impactedMarket
            newsGenerated = newNews
        }

        // 글로벌 특별 이벤트 (매우 희귀)
        const globalEvent = generateGlobalEvent()
        if (globalEvent) {
            setNews(prev => [globalEvent, ...prev].slice(0, 50))
            const notifType = globalEvent.type === 'positive' ? 'success' : globalEvent.type === 'negative' ? 'error' : 'info'
            showNotificationCurrent(`${globalEvent.icon} 속보: ${globalEvent.text}`, notifType)
            playSoundCurrent('news')

            const { stocks: impactedStocks, marketState: impactedMarket } = applyNewsImpact(
                workingStocks,
                globalEvent,
                workingMarketState
            )
            workingStocks = impactedStocks
            workingMarketState = impactedMarket
        }

        // 계절별 특별 이벤트 (1% 확률)
        const seasonalEvent = generateSeasonalEvent(gameTime.season, 0.01)
        if (seasonalEvent) {
            setNews(prev => [seasonalEvent, ...prev].slice(0, 50))
            const notifType = seasonalEvent.type === 'positive' ? 'success' : 'error'
            showNotificationCurrent(`${seasonalEvent.icon} 계절 뉴스: ${seasonalEvent.text}`, notifType)
            playSoundCurrent('news')

            const { stocks: impactedStocks, marketState: impactedMarket } = applyNewsImpact(
                workingStocks,
                seasonalEvent,
                workingMarketState
            )
            workingStocks = impactedStocks
            workingMarketState = impactedMarket
        }

        return { stocks: workingStocks, marketState: workingMarketState, newsGenerated }
    }, [setNews])

    return { tick }
}

export default useNewsGenerator
