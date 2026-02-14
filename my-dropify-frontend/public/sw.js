const CACHE_STATIC = 'dropify-static-v4'
const CACHE_API = 'dropify-api-v4'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      return cache.addAll(['/offline'])
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_STATIC && key !== CACHE_API) {
            return caches.delete(key)
          }
        })
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const request = event.request

  if (!request.url.startsWith('http')) return
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Backend API
  if (url.origin !== self.location.origin) {
    event.respondWith(staleWhileRevalidate(request))
    return
  }

  // Static assets
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image'
  ) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request))
    return
  }
})

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_API)
  const cached = await cache.match(request)

  try {
    const response = await fetch(request)
    if (response && response.status === 200) {
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return cached || new Response('Offline', { status: 503 })
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_STATIC)
  const cached = await cache.match(request)

  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response && response.status === 200) {
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('Offline asset', { status: 503 })
  }
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_STATIC)

  try {
    const response = await fetch(request)
    if (response && response.status === 200) {
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await cache.match(request)
    if (cached) return cached

    const offline = await cache.match('/offline')
    if (offline) return offline

    return new Response('Offline', { status: 503 })
  }
}
