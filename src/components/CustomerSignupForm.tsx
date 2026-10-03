"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { customerSignup, type AuthState } from "@/lib/actions/customer-auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-brand-ink px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "가입 처리 중..." : "이메일로 회원가입"}
    </button>
  );
}

export function CustomerSignupForm() {
  const [state, formAction] = useActionState(customerSignup, { status: "idle" } as AuthState);

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
        <label htmlFor="name" className="text-sm font-semibold">
          이름 *
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder="홍길동"
          className="mt-1.5 w-full rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
      </div>
      <div>
        <label htmlFor="phone" className="text-sm font-semibold">
          연락처
        </label>
        <input
          id="phone"
          name="phone"
          placeholder="010-1234-5678 (선택)"
          className="mt-1.5 w-full rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
      </div>
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
          minLength={8}
          autoComplete="new-password"
          placeholder="8자 이상"
          className="mt-1.5 w-full rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
      </div>
      {state.status === "error" && <p className="text-sm font-medium text-red-600">{state.message}</p>}
      <SubmitButton />
    </form>
  );
}
