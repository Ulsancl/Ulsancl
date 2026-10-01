// Build finalization injects every local production asset and its content revision.
const PRECACHE = /* STOCK_PRECACHE */ ['/', '/index.html']
const CACHE_NAME = 'stock-game-/* STOCK_REVISION */development'
const PREFIX = 'stock-game-'

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE)))
})

self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        const names = await caches.keys()
        await Promise.all(names.filter(name => name.startsWith(PREFIX) && name !== CACHE_NAME).map(name => caches.delete(name)))
        await self.clients.claim()
    })())
})

self.addEventListener('fetch', event => {
    const request = event.request, url = new URL(request.url)
    if (request.method !== 'GET' || url.origin !== self.location.origin) return
    if (request.mode === 'navigate') {
        event.respondWith((async () => {
            try {
                const response = await fetch(request)
                if (response.ok) {
                    const cache = await caches.open(CACHE_NAME)
                    await cache.put('/index.html', response.clone())
                }
                return response
            } catch {
                return (await caches.open(CACHE_NAME)).match('/index.html')
            }
        })())
        return
    }
    if (!PRECACHE.includes(url.pathname)) return
    event.respondWith((async () => {
        const cache = await caches.open(CACHE_NAME)
        // Build-manifest assets are static and same-origin. Development/preview
        // servers may emit Vary: Origin while module requests add Origin and the
        // precache request does not. Match these known files independently of Vary.
        return await cache.match(request, { ignoreVary: true }) || fetch(request)
    })())
})
