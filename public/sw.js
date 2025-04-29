const CACHE_NAME = 'sporty-clone-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/default.png',
  '/loader.gif',
  '/assets/css/base.css',
  '/assets/css/main.css',
  '/assets/css/loading.css'
];

// File extensions to cache
const CACHEABLE_EXTENSIONS = [
  '.css',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot'
];

// Paths to exclude from caching
const EXCLUDED_PATHS = [
  '/src/',
  '.vue',
  '.js',
  '.ts',
  '.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

// Fetch event - serve from cache if available
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const pathname = url.pathname;
  
  // First check if this is a source file that should be excluded
  const isSourceFile = EXCLUDED_PATHS.some(path => 
    pathname.includes(path) || 
    pathname.endsWith(path)
  );

  if (isSourceFile) {
    // For source files, always fetch from network
    return fetch(event.request);
  }

  // Handle image and CSS requests
  if (event.request.url.match(/\.(png|jpg|jpeg|gif|css)$/)) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Return cached response if found
          if (response) {
            return response;
          }

          // Otherwise fetch from network
          return fetch(event.request)
            .then((response) => {
              // Don't cache if not a valid response
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              // Clone the response
              const responseToCache = response.clone();

              // Cache the new response
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });

              return response;
            });
        })
    );
  }
});

// Helper function to fetch and cache
async function fetchAndCache(request) {
  try {
    const response = await fetch(request);
    
    // Don't cache if not a valid response
    if (!response || response.status !== 200 || response.type !== 'basic') {
      return response;
    }

    // Clone the response
    const responseToCache = response.clone();

    // Cache the new response
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, responseToCache);

    return response;
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error;
  }
} 