'use client';

import { useEffect } from 'react';
import { getFirebaseMessaging, getToken, onMessage, VAPID_KEY } from '@/lib/firebase';
import { registerFCMToken } from '@/app/actions/notifications';
import { toast } from 'sonner';

export function FCMProvider() {
  useEffect(() => {
    if (!('Notification' in window) || !VAPID_KEY) return;

    const setup = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const messaging = getFirebaseMessaging();
        if (!messaging) return;

        const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: swReg,
        });

        if (token) {
          await registerFCMToken(token);
        }

        // Foreground push → show as toast
        onMessage(messaging, (payload) => {
          const title = payload.notification?.title || 'Notification';
          const body = payload.notification?.body;
          toast(title, {
            description: body,
            action: {
              label: 'Voir',
              onClick: () => window.location.href = payload.data?.url || '/dashboard/notifications',
            },
          });
        });
      } catch {
        // FCM not configured or blocked — silent fail
      }
    };

    setup();
  }, []);

  return null;
}
