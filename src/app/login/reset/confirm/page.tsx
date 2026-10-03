import { buildMetadata } from "@/lib/seo";
import { PasswordUpdateForm } from "@/components/PasswordUpdateForm";

export const metadata = buildMetadata({
  title: "새 비밀번호 설정",
  description: "새 비밀번호를 설정합니다.",
  path: "/login/reset/confirm",
});

export default function PasswordResetConfirmPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="rounded-2xl border border-border bg-background p-8 shadow-sm">
        <h1 className="text-2xl font-bold">새 비밀번호 설정</h1>
        <p className="mt-2 text-sm text-foreground-soft">이메일로 받은 링크를 통해 접속하셨다면, 새 비밀번호를 설정해 주세요.</p>

        <PasswordUpdateForm />
      </div>
    </div>
  );
}
