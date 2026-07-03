import React, { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { FirestoreOrder } from '../types/firestore';
import { getOrderById } from '../lib/services/orders';

interface OrderSuccessPageProps {
  orderId: string;
  onContinueShopping: () => void;
  onViewOrder: () => void;
}

export default function OrderSuccessPage({ orderId, onContinueShopping, onViewOrder }: OrderSuccessPageProps) {
  const [order, setOrder] = useState<FirestoreOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getOrderById(orderId)
      .then((data) => {
        if (!cancelled) setOrder(data);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError('Could not load your order right now.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const createdDate = order?.createdAt?.toDate?.()
    ? order.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  return (
    <div className="py-16 max-w-xl mx-auto text-center space-y-6">
      <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow shadow-emerald-500/10">
        <CheckCircle2 size={44} />
      </div>

      <div className="space-y-2">
        <h1 className="font-display font-bold text-3xl text-[#291715]">Order Successfully Placed!</h1>
        <p className="text-sm text-[#5e3f3b] leading-relaxed">
          Thank you for shopping at PurnimaCart. Your order has been recorded and is being prepared for processing.
        </p>
      </div>

      {loading && (
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-xs font-semibold text-[#5e3f3b]/60">Loading order details…</p>
        </div>
      )}

      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

      {order && (
        <div className="bg-[#fff0ee]/70 border border-[#e8bcb7]/15 p-6 rounded-3xl space-y-4 text-left text-xs text-[#5e3f3b]">
          <div className="flex justify-between font-bold text-[#291715]">
            <span>Order ID:</span>
            <span className="font-mono">{order.id}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{createdDate}</span>
          </div>
          <div className="flex justify-between">
            <span>Items:</span>
            <span>{order.items.reduce((acc, i) => acc + i.qty, 0)} item(s)</span>
          </div>
          <div className="flex justify-between">
            <span>Payment Method:</span>
            <span className="capitalize">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay'}</span>
          </div>
          <div className="flex justify-between">
            <span>Payment Status:</span>
            <span className="capitalize font-bold text-amber-600">{order.paymentStatus}</span>
          </div>
          <div className="flex justify-between border-t border-[#e8bcb7]/15 pt-3 font-bold text-[#291715]">
            <span>Total:</span>
            <span className="text-primary text-sm">₹{order.total.toLocaleString()}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {order && (
          <button
            onClick={onViewOrder}
            className="bg-[#fff0ee] hover:bg-[#ffe4df] text-primary py-4 px-8 rounded-xl font-bold text-xs transition-colors cursor-pointer"
          >
            View Order Details
          </button>
        )}
        <button
          onClick={onContinueShopping}
          className="bg-primary hover:bg-[#9a000e] text-white py-4 px-8 rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-lg shadow-primary/15"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}
