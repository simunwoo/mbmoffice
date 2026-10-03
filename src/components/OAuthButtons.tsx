export function OAuthButtons({ origin, next }: { origin: string; next?: string }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const redirectTo = `${origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`;
  const oauthHref = (provider: string) =>
    supabaseUrl ? `${supabaseUrl}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectTo)}` : "#";
  const naverHref = `/auth/naver/start${next ? `?next=${encodeURIComponent(next)}` : ""}`;

  return (
    <div className="space-y-2.5">
      <a
        href={oauthHref("kakao")}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] px-4 py-3 text-sm font-bold text-[#191600] hover:opacity-90"
      >
        <span aria-hidden>💬</span> 카카오로 로그인
      </a>
      <a
        href={naverHref}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#03C75A] px-4 py-3 text-sm font-bold text-white hover:opacity-90"
      >
        <span aria-hidden className="font-black">N</span> 네이버로 로그인
      </a>
      <a
        href={oauthHref("google")}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-3 text-sm font-bold text-[#1f1f1f] hover:bg-surface"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <path fill="#4285F4" d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.55-5.17 3.55-8.86z" />
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.9l-3.88-3a7.4 7.4 0 0 1-4.06 1.16c-3.12 0-5.77-2.11-6.72-4.94H1.28v3.1A12 12 0 0 0 12 24z" />
          <path fill="#FBBC05" d="M5.28 14.32a7.2 7.2 0 0 1 0-4.64v-3.1H1.28a12 12 0 0 0 0 10.84z" />
          <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.61 4.58 1.79l3.44-3.44C17.94 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.58l4 3.1C6.23 6.86 8.88 4.75 12 4.75z" />
        </svg>
        구글로 로그인
      </a>
    </div>
  );
}
