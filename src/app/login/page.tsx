import Image from "next/image";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { getOrigin } from "@/lib/origin";
import { OAuthButtons } from "@/components/OAuthButtons";
import { CustomerLoginForm } from "@/components/CustomerLoginForm";

export const metadata = buildMetadata({
  title: "로그인",
  description: "카카오·네이버·구글 또는 이메일로 로그인하세요.",
  path: "/login",
});

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const origin = await getOrigin();

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="rounded-2xl border border-border bg-background p-8 shadow-sm">
        <div className="flex items-center gap-2">
          <Image src="/mbm-logo.png" alt={siteConfig.name} width={100} height={30} className="h-7 w-auto" />
          <span className="text-sm font-extrabold text-foreground-soft">{siteConfig.name} MBM</span>
        </div>

        <h1 className="mt-6 text-2xl font-bold">로그인</h1>
        <p className="mt-2 text-sm text-foreground-soft">카카오·네이버·구글 계정 또는 이메일로 로그인할 수 있습니다.</p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
            로그인 중 문제가 발생했습니다. 다시 시도해 주세요.
          </p>
        )}

        <div className="mt-6">
          <OAuthButtons origin={origin} next={next} />
        </div>

        <div className="my-6 flex items-center gap-3 text-xs text-foreground-soft">
          <div className="h-px flex-1 bg-border" />
          또는 이메일로
          <div className="h-px flex-1 bg-border" />
        </div>

        <CustomerLoginForm next={next} />

        <p className="mt-6 text-center text-sm text-foreground-soft">
          아직 회원이 아니신가요?{" "}
          <Link href="/signup" className="font-semibold text-brand-ink hover:opacity-80">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
