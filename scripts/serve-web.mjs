import http from 'node:http'
import path from 'node:path'
import { createReadStream } from 'node:fs'
import { realpath, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

export const HOST = '127.0.0.1'
export const PORT = 5315
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.ico': 'image/x-icon', '.avif': 'image/avif',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.wasm': 'application/wasm', '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.mp4': 'video/mp4'
}

export function assertSupportedNode(version = process.versions.node) {
  const [major, minor] = version.split('.').map(Number)
  if (major < 24 || (major === 24 && minor < 19)) throw new Error('Node.js 24.19.0 이상이 필요합니다.')
}

export function isWithin(root, candidate) {
  const relative = path.relative(root, candidate)
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
}

// Inspect the raw request target before URL normalization can remove ../ segments.
export function requestPath(target) {
  if (typeof target !== 'string' || !target.startsWith('/') || target.startsWith('//')) throw new Error('invalid-path')
  let decoded
  try { decoded = decodeURIComponent(target.split('?')[0]) } catch { throw new Error('invalid-path') }
  if (/[\\\0:#]/.test(decoded) || decoded.split('/').some(segment => segment.startsWith('.'))) throw new Error('invalid-path')
  return decoded === '/' ? '/index.html' : decoded
}

export async function createRequestHandler(directory) {
  const root = await realpath(directory)
  if (!(await stat(root)).isDirectory()) throw new Error('웹 폴더가 없습니다.')
  const index = await realpath(path.join(root, 'index.html'))
  if (!isWithin(root, index) || !(await stat(index)).isFile()) throw new Error('웹 시작 파일이 없습니다.')
  return async (request, response) => {
    const fail = (status, message) => {
      response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' })
      response.end(request.method === 'HEAD' ? undefined : message)
    }
    if (request.headers.host !== `${HOST}:${PORT}`) return fail(403, '허용되지 않은 주소입니다.')
    if (!['GET', 'HEAD'].includes(request.method)) { response.setHeader('Allow', 'GET, HEAD'); return fail(405, '읽기 요청만 허용합니다.') }
    let requested
    try { requested = requestPath(request.url) } catch { return fail(400, '올바르지 않은 경로입니다.') }
    try {
      let candidate = path.resolve(root, `.${requested}`)
      if (!isWithin(root, candidate)) return fail(403, '허용되지 않은 경로입니다.')
      let info
      try { candidate = await realpath(candidate); info = await stat(candidate) }
      catch (error) {
        if (!['ENOENT', 'ENOTDIR'].includes(error.code)) throw error
        // Navigation-only fallback. A missing script/image must remain a real 404.
        if (!path.extname(requested) && request.headers.accept?.includes('text/html')) { candidate = index; info = await stat(index) }
        else return fail(404, '파일을 찾을 수 없습니다.')
      }
      if (!isWithin(root, candidate)) return fail(403, '허용되지 않은 경로입니다.')
      if (!info.isFile()) return fail(404, '파일을 찾을 수 없습니다.')
      const headers = {
        'Content-Type': MIME[path.extname(candidate).toLowerCase()] || 'application/octet-stream',
        'Content-Length': info.size, 'Cache-Control': 'no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer'
      }
      if (requested === '/sw.js') headers['Service-Worker-Allowed'] = '/'
      response.writeHead(200, headers)
      if (request.method === 'HEAD') return response.end()
      const stream = createReadStream(candidate)
      stream.on('error', () => response.destroy())
      response.on('close', () => stream.destroy())
      stream.pipe(response)
    } catch { if (!response.headersSent) fail(500, '파일을 읽지 못했습니다.'); else response.destroy() }
  }
}

export async function startServer(directory) {
  assertSupportedNode()
  const handler = await createRequestHandler(directory)
  const server = http.createServer(handler)
  server.requestTimeout = 15000
  server.headersTimeout = 10000
  server.keepAliveTimeout = 5000
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(PORT, HOST, resolve)
  })
  return server
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2)
    if (args.length && !(args.length === 2 && args[0] === '--root')) throw new Error('사용법: node serve-web.mjs [--root 웹폴더]')
    const directory = args.length ? path.resolve(args[1]) : path.join(path.dirname(fileURLToPath(import.meta.url)), 'web')
    const server = await startServer(directory)
    console.log(`Stock Trading Game: http://${HOST}:${PORT}/\n이 창을 열어 두고 주소를 브라우저에서 여세요. 종료: Ctrl+C`)
    for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { server.close(); server.closeAllConnections() })
  } catch (error) {
    console.error(error.code === 'EADDRINUSE' ? `${HOST}:${PORT} 포트가 사용 중입니다. 기존 실행을 종료한 뒤 다시 실행하세요.` : error.message)
    process.exitCode = 1
  }
}
