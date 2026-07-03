import { HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { db } from './admin';
import { deductStockInTransaction } from './stock';
import { applyCouponUsage } from './coupon';
import type { OrderItem, AddressInput } from './types';

export interface CheckoutSessionData {
  uid: string;
  items: OrderItem[];
  addressSnapshot: AddressInput;
  couponCode?: string;
  couponRefPath?: string;
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  total: number;
  razorpayOrderId: string;
  status: 'created' | 'completed' | 'failed';
  orderId?: string;
}

// Idempotent: if this session was already finalized (e.g. the client called
// verifyPayment AND the webhook fired for the same payment), returns the
// existing orderId instead of creating a duplicate order or throwing.
export async function finalizeVerifiedSession(
  sessionId: string,
  razorpayPaymentId: string
): Promise<{ orderId: string; alreadyProcessed: boolean }> {
  const sessionRef = db.collection('checkoutSessions').doc(sessionId);

  return db.runTransaction(async (tx) => {
    const sessionSnap = await tx.get(sessionRef);
    if (!sessionSnap.exists) {
      throw new HttpsError('not-found', 'Checkout session not found or expired.');
    }
    const session = sessionSnap.data() as CheckoutSessionData;

    if (session.status === 'completed' && session.orderId) {
      return { orderId: session.orderId, alreadyProcessed: true };
    }
    if (session.status === 'failed') {
      throw new HttpsError('failed-precondition', 'This checkout session already failed and cannot be retried.');
    }

    await deductStockInTransaction(tx, session.items);

    const orderRef = db.collection('orders').doc();
    tx.set(orderRef, {
      userId: session.uid,
      items: session.items,
      addressSnapshot: session.addressSnapshot,
      subtotal: session.subtotal,
      deliveryCharge: session.deliveryCharge,
      discount: session.discount,
      total: session.total,
      paymentMethod: 'razorpay',
      paymentStatus: 'paid',
      razorpayOrderId: session.razorpayOrderId,
      razorpayPaymentId,
      orderStatus: 'pending',
      trackingNote: '',
      ...(session.couponCode ? { couponCode: session.couponCode } : {}),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (session.couponRefPath) {
      applyCouponUsage(tx, db.doc(session.couponRefPath), session.uid, orderRef.id);
    }

    tx.update(sessionRef, { status: 'completed', orderId: orderRef.id });

    return { orderId: orderRef.id, alreadyProcessed: false };
  });
}

export async function markSessionFailed(sessionId: string, reason: string): Promise<void> {
  await db.collection('checkoutSessions').doc(sessionId).update({
    status: 'failed',
    failureReason: reason,
  });
}
