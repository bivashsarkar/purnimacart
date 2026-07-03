import { useCallback, useEffect, useState } from 'react';
import type { StoreSettings } from '../../types/firestore';
import { getStoreSettings, updateStoreSettings } from '../../lib/services/misc';

export function useAdminSettings() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true);
    getStoreSettings()
      .then((data) => {
        setSettings(data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError('Could not load store settings right now.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = useCallback(async (data: Partial<StoreSettings>) => {
    setSaving(true);
    try {
      await updateStoreSettings(data);
      setSettings((prev) => (prev ? { ...prev, ...data } : prev));
    } finally {
      setSaving(false);
    }
  }, []);

  return { settings, loading, error, saving, save, refresh };
}
