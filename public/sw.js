const CACHE_NAME = 'gas-cylinder-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/manifest.json',
  '/icons/icon.svg',
  '/vite.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from Gas Cylinder Manager',
    icon: '/icons/icon.svg',
    badge: '/vite.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icons/icon.svg'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon.svg'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Gas Cylinder Manager', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync function
async function doBackgroundSync() {
  try {
    // Sync offline data when connection is restored
    const offlineData = localStorage.getItem('offlineData');
    if (offlineData) {
      // Send offline data to server
      await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: offlineData
      });
      
      // Clear offline data after successful sync
      localStorage.removeItem('offlineData');
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
} 