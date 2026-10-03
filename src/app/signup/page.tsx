import Image from "next/image";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { getOrigin } from "@/lib/origin";
import { OAuthButtons } from "@/components/OAuthButtons";
import { CustomerSignupForm } from "@/components/CustomerSignupForm";

export const metadata = buildMetadata({
  title: "회원가입",
  description: "카카오·네이버·구글 또는 이메일로 회원가입하세요.",
  path: "/signup",
});

export default async function SignupPage() {
  const origin = await getOrigin();

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="rounded-2xl border border-border bg-background p-8 shadow-sm">
        <div className="flex items-center gap-2">
          <Image src="/mbm-logo.png" alt={siteConfig.name} width={100} height={30} className="h-7 w-auto" />
          <span className="text-sm font-extrabold text-foreground-soft">{siteConfig.name} MBM</span>
        </div>

        <h1 className="mt-6 text-2xl font-bold">회원가입</h1>
        <p className="mt-2 text-sm text-foreground-soft">카카오·네이버·구글 계정으로 바로 가입하거나, 이메일로 가입할 수 있습니다.</p>

        <div className="mt-6">
          <OAuthButtons origin={origin} />
        </div>

        <div className="my-6 flex items-center gap-3 text-xs text-foreground-soft">
          <div className="h-px flex-1 bg-border" />
          또는 이메일로
          <div className="h-px flex-1 bg-border" />
        </div>

        <CustomerSignupForm />

        <p className="mt-6 text-center text-sm text-foreground-soft">
          이미 회원이신가요?{" "}
          <Link href="/login" className="font-semibold text-brand-ink hover:opacity-80">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
