const CACHE_NAME = 'stardust-hub-v21';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './app.js',
    './data.js',
    './firebase-db.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Cache opened');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
