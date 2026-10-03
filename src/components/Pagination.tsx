import Link from "next/link";

function getPageNumbers(current: number, total: number, windowSize = 2): (number | "...")[] {
  const range = new Set<number>([1, total]);
  const start = Math.max(1, current - windowSize);
  const end = Math.min(total, current + windowSize);
  for (let p = start; p <= end; p++) range.add(p);

  const sorted = [...range].sort((a, b) => a - b);
  const pages: (number | "...")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) pages.push("...");
    pages.push(p);
    prev = p;
  }
  return pages;
}

function hrefFor(basePath: string, page: number) {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}

const circleClass = "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition";

export function Pagination({ currentPage, totalPages, basePath }: { currentPage: number; totalPages: number; basePath: string }) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <nav className="mt-10 flex items-center justify-center gap-2" aria-label="페이지">
      {currentPage > 1 ? (
        <Link href={hrefFor(basePath, currentPage - 1)} className={`${circleClass} border border-border bg-background hover:border-brand/50`} aria-label="이전 페이지">
          ‹
        </Link>
      ) : (
        <span className={`${circleClass} border border-border text-foreground-soft/40`} aria-hidden>‹</span>
      )}

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className={`${circleClass} text-foreground-soft`}>
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(basePath, p)}
            className={`${circleClass} ${
              p === currentPage ? "bg-brand text-white" : "border border-border bg-background hover:border-brand/50"
            }`}
            aria-current={p === currentPage ? "page" : undefined}
          >
            {p}
          </Link>
        )
      )}

      {currentPage < totalPages ? (
        <Link href={hrefFor(basePath, currentPage + 1)} className={`${circleClass} border border-border bg-background hover:border-brand/50`} aria-label="다음 페이지">
          ›
        </Link>
      ) : (
        <span className={`${circleClass} border border-border text-foreground-soft/40`} aria-hidden>›</span>
      )}
    </nav>
  );
}
