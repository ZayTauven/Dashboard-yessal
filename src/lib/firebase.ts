import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyB6L5d1TIDCavFpXdb56qXzTmjOKx24fbE",
  authDomain: "yessal-gui-444.firebaseapp.com",
  projectId: "yessal-gui-444",
  storageBucket: "yessal-gui-444.firebasestorage.app",
  messagingSenderId: "737413621097",
  appId: "1:737413621097:web:dbf08040b00cd7688109f8",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') return null;
  try {
    return getMessaging(app);
  } catch {
    return null;
  }
}

// VAPID key from Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
export const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? '';

export { getToken, onMessage };
