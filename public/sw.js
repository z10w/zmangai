const CACHE_NAME = 'mangaverse-v1'
const STATIC_CACHE_URL = 'static-v1'
const DYNAMIC_CACHE_URL = 'dynamic-v1'

// Assets to cache on install
const ASSETS_TO_CACHE = [
  '/',
  '/library',
  '/discover',
  '/icon-192.png',
  '/icon-512.png',
]

// API routes that should be cached
const CACHEABLE_API_ROUTES = [
  '/api/series',
  '/api/chapters',
  '/api/comments',
  '/api/ratings',
  '/api/reviews',
]

// Install event - cache assets and pages
self.addEventListener('install', (event: ExtendableEvent) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE)
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
  const cacheWhitelist = [CACHE_NAME, STATIC_CACHE_URL, DYNAMIC_CACHE_URL]
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.includes(cacheName)) {
            return Promise.resolve()
          }
          return caches.delete(cacheName)
        })
      )
    }).then(() => {
      return self.clients.claim()
    })
  )
})

// Fetch event - serve from cache with network-first strategy
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip caching for WebSocket, extensions, etc.
  if (
    url.protocol === 'ws:' ||
    url.protocol === 'wss:' ||
    url.pathname.startsWith('/api/auth') ||
    url.pathname.startsWith('/_next')
  ) {
    return
  }

  // Network-first strategy for API routes
  const isApiRoute = url.pathname.startsWith('/api')
  const isCacheableApi = CACHEABLE_API_ROUTES.some((route) =>
    url.pathname.startsWith(route)
  )

  if (isApiRoute && isCacheableApi) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            // Cache successful responses
            if (networkResponse && networkResponse.ok) {
              cache.put(request, networkResponse.clone())
            }
            return networkResponse
          }).catch(() => {
            // Return cached response if network fails
            return cachedResponse
          })

          // Return cached response immediately, fetch in background
          if (cachedResponse) {
            fetchPromise.then(() => {
              self.clients.matchAll({
                type: 'window',
              }).then((clients) => {
                clients.forEach((client) => {
                  client.postMessage({
                    type: 'CACHE_UPDATED',
                    url: url.pathname,
                  })
                })
              })
            })
          })

          return cachedResponse || fetchPromise
        })
      })
    )
  } else {
    // Cache-first strategy for static assets
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            // Verify cache is fresh
            const cachedDate = cachedResponse.headers.get('date')
            const currentDate = new Date().toUTCString()

            // If cache is older than 1 hour, fetch from network
            if (
              cachedDate &&
              new Date(cachedDate).getTime() < Date.now() - 60 * 60 * 1000
            ) {
              return fetch(request).then((networkResponse) => {
                if (networkResponse && networkResponse.ok) {
                  cache.put(request, networkResponse.clone())
                }
                return networkResponse
              })
            }

            return cachedResponse
          }

          // Fetch from network if not cached
          return fetch(request).then((networkResponse) => {
            // Cache successful responses for static assets
            if (networkResponse && networkResponse.ok && isCacheable(url)) {
              cache.put(request, networkResponse.clone())
            }
            return networkResponse
          })
        })
      })
    )
  }
})

// Helper function to check if URL should be cached
function isCacheable(url: URL): boolean {
  // Don't cache: API routes, Next.js internals, websocket
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    url.protocol === 'ws:' ||
    url.protocol === 'wss:'
  ) {
    return false
  }

  // Cache static assets
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)
  ) {
    return true
  }

  // Cache main pages
  if (url.pathname === '/' || url.pathname.match(/^\/(library|discover)/)) {
    return true
  }

  return false
}

// Listen for messages from clients
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === 'CACHE_BUST') {
    // Bust specific URL from cache
    if (event.data.url) {
      caches.open(CACHE_NAME).then((cache) => {
        const url = new URL(event.data.url, self.location.href)
        return cache.keys().then((keys) => {
          return Promise.all(
            keys
              .filter((key) => {
                const keyUrl = new URL(key, self.location.href)
                return keyUrl.pathname === url.pathname
              })
              .map((key) => cache.delete(key))
          )
        })
      })
    } else {
      // Bust all caches
      caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => caches.delete(key))
        )
      })
    }
  }

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Background sync for offline data
self.addEventListener('sync', (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === 'SYNC_LIBRARY') {
    // Sync user's library for offline access
    return caches.open(CACHE_NAME).then((cache) => {
      return cache.match('/api/library').then((response) => {
        if (response) {
          return response.json().then((data) => {
            // Process synced data
            console.log('Synced library data:', data)
          })
        }
      })
    })
  }

  if (event.data && event.data.type === 'SYNC_CONTINUE_READING') {
    // Sync continue reading data
    return caches.open(CACHE_NAME).then((cache) => {
      return cache.match('/api/progress?continue=true').then((response) => {
        if (response) {
          return response.json().then((data) => {
            console.log('Synced reading progress:', data)
          })
        }
      })
    })
  }
})

// Cleanup old caches periodically
self.addEventListener('periodicsync', (event) => {
  const CHECK_INTERVAL = 24 * 60 * 60 * 1000 // 24 hours

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.open(cacheName).then((cache) => {
            return cache.keys().then((keys) => {
              return Promise.all(
                keys.map((key) => {
                  return cache.match(key).then((response) => {
                    if (response) {
                      const cacheDate = response.headers.get('date')
                      if (cacheDate) {
                        const age = Date.now() - new Date(cacheDate).getTime()
                        // Delete entries older than 7 days
                        if (age > 7 * 24 * 60 * 60 * 1000) {
                          return cache.delete(key)
                        }
                      }
                    }
                    return Promise.resolve()
                  })
                })
              )
            })
          })
        })
      )
    })
  )
})
