// Persistent cart service — carts/{uid}/items/{itemId}
// Firestore is the source of truth for signed-in users. A tiny localStorage
// staging area is used ONLY for guest (signed-out) carts, since Firestore
// writes require a uid — it is merged into Firestore and discarded on login.
import {
  collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, getDocs,
  writeBatch, serverTimestamp, increment,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { FirestoreCartItem, CartItemVariant } from '../../types/firestore';
import type { Product } from '../../types';

const GUEST_CART_KEY = 'purnimacart_guest_cart';

function itemsCol(uid: string) {
  return collection(db, 'carts', uid, 'items');
}

// Deterministic doc id so adding the same product+variant twice increments
// quantity instead of creating duplicate rows.
export function buildCartItemId(productId: string, color?: string, size?: string): string {
  const c = (color || 'none').replace(/[^a-zA-Z0-9_-]/g, '_');
  const s = (size || 'none').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${productId}__${c}__${s}`;
}

export function subscribeCart(
  uid: string,
  onChange: (items: FirestoreCartItem[]) => void,
  onError?: (err: Error) => void
) {
  return onSnapshot(
    itemsCol(uid),
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreCartItem));
      items.sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0));
      onChange(items);
    },
    (err) => {
      console.error('subscribeCart failed', err);
      onError?.(err as Error);
    }
  );
}

export async function addToCart(
  uid: string,
  product: Product,
  quantity: number,
  color?: string,
  size?: string
) {
  try {
    const itemId = buildCartItemId(product.id, color, size);
    const ref = doc(db, 'carts', uid, 'items', itemId);
    const variant: CartItemVariant = { color, size };
    // setDoc with merge lets us both create-and-increment in one round trip:
    // increment() on a non-existent field defaults from 0.
    await setDoc(
      ref,
      {
        productId: product.id,
        productName: product.name,
        image: product.image,
        price: product.price,
        offerPrice: product.originalPrice ? product.price : null,
        quantity: increment(quantity),
        selectedVariant: variant,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error: any) {
    console.error(error);
    throw error;
  }
}

export async function updateCartItemQuantity(uid: string, itemId: string, quantity: number) {
  try {
    if (quantity <= 0) {
      await deleteDoc(doc(db, 'carts', uid, 'items', itemId));
      return;
    }
    await updateDoc(doc(db, 'carts', uid, 'items', itemId), { quantity });
  } catch (error: any) {
    console.error(error);
    throw error;
  }
}

export async function removeCartItem(uid: string, itemId: string) {
  try {
    await deleteDoc(doc(db, 'carts', uid, 'items', itemId));
  } catch (error: any) {
    console.error(error);
    throw error;
  }
}

export async function clearCart(uid: string) {
  try {
    const snap = await getDocs(itemsCol(uid));
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  } catch (error: any) {
    console.error(error);
    throw error;
  }
}

// ---------- Guest cart (localStorage staging only, pre-login) ----------
interface GuestCartItem {
  productId: string;
  productName: string;
  image: string;
  price: number;
  quantity: number;
  color?: string;
  size?: string;
}

export function getGuestCart(): GuestCartItem[] {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToGuestCart(product: Product, quantity: number, color?: string, size?: string) {
  const items = getGuestCart();
  const idx = items.findIndex(
    (i) => i.productId === product.id && i.color === color && i.size === size
  );
  if (idx > -1) {
    items[idx].quantity += quantity;
  } else {
    items.push({
      productId: product.id,
      productName: product.name,
      image: product.image,
      price: product.price,
      quantity,
      color,
      size,
    });
  }
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  return items;
}

export function updateGuestCartQuantity(productId: string, quantity: number, color?: string, size?: string) {
  let items = getGuestCart();
  if (quantity <= 0) {
    items = items.filter((i) => !(i.productId === productId && i.color === color && i.size === size));
  } else {
    items = items.map((i) =>
      i.productId === productId && i.color === color && i.size === size ? { ...i, quantity } : i
    );
  }
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  return items;
}

export function removeFromGuestCart(productId: string, color?: string, size?: string) {
  const items = getGuestCart().filter(
    (i) => !(i.productId === productId && i.color === color && i.size === size)
  );
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  return items;
}

export function clearGuestCart() {
  localStorage.removeItem(GUEST_CART_KEY);
}

// Merge the guest cart into the signed-in user's Firestore cart, then wipe
// the local staging copy. Safe to call on every login — it's a no-op if the
// guest cart is empty.
export async function mergeGuestCartIntoFirestore(uid: string) {
  const guestItems = getGuestCart();
  if (guestItems.length === 0) return;
  try {
    for (const item of guestItems) {
      const itemId = buildCartItemId(item.productId, item.color, item.size);
      const ref = doc(db, 'carts', uid, 'items', itemId);
      await setDoc(
        ref,
        {
          productId: item.productId,
          productName: item.productName,
          image: item.image,
          price: item.price,
          offerPrice: null,
          quantity: increment(item.quantity),
          selectedVariant: { color: item.color, size: item.size },
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
    clearGuestCart();
  } catch (error: any) {
    console.error(error);
    throw error;
  }
}
