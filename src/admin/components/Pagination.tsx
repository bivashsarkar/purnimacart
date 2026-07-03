import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number; // 1-indexed
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#e8bcb7]/15">
      <p className="text-[11px] font-semibold text-[#5e3f3b]/60">
        Showing {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="w-8 h-8 rounded-lg border border-[#e8bcb7]/25 flex items-center justify-center text-[#5e3f3b] hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-[#e8bcb7]/25 disabled:hover:text-[#5e3f3b] transition-colors cursor-pointer"
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-[11px] font-bold text-[#291715] px-2">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="w-8 h-8 rounded-lg border border-[#e8bcb7]/25 flex items-center justify-center text-[#5e3f3b] hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-[#e8bcb7]/25 disabled:hover:text-[#5e3f3b] transition-colors cursor-pointer"
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
