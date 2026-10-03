"use client";

import { useState } from "react";
import { siteConfig } from "@/lib/site-config";
import { startRentalApplication } from "@/lib/actions/rental-apply";
import { trackEvent } from "@/lib/gtag";

export function RentalApplyForm({
  productId,
  productLabel,
  planLabel,
  termMonths,
  faxOption,
  monthlyPrice,
  usageSummary,
}: {
  productId: string;
  productLabel: string;
  planLabel: string | null;
  termMonths: number | null;
  faxOption: boolean;
  monthlyPrice: number | null;
  usageSummary: string | null;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [bizNumber, setBizNumber] = useState("");
  const [paymentDay, setPaymentDay] = useState("");
  const [address, setAddress] = useState("");
  const [installDate, setInstallDate] = useState("");
  const [notes, setNotes] = useState("");

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const allAgreed = agreeTerms && agreePrivacy;

  async function handleSubmit() {
    setError(null);
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setError("이름·연락처·설치 주소를 입력해 주세요.");
      return;
    }
    if (!allAgreed) {
      setError("약관에 모두 동의해 주세요.");
      return;
    }

    setSubmitting(true);
    const result = await startRentalApplication({
      productId,
      productName: productLabel,
      planLabel,
      termMonths,
      faxOption,
      monthlyPrice,
      usageSummary,
      applicantName: name,
      applicantPhone: phone,
      applicantEmail: email,
      companyName,
      businessRegNumber: bizNumber,
      installAddress: address,
      installDate,
      notes,
      paymentDay: paymentDay ? Number(paymentDay) : null,
    });
    setSubmitting(false);

    if (!result.success) {
      setError(result.message ?? "신청 접수 중 문제가 발생했습니다.");
      return;
    }
    trackEvent("generate_lead", {
      lead_type: "rental_application",
      item_name: productLabel,
      value: monthlyPrice ?? undefined,
      currency: "KRW",
    });
    setDone(true);
  }

  if (done) {
    return (
      <div className="mt-6 rounded-2xl border border-border bg-background p-10 text-center">
        <p className="text-lg font-bold text-brand-ink">렌탈 신청이 접수되었습니다.</p>
        <p className="mt-2 text-sm text-foreground-soft">
          입력하신 연락처로 담당자가 빠르게 연락드려 계약 조건과 설치 일정을 안내해 드립니다.
        </p>
        <p className="mt-4 text-xs text-foreground-soft">급하시면 전화 {siteConfig.phone}로 바로 연결해 드립니다.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-5">
      {/* 1. 계약조건 */}
      <div className="rounded-2xl border border-border bg-background p-6">
        <p className="text-sm font-bold">1. 계약조건</p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-foreground-soft">상품</p>
            <p className="mt-0.5 font-semibold">{productLabel}</p>
          </div>
          <div>
            <p className="text-xs text-foreground-soft">요금제</p>
            <p className="mt-0.5 font-semibold">{planLabel ?? "상담 후 결정"}</p>
          </div>
          <div>
            <p className="text-xs text-foreground-soft">약정 기간</p>
            <p className="mt-0.5 font-semibold">{termMonths ? `${termMonths}개월` : "상담 후 확정"}</p>
          </div>
          <div>
            <p className="text-xs text-foreground-soft">월 예상 금액</p>
            <p className="mt-0.5 font-semibold">{monthlyPrice ? `${monthlyPrice.toLocaleString()}원 (VAT 별도)` : "상담 후 확정"}</p>
          </div>
          {usageSummary && (
            <div className="col-span-2">
              <p className="text-xs text-foreground-soft">흑백·컬러 매수</p>
              <p className="mt-0.5 font-semibold">{usageSummary}</p>
            </div>
          )}
          {faxOption && (
            <div className="col-span-2">
              <p className="text-xs text-foreground-soft">팩스 옵션</p>
              <p className="mt-0.5 font-semibold">포함</p>
            </div>
          )}
        </div>
        <p className="mt-3 text-xs text-foreground-soft">조건을 바꾸고 싶으시면 상품 상세페이지로 돌아가 다시 선택해 주세요.</p>
      </div>

      {/* 2. 신청자 정보 */}
      <div className="rounded-2xl border border-border bg-background p-6">
        <p className="text-sm font-bold">2. 신청자 정보</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="이름 *">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="홍길동" />
          </Field>
          <Field label="연락처 *">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="010-1234-5678" />
          </Field>
          <Field label="이메일">
            <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="선택 입력" />
          </Field>
          <Field label="회사명">
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputClass} placeholder="선택 입력" />
          </Field>
          <Field label="사업자등록번호">
            <input value={bizNumber} onChange={(e) => setBizNumber(e.target.value)} className={inputClass} placeholder="선택 입력" />
          </Field>
          <Field label="월 렌탈료 결제일">
            <select value={paymentDay} onChange={(e) => setPaymentDay(e.target.value)} className={inputClass}>
              <option value="">선택 입력</option>
              {[5, 10, 15, 20, 25, 30].map((d) => (
                <option key={d} value={d}>
                  매월 {d}일
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {/* 3. 설치장소·일정 */}
      <div className="rounded-2xl border border-border bg-background p-6">
        <p className="text-sm font-bold">3. 설치장소·일정</p>
        <div className="mt-4 space-y-4">
          <Field label="설치 주소 *">
            <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} placeholder="도로명 주소를 입력해 주세요" />
          </Field>
          <Field label="희망 설치일">
            <input
              type="date"
              value={installDate}
              onChange={(e) => setInstallDate(e.target.value)}
              onClick={(e) => e.currentTarget.showPicker?.()}
              className={`${inputClass} cursor-pointer`}
            />
          </Field>
          <Field label="요청사항">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inputClass} placeholder="선택 입력" />
          </Field>
        </div>
      </div>

      {/* 4. 약관 동의 및 신청 */}
      <div className="rounded-2xl border border-border bg-background p-6">
        <p className="text-sm font-bold">4. 약관 동의 및 신청</p>
        <div className="mt-4 space-y-2">
          <AgreeRow checked={agreeTerms} onChange={setAgreeTerms} label="[필수] 렌탈 이용약관에 동의합니다." />
          <AgreeRow
            checked={agreePrivacy}
            onChange={setAgreePrivacy}
            label="[필수] 상담을 위한 개인정보 수집·이용에 동의합니다."
          />
        </div>

        <div className="mt-4 rounded-xl bg-surface p-4 text-xs text-foreground-soft">
          신청서를 접수하면 담당 매니저가 직접 연락드려 계약 조건과 결제(카드 자동이체 등) 방법을 안내해 드립니다.
          이 단계에서는 어떠한 결제나 카드 등록도 진행되지 않습니다.
        </div>

        {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-5 w-full rounded-full bg-brand py-3.5 text-center text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? "접수 중..." : "렌탈 신청하기"}
        </button>
        <p className="mt-3 text-center text-xs text-foreground-soft">
          급하시면 전화 {siteConfig.phone}로 연결해 드립니다.
        </p>
      </div>
    </div>
  );
}

const inputClass = "w-full rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-foreground-soft">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function AgreeRow({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-start gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-brand"
      />
      <span>{label}</span>
    </label>
  );
}
