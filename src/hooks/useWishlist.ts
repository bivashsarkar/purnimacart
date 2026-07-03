import { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Product } from '../types';
import type { FirestoreWishlistItem } from '../types/firestore';
import { subscribeWishlist, addToWishlist, removeFromWishlist } from '../lib/services/wishlist';

const FALLBACK_IMAGE = 'https://placehold.co/300x300/fff0ee/bb0012?text=PurnimaCart';

function toProduct(doc: FirestoreWishlistItem, catalog: Map<string, Product>): Product {
  const catalogProduct = catalog.get(doc.productId);
  if (catalogProduct) return catalogProduct;
  return {
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
}

export function useWishlist(products: Product[]) {
  const { user } = useAuth();
  const [items, setItems] = useState<FirestoreWishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const catalog = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeWishlist(user.uid, (docs) => {
      setItems(docs);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const wishlist: Product[] = useMemo(() => items.map((d) => toProduct(d, catalog)), [items, catalog]);
  const isWishlisted = useCallback((productId: string) => items.some((i) => i.productId === productId), [items]);

  const toggle = useCallback(
    async (product: Product) => {
      if (!user) throw new Error('NOT_SIGNED_IN');
      const exists = items.some((i) => i.productId === product.id);
      if (exists) {
        await removeFromWishlist(user.uid, product.id);
      } else {
        await addToWishlist(user.uid, product);
      }
    },
    [user, items]
  );

  return { wishlist, loading, isWishlisted, toggle };
}
