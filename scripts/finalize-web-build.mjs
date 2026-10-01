import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
const root = path.resolve('dist')
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(entry => entry.isDirectory() ? files(path.join(directory, entry.name)) : path.join(directory, entry.name)))
  return nested.flat()
}
const assetFiles = (await files(root)).filter(file => path.basename(file) !== 'sw.js').sort()
const digest = createHash('sha256')
for (const file of assetFiles) digest.update(path.relative(root, file)).update(await readFile(file))
const revision = digest.digest('hex').slice(0, 16)
const urls = ['/', ...assetFiles.map(file => '/' + path.relative(root, file).split(path.sep).join('/'))]
const source = await readFile(path.join(root, 'sw.js'), 'utf8')
if (!source.includes('/* STOCK_PRECACHE */') || !source.includes('/* STOCK_REVISION */development')) throw new Error('Service worker build placeholders missing')
await writeFile(path.join(root, 'sw.js'), source.replace("/* STOCK_PRECACHE */ ['/', '/index.html']", JSON.stringify(urls)).replace('/* STOCK_REVISION */development', revision))
console.log(`Offline precache: ${urls.length} files, revision ${revision}`)
