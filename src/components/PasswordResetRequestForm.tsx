"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { requestPasswordReset, type AuthState } from "@/lib/actions/customer-auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-brand-ink px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "전송 중..." : "재설정 링크 보내기"}
    </button>
  );
}

export function PasswordResetRequestForm() {
  const [state, formAction] = useActionState(requestPasswordReset, { status: "idle" } as AuthState);

  if (state.status === "check-email") {
    return (
      <div className="mt-5 rounded-xl border border-dashed border-border p-6 text-center text-sm">
        <p className="font-semibold">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-5 space-y-4">
      <div>
        <label htmlFor="email" className="text-sm font-semibold">
          가입한 이메일
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
      {state.status === "error" && <p className="text-sm font-medium text-red-600">{state.message}</p>}
      <SubmitButton />
    </form>
  );
}
