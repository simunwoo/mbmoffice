import Image from "next/image";
import Link from "next/link";
import { navLinks, siteConfig } from "@/lib/site-config";
import { AuthStatus } from "@/components/AuthStatus";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 xl:gap-6">
        <div className="flex shrink-0 items-center gap-3">
          <Link href="/" className="flex items-center">
            <Image src="/mbm-logo.png" alt={siteConfig.name} width={120} height={36} priority className="h-9 w-auto" />
          </Link>
          <div className="hidden border-l border-border pl-3 leading-tight sm:block">
            <p className="text-xs font-semibold text-foreground">사무환경의 모든 것</p>
            <p className="text-[11px] text-foreground-soft">MBM OFFICE</p>
          </div>
        </div>

        <nav className="hidden items-center gap-4 text-sm font-medium xl:flex">
          {navLinks.map((s) => (
            <Link key={s.slug} href={`/${s.slug}`} className="whitespace-nowrap text-foreground-soft hover:text-brand-ink">
              {s.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <a
            href={siteConfig.phoneHref}
            className="hidden items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-foreground-soft hover:text-brand-ink xl:flex"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {siteConfig.phone}
          </a>
          <Link href="/compare" className="hidden whitespace-nowrap text-sm text-foreground-soft hover:text-brand-ink xl:inline-block">
            상품 비교
          </Link>
          <AuthStatus variant="desktop" />
          <Link
            href="/contact"
            className="hidden whitespace-nowrap rounded-full bg-brand px-4 py-2 text-sm font-bold text-white hover:opacity-90 sm:inline-block"
          >
            견적 문의
          </Link>
          <details className="xl:hidden">
            <summary className="list-none rounded-md border border-border p-2 [&::-webkit-details-marker]:hidden" aria-label="메뉴 열기">
              <span className="block h-0.5 w-5 bg-foreground" />
              <span className="mt-1 block h-0.5 w-5 bg-foreground" />
              <span className="mt-1 block h-0.5 w-5 bg-foreground" />
            </summary>
            <div className="absolute inset-x-0 top-full border-b border-border bg-background p-4 shadow-lg">
              <nav className="flex flex-col gap-3 text-sm font-medium">
                <Link href="/contact" className="w-full rounded-full bg-brand px-4 py-2.5 text-center text-sm font-bold text-white sm:hidden">
                  견적 문의
                </Link>
                {navLinks.map((s) => (
                  <Link key={s.slug} href={`/${s.slug}`} className="text-foreground-soft hover:text-brand-ink">
                    {s.label}
                  </Link>
                ))}
                <Link href="/compare" className="text-foreground-soft hover:text-brand-ink">
                  상품 비교
                </Link>
                <AuthStatus variant="mobile" />
                <a href={siteConfig.phoneHref} className="text-foreground-soft">
                  전화 상담 {siteConfig.phone}
                </a>
              </nav>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
