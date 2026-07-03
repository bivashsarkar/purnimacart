import { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import type { CartItem, Product } from '../types';
import type { FirestoreCartItem } from '../types/firestore';
import {
  subscribeCart, addToCart, updateCartItemQuantity, removeCartItem, clearCart,
  buildCartItemId, getGuestCart, addToGuestCart, updateGuestCartQuantity,
  removeFromGuestCart, clearGuestCart, mergeGuestCartIntoFirestore,
} from '../lib/services/cart';

const FALLBACK_IMAGE = 'https://placehold.co/300x300/fff0ee/bb0012?text=PurnimaCart';

// Turns a raw Firestore cart doc into the existing UI's CartItem shape.
// Prefers live catalog data (fresh price/image) but falls back to the
// snapshot stored on the cart item if the product was removed/unavailable.
function toCartItem(doc: FirestoreCartItem, catalog: Map<string, Product>): CartItem {
  const catalogProduct = catalog.get(doc.productId);
  const product: Product = catalogProduct || {
    id: doc.productId,
    name: doc.productName,
    category: 'general',
    price: doc.price,
    image: doc.image || FALLBACK_IMAGE,
    rating: 0,
    reviewCount: 0,
    tags: [],
    description: '',
  };
  return {
    product,
    quantity: doc.quantity,
    selectedColor: doc.selectedVariant?.color,
    selectedSize: doc.selectedVariant?.size,
  };
}

export function useCart(products: Product[]) {
  const { user } = useAuth();
  const [firestoreItems, setFirestoreItems] = useState<FirestoreCartItem[]>([]);
  const [guestItems, setGuestItems] = useState(getGuestCart());
  const [loading, setLoading] = useState(true);

  const catalog = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  // Merge any guest cart into Firestore the moment we detect a signed-in user.
  useEffect(() => {
    if (user) {
      mergeGuestCartIntoFirestore(user.uid)
        .then(() => setGuestItems([]))
        .catch((e) => console.error(e));
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setFirestoreItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeCart(user.uid, (items) => {
      setFirestoreItems(items);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const cartItems: CartItem[] = useMemo(() => {
    if (user) {
      return firestoreItems.map((d) => toCartItem(d, catalog));
    }
    return guestItems.map((g) =>
      toCartItem(
        {
          id: buildCartItemId(g.productId, g.color, g.size),
          productId: g.productId,
          productName: g.productName,
          image: g.image,
          price: g.price,
          quantity: g.quantity,
          selectedVariant: { color: g.color, size: g.size },
          createdAt: null,
        },
        catalog
      )
    );
  }, [user, firestoreItems, guestItems, catalog]);

  const add = useCallback(
    async (product: Product, quantity = 1, color?: string, size?: string) => {
      if (user) {
        await addToCart(user.uid, product, quantity, color, size);
      } else {
        setGuestItems(addToGuestCart(product, quantity, color, size));
      }
    },
    [user]
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number, color?: string, size?: string) => {
      if (user) {
        await updateCartItemQuantity(user.uid, buildCartItemId(productId, color, size), quantity);
      } else {
        setGuestItems(updateGuestCartQuantity(productId, quantity, color, size));
      }
    },
    [user]
  );

  const removeItem = useCallback(
    async (productId: string, color?: string, size?: string) => {
      if (user) {
        await removeCartItem(user.uid, buildCartItemId(productId, color, size));
      } else {
        setGuestItems(removeFromGuestCart(productId, color, size));
      }
    },
    [user]
  );

  const clear = useCallback(async () => {
    if (user) {
      await clearCart(user.uid);
    } else {
      clearGuestCart();
      setGuestItems([]);
    }
  }, [user]);

  return { cartItems, loading, add, updateQuantity, removeItem, clear };
}
