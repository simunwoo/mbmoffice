"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitInquiry, type InquiryFormState } from "@/lib/actions/inquiry";
import { siteConfig } from "@/lib/site-config";

const INTEREST_OPTIONS = ["복합기 렌탈", "조립PC·노트북 렌탈", "문서세단기 렌탈", "IT·PC 유지보수", "구매", "기타"];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-brand px-7 py-3.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "접수 중..." : "견적 문의 보내기"}
    </button>
  );
}

export function ContactForm() {
  const [state, formAction] = useActionState(submitInquiry, { status: "idle" } as InquiryFormState);
  const searchParams = useSearchParams();
  const packageLabel = searchParams.get("package");
  const productLabel = searchParams.get("product");
  const needsUsage = searchParams.get("usage") === "1";
  const defaultMessage = packageLabel
    ? `[${packageLabel} 패키지] 상담을 원합니다.\n\n`
    : productLabel
      ? `[${productLabel}] 렌탈 상담을 원합니다.\n\n${
          needsUsage ? "월 사용 매수를 알려주시면 딱 맞는 요금제로 안내해 드립니다.\n예) 흑백 ○,○○○매 / 컬러 ○○○매\n\n" : ""
        }`
      : "";

  if (state.status === "success") {
    return (
      <div className="rounded-2xl border border-border bg-background p-10 text-center">
        <p className="text-lg font-bold text-brand-ink">{state.message}</p>
        <p className="mt-2 text-sm text-foreground-soft">급하시면 전화 {siteConfig.phone}로 바로 연결해 드립니다.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="rounded-2xl border border-border bg-background p-6 sm:p-8">
      <h2 className="text-xl font-bold">온라인 견적문의</h2>
      <p className="mt-1 text-sm text-foreground-soft">빠른 상담을 원하시면 전화 또는 카카오톡이 가장 빠릅니다.</p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="text-sm font-semibold">
            이름 <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="홍길동"
            className="mt-2 w-full rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
        </div>
        <div>
          <label htmlFor="phone" className="text-sm font-semibold">
            연락처 <span className="text-red-500">*</span>
          </label>
          <input
            id="phone"
            name="phone"
            required
            type="tel"
            placeholder="010-1234-5678"
            className="mt-2 w-full rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
        </div>
        <div>
          <label htmlFor="email" className="text-sm font-semibold">
            이메일 <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            required
            type="email"
            placeholder="견적서를 받으실 이메일 주소"
            className="mt-2 w-full rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
        </div>
        <div>
          <label htmlFor="companyName" className="text-sm font-semibold">
            회사명
          </label>
          <input
            id="companyName"
            name="companyName"
            placeholder="(선택) 회사·기관명"
            className="mt-2 w-full rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-semibold">
            관심 상품 <span className="text-red-500">*</span>
            <span className="ml-1 text-xs font-normal text-foreground-soft">(복수 선택 가능 · 패키지 문의 시 여러 개 선택해주세요)</span>
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((o) => (
              <label key={o} className="cursor-pointer">
                <input type="checkbox" name="interest" value={o} className="peer sr-only" />
                <span className="inline-flex items-center rounded-full border border-border px-3.5 py-2 text-sm font-semibold text-foreground-soft transition peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white hover:border-brand/50">
                  {o}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="message" className="text-sm font-semibold">
          문의내용 <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          defaultValue={defaultMessage}
          placeholder="사무실 인원, 월 예상 출력량, 희망 기종 등을 적어 주시면 더 정확한 견적을 드릴 수 있습니다."
          className="mt-2 w-full rounded-lg border border-border bg-transparent p-3 text-sm outline-none focus:border-brand"
        />
      </div>

      <div className="mt-5 rounded-xl bg-surface p-4">
        <label className="flex items-start gap-2 text-sm font-semibold">
          <input type="checkbox" name="consent" value="yes" required className="mt-0.5 h-4 w-4 accent-brand" />
          <span>
            <span className="text-red-500">[필수]</span> 개인정보 수집·이용에 동의합니다.
          </span>
        </label>
        <p className="mt-2 text-xs leading-relaxed text-foreground-soft">
          수집항목: 이름, 연락처, 회사명, 문의내용 · 목적: 견적·상담 회신 · 보유기간: 상담 완료 후 1년. 동의를 거부할
          수 있으나 거부 시 온라인 문의가 제한됩니다.{" "}
          <Link href="/privacy" className="underline hover:text-brand-ink">
            개인정보처리방침
          </Link>
        </p>
      </div>

      {state.status === "error" && <p className="mt-4 text-sm font-medium text-red-600">{state.message}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <SubmitButton />
        <p className="text-xs text-foreground-soft">{siteConfig.businessHours.weekday} 접수 건은 당일 회신을 원칙으로 합니다.</p>
      </div>
    </form>
  );
}
