import Link from "next/link";
import { redirect } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { customerLogout } from "@/lib/actions/customer-auth";
import { submitAsRequest, updateMyProfile } from "@/lib/actions/customer-profile";
import type { AsRequestRow, InquiryRow, ProfileRow, RentalApplicationRow } from "@/lib/supabase/types";

export const metadata = buildMetadata({
  title: "마이페이지",
  description: "회원 정보를 확인합니다.",
  path: "/mypage",
});

const PROVIDER_LABEL: Record<string, string> = {
  email: "이메일",
  kakao: "카카오",
  naver: "네이버",
  google: "구글",
};

const CONTRACT_STATUS_LABEL: Record<RentalApplicationRow["status"], string> = {
  new: "접수 확인 중",
  contacted: "상담 진행 중",
  won: "계약 진행 중",
  lost: "종료",
  closed: "종료",
};

// 전자서명까지 끝난 건은 status(won)와 별개로 "계약 완료"를 우선 표시합니다.
function contractStatusLabel(a: RentalApplicationRow): string {
  if (a.contract_agreed_at) {
    return `계약 완료 · ${new Date(a.contract_agreed_at).toLocaleDateString("ko-KR")}`;
  }
  if (a.contract_sent_at) return "전자계약 서명 대기 중";
  return CONTRACT_STATUS_LABEL[a.status];
}

const inputClass = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand";

