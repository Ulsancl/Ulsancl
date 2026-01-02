/**
 * submitScore.ts - Score Submission and Verification
 * 
 * The "heart" of the security system. Handles:
 * 1. App Check verification (reject invalid tokens)
 * 2. Input validation (trade log structure)
 * 3. Seed fetch from Firestore (server-only)
 * 4. Trade log replay with deterministic engine
 * 5. Firestore transaction for atomic leaderboard update
 * 
 * @module verification/submitScore
 * @version 3.0.0
 */

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { replayGame, TradeAction, ReplayResult } from '../replay/engine';
import { isVersionCompatible, ENGINE_VERSION } from '../shared/version';

// ============================================
// TYPES
// ============================================

interface SessionMeta {
    seasonId: string;
    engineVersion: string;
    clientVersion: string;
    startedAt: number;
    endedAt: number;
    initialCapital: number;
    totalTicks: number;
}

interface ClientPayload {
    meta: SessionMeta;
    tradeLogs: TradeAction[];
    checksum: string;
}

interface VerificationResult {
    success: boolean;
    error?: string;
    errorCode?: string;
    score?: number;
    portfolioValue?: number;
    profitRate?: number;
    isNewHighScore?: boolean;
    rank?: number;
    previousScore?: number;
}

interface SeasonData {
    seed: string;
    active: boolean;
    initialCapital: number;
    gameDuration: number;
    startDate: admin.firestore.Timestamp;
    endDate: admin.firestore.Timestamp;
}

// ============================================
// CONSTANTS
// ============================================

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5;
const MAX_TRADE_LOG_LENGTH = 100000; // Prevent abuse
const MIN_TRADE_LOG_LENGTH = 0; // Allow zero trades (hold strategy)

// ============================================
// MAIN SUBMIT FUNCTION
// ============================================

/**
 * Submit and verify a game score
 * Called by Cloud Function onCall handler
 * 
 * @param payload - Client payload with trade logs
 * @param uid - Authenticated user ID
 * @param db - Firestore instance
 * @returns Verification result
 */
