# PurnimaCart Backend — Phase 4 (Secure Payments + Cloud Functions)

## What changed

**New: `functions/` — a Cloud Functions (Node 20 + TypeScript) package**
- `createRazorpayOrder` — prices the cart from live Firestore data (never the client's numbers), validates any coupon, opens a Razorpay order, stores a `checkoutSessions/{id}` doc as the source of truth for verification.
- `verifyPayment` — the *only* place a payment is trusted. Verifies the HMAC-SHA256 signature server-side, then atomically deducts stock and creates the paid order in one Firestore transaction. Idempotent — safe to call twice.
- `placeOrder` — Cash on Delivery path. Same server-side pricing/coupon/stock logic, no payment step.
- `validateCoupon` — read-only preview used by the checkout UI (no side effects, doesn't burn a redemption).
- `updateInventory` — admin-only manual stock correction utility.
- `razorpayWebhook` — safety net: if the client's `verifyPayment` call never lands (browser closed, network drop), Razorpay's webhook retries independently finalize the same order (idempotent via `checkoutSessions` status).

**Client wiring**
- `src/lib/services/checkout.ts` — typed wrappers around the callables above, plus `describeCheckoutError()` for friendly error copy (cancelled, failed, invalid signature, network, stock/coupon precondition failures).
- `src/lib/razorpayCheckout.ts` — dynamically loads `checkout.js` and opens the Razorpay modal.
- `src/components/CheckoutPage.tsx` — now calls the Cloud Functions instead of validating coupons or writing orders directly. Client-side totals are a preview only; the server recomputes everything before anything is charged.
- `src/lib/services/orders.ts` — `createOrder()` (the old direct-write path) now throws immediately — kept only so a stray import fails loudly instead of silently hitting a permission error.

**Security**
- `firestore.rules` — `orders` create is now `allow create: if false;` for clients. Every order is created by a Cloud Function using the Admin SDK, which bypasses rules — so this fully closes the door on a client faking a "paid" order. `checkoutSessions` is fully server-only. `coupons/{id}/usage/{uid}` (per-user redemption tracking) is fully server-only.
- Razorpay secret key never reaches the client — it lives only in Cloud Functions secrets.
- Stock decrements happen inside a Firestore transaction shared by both the COD and Razorpay paths, so two simultaneous checkouts can't oversell the last unit.

**Nothing else was touched** — auth, product browsing, cart, wishlist, search/filters, the admin panel, and Cloudinary uploads all work exactly as they did in Phase 3.

## Deploying this

1. `cd functions && npm install`
2. Log in and select your project: `firebase login`, then edit `.firebaserc` to put your real project ID in place of `your-firebase-project-id`.
3. Set the Razorpay secrets (never put these in `.env` files that get committed):
   ```
   firebase functions:secrets:set RAZORPAY_KEY_ID
   firebase functions:secrets:set RAZORPAY_KEY_SECRET
   firebase functions:secrets:set RAZORPAY_WEBHOOK_SECRET
   ```
4. Deploy rules, indexes, and functions:
   ```
   firebase deploy --only firestore:rules,firestore:indexes,functions
   ```
5. In the Razorpay Dashboard → Webhooks, add an endpoint pointing at your deployed `razorpayWebhook` function URL (shown after deploy), subscribed to the `payment.captured` event, using the same secret you set as `RAZORPAY_WEBHOOK_SECRET`.
6. `npm run build` the client as usual and deploy to hosting (`firebase deploy --only hosting`) or wherever you're currently deploying it.

### Local testing
- `cd functions && npm run serve` starts the Functions + Firestore emulators. Point the client's `VITE_FIREBASE_*` config at the emulator or use `connectFunctionsEmulator`/`connectFirestoreEmulator` in `src/lib/firebase.ts` if you want a fully local loop (not wired up automatically here, to avoid touching working prod config).
- Use Razorpay's test mode keys (`rzp_test_...`) and their published test card/UPI numbers to exercise the full flow without moving real money.

## Verified before hand-off
- `npm run build` (client) — succeeds.
- `npx tsc --noEmit` (client) — no type errors.
- `functions && npx tsc --noEmit` and `npm run build` — no type errors, compiles cleanly.

## Still left after this phase
- Admin panel: order status updates should eventually trigger customer-facing notifications (email/SMS) — not built.
- Refund flow: if `verifyPayment` signature check fails after money was actually deducted (rare edge case, e.g. tampered client), the UI tells the customer it'll be auto-refunded, but no automated refund call to Razorpay exists yet — that would be a `refundPayment` function using `razorpay.payments.refund()`.
- Cloudinary image upload — already wired in Phase 3, untouched here.
- No automated tests around the Cloud Functions (transaction race conditions, signature verification) — worth adding before high-volume production traffic.
