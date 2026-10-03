import { LoginForm } from "@/components/admin/LoginForm";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const configured = isSupabaseConfigured();

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-8 shadow-sm">
        <p className="text-xs font-bold tracking-widest text-brand">MBM ADMIN</p>
        <h1 className="mt-2 text-2xl font-bold">관리자 로그인</h1>

        {configured ? (
          <LoginForm next={next} />
        ) : (
          <p className="mt-6 rounded-xl bg-surface p-4 text-sm leading-relaxed text-foreground-soft">
            아직 Supabase가 연결되지 않았습니다. 프로젝트 URL과 API 키를 환경변수에 등록한 뒤 다시 시도해 주세요.
          </p>
        )}
      </div>
    </div>
  );
}
