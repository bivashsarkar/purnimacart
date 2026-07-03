// Server-side copies of the shapes we need. Kept minimal and separate from
// the client's src/types — functions/ is a standalone deployable package and
// doesn't share a build step with the Vite app.

export interface AddressInput {
  id: string;
  label: string;
  fullName: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  district?: string;
  state: string;
  country: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
}

export interface CartLineInput {
  productId: string;
  qty: number;
  variant?: { size?: string; color?: string };
}

export interface CheckoutRequest {
  items: CartLineInput[];
  addressId: string;
  couponCode?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  qty: number;
  variant?: { size?: string; color?: string };
}

export type PaymentMethod = 'razorpay' | 'cod';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type OrderStatus = 'pending' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
export type CouponType = 'flat' | 'percentage';

export interface FirestoreProduct {
  name: string;
  images: string[];
  price: number;
  offerPrice?: number | null;
  stock: number;
  isActive: boolean;
}

export interface FirestoreCoupon {
  code: string;
  type: CouponType;
  value: number;
  minOrderValue: number;
  expiryDate: FirebaseFirestore.Timestamp | null;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}
