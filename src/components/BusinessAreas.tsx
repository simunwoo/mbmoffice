import Link from "next/link";

const ICONS: Record<string, React.ReactNode> = {
  printer: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M7 8.5V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v4.5" />
      <rect x="3.5" y="8.5" width="17" height="7" rx="2" />
      <circle cx="17" cy="11.7" r="0.5" fill="currentColor" stroke="none" />
      <path d="M7 14v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-6" />
    </svg>
  ),
  laptop: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <rect x="4.5" y="4.5" width="15" height="10" rx="1.5" />
      <path d="M2.5 17.5h19l-1.1 2.1a1.5 1.5 0 0 1-1.33.9H4.93a1.5 1.5 0 0 1-1.33-.9Z" />
    </svg>
  ),
  shredder: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M8 3.5h6a1 1 0 0 1 1 1V9H7V4.5a1 1 0 0 1 1-1Z" />
      <rect x="3.5" y="9" width="17" height="4" rx="1.3" />
      <path d="M7.5 15.5v5M11 15.5v3.5M14 15.5v5M17 15.5v3.5" />
    </svg>
  ),
  wrench: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M20.2 7.3a4.8 4.8 0 0 1-6.4 6.1L7 20.2l-3.2-3.2L10.6 10a4.8 4.8 0 0 1 6.1-6.4l-3.3 3.3 1.7 1.7 3.3-3.3Z" />
    </svg>
  ),
  cartridge: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M9 3.5h6M10 3.5V6h4V3.5" />
      <rect x="6.5" y="6" width="11" height="14.5" rx="3" />
      <path d="M6.5 13.5h11" />
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M12 2.5 20 7v10l-8 4.5L4 17V7Z" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  ),
};

const AREAS = [
  { icon: "printer", label: "복합기, 프린터", href: "/rental?tab=mfp-printer" },
  { icon: "laptop", label: "PC, 노트북", href: "/rental?tab=pc-notebook" },
  { icon: "shredder", label: "문서세단기", href: "/shop?tab=shredder" },
  { icon: "wrench", label: "IT 유지보수", href: "/maintenance" },
  { icon: "cartridge", label: "사무기기 소모품\n(토너, 드럼)", href: "/shop?tab=supplies" },
  { icon: "bolt", label: "부품 구매", href: "/shop?tab=parts" },
] as const;

export function BusinessAreas() {
  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold">
          사무실에 필요한 모든것, <span className="text-brand">MBM</span>에서
        </h2>

        <div className="mt-9 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {AREAS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="flex flex-col items-center gap-3 rounded-xl border border-border bg-background px-3 py-6 text-center transition hover:border-brand hover:shadow-sm"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand-ink">
                {ICONS[a.icon]}
              </span>
              <span className="whitespace-pre-line text-sm font-semibold leading-snug">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
