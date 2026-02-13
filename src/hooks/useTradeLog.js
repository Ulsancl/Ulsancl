/**
 * useTradeLog - Trade Log Recording Hook
 * 
 * Records all trade actions during gameplay for server verification.
 * The log can be replayed with a seed to reproduce exact game state.
 * 
 * @module hooks/useTradeLog
 * @version 3.0.0
 */

import { useState, useCallback, useRef } from 'react'
import { ENGINE_VERSION, CLIENT_VERSION } from '../engine/version'

/**
 * @typedef {Object} TradeAction
 * @property {number} tick - Game tick when action occurred
 * @property {'BUY'|'SELL'|'SHORT'|'COVER'} type - Trade action type
 * @property {string} stockId - Stock identifier
 * @property {number} quantity - Quantity traded
 * @property {string} [orderType] - Order type (market/limit)
 * @property {number} [limitPrice] - Limit price if applicable
 * @property {number} [timestamp] - Debug timestamp
 */

/**
 * Simple hash function for checksum (DJB2 algorithm)
 * @param {string} str - String to hash
 * @returns {string} Hash as hex string
 */
function djb2Hash(str) {
    let hash = 5381
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) ^ str.charCodeAt(i)
        hash = hash >>> 0 // Convert to unsigned 32-bit
    }
    return hash.toString(16).padStart(8, '0')
}

/**
 * Calculate checksum for client payload
 * @param {Object} meta - Session metadata
 * @param {Array} tradeLogs - Trade log array
 * @returns {string} Checksum string
 */
export function calculateChecksum(meta, tradeLogs) {
    const data = {
        seasonId: meta.seasonId,
        engineVersion: meta.engineVersion,
        totalTicks: meta.totalTicks,
        tradeCount: tradeLogs.length,
        // Include first and last trade for integrity
        firstTrade: tradeLogs.length > 0 ? tradeLogs[0] : null,
        lastTrade: tradeLogs.length > 0 ? tradeLogs[tradeLogs.length - 1] : null
    }

    const jsonStr = JSON.stringify(data)
    return djb2Hash(jsonStr)
}

/**
 * Hook for recording trade actions during gameplay
 * 
 * @param {Object} options - Hook options
 * @param {string|null} [options.seasonId] - Current season ID
 * @param {number} [options.initialCapital=100000000] - Initial capital amount
 * @returns {Object} Trade log recorder API
 */
export function useTradeLog(options = {}) {
    const {
        seasonId: initialSeasonId = null,
        initialCapital = 100000000
    } = options

    const [tradeLogs, setTradeLogs] = useState([])
    const [seasonId, setSeasonId] = useState(initialSeasonId)
    const tickRef = useRef(0)
    const startedAtRef = useRef(Date.now())

    /**
     * Record a trade action
     * @param {'BUY'|'SELL'|'SHORT'|'COVER'} type - Trade type
     * @param {string} stockId - Stock ID
     * @param {number} quantity - Quantity
     * @param {Object} options - Additional options
     */
    const recordTrade = useCallback((type, stockId, quantity, options = {}) => {
        const action = {
            tick: tickRef.current,
            type,
            stockId,
            quantity,
            orderType: options.orderType || 'market',
            timestamp: Date.now()
        }

        if (options.limitPrice !== undefined) {
            action.limitPrice = options.limitPrice
        }

        setTradeLogs(prev => [...prev, action])

        return action
    }, [])

    /**
     * Advance the game tick
     * Should be called each game loop iteration
     */
    const advanceTick = useCallback(() => {
        tickRef.current += 1
        return tickRef.current
    }, [])

    /**
     * Get current tick
     */
    const getCurrentTick = useCallback(() => tickRef.current, [])

    /**
     * Set tick directly (for loading saved games)
     */
    const setTick = useCallback((tick) => {
        tickRef.current = tick
    }, [])

    /**
     * Reset the trade log (for new game)
     */
    const reset = useCallback(() => {
        setTradeLogs([])
        tickRef.current = 0
        startedAtRef.current = Date.now()
    }, [])

    /**
     * Build client payload for submission
     * @param {Object} [overrides]
     * @param {string} [overrides.seasonId]
     * @returns {Object} Client payload
     */
    const buildPayload = useCallback((overrides = {}) => {
        const effectiveSeasonId = overrides.seasonId ?? seasonId
        if (!effectiveSeasonId) {
            return null
        }

        const meta = {
            seasonId: effectiveSeasonId,
            engineVersion: ENGINE_VERSION,
            clientVersion: CLIENT_VERSION,
            startedAt: startedAtRef.current,
            endedAt: Date.now(),
            initialCapital,
            totalTicks: tickRef.current
        }

        const checksum = calculateChecksum(meta, tradeLogs)

        return {
            meta,
            tradeLogs,
            checksum
        }
    }, [seasonId, initialCapital, tradeLogs])

    /**
     * Get trade statistics
     */
    const getStats = useCallback(() => {
        const buys = tradeLogs.filter(t => t.type === 'BUY').length
        const sells = tradeLogs.filter(t => t.type === 'SELL').length
        const shorts = tradeLogs.filter(t => t.type === 'SHORT').length
        const covers = tradeLogs.filter(t => t.type === 'COVER').length

        return {
            totalTrades: tradeLogs.length,
            buys,
            sells,
            shorts,
            covers,
            currentTick: tickRef.current
        }
    }, [tradeLogs])

    /**
     * Export trade log for debugging
     */
    const exportLog = useCallback(() => {
        return {
            meta: {
                seasonId,
                engineVersion: ENGINE_VERSION,
                clientVersion: CLIENT_VERSION,
                exportedAt: Date.now()
            },
            tradeLogs,
            stats: getStats()
        }
    }, [seasonId, tradeLogs, getStats])

    /**
     * Import trade log (for replay testing)
     */
    const importLog = useCallback((data) => {
        if (data.tradeLogs && Array.isArray(data.tradeLogs)) {
            setTradeLogs(data.tradeLogs)
            if (data.tradeLogs.length > 0) {
                tickRef.current = data.tradeLogs[data.tradeLogs.length - 1].tick
            }
        }
    }, [])

    return {
        // State
        seasonId,
        tradeLogs,
        currentTick: tickRef.current,

        // Actions
        setSeasonId,
        recordTrade,
        advanceTick,
        getCurrentTick,
        setTick,
        reset,

        // Payload
        buildPayload,
        // Backward compatibility for in-flight branches
        getPayload: buildPayload,
        calculateChecksum: () => calculateChecksum(
            { seasonId, engineVersion: ENGINE_VERSION, totalTicks: tickRef.current },
            tradeLogs
        ),

        // Utilities
        getStats,
        exportLog,
        importLog
    }
}

export default useTradeLog
