// Raja Rani Police Thief - Production Service Worker
// Version: 1.0.0
const CACHE_NAME = 'raja-rani-pwa-v1';

// Core application shell assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/manifest.json',
  '/favicon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-512x512.png',
  '/icons/apple-touch-icon.png',
  '/assets/images/background.jpg'
];

// Install Event - Pre-cache critical app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use catch on each entry so one missing asset never breaks installation
      return Promise.allSettled(
        PRECACHE_ASSETS.map((asset) =>
          cache.add(asset).catch((err) => {
            console.warn(`[PWA SW] Failed to pre-cache: ${asset}`, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up stale cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log(`[PWA SW] Removing old cache: ${key}`);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Smart routing with ZERO interference with multiplayer & APIs
self.addEventListener('fetch', (event) => {
  // 1. Only process GET requests (POST, PUT, DELETE pass straight through)
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // 2. Cross-origin requests (e.g. Google Auth, CDNs) pass directly through
  if (url.origin !== self.location.origin) {
    return;
  }

  // 3. CRITICAL SAFETY: Never intercept or cache Socket.IO, API requests, or auth
  if (
    url.pathname.startsWith('/socket.io/') ||
    url.pathname.includes('/socket.io') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('/api')
  ) {
    // Return early to let browser perform standard network fetch without SW interference
    return;
  }

  // 4. Navigation requests (HTML page loads) - Network First with Cache Fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline fallback to app shell
          const cachedResponse = await caches.match('/index.html') || await caches.match('/');
          return cachedResponse || new Response('Offline: Raja Rani requires connection for multiplayer.', {
            headers: { 'Content-Type': 'text/plain' }
          });
        })
    );
    return;
  }

  // 5. Static Assets (Scripts, Styles, Images, Audio, Fonts) - Stale While Revalidate
  const isStaticAsset =
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/') ||
    /\.(js|css|png|jpg|jpeg|svg|webp|mp3|ogg|woff2?|ico|webmanifest)$/i.test(url.pathname);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Network failure: if we had a cached response, it was already returned
            return cachedResponse;
          });

        return cachedResponse || fetchPromise;
      })
    );
  }
});

// ============================================================
// 6. Push Notification Handling (FCM & Web Push)
// ============================================================
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  try {
    const payload = event.data.json();
    const notification = payload.notification || payload.data || {};
    const title = notification.title || payload.data?.title || '👑 Raja Rani';
    const body = notification.body || payload.data?.body || 'A royal battle awaits!';
    const icon = notification.icon || payload.data?.icon || '/icons/icon-192x192.png';
    const deepLink = payload.data?.deepLink || payload.fcmOptions?.link || '/';

    const notificationOptions = {
      body,
      icon,
      badge: '/icons/icon-192x192.png',
      data: {
        url: deepLink,
        sentAt: payload.data?.sentAt || new Date().toISOString(),
      },
      vibrate: [200, 100, 200],
      tag: 'raja-rani-push',
      renotify: true,
    };

    event.waitUntil(self.registration.showNotification(title, notificationOptions));
  } catch (err) {
    console.warn('[PWA SW] Failed to parse push payload:', err);
    // Fallback for plain text push messages
    const rawText = event.data.text();
    if (rawText) {
      event.waitUntil(
        self.registration.showNotification('👑 Raja Rani', {
          body: rawText,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
          data: { url: '/' },
        })
      );
    }
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open within our origin, focus it
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

