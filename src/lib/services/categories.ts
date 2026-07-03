import {
  collection, doc, getDocs, setDoc, deleteDoc, updateDoc, onSnapshot,
  query, where, orderBy, limit as fbLimit, serverTimestamp, addDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { FirestoreCategory } from '../../types/firestore';

const COL = 'categories';

export async function getCategories(): Promise<FirestoreCategory[]> {
  const q = query(collection(db, COL), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreCategory));
}

// Realtime feed for the admin Categories screen.
export function subscribeCategoriesAdmin(
  onData: (categories: FirestoreCategory[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(collection(db, COL), orderBy('order', 'asc'));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map(d => ({ id: d.id, ...d.data() } as FirestoreCategory))),
    (error) => {
      console.error('subscribeCategoriesAdmin: listener failed', error);
      onError?.(error as unknown as Error);
    }
  );
}

export async function createCategory(data: Omit<FirestoreCategory, 'id' | 'createdAt'>) {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateCategory(id: string, data: Partial<FirestoreCategory>) {
  await updateDoc(doc(db, COL, id), data);
}

export async function deleteCategory(id: string) {
  await deleteDoc(doc(db, COL, id));
}

// Guard used by the admin UI before deleting a category — Firestore has no
// native foreign-key constraints, so this is enforced in application code.
export async function categoryHasProducts(categorySlug: string): Promise<boolean> {
  const q = query(collection(db, 'products'), where('categorySlug', '==', categorySlug), fbLimit(1));
  const snap = await getDocs(q);
  return !snap.empty;
}

export async function reorderCategories(orderedIds: string[]) {
  await Promise.all(
    orderedIds.map((id, index) => updateDoc(doc(db, COL, id), { order: index }))
  );
}

// One-time helper to load the 7 seed categories from the spec into Firestore.
// Call manually once from the browser console or a temporary admin button —
// not auto-run, so it never overwrites real data by accident.
export async function seedDefaultCategories() {
  const seeds: Array<Omit<FirestoreCategory, 'id' | 'createdAt'>> = [
    { name: 'Toys', slug: 'toys', image: '', order: 0, isActive: true },
    { name: 'Dresses', slug: 'dresses', image: '', order: 1, isActive: true },
    { name: 'Cosmetics', slug: 'cosmetics', image: '', order: 2, isActive: true },
    { name: 'Gifts', slug: 'gifts', image: '', order: 3, isActive: true },
    { name: 'Chocolates', slug: 'chocolates', image: '', order: 4, isActive: true },
    { name: 'Accessories', slug: 'accessories', image: '', order: 5, isActive: true },
    { name: 'Photo Frames', slug: 'photo-frames', image: '', order: 6, isActive: true },
  ];
  for (const s of seeds) {
    await setDoc(doc(collection(db, COL)), { ...s, createdAt: serverTimestamp() });
  }
}
