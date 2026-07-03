import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCbsmMTGagtxC7N-Ph2M8gM5Lv8go5B3Ts',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'purnima-cart.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'purnima-cart',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'purnima-cart.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '332871129526',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:332871129526:web:969fae25ac3edb7d088917',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-X801QBRSK6',
};

// Avoid re-initializing during Vite HMR
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
// Region must match `setGlobalOptions({ region: ... })` in functions/src/index.ts
export const functions = getFunctions(app, 'asia-south1');

export const googleProvider = new GoogleAuthProvider();
// Always show the account chooser instead of auto-picking the last used Google account
googleProvider.setCustomParameters({ prompt: 'select_account' });

let analytics: Analytics | null = null;

if (typeof window !== 'undefined') {
  void isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      analytics = null;
    });
}

export { analytics };
