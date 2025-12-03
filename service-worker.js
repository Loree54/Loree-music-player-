// service-worker.js
const CACHE_NAME = 'zenith-player-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Montserrat:wght@800;900&display=swap'
];

// Install event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

// Activate event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});

// Background sync for offline playback
self.addEventListener('sync', (event) => {
    if (event.tag === 'playback-sync') {
        // Handle background playback sync
        console.log('Background sync for playback');
    }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    const actions = {
        'play': () => {
            // Send play command to all clients
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({ action: 'play' });
                });
            });
        },
        'pause': () => {
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({ action: 'pause' });
                });
            });
        },
        'next': () => {
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({ action: 'next' });
                });
            });
        },
        'prev': () => {
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({ action: 'prev' });
                });
            });
        }
    };
    
    if (actions[event.action]) {
        actions[event.action]();
    } else {
        // Default: focus/open the app
        event.waitUntil(
            self.clients.matchAll({ type: 'window' }).then(clients => {
                if (clients.length > 0) {
                    return clients[0].focus();
                }
                return self.clients.openWindow('/');
            })
        );
    }
});
