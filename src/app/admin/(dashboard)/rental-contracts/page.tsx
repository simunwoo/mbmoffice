import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { RentalApplicationRow } from "@/lib/supabase/types";

type ContractFilter = "all" | "pending" | "signed";

export default async function AdminRentalContractsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const activeFilter: ContractFilter = status === "pending" || status === "signed" ? status : "all";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rental_applications")
    .select("*")
    .not("contract_token", "is", null)
    .order("contract_sent_at", { ascending: false });

  const contracts = (data ?? []) as RentalApplicationRow[];
  const pending = contracts.filter((c) => !c.contract_agreed_at);
  const signed = contracts.filter((c) => c.contract_agreed_at);

  const filtered = activeFilter === "pending" ? pending : activeFilter === "signed" ? signed : contracts;

  const cards: { key: ContractFilter; label: string; value: number }[] = [
    { key: "all", label: "전체 계약", value: contracts.length },
    { key: "pending", label: "서명 대기중", value: pending.length },
    { key: "signed", label: "서명완료", value: signed.length },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">렌탈계약</h1>
      <p className="mt-1 text-sm text-foreground-soft">전자계약서를 발급한 렌탈신청 건의 서명 진행 현황입니다.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.key}
            href={c.key === "all" ? "/admin/rental-contracts" : `/admin/rental-contracts?status=${c.key}`}
            className={`rounded-2xl border p-5 transition hover:shadow-sm ${
              activeFilter === c.key ? "border-brand bg-brand-soft" : "border-border bg-background"
            }`}
          >
            <p className="text-xs font-semibold text-foreground-soft">{c.label}</p>
            <p className={`mt-2 text-3xl font-bold ${activeFilter === c.key ? "text-brand-ink" : ""}`}>{c.value}</p>
          </Link>
        ))}
      </div>

      {error && <p className="mt-6 text-sm text-red-600">불러오는 중 오류가 발생했습니다: {error.message}</p>}

      {!error && filtered.length === 0 && (
        <p className="mt-10 text-sm text-foreground-soft">
          {contracts.length === 0
            ? "아직 발급된 전자계약이 없습니다. 렌탈신청 상세페이지에서 \"전자계약 보내기\"로 발급할 수 있습니다."
            : "조건에 맞는 계약이 없습니다."}
        </p>
      )}

      {!error && filtered.length > 0 && (
        <div className="mt-6 space-y-3">
          {filtered.map((c) => (
            <div key={c.id} className="relative rounded-2xl border border-border bg-background p-4 transition hover:border-brand/40">
              <Link href={`/admin/rental-applications/${c.id}`} className="absolute inset-0 z-0" aria-label="상세보기" />
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="text-xs text-foreground-soft">
                    발급 {c.contract_sent_at ? new Date(c.contract_sent_at).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" }) : "-"}
                  </span>
                  <span className="font-semibold">{c.product_name}</span>
                  <span className="text-sm text-foreground-soft">
                    {c.applicant_name}
                    {c.company_name ? ` (${c.company_name})` : ""} · {c.applicant_phone}
                  </span>
                </div>
                <div className="relative z-10">
                  {c.contract_agreed_at ? (
                    <span className="inline-block rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                      서명완료 · {new Date(c.contract_agreed_at).toLocaleDateString("ko-KR")}
                    </span>
                  ) : (
                    <span className="inline-block rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">서명 대기중</span>
                  )}
                </div>
              </div>
              {c.contract_agreed_name && (
                <p className="mt-2 text-sm text-foreground-soft">서명자: {c.contract_agreed_name} · IP {c.contract_agreed_ip || "-"}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
