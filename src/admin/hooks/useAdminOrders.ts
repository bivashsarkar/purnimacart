import { useEffect, useState } from 'react';
import type { FirestoreOrder } from '../../types/firestore';
import { subscribeAllOrdersAdmin } from '../../lib/services/orders';

export function useAdminOrders() {
  const [orders, setOrders] = useState<FirestoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeAllOrdersAdmin(
      (data) => {
        setOrders(data);
        setLoading(false);
        setError(null);
      },
      () => {
        setError('Could not load orders right now.');
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  return { orders, loading, error };
}
