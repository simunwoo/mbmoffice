"use client";

import { useTransition } from "react";
import { deleteMemberAndRedirect, updateMemberRole } from "@/lib/actions/admin/members";

export function MemberRoleSelect({ id, role }: { id: string; role: "member" | "admin" }) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={role}
      disabled={isPending}
      onChange={(e) => {
        const next = e.target.value as "member" | "admin";
        startTransition(() => updateMemberRole(id, next));
      }}
      className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold outline-none focus:border-brand"
    >
      <option value="member">일반회원</option>
      <option value="admin">관리자</option>
    </select>
  );
}

export function MemberDeleteButton({ id, isSelf }: { id: string; isSelf: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending || isSelf}
      title={isSelf ? "본인 계정은 삭제할 수 없습니다" : undefined}
      onClick={() => {
        if (!confirm("이 회원을 삭제할까요? 계정이 완전히 삭제되며 되돌릴 수 없습니다.")) return;
        startTransition(() => deleteMemberAndRedirect(id));
      }}
      className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
    >
      회원 삭제
    </button>
  );
}