export default async function MyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/mypage");
  }

  const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<ProfileRow>();
  const profile = profileData;

  const admin = createAdminClient();
  const email = user.email;
  const phone = profile?.phone || undefined;

  const inquiryConditions = [email && `email.eq.${email}`, phone && `phone.eq.${phone}`].filter(Boolean) as string[];
  const rentalConditions = [email && `applicant_email.eq.${email}`, phone && `applicant_phone.eq.${phone}`].filter(Boolean) as string[];

  const [{ data: inquiries }, { data: rentalApps }, { data: asRequests }] = await Promise.all([
    inquiryConditions.length
      ? admin.from("inquiries").select("*").or(inquiryConditions.join(",")).order("created_at", { ascending: false }).limit(5)
      : Promise.resolve({ data: [] as InquiryRow[] }),
    rentalConditions.length
      ? admin.from("rental_applications").select("*").or(rentalConditions.join(",")).order("created_at", { ascending: false }).limit(5)
      : Promise.resolve({ data: [] as RentalApplicationRow[] }),
    supabase.from("as_requests").select("*").order("created_at", { ascending: false }),
  ]);

  const linkedInquiries = (inquiries ?? []) as InquiryRow[];
  const linkedRentalApps = (rentalApps ?? []) as RentalApplicationRow[];
  const myAsRequests = (asRequests ?? []) as AsRequestRow[];
  // "계약성공(won)" 상태만 실제로 설치가 끝난 계약입니다. 신청 접수/상담 중인 건은
  // 아직 장비가 없는 상태라 A/S 대상이 아니므로 포함하지 않습니다.
  const activeContract = linkedRentalApps.find((a) => a.status === "won");

  return (
    <div className="bg-[#fafafa]">
      <div className="mx-auto max-w-5xl px-4 py-14">
        <p className="text-sm text-foreground-soft">
          <Link href="/" className="hover:text-brand-ink">홈</Link> <span aria-hidden>›</span> 마이페이지
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-brand-ink">
              <span className="h-px w-6 bg-brand-ink" /> MY PAGE
            </p>
            <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{profile?.name || "회원"}님 마이페이지</h1>
          </div>
          <form action={customerLogout}>
            <button type="submit" className="rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold hover:bg-surface">
              로그아웃
            </button>
          </form>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl border border-border bg-background p-6">
            <p className="text-sm font-bold">회원 정보</p>
            <dl className="mt-4 space-y-2.5 text-sm">
              <Row label="이름" value={profile?.name || "-"} />
              <Row label="이메일" value={user.email ?? "-"} />
              <Row label="휴대폰" value={profile?.phone || "-"} />
              <Row label="회사명" value={profile?.company_name || "-"} />
              <Row label="가입일" value={new Date(profile?.created_at ?? user.created_at ?? "").toLocaleDateString("ko-KR")} />
            </dl>

            <div className="mt-6 border-t border-border pt-5">
              <p className="text-sm font-bold">전화번호 등록·수정</p>
              <p className="mt-1 text-xs text-foreground-soft">
                상담 회신에 사용할 연락처입니다. 기존 계약 연결은 고객센터에서 본인 확인 후 처리합니다.
              </p>
              <form action={updateMyProfile} className="mt-4 space-y-4">
                <Field label="이름">
                  <input name="name" defaultValue={profile?.name ?? ""} required className={inputClass} />
                </Field>
                <Field label="휴대폰 *">
                  <input name="phone" defaultValue={profile?.phone ?? ""} required className={inputClass} />
                </Field>
                <Field label="회사명">
                  <input name="company_name" defaultValue={profile?.company_name ?? ""} className={inputClass} />
                </Field>
                <button type="submit" className="w-full rounded-full bg-brand-ink py-3 text-sm font-bold text-white hover:opacity-90">
                  저장
                </button>
              </form>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-border bg-background p-6">
              <p className="text-sm font-bold">연결된 로그인</p>
              <span className="mt-3 inline-block rounded-full bg-[#12241c] px-3 py-1 text-xs font-bold text-white">
                {PROVIDER_LABEL[profile?.provider ?? "email"] ?? profile?.provider}
              </span>
            </div>

            <div className="flex-1 rounded-2xl border border-border bg-background p-6">
              <p className="text-sm font-bold">주문 내역 · 렌탈 계약</p>
              <p className="mt-1 text-xs text-foreground-soft">
                본인 계정에 연결된 주문과 계약입니다. 기존 내역이 보이지 않으면 고객센터로 연결을 요청해 주세요.
              </p>

              <p className="mt-4 text-xs font-semibold text-foreground-soft">최근 견적문의</p>
              {linkedInquiries.length === 0 ? (
                <p className="mt-1 text-sm text-foreground-soft">연결된 문의가 없습니다.</p>
              ) : (
                <ul className="mt-1 space-y-1 text-sm">
                  {linkedInquiries.map((i) => (
                    <li key={i.id}>
                      {i.interest ?? "견적문의"} · {new Date(i.created_at).toLocaleDateString("ko-KR")}
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-4 text-xs font-semibold text-foreground-soft">렌탈 계약</p>
              {linkedRentalApps.length === 0 ? (
                <p className="mt-1 text-sm text-foreground-soft">연결된 계약이 없습니다.</p>
              ) : (
                <ul className="mt-1 space-y-1 text-sm">
                  {linkedRentalApps.map((a) => (
                    <li key={a.id}>
                      {a.product_name} · {contractStatusLabel(a)}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2">
                <a
                  href={siteConfig.phoneHref}
                  className="rounded-full border border-border py-2.5 text-center text-sm font-bold hover:bg-surface"
                >
                  전화 {siteConfig.phone}
                </a>
                <a
                  href={siteConfig.kakaoChatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-[#FEE500] py-2.5 text-center text-sm font-bold text-[#3C1E1E] hover:opacity-90"
                >
                  카카오톡 상담
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-border bg-background p-6">
          <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-brand-ink">
            <span className="h-px w-6 bg-brand-ink" /> CUSTOMER CARE
          </p>
          <h2 className="mt-3 text-xl font-bold">A/S·토너 요청</h2>
          <p className="mt-1 text-sm text-foreground-soft">사용 중인 계약을 선택하면 기종 정보를 다시 입력할 필요 없이 접수할 수 있습니다.</p>

          {activeContract ? (
            <form action={submitAsRequest} className="mt-4 space-y-3 rounded-xl bg-surface p-4">
              <input type="hidden" name="rental_application_id" value={activeContract.id} />
              <input type="hidden" name="contract_label" value={activeContract.product_name} />
              <p className="text-sm font-semibold">{activeContract.product_name}</p>
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-1.5">
                  <input type="radio" name="request_type" value="as" defaultChecked /> A/S
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="radio" name="request_type" value="toner" /> 토너
                </label>
              </div>
              <textarea name="description" required rows={3} placeholder="증상이나 요청 내용을 적어주세요" className={inputClass} />
              <button type="submit" className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:opacity-90">
                접수하기
              </button>
            </form>
          ) : (
            <div className="mt-4 rounded-xl bg-surface p-4">
              <p className="text-sm text-foreground-soft">
                현재 계정에 연결된 이용 중인 렌탈 계약이 없어 A/S는 접수하실 수 없습니다. 토너·소모품은 바로 구매하실 수 있고,
                기존 렌탈 고객은 고객센터에서 본인 확인 후 계약 연결을 요청해 주세요.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/shop/supplies" className="rounded-full bg-brand px-4 py-2 text-sm font-bold text-white hover:opacity-90">
                  토너·소모품 구매하기 →
                </Link>
                <a href={siteConfig.phoneHref} className="rounded-full border border-border bg-background px-4 py-2 text-sm font-bold hover:bg-surface">
                  전화 상담
                </a>
                <a
                  href={siteConfig.kakaoChatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-[#FEE500] px-4 py-2 text-sm font-bold text-[#3C1E1E] hover:opacity-90"
                >
                  카카오톡
                </a>
              </div>
            </div>
          )}

          <div className="mt-6 border-t border-border pt-5">
            <p className="text-sm font-bold">접수 내역</p>
            {myAsRequests.length === 0 ? (
              <p className="mt-1 text-sm text-foreground-soft">아직 접수한 요청이 없습니다.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {myAsRequests.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                    <span>
                      {r.request_type === "toner" ? "토너" : "A/S"} · {r.description}
                    </span>
                    <span className="text-xs text-foreground-soft">{new Date(r.created_at).toLocaleDateString("ko-KR")}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-foreground-soft">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-foreground-soft">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
