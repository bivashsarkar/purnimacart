import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { FirestoreProduct } from '../types/firestore';
import { productFromFirestore } from '../lib/adapters';
import type { Product } from '../types';

interface UseProductsResult {
  products: Product[];
  loading: boolean;
  error: string | null;
}

// Realtime, storefront-facing: only active products, newest first.
// Uses onSnapshot per the backend spec's "realtime updates preferred" rule.
export function useActiveProducts(): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'products'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as FirestoreProduct)
        );
        setProducts(items.map(productFromFirestore));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('useActiveProducts: Firestore listener failed', err);
        setError('Could not load products right now.');
        setLoading(false);
      }
    );

    return unsub;
  }, []);

  return { products, loading, error };
}
