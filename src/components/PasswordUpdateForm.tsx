"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updatePassword, type AuthState } from "@/lib/actions/customer-auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-brand-ink px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "변경 중..." : "비밀번호 변경"}
    </button>
  );
}

export function PasswordUpdateForm() {
  const [state, formAction] = useActionState(updatePassword, { status: "idle" } as AuthState);

  return (
    <form action={formAction} className="mt-5 space-y-4">
      <div>
        <label htmlFor="password" className="text-sm font-semibold">
          새 비밀번호
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
