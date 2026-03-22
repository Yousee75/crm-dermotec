// Satorea CRM — Service Worker v1
const CACHE_NAME = 'satorea-v1'

// Assets statiques a pre-cacher
const PRECACHE_URLS = [
  '/offline.html',
]

// ── Install : pre-cache les assets essentiels ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

// ── Activate : nettoyer les anciens caches ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch : strategie par type de requete ──
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorer les requetes non-GET
  if (request.method !== 'GET') return

  // Ignorer les requetes cross-origin (analytics, stripe, etc.)
  if (url.origin !== self.location.origin) return

  // API routes → network-only (jamais cacher les donnees dynamiques)
  if (url.pathname.startsWith('/api/')) return

  // Pages et assets → network-first avec fallback cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cacher la reponse reussie pour les assets statiques
        if (
          response.ok &&
          (url.pathname.match(/\.(js|css|woff2?|png|jpg|jpeg|svg|ico|webp)$/) ||
            url.pathname.startsWith('/_next/static/'))
        ) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() => {
        // Fallback : chercher dans le cache
        return caches.match(request).then((cached) => {
          if (cached) return cached
          // Pour les navigations, afficher la page offline
          if (request.mode === 'navigate') {
            return caches.match('/offline.html')
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' })
        })
      })
  )
})
