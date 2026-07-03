# PurnimaCart Backend — Phase 1 (Firebase Foundation)

## What's in this phase
- `src/lib/firebase.ts` — Firebase app/auth/Firestore init (reads env vars)
- `src/types/firestore.ts` — full data model types (Product, Category, Order, User, Coupon, Banner, Settings)
- `src/lib/services/categories.ts` — category CRUD + reorder + one-time seed helper
- `src/lib/services/products.ts` — product CRUD, category filter, local search, low-stock query
- `src/lib/services/misc.ts` — banners, coupons, store settings (delivery charge / free delivery threshold)
- `src/context/AuthContext.tsx` — Google sign-in, auto-creates `users/{uid}` on first login, admin check via `admins/{uid}`
- `firestore.rules` — security rules (public read on catalog, owner-only on users/cart/wishlist/orders, admin-only writes on catalog/settings/coupons/banners, orders locked from client-side status tampering)
- `.env.example` — updated with `VITE_FIREBASE_*`, `VITE_CLOUDINARY_*`, `VITE_RAZORPAY_KEY_ID` placeholders

**Nothing in your existing UI was touched.** `App.tsx`, `data.ts`, and all components still run exactly as before — this phase only adds the plumbing underneath. Phase 2 is where components get switched over to live data.

## What you need to do before Phase 2

1. **Create a Firebase project** at console.firebase.google.com (if you haven't).
2. **Enable Authentication → Google** sign-in provider.
3. **Create a Firestore database** (production mode).
4. **Register a Web app** in Project Settings → get your config values → copy `.env.example` to `.env` and fill in the `VITE_FIREBASE_*` values.
5. **Deploy the security rules**: `firebase deploy --only firestore:rules` (needs Firebase CLI + `firebase init` once, pointing at `firestore.rules`).
6. **Make yourself admin**: in Firestore, manually create a document at `admins/{your-uid}` (any field, e.g. `{ role: "owner" }`). Get your uid from Authentication → Users after your first Google sign-in.
7. `npm install` (pulls in the new `firebase` package).
8. Wrap your app root with `<AuthProvider>` from `src/context/AuthContext.tsx` (Phase 2 will do this wiring into `main.tsx`/`App.tsx`, or you can do it now).

## Roadmap — what's left

- **Phase 2:** Wire `Header`, `ProductCard`, `CategoryList`, `BentoCollections`, `ProductDetail`, `SearchOverlay`, `CartSidebar` to live Firestore data (replace `data.ts` mocks), add the Google sign-in button/flow to the UI.
- **Phase 3:** Cart page, Checkout page (address add/select, coupon field), Order Success, Order History, Order Details, Wishlist sync, Offers page, Address management, Cloudinary multi-image upload widget.
- **Phase 4:** Razorpay Checkout integration + a Cloud Function (or lightweight serverless endpoint) that verifies the Razorpay payment signature server-side before marking an order `paid`; coupon validation logic (min order value, expiry, usage limit).
- **Phase 5:** Admin CRUD screens — Products, Categories, Coupons, Banners, Settings, inline stock editor — admin route guard using `isAdmin` from `AuthContext`, live Dashboard numbers replacing `adminData.ts` mocks.

Say "start phase 2" whenever you're ready and I'll wire the storefront components to this backend.
