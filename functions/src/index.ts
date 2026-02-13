/**
 * Cloud Functions Entry Point
 * 
 * Exports all Firebase Cloud Functions for the Ulsancl Stock Game v3.
 * Server-side verification for secure global ranking.
 * 
 * @module functions
 * @version 3.0.0
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { randomBytes } from 'crypto';

// Initialize Firebase Admin
admin.initializeApp();

// Database reference
const db = admin.firestore();

// Import verification and utility functions
import { submitScore } from './verification/submitScore';
import { updateLeaderboardSnapshot, updateAllActiveSnapshots } from './scheduled/updateSnapshot';

// ============================================
// CALLABLE FUNCTIONS
// ============================================

/**
 * Submit a game score for verification
 * 
 * Flow:
 * 1. Verify App Check token (reject if missing)
 * 2. Validate trade log structure
 * 3. Fetch seed from Firestore server-only secret document (never sent by client)
 * 4. Replay game with deterministic engine
 * 5. Update leaderboard if new high score
 * 
 * @requires App Check token
 * @requires Firebase Authentication
 * @param data - ClientPayload with trade logs and metadata
 * @returns VerificationResult with score and rank
 */
export const submitGameScore = functions
    .runWith({
        enforceAppCheck: true, // CRITICAL: Reject requests without valid App Check token
        memory: '512MB',
        timeoutSeconds: 120 // Allow up to 2 minutes for large trade logs
    })
    .https.onCall(async (data, context) => {

        // ========================================
        // SECURITY CHECK 1: App Check
        // ========================================
        if (!context.app) {
            console.warn('[submitGameScore] Rejected - No App Check token');
            throw new functions.https.HttpsError(
                'failed-precondition',
                'The function must be called from an App Check verified app.'
            );
        }

        // ========================================
        // SECURITY CHECK 2: Authentication
        // ========================================
        if (!context.auth) {
            console.warn('[submitGameScore] Rejected - Not authenticated');
            throw new functions.https.HttpsError(
                'unauthenticated',
                'User must be authenticated to submit scores.'
            );
        }

        const uid = context.auth.uid;

        // ========================================
        // VERIFY AND SUBMIT
        // ========================================
        try {
            const result = await submitScore(data, uid, db);

            if (!result.success) {
                // Return error as data, not as exception (for client handling)
                return result;
            }

            return result;

        } catch (error) {
            console.error('[submitGameScore] Unexpected error:', error);
            throw new functions.https.HttpsError(
                'internal',
                'An unexpected error occurred during score verification.'
            );
        }
    });

// ============================================
// SCHEDULED FUNCTIONS
// ============================================

/**
 * Update leaderboard snapshots every 10 minutes
 * 
 * Creates cached top50 documents for efficient client reads.
 * Reduces Firestore costs by 50x (1 read vs 50 reads).
 */
export const scheduledSnapshotUpdate = functions
    .runWith({ memory: '256MB', timeoutSeconds: 60 })
    .pubsub.schedule('every 10 minutes')
    .onRun(async () => {
        const result = await updateAllActiveSnapshots(db);
        console.log(`[scheduledSnapshotUpdate] Complete - ${result.updated} updated, ${result.failed} failed`);
    });

// ============================================
// FIRESTORE TRIGGERS
// ============================================

/**
 * On new leaderboard entry, trigger snapshot update
 * 
 * Debounced: only updates if last update was > 60 seconds ago
 * This provides near-real-time updates without excessive writes
 */
export const onLeaderboardEntryCreate = functions.firestore
    .document('leaderboard/{seasonId}/entries/{entryId}')
    .onCreate(async (snap, context) => {
        const { seasonId } = context.params;

        // Debounce: check if snapshot was updated recently
        const snapshotRef = db.doc(`leaderboard/${seasonId}/snapshot/top50`);
        const snapshotDoc = await snapshotRef.get();

        if (snapshotDoc.exists) {
            const lastUpdate = snapshotDoc.data()?.updatedAt || 0;
            const timeSinceUpdate = Date.now() - lastUpdate;

            // Only update if last update was > 60 seconds ago
            if (timeSinceUpdate < 60000) {
                console.log(`[onLeaderboardEntryCreate] Skipping - last update ${timeSinceUpdate}ms ago`);
                return;
            }
        }

        console.log(`[onLeaderboardEntryCreate] Updating snapshot for ${seasonId}`);
        await updateLeaderboardSnapshot(seasonId, db);
    });

/**
 * On leaderboard entry update (new high score), trigger snapshot update
 */
