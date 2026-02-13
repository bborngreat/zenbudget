const CACHE_NAME = 'zenbudget-v1.3';
const FONT_CACHE = 'zenbudget-fonts-v1';

// Core assets (your existing ones + fonts)
const assets = [
  './index.html',
  './manifest.json',
  './logo-192x192.png',
  './logo-512x512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Font files to cache separately
const fontAssets = [
  './fonts/Inter-Regular.woff2',
  './fonts/Inter-Medium.woff2',
  './fonts/Poppins-Regular.woff2',
  './fonts/Poppins-SemiBold.woff2',
  './fonts/Poppins-Bold.woff2'
];

// Install event - cache everything
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache core assets
      caches.open(CACHE_NAME).then((cache) => {
        console.log('Caching core assets');
        return cache.addAll(assets);
      }),
      // Cache fonts separately
      caches.open(FONT_CACHE).then((cache) => {
        console.log('Caching fonts');
        return cache.addAll(fontAssets);
      })
    ])
  );
  
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          // Keep only our current caches
          if (cache !== CACHE_NAME && cache !== FONT_CACHE) {
            console.log('Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response if found
        if (response) {
          return response;
        }
        
        // Otherwise fetch from network
        return fetch(event.request).then((networkResponse) => {
          // Check if we got a valid response
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          
          // Determine which cache to use
          const isFont = event.request.url.includes('/fonts/');
          const cacheName = isFont ? FONT_CACHE : CACHE_NAME;
          
          // Clone the response (can only use it once)
          const responseToCache = networkResponse.clone();
          
          // Cache the new response
          caches.open(cacheName).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return networkResponse;
        }).catch(() => {
          // If both cache and network fail, return offline fallback for HTML
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('./index.html');
          }
        });
      })
  );
});
