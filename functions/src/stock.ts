import { HttpsError } from 'firebase-functions/v2/https';
import { db } from './admin';
import type { OrderItem } from './types';

// Reads and decrements stock for every line item inside a single Firestore
// transaction, so two simultaneous checkouts can never oversell the last
// unit — the second transaction will retry, re-read the updated stock, and
// fail cleanly with 'failed-precondition' instead of silently going negative.
export async function deductStockInTransaction(
  tx: FirebaseFirestore.Transaction,
  items: OrderItem[]
): Promise<void> {
  const productRefs = items.map((item) => db.collection('products').doc(item.productId));
  const snaps = await Promise.all(productRefs.map((ref) => tx.get(ref)));

  snaps.forEach((snap, i) => {
    const item = items[i];
    if (!snap.exists) {
      throw new HttpsError('not-found', `${item.name} is no longer available.`);
    }
    const currentStock = (snap.data()?.stock as number) ?? 0;
    if (currentStock < item.qty) {
      throw new HttpsError(
        'failed-precondition',
        `Only ${currentStock} left of "${item.name}" — please update your cart.`
      );
    }
  });

  snaps.forEach((snap, i) => {
    const item = items[i];
    const currentStock = (snap.data()?.stock as number) ?? 0;
    tx.update(productRefs[i], { stock: currentStock - item.qty });
  });
}

// Reverses a previous stock deduction — called when an admin cancels an
// order. Reads every line item's current stock and adds the quantity back
// in the same transaction the order-status update happens in, so a
// concurrent checkout can't race with the restock. If the product was
// deleted since the order was placed, there's nothing to restore it onto,
// so that line item is silently skipped rather than failing the whole
// cancellation.
export async function restoreStockInTransaction(
  tx: FirebaseFirestore.Transaction,
  items: OrderItem[]
): Promise<void> {
  const productRefs = items.map((item) => db.collection('products').doc(item.productId));
  const snaps = await Promise.all(productRefs.map((ref) => tx.get(ref)));

  snaps.forEach((snap, i) => {
    if (!snap.exists) return;
    const item = items[i];
    const currentStock = (snap.data()?.stock as number) ?? 0;
    tx.update(productRefs[i], { stock: currentStock + item.qty });
  });
}
