import { HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { db } from './admin';
import type { FirestoreCoupon } from './types';

export interface CouponValidation {
  couponRef: FirebaseFirestore.DocumentReference;
  coupon: FirestoreCoupon;
  discountAmount: number;
}

// Throws HttpsError with a user-friendly message on any invalid state.
// Checks existence, active flag, expiry, min order value, global usage
// limit, AND per-user usage (one redemption per coupon per customer) via
// the coupons/{id}/usage/{uid} subcollection.
export async function validateCouponServerSide(
  code: string,
  subtotal: number,
  uid: string
): Promise<CouponValidation | null> {
  if (!code) return null;
  const normalized = code.trim().toUpperCase();

  const q = await db.collection('coupons').where('code', '==', normalized).limit(1).get();
  if (q.empty) {
    throw new HttpsError('not-found', 'Invalid coupon code.');
  }
  const couponDoc = q.docs[0];
  const coupon = couponDoc.data() as FirestoreCoupon;

  if (!coupon.isActive) {
    throw new HttpsError('failed-precondition', 'This coupon is no longer active.');
  }
  if (coupon.expiryDate && coupon.expiryDate.toMillis() < Date.now()) {
    throw new HttpsError('failed-precondition', 'This coupon has expired.');
  }
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    throw new HttpsError('failed-precondition', 'This coupon has reached its usage limit.');
  }
  if (subtotal < coupon.minOrderValue) {
    throw new HttpsError(
      'failed-precondition',
      `Minimum order value for this coupon is ₹${coupon.minOrderValue.toLocaleString('en-IN')}.`
    );
  }

  const usageSnap = await couponDoc.ref.collection('usage').doc(uid).get();
  if (usageSnap.exists) {
    throw new HttpsError('failed-precondition', 'You have already used this coupon.');
  }

  const discountAmount = coupon.type === 'percentage'
    ? Math.round((subtotal * coupon.value) / 100)
    : coupon.value;

  return { couponRef: couponDoc.ref, coupon, discountAmount: Math.min(discountAmount, subtotal) };
}

// Called inside the order-creation transaction only, after payment is
// confirmed (or immediately for COD) — records that this user has redeemed
// this coupon and bumps the global counter atomically.
export function applyCouponUsage(
  tx: FirebaseFirestore.Transaction,
  couponRef: FirebaseFirestore.DocumentReference,
  uid: string,
  orderId: string
) {
  tx.update(couponRef, { usedCount: admin.firestore.FieldValue.increment(1) });
  tx.set(couponRef.collection('usage').doc(uid), {
    orderId,
    usedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}
