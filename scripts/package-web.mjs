import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFile, readdir, realpath, stat, mkdir, writeFile, rename, lstat } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { deflateRawSync } from 'node:zlib'
import { execFileSync } from 'node:child_process'
import { assertSupportedNode, isWithin } from './serve-web.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const utf8 = text => Buffer.from(text, 'utf8')
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0
const slash = value => value.split(path.sep).join('/')
const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', windowsHide: true }).trim()

async function readTree(directory, prefix = '') {
  const result = []
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => compare(a.name, b.name))) {
    const absolute = path.join(directory, entry.name)
    if (entry.isSymbolicLink()) throw new Error(`심볼릭 링크는 패키징하지 않습니다: ${absolute}`)
    if (entry.isDirectory()) result.push(...await readTree(absolute, `${prefix}${entry.name}/`))
    else if (entry.isFile()) result.push({ name: `${prefix}${entry.name}`, bytes: await readFile(absolute), modified: (await stat(absolute)).mtimeMs })
    else throw new Error(`일반 파일이 아닙니다: ${absolute}`)
  }
  return result
}

async function resolveInstalledPackage(name, from) {
  if (!/^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/i.test(name)) throw new Error(`잘못된 패키지 이름: ${name}`)
  let directory = from
  while (isWithin(ROOT, directory)) {
    const candidate = path.join(directory, 'node_modules', name)
    try {
      const resolved = await realpath(candidate)
      if (!isWithin(path.join(ROOT, 'node_modules'), resolved)) throw new Error(`외부 의존성 경로: ${name}`)
      return { directory: resolved, manifest: JSON.parse(await readFile(path.join(resolved, 'package.json'), 'utf8')) }
    } catch (error) { if (!['ENOENT', 'ENOTDIR'].includes(error.code)) throw error }
    if (directory === ROOT) break
    directory = path.dirname(directory)
  }
  return null
}

async function embeddedNotices(directory) {
  const found = new Map()
  async function scan(folder) {
    for (const entry of (await readdir(folder, { withFileTypes: true })).sort((a, b) => compare(a.name, b.name))) {
      if (entry.isSymbolicLink() || entry.name === 'node_modules') continue
      const target = path.join(folder, entry.name)
      if (entry.isDirectory()) await scan(target)
      else if (entry.isFile() && /\.(?:js|mjs|cjs)$/.test(entry.name)) {
        const source = await readFile(target, 'utf8')
        for (const match of source.matchAll(/\/\*[\s\S]*?\*\//g)) {
          if (/@license\b|@preserve\b|copyright[^\n]*(?:google|firebase)/i.test(match[0]) && !found.has(match[0])) {
            found.set(match[0], { name: `${slash(path.relative(directory, target))} (embedded notice)`, text: match[0] })
          }
        }
      }
    }
  }
  await scan(directory)
  return [...found.values()]
}

async function noticeFiles(directory, folder = directory) {
  const texts = []
  for (const entry of (await readdir(folder, { withFileTypes: true })).sort((a, b) => compare(a.name, b.name))) {
    if (entry.isSymbolicLink() || entry.name === 'node_modules') continue
    const target = path.join(folder, entry.name)
    if (entry.isDirectory()) texts.push(...await noticeFiles(directory, target))
    else if (entry.isFile() && /^(licen[sc]e|copying|notice)(?:[._-].*|$)/i.test(entry.name)) {
      texts.push({ name: slash(path.relative(directory, target)), text: await readFile(target, 'utf8') })
    }
  }
  return texts
}

export async function collectNotices(manifest) {
  // Conservative closure: includes all installed production dependencies, even
  // when tree shaking removes some code, plus Vite's generated browser helper.
  const queue = Object.keys(manifest.dependencies || {}).map(name => ({ name, from: ROOT, optional: false }))
  queue.push({ name: 'vite', from: ROOT, optional: false, helperOnly: true })
  const visited = new Set(), inventory = [], sections = []
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const item = queue[cursor]
    const installed = await resolveInstalledPackage(item.name, item.from)
    if (!installed) {
      if (item.optional) continue
      throw new Error(`설치된 의존성을 찾지 못했습니다: ${item.name}`)
    }
    const { directory, manifest: pkg } = installed
    if (visited.has(directory)) continue
    visited.add(directory)
    const texts = await noticeFiles(directory)
    // Firebase npm packages omit LICENSE files but retain their copyright and
    // Apache notices inside emitted JS. Preserve those blocks verbatim.
    if (!texts.length && (pkg.name === 'firebase' || pkg.name.startsWith('@firebase/'))) {
      texts.push(...await embeddedNotices(directory))
      if (pkg.license === 'Apache-2.0') {
        const apache = await readFile(path.join(ROOT, 'node_modules', '@grpc', 'proto-loader', 'LICENSE'), 'utf8')
        if (!apache.includes('Apache License') || !apache.includes('Version 2.0, January 2004')) throw new Error('설치된 Apache 2.0 전체 문구를 확인하지 못했습니다.')
        texts.push({ name: 'Apache-2.0 full license (installed @grpc/proto-loader/LICENSE)', text: apache })
      }
    }
    if (!texts.length) throw new Error(`라이선스 원문이 없습니다: ${pkg.name}@${pkg.version}`)
    const location = slash(path.relative(ROOT, directory))
    inventory.push({ name: pkg.name, version: pkg.version, license: pkg.license || 'see included text', location, noticeFiles: texts.map(text => text.name) })
    sections.push({ key: `${pkg.name}@${pkg.version}:${location}`, text: `${pkg.name}@${pkg.version}\nInstalled path: ${location}\nDeclared license: ${JSON.stringify(pkg.license || 'see included text')}\n\n${texts.map(file => `--- ${file.name} ---\n${file.text}`).join('\n\n')}` })
    if (!item.helperOnly) {
      for (const name of Object.keys({ ...pkg.dependencies, ...pkg.optionalDependencies, ...pkg.peerDependencies }).sort(compare)) {
        queue.push({ name, from: directory, optional: Boolean(pkg.optionalDependencies?.[name] || pkg.peerDependenciesMeta?.[name]?.optional) })
      }
    }
  }
  inventory.sort((a, b) => compare(`${a.name}@${a.version}:${a.location}`, `${b.name}@${b.version}:${b.location}`))
  sections.sort((a, b) => compare(a.key, b.key))
  const heading = 'THIRD-PARTY NOTICES\n\nThis inventory conservatively includes installed production dependency closures, including code that may be removed by tree shaking, and the Vite browser helper. License and NOTICE texts below were copied from the installed packages without rewriting them. This file does not grant a license to the application itself.\n'
  return { inventory, bytes: utf8(`${heading}\n${sections.map(item => `\n${'='.repeat(78)}\n${item.text}`).join('\n')}\n`) }
}