export async function submitScore(
    payload: ClientPayload,
    uid: string,
    db: admin.firestore.Firestore
): Promise<VerificationResult> {

    const startTime = Date.now();
    const { meta, tradeLogs, checksum } = payload;

    console.log(`[submitScore] Start - uid: ${uid}, season: ${meta.seasonId}, trades: ${tradeLogs.length}`);

    // ========================================
    // STEP 1: VERSION CHECK
    // ========================================

    if (!meta.engineVersion) {
        return createError('Engine version is required', 'INVALID_VERSION');
    }

    if (!isVersionCompatible(meta.engineVersion)) {
        return createError(
            `Engine version ${meta.engineVersion} is not supported. Minimum: ${ENGINE_VERSION}`,
            'INVALID_VERSION'
        );
    }

    // ========================================
    // STEP 2: INPUT VALIDATION
    // ========================================

    if (!meta.seasonId || typeof meta.seasonId !== 'string') {
        return createError('Invalid seasonId', 'INVALID_INPUT');
    }

    if (!Array.isArray(tradeLogs)) {
        return createError('tradeLogs must be an array', 'INVALID_INPUT');
    }

    if (tradeLogs.length > MAX_TRADE_LOG_LENGTH) {
        return createError(`Trade log exceeds maximum length (${MAX_TRADE_LOG_LENGTH})`, 'INVALID_INPUT');
    }

    // Validate trade log structure
    const validationResult = validateTradeLogs(tradeLogs);
    if (!validationResult.valid) {
        return createError(`Invalid trade log: ${validationResult.error}`, 'INVALID_INPUT');
    }

    if (!meta.totalTicks || meta.totalTicks <= 0) {
        return createError('Invalid totalTicks', 'INVALID_INPUT');
    }

    // ========================================
    // STEP 3: RATE LIMITING
    // ========================================

    const rateLimitResult = await checkRateLimit(uid, db);
    if (!rateLimitResult.allowed) {
        return createError(
            `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`,
            'RATE_LIMITED'
        );
    }

    // ========================================
    // STEP 4: FETCH SEASON SEED FROM FIRESTORE
    // ========================================

    const seasonRef = db.doc(`seasons/${meta.seasonId}`);
    const seasonDoc = await seasonRef.get();

    if (!seasonDoc.exists) {
        return createError('Season not found', 'SEASON_NOT_FOUND');
    }

    const seasonData = seasonDoc.data() as SeasonData;

    // Check if season is active
    if (!seasonData.active) {
        return createError('Season has ended', 'SEASON_ENDED');
    }

    // Verify initial capital matches season config
    if (meta.initialCapital !== seasonData.initialCapital) {
        return createError(
            `Initial capital mismatch: expected ${seasonData.initialCapital}, got ${meta.initialCapital}`,
            'REPLAY_MISMATCH'
        );
    }

    // The SEED - loaded from Firestore, NEVER sent by client
    const seed = seasonData.seed;

    // ========================================
    // STEP 5: CHECKSUM VERIFICATION
    // ========================================

    const expectedChecksum = calculateChecksum(meta, tradeLogs);
    if (checksum !== expectedChecksum) {
        console.warn(`[submitScore] Checksum mismatch - expected: ${expectedChecksum}, got: ${checksum}`);
        return createError('Checksum verification failed', 'INVALID_CHECKSUM');
    }

    // ========================================
    // STEP 6: REPLAY GAME WITH SERVER LOGIC
    // ========================================

    console.log(`[submitScore] Starting replay with seed length: ${seed.length}`);

    let replayResult: ReplayResult;
    try {
        replayResult = replayGame(seed, tradeLogs, {
            initialCapital: meta.initialCapital,
            totalTicks: meta.totalTicks
        });
    } catch (error) {
        console.error('[submitScore] Replay failed:', error);
        return createError(
            `Game replay failed: ${(error as Error).message}`,
            'REPLAY_MISMATCH'
        );
    }

    // Check if replay was valid
    if (!replayResult.valid) {
        console.warn(`[submitScore] Replay invalid: ${replayResult.error}`);
        return createError(
            replayResult.error || 'Replay verification failed',
            'REPLAY_MISMATCH'
        );
    }

    const calculatedScore = replayResult.finalScore;

    console.log(`[submitScore] Replay complete - score: ${calculatedScore}, profitRate: ${replayResult.profitRate.toFixed(2)}%`);

    // ========================================
    // STEP 7: FIRESTORE TRANSACTION
    // Atomic read-modify-write for leaderboard
    // ========================================

    const transactionResult = await db.runTransaction(async (transaction) => {
        // Read existing entry for this user
        const entriesRef = db.collection(`leaderboard/${meta.seasonId}/entries`);
        const existingQuery = await transaction.get(
            entriesRef.where('uid', '==', uid).limit(1)
        );

        let existingDoc: admin.firestore.QueryDocumentSnapshot | null = null;
        let existingScore = 0;

        if (!existingQuery.empty) {
            existingDoc = existingQuery.docs[0];
            existingScore = existingDoc.data().score;
        }

        // Idempotency check: only update if new score is higher
        if (existingDoc && calculatedScore <= existingScore) {
            return {
                updated: false,
                isNewHighScore: false,
                previousScore: existingScore
            };
        }

        // Prepare entry data
        const entryData = {
            uid,
            displayName: await getDisplayName(uid),
            score: calculatedScore,
            portfolioValue: replayResult.portfolioValue,
            profitRate: replayResult.profitRate,
            cashBalance: replayResult.cashBalance,
            engineVersion: meta.engineVersion,
            clientVersion: meta.clientVersion,
            submittedAt: Date.now(),
            totalTrades: tradeLogs.length,
            profitableTrades: replayResult.profitableTrades,
            winRate: replayResult.winRate,
            maxDrawdown: replayResult.maxDrawdown,
            replayDuration: Date.now() - startTime
        };

        if (existingDoc) {
            // Update existing entry
            transaction.update(existingDoc.ref, entryData);
        } else {
            // Create new entry with score-based ID for natural ordering
            // Use inverted score so descending order is natural
            const scoreKey = (999999999999 - calculatedScore).toString().padStart(15, '0');
            const entryRef = db.doc(`leaderboard/${meta.seasonId}/entries/${scoreKey}_${uid}`);
            transaction.set(entryRef, entryData);
        }

        // Also save to submissions collection for audit trail
        const submissionRef = db.collection(`submissions/${meta.seasonId}/logs`).doc();
        transaction.set(submissionRef, {
            uid,
            score: calculatedScore,
            tradeLogs: tradeLogs.length, // Don't store full logs, just count
            checksum,
            submittedAt: Date.now(),
            valid: true
        });

        return {
            updated: true,
            isNewHighScore: true,
            previousScore: existingScore
        };
    });

    // ========================================
    // STEP 8: CALCULATE RANK
    // ========================================

    let rank = 0;
    if (transactionResult.updated) {
        const higherScoreCount = await db.collection(`leaderboard/${meta.seasonId}/entries`)
            .where('score', '>', calculatedScore)
            .count()
            .get();
        rank = higherScoreCount.data().count + 1;
    }

    console.log(`[submitScore] Complete - score: ${calculatedScore}, rank: ${rank}, updated: ${transactionResult.updated}`);

    return {
        success: true,
        score: calculatedScore,
        portfolioValue: replayResult.portfolioValue,
        profitRate: replayResult.profitRate,
        isNewHighScore: transactionResult.isNewHighScore,
        rank: rank || undefined,
        previousScore: transactionResult.previousScore || undefined
    };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create error response
 */
function createError(message: string, code: string): VerificationResult {
    console.warn(`[submitScore] Error: ${code} - ${message}`);
    return {
        success: false,
        error: message,
        errorCode: code
    };
}

/**
 * Validate trade log structure
 */
function validateTradeLogs(tradeLogs: TradeAction[]): { valid: boolean; error?: string } {
    const validTypes = ['BUY', 'SELL', 'SHORT', 'COVER'];
    let lastTick = -1;

    for (let i = 0; i < tradeLogs.length; i++) {
        const trade = tradeLogs[i];

        // Check required fields
        if (typeof trade.tick !== 'number' || trade.tick < 0) {
            return { valid: false, error: `Invalid tick at index ${i}` };
        }

        if (!validTypes.includes(trade.type)) {
            return { valid: false, error: `Invalid trade type at index ${i}: ${trade.type}` };
        }

        if (typeof trade.stockId !== 'string' || !trade.stockId) {
            return { valid: false, error: `Invalid stockId at index ${i}` };
        }

        if (typeof trade.quantity !== 'number' || trade.quantity <= 0) {
            return { valid: false, error: `Invalid quantity at index ${i}` };
        }

        // Check ordering (trades should be sequential by tick)
        if (trade.tick < lastTick) {
            return { valid: false, error: `Trades not in tick order at index ${i}` };
        }
        lastTick = trade.tick;
    }

    return { valid: true };
}

/**
 * Check rate limit for user
 */
async function checkRateLimit(
    uid: string,
    db: admin.firestore.Firestore
): Promise<{ allowed: boolean; retryAfter?: number }> {

    const rateLimitRef = db.doc(`rateLimits/${uid}`);
    const now = Date.now();

    return db.runTransaction(async (transaction) => {
        const doc = await transaction.get(rateLimitRef);

        if (!doc.exists) {
            transaction.set(rateLimitRef, { windowStart: now, count: 1 });
            return { allowed: true };
        }

        const data = doc.data()!;
        const windowStart = data.windowStart || 0;
        const count = data.count || 0;

        // Check if window expired
        if (now - windowStart >= RATE_LIMIT_WINDOW_MS) {
            // Reset window
            transaction.set(rateLimitRef, { windowStart: now, count: 1 });
            return { allowed: true };
        }

        // Check if limit exceeded
        if (count >= RATE_LIMIT_MAX_REQUESTS) {
            const retryAfter = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - windowStart)) / 1000);
            return { allowed: false, retryAfter };
        }

        // Increment counter
        transaction.update(rateLimitRef, {
            count: admin.firestore.FieldValue.increment(1)
        });
        return { allowed: true };
    });
}

