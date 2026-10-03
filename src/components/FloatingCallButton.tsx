import { siteConfig } from "@/lib/site-config";

export function FloatingCallButton() {
  return (
    <div className="fixed bottom-5 right-5 z-30 flex flex-col items-center gap-3">
      <a
        href={siteConfig.phoneHref}
        aria-label={`전화 상담 ${siteConfig.phone}`}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white shadow-lg transition hover:opacity-90"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
          <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </div>
  );
}
