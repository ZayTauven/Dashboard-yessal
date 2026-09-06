importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyB6L5d1TIDCavFpXdb56qXzTmjOKx24fbE",
  authDomain: "yessal-gui-444.firebaseapp.com",
  projectId: "yessal-gui-444",
  storageBucket: "yessal-gui-444.firebasestorage.app",
  messagingSenderId: "737413621097",
  appId: "1:737413621097:web:dbf08040b00cd7688109f8",
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
