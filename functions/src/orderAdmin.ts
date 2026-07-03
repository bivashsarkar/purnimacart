import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { db } from './admin';
import { restoreStockInTransaction } from './stock';
import type { OrderItem, OrderStatus, PaymentStatus } from './types';

// Which statuses an order can legally move to from its current one.
// Terminal states (delivered, cancelled) have no outgoing transitions.
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

async function requireAdmin(uid: string | undefined): Promise<string> {
  if (!uid) {
    throw new HttpsError('unauthenticated', 'You must be signed in to do this.');
  }
  const adminSnap = await db.collection('admins').doc(uid).get();
  if (!adminSnap.exists) {
    throw new HttpsError('permission-denied', 'Admin access required.');
  }
  return uid;
}

// ---------------------------------------------------------------------------
// adminUpdateOrderStatus — the ONLY way an order's status ever changes after
// creation. firestore.rules denies direct client writes to /orders, so every
// admin action (mark packed/shipped/delivered, cancel) goes through here.
//
// Cancelling is the special case: it atomically restores stock for every
// line item inside the same transaction as the status flip, and — if the
// order had already been paid via Razorpay — flips paymentStatus to
// "refunded" as a bookkeeping flag (see PHASE4_SETUP.md: an actual Razorpay
// refund call is a follow-up, not built here).
// ---------------------------------------------------------------------------
export const adminUpdateOrderStatus = onCall(async (request) => {
  await requireAdmin(request.auth?.uid);

  const { orderId, status, trackingNote } = request.data as {
    orderId: string;
    status: OrderStatus;
    trackingNote?: string;
  };

  const VALID_STATUSES: OrderStatus[] = ['pending', 'packed', 'shipped', 'delivered', 'cancelled'];
  if (!orderId || !VALID_STATUSES.includes(status)) {
    throw new HttpsError('invalid-argument', 'Invalid order or status.');
  }
  if (trackingNote !== undefined && typeof trackingNote !== 'string') {
    throw new HttpsError('invalid-argument', 'Invalid tracking note.');
  }

  await db.runTransaction(async (tx) => {
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists) {
      throw new HttpsError('not-found', 'Order not found.');
    }
    const order = orderSnap.data()!;
    const currentStatus = order.orderStatus as OrderStatus;

    if (currentStatus !== status && !ALLOWED_TRANSITIONS[currentStatus]?.includes(status)) {
      throw new HttpsError(
        'failed-precondition',
        `Cannot move an order from "${currentStatus}" to "${status}".`
      );
    }

    const update: Record<string, unknown> = {
      orderStatus: status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (trackingNote !== undefined) {
      update.trackingNote = trackingNote;
    }

    if (status === 'cancelled' && currentStatus !== 'cancelled') {
      await restoreStockInTransaction(tx, (order.items as OrderItem[]) || []);
      if ((order.paymentStatus as PaymentStatus) === 'paid') {
        update.paymentStatus = 'refunded' as PaymentStatus;
      }
    }

    tx.update(orderRef, update);
  });

  return { success: true };
});
