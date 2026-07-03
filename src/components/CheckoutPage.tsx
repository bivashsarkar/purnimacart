import React, { useState, useMemo } from 'react';
import { MapPin, Tag, CheckCircle2, Wallet, Smartphone, Loader2, ChevronLeft, AlertTriangle } from 'lucide-react';
import type { CartItem } from '../types';
import type { Address, PaymentMethod } from '../types/firestore';
import AddressBook from './AddressBook';
import { useAuth } from '../context/AuthContext';
import {
  cartItemsToLines,
  createRazorpayOrder,
  verifyPayment,
  placeCodOrder,
  validateCouponRemote,
  describeCheckoutError,
} from '../lib/services/checkout';
import { openRazorpayCheckout } from '../lib/razorpayCheckout';

interface CheckoutPageProps {
  uid: string;
  cartItems: CartItem[];
  addresses: Address[];
  deliveryCharge: number;
  freeDeliveryThreshold: number;
  onOrderPlaced: (orderId: string) => Promise<void> | void;
  onBack: () => void;
  onToast: (message: string, type?: 'success' | 'info') => void;
}

type Stage = 'idle' | 'validating-coupon' | 'creating-payment' | 'awaiting-payment' | 'verifying' | 'placing-cod';

export default function CheckoutPage({
  uid,
  cartItems,
  addresses,
  deliveryCharge,
  freeDeliveryThreshold,
  onOrderPlaced,
  onBack,
  onToast,
}: CheckoutPageProps) {
  const { user } = useAuth();
  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0] || null;
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(defaultAddress?.id ?? null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [stage, setStage] = useState<Stage>('idle');
  const [checkoutError, setCheckoutError] = useState('');

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) || null;
  const busy = stage !== 'idle';

  // Client-side numbers are a PREVIEW ONLY, for a responsive UI. The Cloud
  // Functions (createRazorpayOrder / placeOrder) recompute every figure from
  // live Firestore data before anything is charged or an order is created —
  // this component never sends a price to the server, only productId + qty.
  const subtotal = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0),
    [cartItems]
  );
  const computedDeliveryCharge = subtotal >= freeDeliveryThreshold || subtotal === 0 ? 0 : deliveryCharge;
  const discount = appliedCoupon?.discountAmount ?? 0;
  const total = Math.max(0, subtotal + computedDeliveryCharge - discount);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    const code = couponCode.trim();
    if (!code) return;
    setStage('validating-coupon');
    try {
      const result = await validateCouponRemote(code, subtotal);
      if (!result.valid) {
        setCouponError(result.error || 'Invalid coupon code.');
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({ code: result.code || code.toUpperCase(), discountAmount: result.discountAmount });
        onToast(`Coupon ${result.code || code.toUpperCase()} applied!`);
      }
    } catch (err) {
      setCouponError(describeCheckoutError(err));
      setAppliedCoupon(null);
    } finally {
      setStage('idle');
    }
  };

  const resetPaymentState = () => {
    setStage('idle');
  };

  const handlePlaceOrder = async () => {
    setCheckoutError('');
    if (!selectedAddress) {
      onToast('Please select a delivery address.', 'info');
      return;
    }
    if (cartItems.length === 0) {
      onToast('Your cart is empty.', 'info');
      return;
    }

    const lines = cartItemsToLines(cartItems);

    if (paymentMethod === 'cod') {
      setStage('placing-cod');
      try {
        const { orderId } = await placeCodOrder(lines, selectedAddress.id, appliedCoupon?.code);
        await onOrderPlaced(orderId);
      } catch (err) {
        setCheckoutError(describeCheckoutError(err));
        onToast('Could not place your order. Please try again.', 'info');
      } finally {
        resetPaymentState();
      }
      return;
    }

    // Razorpay flow: create a server-side order + checkout session, open the
    // Razorpay modal, then hand the payment IDs back to verifyPayment — which
    // is the only place a payment is ever trusted as real.
    setStage('creating-payment');
    try {
      const session = await createRazorpayOrder(lines, selectedAddress.id, appliedCoupon?.code);
      setStage('awaiting-payment');

      await openRazorpayCheckout({
        keyId: session.keyId,
        amount: session.amount,
        currency: session.currency,
        razorpayOrderId: session.razorpayOrderId,
        name: 'PurnimaCart',
        description: `Order for ${cartItems.length} item(s)`,
        prefillName: user?.displayName || undefined,
        prefillEmail: user?.email || undefined,
        onSuccess: async (response) => {
          setStage('verifying');
          try {
            const result = await verifyPayment(
              session.checkoutSessionId,
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
            await onOrderPlaced(result.orderId);
          } catch (err) {
            setCheckoutError(describeCheckoutError(err));
            onToast('Payment verification failed. Please contact support if you were charged.', 'info');
          } finally {
            resetPaymentState();
          }
        },
        onDismiss: () => {
          setCheckoutError('Payment was cancelled or did not complete. No charge was made — you can try again.');
          resetPaymentState();
        },
      });
    } catch (err) {
      setCheckoutError(describeCheckoutError(err));
      resetPaymentState();
    }
  };

  const buttonLabel = () => {
    switch (stage) {
      case 'creating-payment': return 'Preparing secure payment…';
      case 'awaiting-payment': return 'Waiting for payment…';
      case 'verifying': return 'Verifying payment…';
      case 'placing-cod': return 'Placing order…';
      default: return 'Place Order';
    }
  };

  return (
    <div className="space-y-8 min-h-[60vh]">
      <div className="border-b border-[#e8bcb7]/20 pb-6 flex items-center gap-4">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-[#e8bcb7]/20 hover:border-primary hover:text-primary transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} />
        </button>
        <div>
          <h1 className="font-display font-bold text-3xl text-[#291715]">Checkout</h1>
          <p className="text-xs text-[#5e3f3b] mt-1.5">Review your order and complete your purchase.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          {/* Address selection */}
          <section className="space-y-4">
            <h2 className="font-display font-bold text-lg text-[#291715] flex items-center gap-2">
              <MapPin size={18} className="text-primary" /> Delivery Address
            </h2>
            <AddressBook
              uid={uid}
              addresses={addresses}
              selectable
              selectedId={selectedAddressId}
              onSelect={(a) => setSelectedAddressId(a.id)}
              onToast={onToast}
            />
          </section>

          {/* Order summary / products */}
          <section className="space-y-4">
            <h2 className="font-display font-bold text-lg text-[#291715]">Order Summary</h2>
            <div className="bg-white border border-[#e8bcb7]/20 rounded-2xl divide-y divide-[#e8bcb7]/10">
              {cartItems.map((item) => (
                <div
                  key={`${item.product.id}-${item.selectedColor}-${item.selectedSize}`}
                  className="flex gap-4 p-4"
                >
                  <img src={item.product.image} alt={item.product.name} className="w-16 h-16 rounded-xl object-cover bg-[#fff8f7]" />
                  <div className="flex-grow min-w-0">
                    <h3 className="font-semibold text-sm text-[#291715] truncate">{item.product.name}</h3>
                    <p className="text-[10px] text-[#5e3f3b]/70 mt-0.5">
                      Style: {item.selectedColor || 'Classic'} · Size: {item.selectedSize || 'Standard'} · Qty: {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-primary shrink-0">
                    ₹{(item.product.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Payment method */}
          <section className="space-y-4">
            <h2 className="font-display font-bold text-lg text-[#291715]">Payment Method</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setPaymentMethod('cod')}
                disabled={busy}
                className={`p-4 rounded-2xl border flex items-center gap-3 text-left transition-all cursor-pointer disabled:opacity-60 ${
                  paymentMethod === 'cod' ? 'border-primary bg-[#fff0ee]' : 'border-[#e8bcb7]/20 bg-white hover:border-primary/40'
                }`}
              >
                <Wallet size={20} className="text-primary shrink-0" />
                <div>
                  <p className="text-xs font-bold text-[#291715]">Cash on Delivery</p>
                  <p className="text-[10px] text-[#5e3f3b]/70">Pay when your order arrives</p>
                </div>
                {paymentMethod === 'cod' && <CheckCircle2 size={16} className="text-primary ml-auto shrink-0" />}
              </button>
              <button
                onClick={() => setPaymentMethod('razorpay')}
                disabled={busy}
                className={`p-4 rounded-2xl border flex items-center gap-3 text-left transition-all cursor-pointer disabled:opacity-60 ${
                  paymentMethod === 'razorpay' ? 'border-primary bg-[#fff0ee]' : 'border-[#e8bcb7]/20 bg-white hover:border-primary/40'
                }`}
              >
                <Smartphone size={20} className="text-primary shrink-0" />
                <div>
                  <p className="text-xs font-bold text-[#291715]">Razorpay</p>
                  <p className="text-[10px] text-[#5e3f3b]/70">UPI, Cards & Netbanking</p>
                </div>
                {paymentMethod === 'razorpay' && <CheckCircle2 size={16} className="text-primary ml-auto shrink-0" />}
              </button>
            </div>
            {paymentMethod === 'razorpay' && (
              <p className="text-[10px] text-[#5e3f3b]/60 bg-[#fff0ee] px-4 py-2.5 rounded-xl">
                You'll be charged ₹{total.toLocaleString()} securely via Razorpay. Your order is only created after payment is verified on our server.
              </p>
            )}
          </section>

          {checkoutError && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl px-5 py-4">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{checkoutError}</span>
            </div>
          )}
        </div>

        {/* Price breakdown */}
        <div className="bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-3xl p-6 space-y-5 sticky top-24">
          <h2 className="font-display font-bold text-lg text-[#291715]">Price Details</h2>

          {!appliedCoupon ? (
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5e3f3b]/40" size={14} />
                <input
                  type="text"
                  placeholder="ENTER COUPON CODE"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  disabled={busy}
                  className="w-full bg-white border border-[#e8bcb7]/20 rounded-xl py-2.5 pl-9 pr-4 text-xs font-semibold uppercase outline-none focus:ring-1 focus:ring-primary text-[#291715] disabled:opacity-60"
                />
              </div>
              <button
                type="submit"
                disabled={busy || stage === 'validating-coupon'}
                className="bg-[#e5e2e1] text-[#474646] hover:bg-primary hover:text-white font-bold text-xs px-4 rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-60"
              >
                {stage === 'validating-coupon' ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/25 p-3 rounded-xl text-emerald-800">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Coupon <strong>{appliedCoupon.code}</strong> applied</span>
              </div>
              <button
                onClick={() => { setAppliedCoupon(null); setCouponCode(''); }}
                disabled={busy}
                className="text-emerald-700 hover:text-red-600 text-xs font-bold cursor-pointer disabled:opacity-60"
              >
                Remove
              </button>
            </div>
          )}
          {couponError && <p className="text-[10px] font-bold text-red-600">{couponError}</p>}

          <div className="space-y-2 text-xs text-[#5e3f3b] pt-2 border-t border-[#e8bcb7]/15">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-bold text-[#291715]">₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Charge</span>
              <span className="font-bold text-[#291715]">
                {computedDeliveryCharge === 0 ? 'FREE' : `₹${computedDeliveryCharge.toLocaleString()}`}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Coupon Discount</span>
                <span>-₹{discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black text-[#291715] pt-2 border-t border-[#e8bcb7]/15">
              <span>Total</span>
              <span className="text-primary text-base font-bold">₹{total.toLocaleString()}</span>
            </div>
            <p className="text-[9px] text-[#5e3f3b]/50 pt-1">
              Final amount is recalculated securely on our server before anything is charged.
            </p>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={busy || cartItems.length === 0 || !selectedAddress}
            className="w-full bg-primary hover:bg-[#9a000e] text-white py-4 rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-60"
          >
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" /> {buttonLabel()}
              </>
            ) : (
              buttonLabel()
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
