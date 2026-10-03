import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { PasswordResetRequestForm } from "@/components/PasswordResetRequestForm";

export const metadata = buildMetadata({
  title: "비밀번호 재설정",
  description: "가입한 이메일로 비밀번호 재설정 링크를 보내드립니다.",
  path: "/login/reset",
});

export default function PasswordResetPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="rounded-2xl border border-border bg-background p-8 shadow-sm">
        <h1 className="text-2xl font-bold">비밀번호 재설정</h1>
        <p className="mt-2 text-sm text-foreground-soft">가입하신 이메일 주소로 재설정 링크를 보내드립니다.</p>

        <PasswordResetRequestForm />

        <p className="mt-6 text-center text-sm text-foreground-soft">
          <Link href="/login" className="font-semibold text-brand-ink hover:opacity-80">
            로그인으로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  );
}
