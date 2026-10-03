import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { createAdminClient } from "@/lib/supabase/admin";
import { ContractAgreeForm } from "@/components/ContractAgreeForm";
import { ContractDocument } from "@/components/ContractDocument";
import { isContractExpired } from "@/lib/contract";
import type { RentalApplicationRow } from "@/lib/supabase/types";

export const metadata = buildMetadata({
  title: "전자계약서",
  description: "렌탈 계약서를 확인하고 전자서명합니다.",
  path: "/contract",
});

export default async function ContractPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();
  const { data: app } = await admin
    .from("rental_applications")
    .select("*")
    .eq("contract_token", token)
    .maybeSingle<RentalApplicationRow>();

  if (!app) {
    return (
      <NoticeLayout title="유효하지 않은 링크입니다">
        계약서 링크를 다시 확인해 주세요. 문제가 계속되면 담당자에게 재발송을 요청해 주세요.
      </NoticeLayout>
    );
  }

  if (app.contract_agreed_at) {
    return (
      <NoticeLayout title="이미 서명이 완료된 계약입니다">
        {app.contract_agreed_name}님이{" "}
        {new Date(app.contract_agreed_at).toLocaleString("ko-KR", { dateStyle: "long", timeStyle: "short" })}에 전자서명을
        완료했습니다.
      </NoticeLayout>
    );
  }

  if (isContractExpired(app.contract_sent_at)) {
    return <NoticeLayout title="계약 링크가 만료되었습니다">담당자에게 연락하시면 계약서를 다시 보내드립니다.</NoticeLayout>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <p className="text-xs font-bold tracking-widest text-brand-ink">전자계약서</p>
      <h1 className="mt-2 text-2xl font-bold">{app.product_name} 렌탈 계약서</h1>
      <p className="mt-2 text-sm text-foreground-soft">
        아래 계약 조항 전문을 확인하신 뒤, 본인 확인 정보를 입력하고 전자서명해 주세요.
      </p>

      <div className="mt-6">
        <ContractDocument text={app.contract_terms_text ?? ""} />
      </div>

      <ContractAgreeForm token={token} />

      <p className="mt-4 text-center text-xs text-foreground-soft">
        문의사항은 전화 {siteConfig.phone}로 연락해 주세요.
      </p>
    </div>
  );
}

function NoticeLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="mt-3 text-sm text-foreground-soft">{children}</p>
      <a href={siteConfig.phoneHref} className="mt-6 inline-block rounded-full bg-brand px-6 py-3 text-sm font-bold text-white hover:opacity-90">
        전화 상담 {siteConfig.phone}
      </a>
    </div>
  );
}
