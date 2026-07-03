// Wishlist service — wishlist/{uid}/items/{productId}
// Wishlist requires authentication (no guest wishlist per spec), so this
// module only ever talks to Firestore, never localStorage.
import { collection, doc, onSnapshot, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { FirestoreWishlistItem } from '../../types/firestore';
import type { Product } from '../../types';

function itemsCol(uid: string) {
  return collection(db, 'wishlist', uid, 'items');
}

export function subscribeWishlist(
  uid: string,
  onChange: (items: FirestoreWishlistItem[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(
    itemsCol(uid),
    (snap) => {
      onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreWishlistItem)));
    },
    (err) => {
      console.error('subscribeWishlist failed', err);
      onError?.(err as Error);
    }
  );
}

export async function addToWishlist(uid: string, product: Product) {
  try {
    await setDoc(doc(db, 'wishlist', uid, 'items', product.id), {
      productId: product.id,
      productName: product.name,
      image: product.image,
      price: product.price,
      createdAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error(error);
    throw error;
  }
}

export async function removeFromWishlist(uid: string, productId: string) {
  try {
    await deleteDoc(doc(db, 'wishlist', uid, 'items', productId));
  } catch (error: any) {
    console.error(error);
    throw error;
  }
}
