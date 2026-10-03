"use client";

import { useState, useTransition } from "react";
import { sendRentalContract } from "@/lib/actions/admin/rental-applications";

export function SendContractButton({ id, alreadySent }: { id: string; alreadySent: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await sendRentalContract(id);
            if (!result.success) setError(result.message ?? "발송에 실패했습니다.");
          });
        }}
        className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "발송 중..." : alreadySent ? "전자계약 다시 보내기" : "전자계약 보내기"}
      </button>
      {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
