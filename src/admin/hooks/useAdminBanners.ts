import { useEffect, useState } from 'react';
import type { FirestoreBanner } from '../../types/firestore';
import { subscribeBannersAdmin } from '../../lib/services/misc';

export function useAdminBanners() {
  const [banners, setBanners] = useState<FirestoreBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeBannersAdmin(
      (data) => {
        setBanners(data);
        setLoading(false);
        setError(null);
      },
      () => {
        setError('Could not load banners right now.');
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  return { banners, loading, error };
}
