import React, { useState } from 'react';
import { Plus, Pencil, Trash2, X, Ticket } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import type { FirestoreCoupon, CouponType } from '../types/firestore';
import { useAdminCoupons } from './hooks/useAdminCoupons';
import { createCoupon, updateCoupon, deleteCoupon } from '../lib/services/misc';
import { LoadingBlock, ErrorBlock, EmptyState } from './components/LoadingState';
import ConfirmDialog from './components/ConfirmDialog';
import Toggle from './components/Toggle';

interface AdminCouponsProps {
  onToast: (message: string, type?: 'success' | 'info') => void;
}

type CouponFormState = {
  code: string;
  type: CouponType;
  value: string;
  minOrderValue: string;
  usageLimit: string;
  expiryDate: string; // yyyy-mm-dd
  isActive: boolean;
};

const EMPTY_FORM: CouponFormState = {
  code: '',
  type: 'percentage',
  value: '',
  minOrderValue: '0',
  usageLimit: '100',
  expiryDate: '',
  isActive: true,
};

function toFormState(c: FirestoreCoupon): CouponFormState {
  return {
    code: c.code,
    type: c.type,
    value: String(c.value),
    minOrderValue: String(c.minOrderValue),
    usageLimit: String(c.usageLimit),
    expiryDate: c.expiryDate ? c.expiryDate.toDate().toISOString().slice(0, 10) : '',
    isActive: c.isActive,
  };
}

