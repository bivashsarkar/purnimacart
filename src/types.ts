export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  tags: string[];
  description: string;
  isDeal?: boolean;
  dealDiscount?: string;
  features?: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export type PageType =
  | 'home'
  | 'category'
  | 'product-detail'
  | 'offers'
  | 'wishlist'
  | 'checkout'
  | 'checkout-success'
  | 'my-orders'
  | 'order-details'
  | 'addresses'
  | 'admin';

export type AdminSection =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'orders'
  | 'customers'
  | 'coupons'
  | 'banners'
  | 'settings';

export interface Category {
  id: string;
  name: string;
  iconName: string;
  count: number;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  date: string;
  comment: string;
}
