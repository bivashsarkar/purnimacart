import { useEffect, useState } from 'react';
import type { FirestoreCategory } from '../../types/firestore';
import { subscribeCategoriesAdmin } from '../../lib/services/categories';

export function useAdminCategories() {
  const [categories, setCategories] = useState<FirestoreCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeCategoriesAdmin(
      (data) => {
        setCategories(data);
        setLoading(false);
        setError(null);
      },
      () => {
        setError('Could not load categories right now.');
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  return { categories, loading, error };
}