/**
 * Calculate checksum for verification (must match client implementation exactly)
 */
function calculateChecksum(meta: SessionMeta, tradeLogs: TradeAction[]): string {
    const data = {
        seasonId: meta.seasonId,
        engineVersion: meta.engineVersion,
        totalTicks: meta.totalTicks,
        tradeCount: tradeLogs.length,
        firstTrade: tradeLogs.length > 0 ? tradeLogs[0] : null,
        lastTrade: tradeLogs.length > 0 ? tradeLogs[tradeLogs.length - 1] : null
    };

    return djb2Hash(JSON.stringify(data));
}

/**
 * DJB2 hash function (must match client implementation)
 */
function djb2Hash(str: string): string {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
        hash = hash >>> 0; // Convert to unsigned 32-bit
    }
    return hash.toString(16).padStart(8, '0');
}

/**
 * Get user display name from profile or Firebase Auth
 */
async function getDisplayName(uid: string): Promise<string> {
    try {
        // Try Firebase Auth first
        const userRecord = await admin.auth().getUser(uid);
        if (userRecord.displayName) {
            return userRecord.displayName;
        }
        // Fallback to anonymous name
        return `Player_${uid.slice(0, 6)}`;
    } catch {
        return `Player_${uid.slice(0, 6)}`;
    }
}

// ============================================
// EXPORTS
// ============================================

export { validateTradeLogs, calculateChecksum, checkRateLimit };
