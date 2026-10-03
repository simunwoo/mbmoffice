import Link from "next/link";
import { getPageItems } from "@/lib/pagination";

export function LinkPagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const items = getPageItems(page, totalPages);

  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="페이지 이동">
      <PageLink href={hrefFor(Math.max(1, page - 1))} disabled={page === 1} label="이전 페이지">
        ‹
      </PageLink>
      {items.map((item, i) =>
        item === "ellipsis" ? (
          <span key={`ellipsis-${i}`} className="px-1 text-sm text-foreground-soft">
            ···
          </span>
        ) : (
          <Link
            key={item}
            href={hrefFor(item)}
            aria-current={item === page ? "page" : undefined}
            className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition ${
              item === page ? "border-brand-ink bg-brand-ink text-white" : "border-border text-foreground-soft hover:border-brand/50"
            }`}
          >
            {item}
          </Link>
        )
      )}
      <PageLink href={hrefFor(Math.min(totalPages, page + 1))} disabled={page === totalPages} label="다음 페이지">
        ›
      </PageLink>
    </nav>
  );
}

function PageLink({ href, disabled, label, children }: { href: string; disabled: boolean; label: string; children: React.ReactNode }) {
  if (disabled) {
    return (
      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground-soft opacity-40" aria-hidden>
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground-soft hover:border-brand/50"
    >
      {children}
    </Link>
  );
}
