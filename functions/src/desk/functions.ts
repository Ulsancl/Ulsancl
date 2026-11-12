import * as functions from 'firebase-functions/v1'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { deskService, riskSweep, DeskError } from './service'
import { privacySweep, processDeletion } from './deletion'
export const deskApi = functions
  .runWith({
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== 'true',
    memory: '512MB',
    timeoutSeconds: 120,
    maxInstances: 5,
  })
  .https.onCall(async (data, context) => {
    if (!context.app && process.env.FUNCTIONS_EMULATOR !== 'true')
      throw new functions.https.HttpsError('failed-precondition', '앱 확인이 필요합니다.')
    if (context.auth) {
      try {
        const token = context.rawRequest.get('authorization')?.replace(/^Bearer\s+/i, '')
        if (!token) throw new Error('missing token')
        // Callable token validation alone does not check disabled users or revocation.
        await getAuth().verifyIdToken(token, true)
      } catch {
        throw new functions.https.HttpsError(
          'unauthenticated',
          '로그인이 만료되거나 취소됐습니다. 다시 로그인하세요.'
        )
      }
    }
    const provider = context.auth?.token.firebase?.sign_in_provider
    if (data?.op === 'deleteAccount' && provider === 'anonymous')
      throw new functions.https.HttpsError('permission-denied', '등록 계정으로 로그인하세요.')
    const member = Boolean(
      context.auth &&
      provider !== 'anonymous' &&
      (provider === 'google.com' || context.auth.token.email_verified === true)
    )
    try {
      const result = await deskService(
        getFirestore(),
        {
          uid: context.auth?.uid || null,
          member,
          admin: context.auth?.token.admin === true,
          authTime: Number(context.auth?.token.auth_time),
        },
        data
      )
      if (data?.op === 'deleteAccount' && context.auth) {
        try {
          // No season history: finish bounded cleanup immediately instead of building a backlog.
          await processDeletion(getFirestore(), getAuth(), context.auth.uid, Date.now(), {
            identityOnly: true,
          })
        } catch (error) {
          // The durable, separate identity queue retries transient Auth/Firestore failures.
          functions.logger.warn('desk_identity_erasure_deferred', {
            code: (error as { code?: string })?.code,
          })
        }
      }
      return result
    } catch (error) {
      if (error instanceof DeskError)
        throw new functions.https.HttpsError(error.code, error.message)
      if (error instanceof Error && !('code' in error))
        throw new functions.https.HttpsError('invalid-argument', error.message)
      functions.logger.error('desk_api_failed', {
        operation: data?.op,
        code: (error as { code?: string })?.code,
      })
      throw new functions.https.HttpsError(
        'internal',
        '처리하지 못했습니다. 요청 번호를 유지한 채 다시 시도하세요.'
      )
    }
  })
export const deskRiskSweep = functions
  .runWith({ memory: '512MB', timeoutSeconds: 540, maxInstances: 1 })
  .pubsub.schedule('every 1 minutes')
  .onRun(() => riskSweep(getFirestore()))

export const deskPrivacySweep = functions
  .runWith({ memory: '256MB', timeoutSeconds: 540, maxInstances: 1 })
  .pubsub.schedule('every 10 minutes')
  .onRun(() => privacySweep(getFirestore(), getAuth()))
