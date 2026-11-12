#!/usr/bin/env node
// Run only in a trusted operator shell using Application Default Credentials.
const { initializeApp, applicationDefault } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { getFirestore } = require('firebase-admin/firestore')
async function main() {
  const [project, action, uid, ...words] = process.argv.slice(2),
    reason = words.join(' ')
  if (!project || !['grant', 'revoke'].includes(action) || !uid || !reason || reason.length > 300)
    throw new Error('Usage: node functions/scripts/desk-admin.cjs PROJECT grant|revoke UID REASON')
  const emulator = Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST)
  if (emulator && !project.startsWith('demo-'))
    throw new Error('Emulator administration requires a demo-* project.')
  const app = initializeApp({
    projectId: project,
    ...(emulator ? {} : { credential: applicationDefault() }),
  })
  const auth = getAuth(app),
    user = await auth.getUser(uid)
  if (action === 'grant' && (!user.emailVerified || user.disabled))
    throw new Error('Only an enabled, email-verified account can become an operator.')
  const claims = { ...user.customClaims }
  if (action === 'grant') claims.admin = true
  else delete claims.admin
  await auth.setCustomUserClaims(uid, claims)
  await auth.revokeRefreshTokens(uid)
  await getFirestore(app)
    .collection('deskAudit')
    .add({
      action: 'admin-' + action,
      target: uid,
      actorUid: 'trusted-operator-cli',
      reason,
      at: Date.now(),
    })
  console.log(
    'Admin claim updated for ' +
      uid +
      '. Sign in again. Desk checks revocation on each request; legacy endpoints may accept old tokens until expiry.'
  )
}
main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
