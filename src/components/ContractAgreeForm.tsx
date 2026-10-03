"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { agreeToContract, type AgreeState } from "@/lib/actions/contract";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-brand py-3.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "처리 중..." : "동의하고 전자서명 완료"}
    </button>
  );
}

export function ContractAgreeForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(agreeToContract, { status: "idle" } as AgreeState);

  if (state.status === "success") {
    return (
      <div className="rounded-2xl border border-border bg-background p-8 text-center">
        <p className="text-lg font-bold text-brand-ink">전자서명이 완료되었습니다.</p>
        <p className="mt-2 text-sm text-foreground-soft">
          서명하신 계약 사본을 입력하신 이메일로 보내드렸습니다. 설치 일정은 담당자가 별도로 안내해 드립니다.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-6 rounded-2xl border border-border bg-background p-6">
      <input type="hidden" name="token" value={token} />
      <p className="text-sm font-bold">본인 확인</p>
      <p className="mt-1 text-xs text-foreground-soft">신청 시 입력하신 성함·연락처와 동일하게 입력해 주세요.</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-foreground-soft">성명</label>
          <input
            name="name"
            required
            className="mt-1.5 w-full rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-foreground-soft">연락처</label>
          <input
            name="phone"
            required
            placeholder="010-1234-5678"
            className="mt-1.5 w-full rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
        </div>
      </div>

      <label className="mt-5 flex items-start gap-2 text-sm">
        <input type="checkbox" name="consent" className="mt-0.5 h-4 w-4 accent-brand" />
        <span>
          위 계약 조항 전문을 읽고 확인하였으며, 「전자서명법」에 따라 전자적 방법으로 본 렌탈 계약에 동의합니다.
        </span>
      </label>

      {state.status === "error" && <p className="mt-3 text-sm font-medium text-red-600">{state.message}</p>}

      <div className="mt-5">
        <SubmitButton />
      </div>
    </form>
  );
}
