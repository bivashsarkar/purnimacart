# PurnimaCart Backend — Phase 5 (Admin Dashboard & Management)

## What changed

**Admin panel is now fully wired to live Firestore data.** Previously only the shell (auth gate, sidebar, layout) and a mock-data Dashboard/Orders screen existed. Every section is now a real, working screen:

- **Dashboard** (`src/admin/AdminDashboard.tsx`) — revenue, orders, products, customers, coupons, pending/delivered counts, low-stock alerts, top products, recent orders, and a combined revenue+orders chart, all computed live from Firestore (`src/lib/services/adminDashboard.ts`, `src/admin/hooks/useAdminDashboard.ts`).
- **Products** (`AdminProducts.tsx`) — create/edit/delete, multi-image Cloudinary upload, stock, featured flag, variants (size/color/stock), search + category filter + pagination.
- **Categories** (`AdminCategories.tsx`) — CRUD, live product counts per category, deletion blocked (with an explanatory dialog) while products still reference that category (`categoryHasProducts()`).
- **Coupons** (`AdminCoupons.tsx`) — flat/percentage CRUD, expiry date, usage limit, minimum purchase, enable/disable toggle, shows "Expired" / "Limit reached" badges.
- **Banners** (`AdminBanners.tsx`) — image upload, active/inactive toggle, optional start/end scheduling (`isBannerLive()` in `lib/services/misc.ts` — a banner is only "live" on the storefront when active *and* inside its schedule window, if one is set).
- **Orders** (`AdminOrders.tsx`) — realtime list, search/filter/pagination, a detail modal with the full item/address/payment breakdown, a tracking-note field, and status transition buttons (pending → packed → shipped → delivered, or cancel at any non-terminal state).
- **Customers** (`AdminCustomers.tsx`) — directory derived from `users` + `orders`, with per-customer order count and lifetime spend (cancelled orders excluded from spend).
- **Settings** (`AdminSettings.tsx`) — store name/email/phone/address, delivery charge, free-delivery threshold, tax percent, social links.

**New Cloud Function: `adminUpdateOrderStatus`** (`functions/src/orderAdmin.ts`)
Every order-status change — including cancellation — now goes through this callable instead of a direct client write. It enforces valid status transitions server-side (mirrored client-side in `AdminOrders.tsx` so the UI never offers an invalid move) and, on cancellation, atomically restores stock for every line item in the same transaction (`restoreStockInTransaction` in `functions/src/stock.ts`) and flips `paymentStatus` to `refunded` if the order had already been paid.

**Security (`firestore.rules`)**
- `orders` update is now `allow update: if false` for every client, admin included — the Cloud Function above is the only path, closing off any way to tamper with an order's items/total/userId from the admin panel.
- `products` and `coupons` writes now carry basic data-integrity checks (price/stock/value/minOrderValue/usageLimit can never go negative; `offerPrice` can never exceed `price`) in addition to the existing `isAdmin()` gate.
- Nothing else in the security model changed — the Cloud-Function-only order *creation* path from Phase 4 is untouched.

**Types** (`src/types/firestore.ts`) — extended `FirestoreProduct` (`isFeatured`, `updatedAt`), `FirestoreBanner` (`title`, `startDate`, `endDate`), and `StoreSettings` (`storeName`, `storeEmail`, `storePhone`, `storeAddress`, `taxPercent`, `socialLinks`). Older documents written before this phase are merged with sensible defaults on read (`getStoreSettings()`, `useStoreSettings()`), so nothing breaks if you deploy this against existing data.

**Nothing on the customer-facing storefront was redesigned** — checkout, cart, wishlist, product browsing, and the Phase 4 payment flow all work exactly as before. `firestore.indexes.json` didn't need any new composite indexes; every new admin query is either unfiltered (`orderBy` only) or a single-field `where`.

## Verified before hand-off
- `npm run build` (client) — succeeds.
- `npx tsc --noEmit` (client) — no type errors. (Root `tsconfig.json` now explicitly excludes `functions/`, which is its own package with its own tsconfig/dependencies — this was already implicitly broken before Phase 5 since `functions/` was never installed at the root.)
- `cd functions && npx tsc --noEmit` — no type errors.

## Deploying this
Same process as Phase 4 — nothing new to configure:
```
firebase deploy --only firestore:rules,functions
npm run build && firebase deploy --only hosting
```

## Still left after this phase
- Real Razorpay refund call on cancellation — currently `adminUpdateOrderStatus` only flips `paymentStatus` to `refunded` as a bookkeeping flag; wiring an actual `razorpay.payments.refund()` call would be a natural Phase 6 addition (see the same note in `PHASE4_SETUP.md`).
- Category/banner drag-to-reorder UI — `reorderCategories()` already exists in `lib/services/categories.ts` but isn't wired to a drag handle in `AdminCategories.tsx` yet; new categories/banners are appended at the end of the current order.
- Customer-facing order-status notifications (email/SMS) on status change — not built.