const crcTable = Array.from({ length: 256 }, (_, value) => {
  for (let i = 0; i < 8; i++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  return value >>> 0
})
const crc32 = bytes => {
  let crc = 0xffffffff
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

export function createZip(entries, timestamp) {
  if (entries.length > 65535) throw new Error('ZIP 파일 수 한도를 초과했습니다.')
  const date = new Date(timestamp)
  if (!Number.isFinite(date.getTime()) || date.getUTCFullYear() < 1980 || date.getUTCFullYear() > 2107) throw new Error('ZIP 시각은 1980–2107 범위여야 합니다.')
  const time = (date.getUTCHours() << 11) | (date.getUTCMinutes() << 5) | Math.floor(date.getUTCSeconds() / 2)
  const day = ((date.getUTCFullYear() - 1980) << 9) | ((date.getUTCMonth() + 1) << 5) | date.getUTCDate()
  const locals = [], central = [], names = new Set()
  let offset = 0, totalInput = 0
  for (const entry of [...entries].sort((a, b) => compare(a.name, b.name))) {
    if (!entry.name || entry.name.startsWith('/') || /[\\:\0]/.test(entry.name) || entry.name.split('/').some(segment => !segment || segment === '.' || segment === '..') || names.has(entry.name)) throw new Error(`잘못된 ZIP 경로: ${entry.name}`)
    names.add(entry.name)
    const name = utf8(entry.name), bytes = entry.bytes
    totalInput += bytes.length
    if (totalInput > 512 * 1024 * 1024 || name.length > 65535) throw new Error('ZIP 안전 크기 한도를 초과했습니다.')
    const compressed = deflateRawSync(bytes, { level: 9 }), crc = crc32(bytes)
    const header = Buffer.alloc(30)
    header.writeUInt32LE(0x04034b50, 0); header.writeUInt16LE(20, 4); header.writeUInt16LE(0x800, 6)
    header.writeUInt16LE(8, 8); header.writeUInt16LE(time, 10); header.writeUInt16LE(day, 12)
    header.writeUInt32LE(crc, 14); header.writeUInt32LE(compressed.length, 18); header.writeUInt32LE(bytes.length, 22); header.writeUInt16LE(name.length, 26)
    locals.push(header, name, compressed)
    const record = Buffer.alloc(46)
    record.writeUInt32LE(0x02014b50, 0); record.writeUInt16LE(20, 4); record.writeUInt16LE(20, 6)
    record.writeUInt16LE(0x800, 8); record.writeUInt16LE(8, 10); record.writeUInt16LE(time, 12); record.writeUInt16LE(day, 14)
    record.writeUInt32LE(crc, 16); record.writeUInt32LE(compressed.length, 20); record.writeUInt32LE(bytes.length, 24); record.writeUInt16LE(name.length, 28); record.writeUInt32LE(offset, 42)
    central.push(record, name)
    offset += header.length + name.length + compressed.length
  }
  const centralSize = central.reduce((sum, value) => sum + value.length, 0)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(centralSize, 12); end.writeUInt32LE(offset, 16)
  return Buffer.concat([...locals, ...central, end])
}

export async function preparePackage({ check = false } = {}) {
  assertSupportedNode()
  const manifest = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'))
  if (!/^\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?$/i.test(manifest.version)) throw new Error('패키지 버전이 올바르지 않습니다.')
  const commit = git('rev-parse', 'HEAD'), branch = git('branch', '--show-current') || '(detached)'
  const dirty = git('status', '--porcelain', '--untracked-files=no').length > 0
  if (dirty && !check) throw new Error('추적 중인 소스 변경을 먼저 커밋하고 최종 빌드를 검증하세요. 중간 dist는 배포물로 만들지 않습니다.')
  const dist = await realpath(path.join(ROOT, 'dist'))
  if (!isWithin(ROOT, dist)) throw new Error('dist가 저장소 바깥을 가리킵니다.')
  const web = await readTree(dist, 'web/')
  const index = web.find(file => file.name === 'web/index.html')
  const serviceWorker = web.find(file => file.name === 'web/sw.js')
  if (!index || !serviceWorker || serviceWorker.bytes.toString().includes('/* STOCK_REVISION */development')) throw new Error('완료된 웹 빌드(index.html 및 확정된 sw.js)가 필요합니다.')
  for (const match of index.bytes.toString().matchAll(/(?:src|href)=["'](\/[^"']+)["']/g)) {
    const target = `web${decodeURIComponent(match[1].split('?')[0])}`
    if (!web.some(file => file.name === target)) throw new Error(`index.html이 참조한 파일이 없습니다: ${target}`)
  }
  const latestDistTime = Math.max(...web.map(file => file.modified))
  const commitTime = Number(git('show', '-s', '--format=%ct', 'HEAD')) * 1000
  if (!check && latestDistTime < commitTime) throw new Error('dist가 현재 소스 커밋보다 오래되었습니다. 최종 커밋 뒤 다시 빌드하고 검증하세요.')
  const epoch = process.env.SOURCE_DATE_EPOCH
  if (epoch !== undefined && !/^\d+$/.test(epoch)) throw new Error('SOURCE_DATE_EPOCH는 UTC Unix 초여야 합니다.')
  const timestamp = epoch === undefined ? Math.floor(latestDistTime / 1000) * 1000 : Number(epoch) * 1000
  const notices = await collectNotices(manifest)
  const run = '@echo off\r\nsetlocal\r\ncd /d "%~dp0"\r\nwhere node >nul 2>nul\r\nif errorlevel 1 (\r\n  echo Node.js 24.19.0 or newer is required.\r\n  pause\r\n  exit /b 1\r\n)\r\nnode "%~dp0serve-web.mjs"\r\nif errorlevel 1 pause\r\n'
  const readme = `Stock Trading Game ${manifest.version} — 로컬 웹 패키지\n\nNode.js 24.19.0 이상을 먼저 준비하세요. 이 패키지는 Node를 설치하거나 포함하지 않습니다.\nZIP 전체를 한 폴더에 풀고 WindowsRun.cmd를 실행한 뒤, 브라우저에서 http://127.0.0.1:5315/ 를 여세요. 종료는 실행 창에서 Ctrl+C입니다.\n다른 운영체제에서는 이 폴더에서 node serve-web.mjs를 실행하세요.\nweb/index.html을 직접 열면 안 됩니다. /assets, 서비스 워커, 저장소는 HTTP 루트 기준입니다.\n서버는 127.0.0.1:5315에만 바인딩하고 브라우저를 자동 실행하지 않습니다. npm install은 필요 없습니다.\n게임 저장은 브라우저의 위 주소에 남습니다. 파일 교체 전 설정에서 현재 진행을 다운로드하세요. 서비스 워커는 검증된 웹 빌드의 캐시 정책을 사용합니다. 서버는 파일을 no-store로 응답합니다.\n이 작업은 로컬 전달용 패키지 생성이며 공개 사이트 게시·원격 서버 배포가 아닙니다. Firebase 온라인 기능은 원래 빌드 설정과 네트워크 상태에 따릅니다.\nTHIRD-PARTY-NOTICES.txt에 설치된 운영 의존성의 라이선스 원문이 있습니다. PACKAGE-METADATA.json의 파일 SHA-256과 ZIP 옆 .sha256 파일로 무결성을 확인할 수 있습니다.\n`
  const entries = [...web, { name: 'WindowsRun.cmd', bytes: utf8(run) }, { name: 'serve-web.mjs', bytes: await readFile(path.join(ROOT, 'scripts', 'serve-web.mjs')) }, { name: 'README.txt', bytes: utf8(readme) }, { name: 'THIRD-PARTY-NOTICES.txt', bytes: notices.bytes }]
  const metadata = {
    formatVersion: 1, name: manifest.name, version: manifest.version,
    source: { branch, commit, trackedChanges: dirty },
    builtAt: new Date(timestamp).toISOString(), buildTimeSource: epoch === undefined ? 'latest dist file modification time, rounded to UTC seconds' : 'SOURCE_DATE_EPOCH supplied for reproducible build',
    packagingNode: process.versions.node, requiredRuntime: 'Node.js >=24.19.0',
    webRoot: 'web/', listen: `http://${HOST_FOR_METADATA}:5315/`,
    thirdPartyInventoryScope: 'installed production dependency closure plus Vite generated browser helper; may include tree-shaken packages',
    dependencies: notices.inventory,
    hashScope: 'All archive files except this metadata file; the external ZIP SHA-256 covers this metadata too.',
    files: entries.map(file => ({ path: file.name, bytes: file.bytes.length, sha256: sha256(file.bytes) })).sort((a, b) => compare(a.path, b.path))
  }
  entries.push({ name: 'PACKAGE-METADATA.json', bytes: utf8(`${JSON.stringify(metadata, null, 2)}\n`) })
  return { filename: `Stock-Trading-Game-${manifest.version}-web.zip`, entries, metadata, timestamp }
}
const HOST_FOR_METADATA = '127.0.0.1'

async function publishBytes(directory, name, bytes) {
  const final = path.join(directory, name)
  if (!isWithin(directory, final)) throw new Error('출력 경로가 release 폴더를 벗어납니다.')
  try { if ((await lstat(final)).isSymbolicLink()) throw new Error('출력 파일이 심볼릭 링크입니다.') }
  catch (error) { if (error.code !== 'ENOENT') throw error }
  const temporary = path.join(directory, `.${name}.${process.pid}.tmp`)
  await writeFile(temporary, bytes, { flag: 'wx' })
  await rename(temporary, final)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2)
    if (args.some(arg => arg !== '--check') || args.length > 1) throw new Error('사용법: node scripts/package-web.mjs [--check]')
    const check = args.includes('--check'), result = await preparePackage({ check })
    const archive = createZip(result.entries, result.timestamp)
    const digest = sha256(archive)
    if (!check) {
      const expected = path.join(ROOT, 'release')
      await mkdir(expected, { recursive: true })
      const release = await realpath(expected)
      if (release !== expected || !isWithin(ROOT, release)) throw new Error('release 실제 경로가 지정된 저장소 폴더와 다릅니다.')
      await publishBytes(release, result.filename, archive)
      await publishBytes(release, `${result.filename}.sha256`, utf8(`${digest}  ${result.filename}\n`))
    }
    console.log(JSON.stringify({ mode: check ? 'validation only; no release files written' : 'packaged', archive: result.filename, files: result.entries.length, dependencies: result.metadata.dependencies.length, bytes: archive.length, sha256: digest, source: result.metadata.source }, null, 2))
  } catch (error) { console.error(error.message); process.exitCode = 1 }
}
