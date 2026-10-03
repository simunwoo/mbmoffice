"use client";

import { useTransition } from "react";

export function ConfirmDeleteButton({
  onDelete,
  confirmText = "정말 삭제할까요? 되돌릴 수 없습니다.",
}: {
  onDelete: () => Promise<void>;
  confirmText?: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (confirm(confirmText)) startTransition(() => onDelete());
      }}
      className="text-xs font-semibold text-foreground-soft hover:text-red-600 disabled:opacity-50"
    >
      삭제
    </button>
  );
}
