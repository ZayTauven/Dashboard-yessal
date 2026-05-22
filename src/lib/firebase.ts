import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyAeyx7pc8sbG2FYx30DaR0VxTPXIRrSU5U",
  authDomain: "yessal-gui-6d7e0.firebaseapp.com",
  projectId: "yessal-gui-6d7e0",
  storageBucket: "yessal-gui-6d7e0.firebasestorage.app",
  messagingSenderId: "885079557757",
  appId: "1:885079557757:web:e92d0d0fc96e3e0a105314",
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
