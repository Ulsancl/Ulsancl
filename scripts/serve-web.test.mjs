import assert from 'node:assert/strict'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { test } from 'node:test'
import { createRequestHandler, HOST, PORT } from './serve-web.mjs'

test('local web server serves indexed files and rejects unlisted paths', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'stock-serve-web-'))
  t.after(async () => {
    if (path.dirname(root) !== os.tmpdir()) throw new Error('unexpected test directory')
    await rm(root, { recursive: true, force: true })
  })
  await mkdir(path.join(root, 'assets'))
  await writeFile(path.join(root, 'index.html'), '<h1>game</h1>')
  await writeFile(path.join(root, 'assets', 'app.js'), 'console.log("ok")')
  const handler = await createRequestHandler(root)
  const server = http.createServer(handler)
  await new Promise(resolve => server.listen(0, HOST, resolve))
  t.after(() => new Promise(resolve => server.close(resolve)))

  function get(target, headers = {}) {
    return new Promise((resolve, reject) => {
      const request = http.get({
        host: HOST, port: server.address().port, path: target,
        headers: { Host: `${HOST}:${PORT}`, ...headers }
      }, response => {
        const chunks = []
        response.on('data', chunk => chunks.push(chunk))
        response.on('end', () => resolve({ status: response.statusCode, body: Buffer.concat(chunks).toString() }))
      })
      request.on('error', reject)
    })
  }

  assert.deepEqual(await get('/assets/app.js'), { status: 200, body: 'console.log("ok")' })
  assert.deepEqual(await get('/game', { Accept: 'text/html' }), { status: 200, body: '<h1>game</h1>' })
  assert.equal((await get('/assets/missing.js')).status, 404)
  await writeFile(path.join(root, 'added-after-start.js'), 'late file')
  assert.equal((await get('/added-after-start.js')).status, 404)
  assert.equal((await get('/%2e%2e/secret.txt')).status, 400)
  assert.equal((await get('/%5csecret.txt')).status, 400)
  assert.equal((await get('/index.html', { Host: 'evil.test' })).status, 403)
})
