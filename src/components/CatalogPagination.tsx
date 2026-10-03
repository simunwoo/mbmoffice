"use client";

import { getPageItems } from "@/lib/pagination";

export function CatalogPagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const items = getPageItems(page, totalPages);

  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="페이지 이동">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground-soft hover:border-brand/50 disabled:opacity-40"
        aria-label="이전 페이지"
      >
        ‹
      </button>
      {items.map((item, i) =>
        item === "ellipsis" ? (
          <span key={`ellipsis-${i}`} className="px-1 text-sm text-foreground-soft">
            ···
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-current={item === page ? "page" : undefined}
            className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition ${
              item === page ? "border-brand-ink bg-brand-ink text-white" : "border-border text-foreground-soft hover:border-brand/50"
            }`}
          >
            {item}
          </button>
        )
      )}
      <button
        type="button"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground-soft hover:border-brand/50 disabled:opacity-40"
        aria-label="다음 페이지"
      >
        ›
      </button>
    </nav>
  );
}
