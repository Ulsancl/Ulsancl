import { FieldPath, type Firestore, type Transaction } from 'firebase-admin/firestore'
import type { Auth } from 'firebase-admin/auth'
import { DeskError } from './errors'

/** A transactional fence prevents in-flight requests from recreating erased data. */
export async function assertNotDeleting(tx: Transaction, db: Firestore, uid: string) {
  if ((await tx.get(db.doc('deskDeletions/' + uid))).exists)
    throw new DeskError(
      'failed-precondition',
      '계정 삭제가 접수됐습니다. 이 계정으로 더 이상 거래할 수 없습니다.'
    )
}

export async function requestDeletion(db: Firestore, uid: string, authTime: number, now: number) {
  if (!Number.isFinite(authTime) || now / 1000 - authTime > 300 || authTime > now / 1000 + 30)
    throw new DeskError(
      'unauthenticated',
      '계정 삭제를 위해 로그아웃 후 다시 로그인하세요. 로그인 후 5분 안에 요청할 수 있습니다.'
    )
  await db.runTransaction(async (tx) => {
    const ref = db.doc('deskDeletions/' + uid)
    const [job, profile] = await tx.getAll(ref, db.doc('deskProfiles/' + uid))
    if (job.exists) return
    tx.set(ref, { state: 'pending', cursor: '', requestedAt: now, updatedAt: now })
    if (profile.exists)
      tx.update(profile.ref, { publicRanking: false, status: 'deleting', updatedAt: now })
    tx.delete(db.doc('deskAccounts/' + uid))
  })
  return { accepted: true }
}

/** Bounded, retryable steps; partial failures retain a durable pending job. */
export async function processDeletion(db: Firestore, auth: Auth, uid: string, now = Date.now()) {
  const ref = db.doc('deskDeletions/' + uid)
  const job = (await ref.get()).data()
  if (!job || job.state !== 'pending') return true
  try {
    await auth.deleteUser(uid)
  } catch (error) {
    if ((error as { code?: string }).code !== 'auth/user-not-found') throw error
  }
  // Existing archive IDs predate the uid field; enumerate their parent seasons.
  if (!job.seasonsDone) {
    let query = db.collection('deskSeasons').orderBy(FieldPath.documentId()).limit(20)
    if (job.cursor) query = query.startAfter(job.cursor)
    const seasons = await query.get()
    for (const season of seasons.docs) {
      await db.runTransaction(async (tx) => {
        const standing = await tx.get(db.doc('deskStandings/' + season.id))
        tx.delete(db.doc('deskArchive/' + season.id + '_' + uid))
        tx.delete(db.doc('deskLeaderboard/' + season.id + '/entries/' + uid))
        if (standing.exists)
          tx.update(standing.ref, {
            rows: (standing.data()?.rows || []).filter((row: { uid: string }) => row.uid !== uid),
          })
      })
    }
    await ref.update({
      cursor: seasons.docs[seasons.docs.length - 1]?.id || job.cursor,
      seasonsDone: seasons.size < 20,
      updatedAt: now,
    })
    if (seasons.size === 20) return false
  }
  const filters = [
    ['deskArchive', 'uid'],
    ['deskReports', 'reporterUid'],
    ['deskReports', 'targetUid'],
    ['deskReports', 'resolvedBy'],
    ['deskAudit', 'actorUid'],
    ['deskAudit', 'target'],
  ]
  for (const [collection, field] of filters) {
    const docs = await db.collection(collection).where(field, '==', uid).limit(100).get()
    if (docs.empty) continue
    const batch = db.batch()
    for (const doc of docs.docs) batch.delete(doc.ref)
    await batch.commit()
    if (docs.size === 100) return false
  }
  const batch = db.batch()
  for (const collection of ['deskAccounts', 'deskProfiles', 'deskLimits'])
    batch.delete(db.doc(collection + '/' + uid))
  // Only the uid and timestamps survive temporarily to fence delayed requests.
  batch.set(ref, {
    state: 'complete',
    requestedAt: job.requestedAt,
    completedAt: now,
    expiresAt: new Date(now + 30 * 86400000),
  })
  await batch.commit()
  return true
}

export async function privacySweep(db: Firestore, auth: Auth, now = Date.now()) {
  const jobs = await db.collection('deskDeletions').where('state', '==', 'pending').limit(20).get()
  let completed = 0,
    failed = 0
  for (const job of jobs.docs) {
    try {
      if (await processDeletion(db, auth, job.id, now)) completed++
    } catch {
      failed++
    }
  }
  // A bounded cleanup also works when the optional Firestore TTL policy is absent.
  const expired = await db
    .collection('deskDeletions')
    .where('expiresAt', '<=', new Date(now))
    .limit(100)
    .get()
  const batch = db.batch()
  for (const doc of expired.docs) batch.delete(doc.ref)
  await batch.commit()
  await db.doc('deskHealth/privacySweep').set({ at: now, scanned: jobs.size, completed, failed })
  return { scanned: jobs.size, completed, failed }
}
