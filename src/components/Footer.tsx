import Image from "next/image";
import Link from "next/link";
import { addressText, navLinks, siteConfig } from "@/lib/site-config";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2">
        <div>
          <Image src="/mbm-logo.png" alt={siteConfig.name} width={120} height={36} className="h-8 w-auto" />
          <p className="mt-3 text-sm text-foreground-soft">{siteConfig.shortDescription}</p>
          <p className="mt-4 text-sm text-foreground-soft">{addressText}</p>
          <p className="mt-1 text-sm text-foreground-soft">
            대표전화 <a href={siteConfig.phoneHref} className="text-brand-ink">{siteConfig.phone}</a>
          </p>
          <p className="text-sm text-foreground-soft">{siteConfig.email}</p>
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground">메뉴</p>
          <ul className="mt-3 space-y-2 text-sm text-foreground-soft">
            {navLinks.map((s) => (
              <li key={s.slug}>
                <Link href={`/${s.slug}`} className="hover:text-brand-ink">{s.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border px-4 py-6 text-center text-xs text-foreground-soft">
        © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
      </div>
    </footer>
  );
}
