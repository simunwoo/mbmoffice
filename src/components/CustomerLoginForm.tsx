"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { customerLogin, type AuthState } from "@/lib/actions/customer-auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-brand-ink px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "로그인 중..." : "이메일로 로그인"}
    </button>
  );
}

export function CustomerLoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState(customerLogin, { status: "idle" } as AuthState);

  return (
    <form action={formAction} className="mt-5 space-y-4">
      <input type="hidden" name="next" value={next ?? "/mypage"} />
      <div>
        <label htmlFor="email" className="text-sm font-semibold">
          이메일 *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          placeholder="you@company.com"
          className="mt-1.5 w-full rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-semibold">
          비밀번호 *
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="비밀번호"
          className="mt-1.5 w-full rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
      </div>
      {state.status === "error" && <p className="text-sm font-medium text-red-600">{state.message}</p>}
      <SubmitButton />
      <div className="flex items-center justify-between text-xs">
        <Link href="/login/reset" className="text-foreground-soft hover:text-brand-ink">
          비밀번호를 잊으셨나요?
        </Link>
        <Link href="/signup" className="font-semibold text-brand-ink hover:opacity-80">
          이메일로 회원가입
        </Link>
      </div>
    </form>
  );
}