function CouponFormModal({
  initial,
  onClose,
  onSaved,
  onToast,
}: {
  initial: FirestoreCoupon | null;
  onClose: () => void;
  onSaved: () => void;
  onToast: (message: string, type?: 'success' | 'info') => void;
}) {
  const [form, setForm] = useState<CouponFormState>(initial ? toFormState(initial) : EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof CouponFormState>(key: K, value: CouponFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const isValid =
    form.code.trim().length >= 3 &&
    Number(form.value) > 0 &&
    (form.type === 'flat' || Number(form.value) <= 100) &&
    Number(form.minOrderValue) >= 0 &&
    Number(form.usageLimit) >= 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      onToast('Check the coupon code, value, and limits.', 'info');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim(),
        type: form.type,
        value: Number(form.value),
        minOrderValue: Number(form.minOrderValue),
        usageLimit: Number(form.usageLimit),
        expiryDate: form.expiryDate ? Timestamp.fromDate(new Date(`${form.expiryDate}T23:59:59`)) : null,
        isActive: form.isActive,
      };
      if (initial) {
        await updateCoupon(initial.id, payload);
        onToast('Coupon updated.');
      } else {
        await createCoupon(payload);
        onToast('Coupon created.');
      }
      onSaved();
    } catch (error: any) {
      console.error(error);
      onToast(error.message || 'Could not save coupon.', 'info');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 animate-[fadeIn_0.15s_ease-out]" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-[slideUp_0.2s_ease-out]">
        <div className="sticky top-0 bg-white border-b border-[#e8bcb7]/15 px-6 py-4 flex items-center justify-between z-10">
          <h3 className="font-display font-bold text-base text-[#291715]">{initial ? 'Edit Coupon' : 'Add Coupon'}</h3>
          <button type="button" onClick={onClose} className="text-[#5e3f3b]/50 hover:text-primary cursor-pointer" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-1.5 block">Code</label>
            <input
              value={form.code}
              onChange={(e) => set('code', e.target.value.toUpperCase())}
              placeholder="WELCOME10"
              className="w-full bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs font-mono outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-1.5 block">Type</label>
              <select
                value={form.type}
                onChange={(e) => set('type', e.target.value as CouponType)}
                className="w-full bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="percentage">Percentage %</option>
                <option value="flat">Flat ₹</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-1.5 block">
                Value {form.type === 'percentage' ? '(%)' : '(₹)'}
              </label>
              <input
                type="number" min="0" max={form.type === 'percentage' ? 100 : undefined}
                value={form.value}
                onChange={(e) => set('value', e.target.value)}
                className="w-full bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-1.5 block">Min. Purchase (₹)</label>
              <input
                type="number" min="0"
                value={form.minOrderValue}
                onChange={(e) => set('minOrderValue', e.target.value)}
                className="w-full bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-1.5 block">Usage Limit</label>
              <input
                type="number" min="1"
                value={form.usageLimit}
                onChange={(e) => set('usageLimit', e.target.value)}
                className="w-full bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-[#5e3f3b]/50 mb-1.5 block">Expiry Date (optional)</label>
            <input
              type="date"
              value={form.expiryDate}
              onChange={(e) => set('expiryDate', e.target.value)}
              className="w-full bg-[#fff8f7] border border-[#e8bcb7]/20 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <Toggle checked={form.isActive} onChange={(v) => set('isActive', v)} label="Enabled" />
        </div>
        <div className="sticky bottom-0 bg-white border-t border-[#e8bcb7]/15 px-6 py-4 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="text-xs font-bold text-[#5e3f3b] px-4 py-2.5 rounded-xl hover:bg-[#fff0ee] cursor-pointer">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !isValid}
            className="bg-primary text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-[#9a000e] transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Coupon'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminCoupons({ onToast }: AdminCouponsProps) {
  const { coupons, loading, error } = useAdminCoupons();
  const [formTarget, setFormTarget] = useState<FirestoreCoupon | 'new' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FirestoreCoupon | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleToggleActive = async (coupon: FirestoreCoupon) => {
    try {
      await updateCoupon(coupon.id, { isActive: !coupon.isActive });
      onToast(coupon.isActive ? 'Coupon disabled.' : 'Coupon enabled.');
    } catch (err: any) {
      onToast(err.message || 'Could not update coupon.', 'info');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCoupon(deleteTarget.id);
      onToast('Coupon deleted.');
      setDeleteTarget(null);
    } catch (err: any) {
      onToast(err.message || 'Could not delete coupon.', 'info');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingBlock label="Loading coupons…" />;
  if (error) return <ErrorBlock message={error} />;

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button
          onClick={() => setFormTarget('new')}
          className="flex items-center gap-2 bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#9a000e] transition-colors cursor-pointer"
        >
          <Plus size={15} /> Add Coupon
        </button>
      </div>

      {coupons.length === 0 ? (
        <EmptyState icon={Ticket} title="No coupons yet" description="Create a coupon to offer discounts at checkout." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((c) => {
            const expired = c.expiryDate ? c.expiryDate.toMillis() < Date.now() : false;
            const usedUp = c.usedCount >= c.usageLimit;
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-[#e8bcb7]/20 p-5 shadow-sm flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono font-bold text-sm text-[#291715]">{c.code}</p>
                    <p className="text-xs text-primary font-bold mt-0.5">
                      {c.type === 'percentage' ? `${c.value}% off` : `₹${c.value} off`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setFormTarget(c)} className="w-7 h-7 rounded-lg hover:bg-[#fff0ee] text-[#5e3f3b] inline-flex items-center justify-center cursor-pointer" aria-label="Edit">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setDeleteTarget(c)} className="w-7 h-7 rounded-lg hover:bg-red-50 text-[#5e3f3b] hover:text-red-600 inline-flex items-center justify-center cursor-pointer" aria-label="Delete">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div className="text-[11px] text-[#5e3f3b]/70 space-y-1">
                  <p>Min. purchase: ₹{c.minOrderValue.toLocaleString('en-IN')}</p>
                  <p>Used {c.usedCount} / {c.usageLimit}</p>
                  <p>{c.expiryDate ? `Expires ${c.expiryDate.toDate().toLocaleDateString('en-IN')}` : 'No expiry'}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#e8bcb7]/15">
                  <div className="flex gap-1.5">
                    {expired && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Expired</span>}
                    {usedUp && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Limit reached</span>}
                  </div>
                  <Toggle checked={c.isActive} onChange={() => handleToggleActive(c)} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {formTarget && (
        <CouponFormModal
          initial={formTarget === 'new' ? null : formTarget}
          onClose={() => setFormTarget(null)}
          onSaved={() => setFormTarget(null)}
          onToast={onToast}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this coupon?"
        description={`"${deleteTarget?.code}" will no longer be usable at checkout.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
