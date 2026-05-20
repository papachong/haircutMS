import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist, CacheFirst, StaleWhileRevalidate, ExpirationPlugin } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[];
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  onInstall: () => {
    self.skipWaiting();
  },
  onActivate: () => {
    self.clients.claim();
  },
  runtimeCaching: [
    {
      urlPattern: /^\/api\/v1\/service-items/,
      handler: new CacheFirst({
        cacheName: 'service-items-cache',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 60 * 60, // 1 hour
          }),
        ],
      }),
      method: 'GET',
    },
    {
      urlPattern: /^\/api\/v1\/service-categories/,
      handler: new CacheFirst({
        cacheName: 'service-categories-cache',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 20,
            maxAgeSeconds: 60 * 60, // 1 hour
          }),
        ],
      }),
      method: 'GET',
    },
    {
      urlPattern: /^\/api\/v1\/staff/,
      handler: new CacheFirst({
        cacheName: 'staff-cache',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 60 * 60, // 1 hour
          }),
        ],
      }),
      method: 'GET',
    },
    {
      urlPattern: /\/api\/v1\/members\/search/,
      handler: new StaleWhileRevalidate({
        cacheName: 'member-search-cache',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 100,
            maxAgeSeconds: 60 * 30, // 30 minutes
          }),
        ],
      }),
      method: 'GET',
    },
  ],
  navigationPreload: false,
});

// Offline fallback for /m/* navigation
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate' && event.request.url.includes('/m/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/m/offline') as Promise<Response | undefined>;
      })
    );
  }
});

// Background sync for order queue
self.addEventListener('sync', (event) => {
  if (event.tag === 'order-sync') {
    event.waitUntil(flushPendingOrders());
  }
});

async function flushPendingOrders(): Promise<void> {
  // Notify all clients to flush the order queue
  const clients = await self.clients.matchAll({ type: 'window' });
  for (const client of clients) {
    client.postMessage({ type: 'FLUSH_ORDER_QUEUE' });
  }
}

serwist.addEventListeners();
