// Simple Service Worker para maging installable ang app
self.addEventListener('install', (e) => {
  console.log('Service Worker: Installed');
});

self.addEventListener('fetch', (e) => {
  // Pinapayagan nito ang app na mag-load kahit offline ang ibang resources
  e.respondWith(fetch(e.request));
});