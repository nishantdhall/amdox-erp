/**
 * AMDOX ERP service worker (F-12 — offline / PWA support).
 *
 * Strategy:
 *   • Navigations      → network-first, fall back to the cached page, then /offline.
 *   • Static assets    → stale-while-revalidate.
 *   • GET /api/v1/*    → network-first with a cached fallback, so read views keep
 *                        rendering offline with the last-known data.
 *   • Non-GET requests → never cached; they must reach the server.
 */

const VERSION = 'amdox-v1'
const SHELL_CACHE = `${VERSION}-shell`
const DATA_CACHE = `${VERSION}-data`
const OFFLINE_URL = '/offline'

const PRECACHE = [OFFLINE_URL, '/manifest.webmanifest', '/icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

function isStaticAsset(url) {
  return url.pathname.startsWith('/_next/static/') || /\.(?:css|js|svg|png|jpg|jpeg|webp|woff2?|ico)$/.test(url.pathname)
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Never cache the auth surface — a stale session response is worse than an error.
  if (url.pathname.startsWith('/api/v1/auth') || url.pathname === '/login') return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(async () => (await caches.match(request)) || (await caches.match(OFFLINE_URL)) || Response.error()),
    )
    return
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            const copy = response.clone()
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy))
            return response
          })
          .catch(() => cached)
        return cached || network
      }),
    )
    return
  }

  if (url.pathname.startsWith('/api/v1/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(DATA_CACHE).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(async () => {
          const cached = await caches.match(request)
          if (cached) return cached
          return new Response(
            JSON.stringify({ error: { code: 'offline', message: 'You are offline and this response was never cached.' } }),
            { status: 503, headers: { 'Content-Type': 'application/json' } },
          )
        }),
    )
  }
})

// Lets the app trigger an immediate activation after a deploy.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})
