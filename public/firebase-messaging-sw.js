importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAeyx7pc8sbG2FYx30DaR0VxTPXIRrSU5U",
  authDomain: "yessal-gui-6d7e0.firebaseapp.com",
  projectId: "yessal-gui-6d7e0",
  storageBucket: "yessal-gui-6d7e0.firebasestorage.app",
  messagingSenderId: "885079557757",
  appId: "1:885079557757:web:e92d0d0fc96e3e0a105314",
});

const messaging = firebase.messaging();

// Background push notifications (app not in focus)
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Yessal';
  const body = payload.notification?.body || '';
  self.registration.showNotification(title, {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data || {},
  });
});

// Open /dashboard/notifications when notification is clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard/notifications';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/dashboard') && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
