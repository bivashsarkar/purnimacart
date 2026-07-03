import React from 'react';

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-xs font-semibold text-[#5e3f3b]/60">{label}</p>
    </div>
  );
}

export function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
      <p className="text-xs font-semibold text-red-600">{message}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3 bg-white rounded-2xl border border-[#e8bcb7]/20">
      <Icon size={32} className="text-[#e8bcb7]" />
      <h3 className="font-semibold text-sm text-[#291715]">{title}</h3>
      <p className="text-xs text-[#5e3f3b]/60 max-w-sm">{description}</p>
    </div>
  );
}
