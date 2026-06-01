// 상담 일정 위젯 - Service Worker
// 앱 셸(HTML/아이콘/매니페스트)만 캐싱한다. Firebase·gstatic·unpkg 등 외부 요청은
// 항상 네트워크로 보낸다(실시간 데이터를 캐싱하면 안 되므로).

const CACHE = 'schedule-widget-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // 외부 도메인(firebase, gstatic, unpkg 등)은 캐싱 없이 네트워크로만 처리
  if (!sameOrigin) return;

  // 같은 출처의 앱 셸은 캐시 우선, 없으면 네트워크
  e.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => cached);
    })
  );
});
