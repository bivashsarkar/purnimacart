# Phase 2 — Progress Notes (Pass 1: Storefront wired to Firestore)

## What changed in this pass

**New files**
- `src/lib/adapters.ts` — converts `FirestoreProduct` / `FirestoreCategory` into the existing UI `Product` / `Category` types, so no component needs to know about the Firestore shape.
- `src/hooks/useProducts.ts` — `useActiveProducts()`, realtime (`onSnapshot`) list of `isActive: true` products, newest first.
- `src/hooks/useCategories.ts` — `useCategories(products)`, realtime category list ordered by `order`, with an `"All Products"` entry synthesized on top and live product counts per category.

**Modified**
- `main.tsx` — wrapped the app in `<AuthProvider>` (it existed but was never mounted).
- `App.tsx` — `PRODUCTS` now comes from `useActiveProducts()`, categories from `useCategories()`. Added a loading spinner and an inline error banner for the storefront (no more blank screen while Firestore loads). The hardcoded category-id chip array on the Catalogue page is now built from live categories. The `/admin` route is now gated: unauthenticated or non-admin users see a sign-in / access-denied screen instead of the panel — admin access is driven entirely by the `admins/{uid}` Firestore doc via `AuthContext`, nothing hardcoded.
- `Header.tsx` — real Google sign-in/sign-out wired to `AuthContext`. Shows the signed-in user's avatar/name/email in the profile menu. "Admin Panel" link only appears for actual admins (`isAdmin`). Passes live `products`/`categories` down to `SearchOverlay`.
- `CategoryList.tsx` — now takes `categories` as a prop instead of importing the mock `CATEGORIES` array. Icon lookup is now keyed by category `slug` with a generic fallback icon, so any new category an admin creates later still renders instead of breaking.
- `SearchOverlay.tsx` — now takes `products`/`categories` as props instead of importing the mocks.
- `tsconfig.json` — added `"types": ["vite/client"]` (pre-existing gap — `import.meta.env` wasn't type-checking before this).

## Deliberately left as-is (out of scope for this pass)

- **Cart & wishlist** stay in `localStorage`. The Phase 2 spec's "zero localStorage" requirement is about product/category/banner persistence (the Firestore collections list explicitly excludes Orders for now), not client-side cart state — there's no `orders` write path yet, so there's nothing real to persist cart/wishlist into. This gets replaced when Phase 3/4 (checkout + orders) is wired.
- **Hero carousel & "Featured Collections" bento grid** — still hardcoded marketing copy/images (`App.tsx` `heroSlides`, `BentoCollections.tsx`). The Firestore `Banner` model is images-only with no title/subtitle/CTA fields (per your own spec: "Never support links. Never support CTA buttons."), so wiring it in as-is would either break the existing hero layout or require a design change — which the brief says not to do. Flagging this so you can decide: keep hero static, or add a separate lightweight banner strip fed by the real `banners` collection.
- **Bento grid product links** currently point at old mock product IDs (e.g. `summer-luxe-lehenga`) which won't exist once real Firestore products replace the mocks — clicking them will silently go nowhere until it's rewired to real product IDs or category links.
- **`SPECIAL_OFFERS` (coupons UI), `MOCK_REVIEWS`, `TRENDING_SEARCHES`** — untouched. Your spec explicitly says "Do NOT create Orders or Coupons yet," and reviews aren't in the Phase 2 collection list either.
- **Admin dashboard/orders** — still reading `adminData.ts` mocks. This is the next pass (admin CRUD + Cloudinary uploads), per what you picked.

## Before you run this

1. Copy `.env.example` to `.env` and fill in your real `VITE_FIREBASE_*` values (Cloudinary vars aren't needed yet — that's next pass).
2. Make sure Firestore actually has `categories` and `products` documents with `isActive: true`, or the storefront will show the loading spinner forever with an empty result underneath. Use `seedDefaultCategories()` in `src/lib/services/categories.ts` for a quick starter set if you don't have real ones yet (it only fills the `image` field with `''`, so you'd still want to add real Cloudinary URLs before going live).
3. Make yourself admin: after your first Google sign-in, grab your uid from Firebase Console → Authentication, then manually create `admins/{your-uid}` in Firestore.

## Next pass (admin CRUD)

- `uploadService.ts` for Cloudinary (single/multi upload, delete, preview).
- Admin Products screen (create/edit/delete, image upload, variants, stock).
- Admin Categories screen (create/edit/delete/reorder, image upload).
- Admin Banners screen (upload/delete/reorder/preview).
- Live Dashboard numbers reading Firestore instead of `adminData.ts`.
