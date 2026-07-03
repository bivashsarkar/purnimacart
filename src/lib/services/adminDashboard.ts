// Pure aggregation helpers for the admin Dashboard. Kept side-effect free
// and framework-agnostic so the numbers are easy to unit test — all the
// Firestore listening happens in src/admin/hooks/useAdminDashboard.ts,
// which feeds already-loaded orders/products/coupons into computeDashboardStats.
import type { FirestoreOrder, FirestoreProduct, FirestoreCoupon } from '../../types/firestore';

export interface SalesDay {
  day: string; // e.g. "Mon"
  revenue: number;
  orders: number;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  activeCoupons: number;
  pendingOrders: number;
  deliveredOrders: number;
  todaysOrders: number;
  lowStockProducts: FirestoreProduct[];
  recentOrders: FirestoreOrder[];
  topProducts: FirestoreProduct[];
  salesLast7Days: SalesDay[];
}

const LOW_STOCK_THRESHOLD = 5;

export function computeDashboardStats(
  orders: FirestoreOrder[],
  products: FirestoreProduct[],
  customerCount: number,
  coupons: FirestoreCoupon[]
): DashboardStats {
  const nonCancelled = orders.filter((o) => o.orderStatus !== 'cancelled');
  const totalRevenue = nonCancelled.reduce((sum, o) => sum + o.total, 0);

  const lowStockProducts = products
    .filter((p) => p.isActive && p.stock <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 6);

  const recentOrders = [...orders]
    .sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0))
    .slice(0, 6);

  const topProducts = [...products]
    .filter((p) => p.isActive)
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 5);

  const pendingOrders = orders.filter((o) => o.orderStatus === 'pending' || o.orderStatus === 'packed').length;
  const deliveredOrders = orders.filter((o) => o.orderStatus === 'delivered').length;

  const now = new Date();
  const todayKey = now.toDateString();
  const todaysOrders = orders.filter((o) => o.createdAt?.toDate().toDateString() === todayKey).length;

  // Build a fixed 7-day window (oldest → newest) and bucket revenue into it.
  const buckets: (SalesDay & { dateKey: string })[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    buckets.push({ day: d.toLocaleDateString('en-US', { weekday: 'short' }), dateKey: d.toDateString(), revenue: 0, orders: 0 });
  }
  nonCancelled.forEach((o) => {
    const d = o.createdAt?.toDate();
    if (!d) return;
    const bucket = buckets.find((b) => b.dateKey === d.toDateString());
    if (bucket) {
      bucket.revenue += o.total;
      bucket.orders += 1;
    }
  });

  return {
    totalRevenue,
    totalOrders: orders.length,
    totalProducts: products.length,
    totalCustomers: customerCount,
    activeCoupons: coupons.filter((c) => c.isActive).length,
    pendingOrders,
    deliveredOrders,
    todaysOrders,
    lowStockProducts,
    recentOrders,
    topProducts,
    salesLast7Days: buckets.map(({ day, revenue, orders }) => ({ day, revenue, orders })),
  };
}
