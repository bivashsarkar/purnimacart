import { useCallback, useEffect, useState } from 'react';
import { getAllCustomersWithStats, type AdminCustomer } from '../../lib/services/customers';

export function useAdminCustomers() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    getAllCustomersWithStats()
      .then((data) => {
        setCustomers(data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError('Could not load customers right now.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { customers, loading, error, refresh };
}
