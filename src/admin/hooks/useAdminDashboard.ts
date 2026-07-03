import { useEffect, useMemo, useState } from 'react';
import { useAdminOrders } from './useAdminOrders';
import { useAdminProducts } from './useAdminProducts';
import { useAdminCoupons } from './useAdminCoupons';
import { getAllCustomersWithStats } from '../../lib/services/customers';
import { computeDashboardStats } from '../../lib/services/adminDashboard';

export function useAdminDashboard() {
  const { orders, loading: ordersLoading, error: ordersError } = useAdminOrders();
  const { products, loading: productsLoading, error: productsError } = useAdminProducts();
  const { coupons, loading: couponsLoading, error: couponsError } = useAdminCoupons();
  const [customerCount, setCustomerCount] = useState(0);
  const [customersLoading, setCustomersLoading] = useState(true);

  useEffect(() => {
    getAllCustomersWithStats()
      .then((data) => setCustomerCount(data.length))
      .catch((err) => console.error(err))
      .finally(() => setCustomersLoading(false));
  }, []);

  const stats = useMemo(
    () => computeDashboardStats(orders, products, customerCount, coupons),
    [orders, products, customerCount, coupons]
  );

  const loading = ordersLoading || productsLoading || couponsLoading || customersLoading;
  const error = ordersError || productsError || couponsError || null;

  return { stats, loading, error };
}
