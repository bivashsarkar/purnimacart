import { httpsCallable, FunctionsError } from 'firebase/functions';
import { functions } from '../firebase';
import type { CartItem } from '../../types';

export interface CartLineInput {
  productId: string;
  qty: number;
  variant?: { size?: string; color?: string };
}

export function cartItemsToLines(cartItems: CartItem[]): CartLineInput[] {
  return cartItems.map((item) => ({
    productId: item.product.id,
    qty: item.quantity,
    variant: { size: item.selectedSize, color: item.selectedColor },
  }));
}

export interface CreateRazorpayOrderResponse {
  checkoutSessionId: string;
  razorpayOrderId: string;
  amount: number; // paise
  currency: string;
  keyId: string;
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  total: number;
}

export interface VerifyPaymentResponse {
  success: boolean;
  orderId: string;
}

export interface PlaceOrderResponse {
  orderId: string;
}

export interface ValidateCouponResponse {
  valid: boolean;
  discountAmount: number;
  code?: string;
  type?: 'flat' | 'percentage';
  value?: number;
  error?: string;
}

const createRazorpayOrderFn = httpsCallable<
  { items: CartLineInput[]; addressId: string; couponCode?: string },
  CreateRazorpayOrderResponse
>(functions, 'createRazorpayOrder');

const verifyPaymentFn = httpsCallable<
  { checkoutSessionId: string; razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string },
  VerifyPaymentResponse
>(functions, 'verifyPayment');

const placeOrderFn = httpsCallable<
  { items: CartLineInput[]; addressId: string; couponCode?: string },
  PlaceOrderResponse
>(functions, 'placeOrder');

const validateCouponFn = httpsCallable<
  { code: string; subtotal: number },
  ValidateCouponResponse
>(functions, 'validateCoupon');

// Maps Cloud Functions error codes to friendly, specific copy for the
// checkout UI — covers the failure modes called out in the spec (cancelled,
// failed, invalid signature, network, stock/coupon precondition failures).
export function describeCheckoutError(err: unknown): string {
  if (err instanceof FunctionsError) {
    switch (err.code) {
      case 'unauthenticated':
        return 'Please sign in again to continue checkout.';
      case 'failed-precondition':
      case 'invalid-argument':
      case 'not-found':
        return err.message;
      case 'permission-denied':
        return err.message || 'Payment verification failed.';
      case 'deadline-exceeded':
      case 'unavailable':
        return 'Network issue reaching the server. Please check your connection and try again.';
      default:
        return err.message || 'Something went wrong. Please try again.';
    }
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Please try again.';
}

export async function createRazorpayOrder(items: CartLineInput[], addressId: string, couponCode?: string) {
  const res = await createRazorpayOrderFn({ items, addressId, couponCode });
  return res.data;
}

export async function verifyPayment(
  checkoutSessionId: string,
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string
) {
  const res = await verifyPaymentFn({ checkoutSessionId, razorpay_order_id, razorpay_payment_id, razorpay_signature });
  return res.data;
}

export async function placeCodOrder(items: CartLineInput[], addressId: string, couponCode?: string) {
  const res = await placeOrderFn({ items, addressId, couponCode });
  return res.data;
}

export async function validateCouponRemote(code: string, subtotal: number) {
  const res = await validateCouponFn({ code, subtotal });
  return res.data;
}
