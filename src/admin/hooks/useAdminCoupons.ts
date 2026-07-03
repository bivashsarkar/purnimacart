import { useEffect, useState } from 'react';
import type { FirestoreCoupon } from '../../types/firestore';
import { subscribeCouponsAdmin } from '../../lib/services/misc';

export function useAdminCoupons() {
  const [coupons, setCoupons] = useState<FirestoreCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeCouponsAdmin(
      (data) => {
        setCoupons(data);
        setLoading(false);
        setError(null);
      },
      () => {
        setError('Could not load coupons right now.');
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  return { coupons, loading, error };
}
