/**
 * updateSnapshot.ts - Leaderboard Snapshot Update
 * 
 * Updates the cached top50 snapshot document for efficient client reads.
 * Reads top 50 entries and writes them as a single document.
 * 
 * Benefits:
 * - Client reads 1 document instead of 50
 * - Reduces Firestore read costs significantly
 * - Improves client performance
 * 
 * @module scheduled/updateSnapshot
 * @version 3.0.0
 */

import * as admin from 'firebase-admin';

// ============================================
// TYPES
// ============================================

interface LeaderboardEntry {
    rank: number;
    uid: string;
    displayName: string;
    score: number;
    portfolioValue: number;
    profitRate: number;
    engineVersion: string;
    submittedAt: number;
    totalTrades: number;
    winRate: number;
    maxDrawdown?: number;
}

interface LeaderboardSnapshot {
    entries: LeaderboardEntry[];
    updatedAt: number;
    seasonId: string;
    totalParticipants: number;
    topScore: number | null;
    averageScore: number | null;
}

// ============================================
// MAIN UPDATE FUNCTION
// ============================================

/**
 * Update the leaderboard snapshot for a specific season
 * 
 * @param seasonId - Season identifier
 * @param db - Firestore instance
 */
export async function updateLeaderboardSnapshot(
    seasonId: string,
    db: admin.firestore.Firestore
): Promise<{ success: boolean; entriesCount: number }> {

    const startTime = Date.now();
    console.log(`[updateSnapshot] Starting for season: ${seasonId}`);

    try {
        // Get top 50 entries ordered by score descending
        const entriesRef = db.collection(`leaderboard/${seasonId}/entries`);
        const topEntriesSnapshot = await entriesRef
            .orderBy('score', 'desc')
            .limit(50)
            .get();

        // Get total participant count
        const totalCountSnapshot = await entriesRef.count().get();
        const totalParticipants = totalCountSnapshot.data().count;

        // Map to entry format with ranks
        const entries: LeaderboardEntry[] = topEntriesSnapshot.docs.map((doc, index) => {
            const data = doc.data();
            return {
                rank: index + 1,
                uid: data.uid,
                displayName: data.displayName || `Player_${data.uid?.slice(0, 6)}`,
                score: data.score,
                portfolioValue: data.portfolioValue,
                profitRate: data.profitRate,
                engineVersion: data.engineVersion,
                submittedAt: data.submittedAt,
                totalTrades: data.totalTrades,
                winRate: data.winRate,
                maxDrawdown: data.maxDrawdown
            };
        });

        // Calculate statistics
        let topScore: number | null = null;
        let totalScore = 0;

        if (entries.length > 0) {
            topScore = entries[0].score;
            totalScore = entries.reduce((sum, e) => sum + e.score, 0);
        }

        const averageScore = entries.length > 0 ? totalScore / entries.length : null;

        // Build snapshot document
        const snapshot: LeaderboardSnapshot = {
            entries,
            updatedAt: Date.now(),
            seasonId,
            totalParticipants,
            topScore,
            averageScore
        };

        // Write to snapshot document (single document read for clients)
        await db.doc(`leaderboard/${seasonId}/snapshot/top50`).set(snapshot);

        const duration = Date.now() - startTime;
        console.log(`[updateSnapshot] Complete - season: ${seasonId}, entries: ${entries.length}, total: ${totalParticipants}, duration: ${duration}ms`);

        return {
            success: true,
            entriesCount: entries.length
        };

    } catch (error) {
        console.error(`[updateSnapshot] Failed for season ${seasonId}:`, error);
        return {
            success: false,
            entriesCount: 0
        };
    }
}

/**
 * Update snapshots for all active seasons
 * Called by scheduled function
 */
export async function updateAllActiveSnapshots(
    db: admin.firestore.Firestore
): Promise<{ updated: number; failed: number }> {

    console.log('[updateAllActiveSnapshots] Starting...');

    // Get all active seasons
    const seasonsSnapshot = await db.collection('seasons')
        .where('active', '==', true)
        .get();

    if (seasonsSnapshot.empty) {
        console.log('[updateAllActiveSnapshots] No active seasons found');
        return { updated: 0, failed: 0 };
    }

    // Update each season in parallel
    const results = await Promise.allSettled(
        seasonsSnapshot.docs.map(doc => updateLeaderboardSnapshot(doc.id, db))
    );

    let updated = 0;
    let failed = 0;

    results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
            updated++;
        } else {
            failed++;
            console.error(`[updateAllActiveSnapshots] Failed for season at index ${index}`);
        }
    });

    console.log(`[updateAllActiveSnapshots] Complete - updated: ${updated}, failed: ${failed}`);

    return { updated, failed };
}

// ============================================
// EXPORTS
// ============================================

export default updateLeaderboardSnapshot;
