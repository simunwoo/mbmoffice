"use client";

import { useTransition } from "react";
import { deleteAsRequest, updateAsRequestStatus } from "@/lib/actions/admin/as-requests";

const STATUS_OPTIONS: { value: "new" | "in_progress" | "done"; label: string }[] = [
  { value: "new", label: "신규" },
  { value: "in_progress", label: "처리중" },
  { value: "done", label: "완료" },
];

export function AsRequestRowActions({ id, status }: { id: string; status: "new" | "in_progress" | "done" }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-center gap-2">
      <select
        defaultValue={status}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.value as "new" | "in_progress" | "done";
          startTransition(() => updateAsRequestStatus(id, next));
        }}
        className="rounded-lg border border-border bg-transparent px-2 py-1.5 text-xs font-semibold outline-none focus:border-brand"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (confirm("이 요청을 삭제할까요?")) startTransition(() => deleteAsRequest(id));
        }}
        className="text-xs font-semibold text-foreground-soft hover:text-red-600"
      >
        삭제
      </button>
    </div>
  );
}
