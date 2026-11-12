import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const read = (file) => readFile(new URL('../' + file, import.meta.url), 'utf8')
const config = JSON.parse(await read('release/play.json'))
const android = await read('android/app/build.gradle')
const strings = await read('android/app/src/main/res/values/strings.xml')
const manifest = await read('android/app/src/main/AndroidManifest.xml')
const assetlinks = JSON.parse(await read('public/.well-known/assetlinks.json'))
const pwa = JSON.parse(await read('public/manifest.json'))
const origin = new URL(config.origin)
assert.equal(origin.protocol, 'https:')
assert.equal(origin.origin, config.origin)
assert.match(config.packageId, /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$/)
assert.ok(config.title.length <= 30 && config.shortDescription.length <= 80)
assert.ok(android.includes("applicationId '" + config.packageId + "'"))
assert.ok(android.includes('targetSdk ' + config.targetSdk) && config.targetSdk >= 36)
assert.ok(android.includes('versionCode ' + config.versionCode))
assert.ok(android.includes("versionName '" + config.versionName + "'"))
assert.ok(strings.includes(config.origin) && manifest.includes(origin.hostname))
assert.equal(pwa.scope, '/')
assert.equal(pwa.id, '/')
for (const icon of pwa.icons) {
  const data = await readFile(new URL('../public' + icon.src, import.meta.url))
  assert.equal(data.subarray(1, 4).toString(), 'PNG')
  assert.equal(icon.sizes, `${data.readUInt32BE(16)}x${data.readUInt32BE(20)}`)
}
assert.ok(Array.isArray(assetlinks))
const blockers = []
if (!config.playConsoleRegistered) blockers.push('Google Play 개발자 계정 및 앱 등록')
if (!config.supportEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.supportEmail))
  blockers.push('스토어에 공개할 지원 이메일')
const certs = config.appSigningCertificateSha256
if (!certs.length) blockers.push('Play 앱 서명 인증서와 Digital Asset Links 연결')
for (const fingerprint of certs) {
  assert.match(fingerprint, /^[A-F0-9]{2}(:[A-F0-9]{2}){31}$/)
  assert.ok(
    assetlinks.some(
      (entry) =>
        entry.target?.namespace === 'android_app' &&
        entry.target.package_name === config.packageId &&
        entry.target.sha256_cert_fingerprints?.includes(fingerprint) &&
        entry.relation?.includes('delegate_permission/common.handle_all_urls')
    )
  )
}
if (config.launchMode === 'practice' && process.env.VITE_FIREBASE_PROJECT_ID)
  blockers.push('서버 활성화 전에 스토어 설명과 Data safety를 온라인 서비스에 맞게 갱신')
if (process.argv.includes('--production')) {
  if (!process.env.MARKETDESK_KEYSTORE) blockers.push('업로드 키 및 서명된 AAB')
  if (blockers.length) {
    console.error('출시 보류:\n- ' + blockers.join('\n- '))
    process.exitCode = 1
  } else
    console.log(
      'Configured release inputs passed. Play Console review/testing requirements still apply.'
    )
} else
  console.log(
    JSON.stringify(
      { sourceChecks: 'passed', productionReady: blockers.length === 0, remaining: blockers },
      null,
      2
    )
  )
