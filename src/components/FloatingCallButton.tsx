import { siteConfig } from "@/lib/site-config";

export function FloatingCallButton() {
  return (
    <div className="fixed bottom-5 right-5 z-30 flex flex-col items-center gap-3">
      <a
        href={siteConfig.kakaoChatUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="카카오톡 상담"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FEE500] text-[#191919] shadow-lg transition hover:opacity-90"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
          <path d="M12 3C6.48 3 2 6.58 2 11c0 2.8 1.84 5.27 4.63 6.72-.2.73-.73 2.67-.84 3.08-.13.5.18.5.39.36.16-.1 2.6-1.76 3.66-2.47.7.1 1.42.16 2.16.16 5.52 0 10-3.58 10-8s-4.48-8-10-8Z" />
        </svg>
      </a>
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
