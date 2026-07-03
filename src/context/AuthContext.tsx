import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import type { FirestoreUser } from '../types/firestore';

interface AuthContextValue {
  user: User | null;
  userDoc: FirestoreUser | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<FirestoreUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubUserDoc: (() => void) | null = null;

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      unsubUserDoc?.();
      unsubUserDoc = null;

      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          const newUser: Omit<FirestoreUser, 'createdAt'> = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || 'PurnimaCart Customer',
            email: firebaseUser.email || '',
            photoURL: firebaseUser.photoURL || '',
            addresses: [],
          };
          await setDoc(userRef, { ...newUser, createdAt: serverTimestamp() });
        }
        // Live subscription so address book edits (add/edit/delete/set default)
        // reflect immediately everywhere userDoc is consumed (checkout, etc.)
        unsubUserDoc = onSnapshot(userRef, (userSnap) => {
          if (userSnap.exists()) setUserDoc(userSnap.data() as FirestoreUser);
        });
        // Admin check: presence of a doc in `admins/{uid}` grants admin panel access.
        // See firestore.rules — this same check is enforced server-side, this is UI-only gating.
        const adminSnap = await getDoc(doc(db, 'admins', firebaseUser.uid));
        setIsAdmin(adminSnap.exists());
      } else {
        setUserDoc(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => {
      unsub();
      unsubUserDoc?.();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(auth, googleProvider);
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  return (
    <AuthContext.Provider value={{ user, userDoc, loading, isAdmin, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
