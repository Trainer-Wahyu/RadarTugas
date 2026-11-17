const CACHE_NAME = 'tugasradar-cache-v1';

// Daftar seluruh file yang akan disimpan ke memori offline perangkat
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 1. Tahap Install: Mengunduh dan menyimpan semua file ke cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. Tahap Activate: Menghapus cache versi lama jika ada pembaruan kode
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Tahap Fetch: Mengambil file dari cache terlebih dahulu agar bisa berjalan offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Jika file ada di memori offline, langsung tampilkan; jika tidak, ambil dari internet
      return cachedResponse || fetch(event.request);
    })
  );
});
