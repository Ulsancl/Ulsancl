import { getApps, initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'
const env = import.meta.env
const emulator =
  env.DEV &&
  env.VITE_DESK_EMULATORS === 'true' &&
  ['localhost', '127.0.0.1'].includes(location.hostname)
export const configured =
  emulator ||
  Boolean(
    env.VITE_FIREBASE_API_KEY &&
    env.VITE_FIREBASE_PROJECT_ID &&
    env.VITE_FIREBASE_APP_ID &&
    env.VITE_FIREBASE_AUTH_DOMAIN &&
    env.VITE_RECAPTCHA_SITE_KEY
  )
let auth, callable
if (configured) {
  const app =
    getApps().find((a) => a.name === 'marketdesk') ||
    initializeApp(
      emulator
        ? {
            apiKey: 'demo-key',
            authDomain: 'localhost',
            projectId: 'demo-stockdesk',
            appId: 'demo-stockdesk',
          }
        : {
            apiKey: env.VITE_FIREBASE_API_KEY,
            authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
            projectId: env.VITE_FIREBASE_PROJECT_ID,
            appId: env.VITE_FIREBASE_APP_ID,
          },
      'marketdesk'
    )
  auth = getAuth(app)
  const functions = getFunctions(app, env.VITE_FIREBASE_FUNCTIONS_REGION || 'us-central1')
  if (emulator) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9299', { disableWarnings: true })
    connectFunctionsEmulator(functions, '127.0.0.1', 5201)
  } else
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(env.VITE_RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    })
  callable = httpsCallable(functions, 'deskApi', { timeout: 120000 })
}
export function observeAuth(callback) {
  if (!auth) {
    callback(null)
    return () => {}
  }
  return onAuthStateChanged(auth, callback)
}
export async function api(data) {
  if (!callable) throw new Error('공개 서버가 연결되지 않았습니다. 연습 모드를 이용하세요.')
  return (await callable(data)).data
}
export const loginGoogle = () => signInWithPopup(auth, new GoogleAuthProvider())
export const logout = () => signOut(auth)
export async function emailAuth(email, password, signup) {
  const result = signup
    ? await createUserWithEmailAndPassword(auth, email, password)
    : await signInWithEmailAndPassword(auth, email, password)
  if (!result.user.emailVerified) {
    await sendEmailVerification(result.user)
    return '인증 메일을 보냈습니다. 인증 후 다시 로그인하세요.'
  }
  return '로그인했습니다.'
}
export const resetPassword = (email) => sendPasswordResetEmail(auth, email)
