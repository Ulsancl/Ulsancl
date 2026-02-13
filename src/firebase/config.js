/**
 * Firebase client configuration.
 * All runtime values come from Vite environment variables (`VITE_*`).
 */

import { getApp, getApps, initializeApp } from 'firebase/app'
import {
    collection,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    limit,
    orderBy,
    query,
    where
} from 'firebase/firestore'
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'

const env = import.meta.env

const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
}

const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId']
const isFirebaseConfigured = requiredKeys.every((key) => Boolean(firebaseConfig[key]))
const isDevHost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

if (!isFirebaseConfigured) {
    console.warn(
        '[Firebase] Missing configuration. Set VITE_FIREBASE_* variables for live season submit/leaderboard.'
    )
}

const fallbackConfig = {
    apiKey: firebaseConfig.apiKey || 'dev-api-key',
    authDomain: firebaseConfig.authDomain || 'localhost',
    projectId: firebaseConfig.projectId || 'demo-stock-game',
    storageBucket: firebaseConfig.storageBucket || 'demo-stock-game.appspot.com',
    messagingSenderId: firebaseConfig.messagingSenderId || '000000000000',
    appId: firebaseConfig.appId || '1:000000000000:web:demo'
}

const app = getApps().length > 0 ? getApp() : initializeApp(fallbackConfig)

let appCheckInitialized = false

function initializeClientAppCheck() {
    if (appCheckInitialized || typeof window === 'undefined') return

    const debugToken = env.VITE_APPCHECK_DEBUG_TOKEN
    const recaptchaSiteKey = env.VITE_RECAPTCHA_SITE_KEY

    if ((env.DEV || isDevHost) && debugToken) {
        window.FIREBASE_APPCHECK_DEBUG_TOKEN =
            debugToken === 'true' ? true : debugToken
    }

    if (!recaptchaSiteKey) {
        console.warn(
            '[Firebase] VITE_RECAPTCHA_SITE_KEY is not set. App Check is disabled for this build.'
        )
        return
    }

    try {
        initializeAppCheck(app, {
            provider: new ReCaptchaV3Provider(recaptchaSiteKey),
            isTokenAutoRefreshEnabled: true
        })
        appCheckInitialized = true
    } catch (error) {
        reportClientError('app_check_init_failed', error)
    }
}

initializeClientAppCheck()

const functionsRegion = env.VITE_FIREBASE_FUNCTIONS_REGION

export const db = getFirestore(app)
export const auth = getAuth(app)
export const functions = functionsRegion
    ? getFunctions(app, functionsRegion)
    : getFunctions(app)

export function reportClientError(event, error, context = {}) {
    const message =
        error instanceof Error ? error.message : typeof error === 'string' ? error : 'unknown_error'
    const code =
        typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined

    console.error('[ClientError]', {
        event,
        code,
        message,
        context,
        timestamp: Date.now()
    })
}

/**
 * Returns current Firebase user, signing in anonymously when needed.
 */
export async function ensureAuth() {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe()

            if (user) {
                resolve(user)
                return
            }

            try {
                const credential = await signInAnonymously(auth)
                resolve(credential.user)
            } catch (error) {
                reportClientError('auth_anonymous_signin_failed', error)
                reject(error)
            }
        })
    })
}

export function getCurrentUserId() {
    return auth.currentUser?.uid || null
}

export const submitGameScore = httpsCallable(functions, 'submitGameScore')

export async function getCurrentSeason() {
    try {
        const q = query(
            collection(db, 'seasons'),
            where('active', '==', true),
            orderBy('startDate', 'desc'),
            limit(1)
        )
        const snapshot = await getDocs(q)
        if (snapshot.empty) return null

        const seasonDoc = snapshot.docs[0]
        return { id: seasonDoc.id, ...seasonDoc.data() }
    } catch (error) {
        reportClientError('season_fetch_failed', error)
        return null
    }
}

export async function getLeaderboardSnapshot(seasonId) {
    try {
        const snapshotRef = doc(db, `leaderboard/${seasonId}/snapshot/top50`)
        const snapshotDoc = await getDoc(snapshotRef)

        if (!snapshotDoc.exists()) {
            return {
                entries: [],
                totalParticipants: 0,
                topScore: null,
                updatedAt: null
            }
        }

        return snapshotDoc.data()
    } catch (error) {
        reportClientError('leaderboard_snapshot_fetch_failed', error, { seasonId })
        return null
    }
}

export async function getUserEntry(seasonId, uid) {
    if (!uid) return null

    try {
        const userEntryQuery = query(
            collection(db, `leaderboard/${seasonId}/entries`),
            where('uid', '==', uid),
            limit(1)
        )
        const userSnapshot = await getDocs(userEntryQuery)
        if (userSnapshot.empty) return null

        const userDoc = userSnapshot.docs[0]
        const userData = userDoc.data()

        const higherScoreQuery = query(
            collection(db, `leaderboard/${seasonId}/entries`),
            where('score', '>', userData.score)
        )
        const higherScoreSnapshot = await getDocs(higherScoreQuery)

        return {
            ...userData,
            rank: higherScoreSnapshot.size + 1,
            docId: userDoc.id
        }
    } catch (error) {
        reportClientError('leaderboard_user_entry_fetch_failed', error, { seasonId, uid })
        return null
    }
}

export default {
    db,
    auth,
    functions,
    submitGameScore,
    ensureAuth,
    getCurrentUserId,
    getCurrentSeason,
    getLeaderboardSnapshot,
    getUserEntry,
    reportClientError
}
