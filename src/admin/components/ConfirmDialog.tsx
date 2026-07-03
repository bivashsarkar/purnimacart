import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  tone?: 'danger' | 'default';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  tone = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 animate-[fadeIn_0.15s_ease-out]" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-[slideUp_0.2s_ease-out]">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-[#5e3f3b]/50 hover:text-primary cursor-pointer"
          aria-label="Close"
        >
          <X size={16} />
        </button>
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${
            tone === 'danger' ? 'bg-red-50 text-red-600' : 'bg-primary/10 text-primary'
          }`}
        >
          <AlertTriangle size={19} />
        </div>
        <h3 className="font-display font-bold text-base text-[#291715]">{title}</h3>
        <p className="text-xs text-[#5e3f3b]/70 mt-2 leading-relaxed">{description}</p>
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-[#fff0ee] text-[#5e3f3b] text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#ffe4df] transition-colors cursor-pointer disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-60 ${
              tone === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-[#9a000e]'
            }`}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
