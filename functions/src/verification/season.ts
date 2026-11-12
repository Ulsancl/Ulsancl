import type { Firestore } from 'firebase-admin/firestore';

export const MAX_REPLAY_TICKS = 120000;

function millis(value: unknown): number {
    if (!value || typeof (value as { toMillis?: unknown }).toMillis !== 'function') return NaN;
    return (value as { toMillis(): number }).toMillis();
}

export function validateSeasonForReplay(
    season: Record<string, unknown> | undefined,
    meta: { initialCapital: number; totalTicks: number },
    now = Date.now()
): boolean {
    if (!season || season.active !== true || Object.prototype.hasOwnProperty.call(season, 'seed')) return false;
    const start = millis(season.startDate), end = millis(season.endDate);
    return Number.isFinite(start) && Number.isFinite(end) && start <= now && now < end &&
        typeof season.initialCapital === 'number' && Number.isFinite(season.initialCapital) &&
        season.initialCapital > 0 && season.initialCapital === meta.initialCapital &&
        Number.isSafeInteger(season.gameDuration) && Number(season.gameDuration) > 0 &&
        Number(season.gameDuration) <= MAX_REPLAY_TICKS && season.gameDuration === meta.totalTicks;
}

// Project known public fields only: legacy documents may contain private data.
export async function readActiveSeason(db: Firestore) {
    const snapshot = await db.collection('seasons').where('active', '==', true)
        .orderBy('startDate', 'desc').limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0], data = doc.data();
    return {
        id: doc.id, name: typeof data.name === 'string' ? data.name : '', active: true,
        initialCapital: data.initialCapital, gameDuration: data.gameDuration,
        startDate: millis(data.startDate), endDate: millis(data.endDate)
    };
}
