// 서비스 워커 - 오프라인 지원
const CACHE_NAME = 'stock-game-v1'
const urlsToCache = [
    '/',
    '/index.html',
]

// 설치 이벤트
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('캐시 열기 성공')
                return cache.addAll(urlsToCache)
            })
    )
})

// 활성화 이벤트 - 오래된 캐시 정리
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((cacheName) => {
                    return cacheName !== CACHE_NAME
                }).map((cacheName) => {
                    return caches.delete(cacheName)
                })
            )
        })
    )
})

// 요청 인터셉트
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // 캐시에 있으면 캐시 반환, 없으면 네트워크 요청
                if (response) {
                    return response
                }
                return fetch(event.request).then((response) => {
                    // 유효한 응답이면 캐시에 저장
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response
                    }
                    const responseToCache = response.clone()
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache)
                        })
                    return response
                })
            })
    )
})
