// ══════════════════════════════════════════════════════════════════════
// HalıSaha PRO – Service Worker v3 (FCM + Cache)
// ══════════════════════════════════════════════════════════════════════
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

const CACHE = 'halisaha-v3';
const PRECACHE = ['/index.html', '/style.css', '/app.js', '/manifest.json'];

// ── Firebase init for FCM ──
firebase.initializeApp({
    apiKey: "AIzaSyAgWXDIgIR503HIK_z7dVYzI-kvg9VFGsk",
    authDomain: "halisaha-app-898e2.firebaseapp.com",
    projectId: "halisaha-app-898e2",
    storageBucket: "halisaha-app-898e2.firebasestorage.app",
    messagingSenderId: "423261008778",
    appId: "1:423261008778:web:e8f2a08bfcacb96b4c8e73"
});

const messaging = firebase.messaging();

// ── Background FCM push handler ──
messaging.onBackgroundMessage((payload) => {
    const { title, body, icon } = payload.notification || {};
    const data = payload.data || {};

    self.registration.showNotification(title || '⚽ HalıSaha PRO', {
        body: body || 'Yeni bir bildirim var!',
        icon: icon || '/icon-192.png',
        badge: '/badge.png',
        tag: data.type || 'general',
        data: { matchId: data.matchId, type: data.type, url: '/' },
        actions: data.type === 'match_invite' ? [
            { action: 'accept', title: '✅ Kabul Et' },
            { action: 'reject', title: '❌ Reddet' }
        ] : data.type === 'sos_invite' ? [
            { action: 'accept', title: '🙋 Gidiyorum!' }
        ] : [],
        vibrate: [200, 100, 200],
        requireInteraction: ['match_invite','sos_invite'].includes(data.type)
    });
});

// ── Notification click ──
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const data = event.notification.data || {};
    const action = event.action;

    if (action === 'accept' || action === '') {
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cls => {
                const url = data.matchId ? `/?matchId=${data.matchId}&action=accept` : '/';
                for (const c of cls) { if (c.url.startsWith(self.location.origin) && 'focus' in c) { c.postMessage({ type: 'NOTIF_CLICK', data }); return c.focus(); } }
                return clients.openWindow(url);
            })
        );
    }
});

// ── Install ──
self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

// ── Activate ──
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

// ── Fetch (Cache First for statics, Network First for API) ──
self.addEventListener('fetch', e => {
    const url = new URL(e.request.url);
    if (url.hostname.includes('googleapis.com') || url.hostname.includes('gstatic.com') || url.hostname.includes('openweathermap.org')) {
        e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
        return;
    }
    if (e.request.method !== 'GET') return;
    e.respondWith(
        caches.match(e.request).then(cached => {
            const fresh = fetch(e.request).then(res => {
                if (res.ok) { const clone = res.clone(); caches.open(CACHE).then(c => c.put(e.request, clone)); }
                return res;
            }).catch(() => cached);
            return cached || fresh;
        })
    );
});