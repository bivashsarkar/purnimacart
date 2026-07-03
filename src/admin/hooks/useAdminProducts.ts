import { useEffect, useState } from 'react';
import type { FirestoreProduct } from '../../types/firestore';
import { subscribeAllProductsAdmin } from '../../lib/services/products';

export function useAdminProducts() {
  const [products, setProducts] = useState<FirestoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeAllProductsAdmin(
      (data) => {
        setProducts(data);
        setLoading(false);
        setError(null);
      },
      () => {
        setError('Could not load products right now.');
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  return { products, loading, error };
}