export const onLeaderboardEntryUpdate = functions.firestore
    .document('leaderboard/{seasonId}/entries/{entryId}')
    .onUpdate(async (change, context) => {
        const { seasonId } = context.params;
        const beforeScore = change.before.data().score;
        const afterScore = change.after.data().score;

        // Only update if score changed
        if (beforeScore === afterScore) {
            return;
        }

        // Debounce check
        const snapshotRef = db.doc(`leaderboard/${seasonId}/snapshot/top50`);
        const snapshotDoc = await snapshotRef.get();

        if (snapshotDoc.exists) {
            const lastUpdate = snapshotDoc.data()?.updatedAt || 0;
            if (Date.now() - lastUpdate < 60000) {
                console.log(`[onLeaderboardEntryUpdate] Skipping - recent update`);
                return;
            }
        }

        console.log(`[onLeaderboardEntryUpdate] Score changed, updating snapshot for ${seasonId}`);
        await updateLeaderboardSnapshot(seasonId, db);
    });

// ============================================
// ADMIN FUNCTIONS (HTTP endpoints)
// ============================================

/**
 * Create a new season (Admin only)
 * 
 * Requires admin authorization via service account or custom token.
 * Generates secure random seed that is never exposed to clients.
 */
export const createSeason = functions.https.onRequest(async (req, res) => {
    // CORS handling
    res.set('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.status(204).send('');
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    // Verify admin authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized - Bearer token required' });
        return;
    }

    const token = authHeader.split('Bearer ')[1];

    try {
        // Verify the token is from an admin
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Check for admin claim (you should set this in Firebase Auth)
        if (!decodedToken.admin) {
            res.status(403).json({ error: 'Forbidden - Admin access required' });
            return;
        }

        const { name, startDate, endDate, initialCapital, gameDuration } = req.body;

        if (!name || !startDate || !endDate) {
            res.status(400).json({ error: 'Missing required fields: name, startDate, endDate' });
            return;
        }

        // Generate cryptographically secure random seed.
        const seed = randomBytes(32).toString('hex');

        const seasonRef = db.collection('seasons').doc();
        const seasonSecretRef = db.doc(`seasonSecrets/${seasonRef.id}`);
        const leaderboardSnapshotRef = db.doc(`leaderboard/${seasonRef.id}/snapshot/top50`);

        const batch = db.batch();

        // Client-readable season metadata (seed excluded).
        batch.set(seasonRef, {
            name,
            startDate: admin.firestore.Timestamp.fromDate(new Date(startDate)),
            endDate: admin.firestore.Timestamp.fromDate(new Date(endDate)),
            initialCapital: initialCapital || 100000000,
            gameDuration: gameDuration || 36000,
            active: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: decodedToken.uid
        });

        // Server-only season seed.
        batch.set(seasonSecretRef, {
            seasonId: seasonRef.id,
            seed,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: decodedToken.uid
        });

        // Empty leaderboard snapshot.
        batch.set(leaderboardSnapshotRef, {
            entries: [],
            updatedAt: Date.now(),
            seasonId: seasonRef.id,
            totalParticipants: 0,
            topScore: null,
            averageScore: null
        });

        await batch.commit();

        console.log(`[createSeason] Created season: ${seasonRef.id} by admin: ${decodedToken.uid}`);

        res.json({
            success: true,
            seasonId: seasonRef.id,
            message: `Season "${name}" created successfully`
        });

    } catch (error) {
        console.error('[createSeason] Error:', error);
        res.status(500).json({ error: 'Failed to create season' });
    }
});

/**
 * End a season (Admin only)
 * 
 * Sets active to false and finalizes the leaderboard.
 */
export const endSeason = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.status(204).send('');
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    try {
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);

        if (!decodedToken.admin) {
            res.status(403).json({ error: 'Admin access required' });
            return;
        }

        const { seasonId } = req.body;

        if (!seasonId) {
            res.status(400).json({ error: 'Missing seasonId' });
            return;
        }

        // Update season to inactive
        await db.doc(`seasons/${seasonId}`).update({
            active: false,
            endedAt: admin.firestore.FieldValue.serverTimestamp(),
            endedBy: decodedToken.uid
        });

        // Final snapshot update
        await updateLeaderboardSnapshot(seasonId, db);

        console.log(`[endSeason] Ended season: ${seasonId} by admin: ${decodedToken.uid}`);

        res.json({
            success: true,
            message: `Season ${seasonId} ended successfully`
        });

    } catch (error) {
        console.error('[endSeason] Error:', error);
        res.status(500).json({ error: 'Failed to end season' });
    }
});
