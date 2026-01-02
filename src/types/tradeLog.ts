/**
 * tradeLog.ts - Trade Log and Payload Interfaces
 * 
 * Defines strict schemas for recording and replaying game sessions.
 * Used by both client and server for verification.
 * 
 * @module types/tradeLog
 * @version 3.0.0
 */

/**
 * Trade action types
 */
export type TradeActionType = 'BUY' | 'SELL' | 'SHORT' | 'COVER';

/**
 * Single trade action recorded during gameplay
 * 
 * Note: Price is NOT recorded - server calculates from replay
 */
export interface TradeAction {
    /** Game tick when action occurred (deterministic counter) */
    tick: number;

    /** Type of trade action */
    type: TradeActionType;

    /** Stock/asset identifier */
    stockId: string;

    /** Quantity traded */
    quantity: number;

    /** Order type (market, limit) - for validation */
    orderType?: 'market' | 'limit';

    /** Limit price if applicable (for limit orders) */
    limitPrice?: number;

    /** Timestamp for debugging (not used in replay) */
    timestamp?: number;
}

/**
 * Order action types (for pending orders)
 */
export type OrderActionType = 'PLACE' | 'CANCEL' | 'MODIFY';

/**
 * Pending order action
 */
export interface OrderAction {
    /** Game tick when order action occurred */
    tick: number;

    /** Type of order action */
    action: OrderActionType;

    /** Order ID */
    orderId: string;

    /** Order details (for PLACE/MODIFY) */
    orderType?: 'limit' | 'stop' | 'trailing';
    stockId?: string;
    side?: 'buy' | 'sell';
    quantity?: number;
    price?: number;
}

/**
 * Game session metadata
 */
export interface SessionMeta {
    /** Season identifier (determines seed) */
    seasonId: string;

    /** Engine version used */
    engineVersion: string;

    /** Client app version */
    clientVersion: string;

    /** Session start timestamp */
    startedAt: number;

    /** Session end timestamp */
    endedAt: number;

    /** Initial capital (for verification) */
    initialCapital: number;

    /** Total game ticks played */
    totalTicks: number;
}

/**
 * Client payload for score submission
 * 
 * IMPORTANT: Does NOT include seed or score
 * - Seed is loaded from Firestore by server
 * - Score is calculated by server via replay
 */
export interface ClientPayload {
    /** Session metadata */
    meta: SessionMeta;

    /** Complete trade log */
    tradeLogs: TradeAction[];

    /** Order actions (optional, for full replay) */
    orderActions?: OrderAction[];

    /** Client-computed checksum for integrity */
    checksum: string;
}

/**
 * Server verification result
 */
export interface VerificationResult {
    /** Whether verification succeeded */
    success: boolean;

    /** Error message if failed */
    error?: string;

    /** Error code for programmatic handling */
    errorCode?: 'INVALID_VERSION' | 'INVALID_CHECKSUM' | 'REPLAY_MISMATCH' |
    'SEASON_NOT_FOUND' | 'RATE_LIMITED' | 'DUPLICATE_SUBMISSION';

    /** Server-calculated final score */
    score?: number;

    /** Server-calculated final portfolio value */
    portfolioValue?: number;

    /** Whether this is a new high score */
    isNewHighScore?: boolean;

    /** Current rank after submission */
    rank?: number;
}

/**
 * Leaderboard entry stored in Firestore
 */
export interface LeaderboardEntry {
    /** User ID */
    uid: string;

    /** Display name */
    displayName: string;

    /** Final score */
    score: number;

    /** Engine version used */
    engineVersion: string;

    /** Submission timestamp */
    submittedAt: number;

    /** Total trades made */
    totalTrades: number;

    /** Win rate percentage */
    winRate: number;
}

/**
 * Top 50 snapshot (single document for efficient reads)
 */
export interface LeaderboardSnapshot {
    /** Ordered list of top entries */
    entries: LeaderboardEntry[];

    /** Last update timestamp */
    updatedAt: number;

    /** Season ID */
    seasonId: string;

    /** Total participants */
    totalParticipants: number;
}

/**
 * Season configuration stored in Firestore
 */
export interface SeasonConfig {
    /** Season ID */
    id: string;

    /** Season name for display */
    name: string;

    /** RNG seed (server-only, never sent to client) */
    seed: string;

    /** Season start date */
    startDate: number;

    /** Season end date */
    endDate: number;

    /** Whether season is currently active */
    active: boolean;

    /** Initial capital for this season */
    initialCapital: number;

    /** Game duration in ticks */
    gameDuration: number;
}

// Type guards for runtime validation

export function isTradeAction(obj: unknown): obj is TradeAction {
    if (typeof obj !== 'object' || obj === null) return false;
    const action = obj as TradeAction;
    return (
        typeof action.tick === 'number' &&
        typeof action.type === 'string' &&
        ['BUY', 'SELL', 'SHORT', 'COVER'].includes(action.type) &&
        typeof action.stockId === 'string' &&
        typeof action.quantity === 'number'
    );
}

export function isClientPayload(obj: unknown): obj is ClientPayload {
    if (typeof obj !== 'object' || obj === null) return false;
    const payload = obj as ClientPayload;
    return (
        typeof payload.meta === 'object' &&
        typeof payload.meta.seasonId === 'string' &&
        typeof payload.meta.engineVersion === 'string' &&
        Array.isArray(payload.tradeLogs) &&
        typeof payload.checksum === 'string'
    );
}

export function validateTradeLog(log: TradeAction[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(log)) {
        return { valid: false, errors: ['Trade log must be an array'] };
    }

    let lastTick = -1;
    for (let i = 0; i < log.length; i++) {
        const action = log[i];

        if (!isTradeAction(action)) {
            errors.push(`Invalid trade action at index ${i}`);
            continue;
        }

        if (action.tick < lastTick) {
            errors.push(`Trade actions must be ordered by tick (index ${i})`);
        }
        lastTick = action.tick;

        if (action.quantity <= 0) {
            errors.push(`Quantity must be positive (index ${i})`);
        }
    }

    return { valid: errors.length === 0, errors };
}
