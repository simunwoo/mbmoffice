"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";
import { joinBrandName, type Product } from "@/lib/data/types";
import { INKJET_PRICING } from "@/lib/estimate";
import { getScaledColorTiers, getScaledMonoTiers, getInkjetTiers } from "@/lib/pricingTiers";
import { FAX_OPTION_PRICE } from "@/components/RecommendWizard";
import { ProductGallery } from "@/components/ProductGallery";
import { WishlistButton } from "@/components/WishlistButton";

const CATEGORY_BADGE: Record<string, string> = { mfp: "복합기", printer: "프린터" };

function findSpec(specs: string[] | undefined, ...keywords: string[]): string | null {
  return specs?.find((s) => keywords.some((k) => s.includes(k))) ?? null;
}

// 만원 단위로 표시하되, 35,000원처럼 딱 떨어지지 않는 금액은 "3.5만원"처럼 소수로 정확히 표시합니다.
function formatManwon(price: number): string {
  const manwon = price / 10000;
  return `${Number.isInteger(manwon) ? manwon : manwon.toFixed(1)}만원`;
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-border px-4 py-3 text-sm first:border-t-0">
      <p className="shrink-0 font-semibold text-foreground-soft">{label}</p>
      <p className="text-right text-foreground">{value}</p>
    </div>
  );
}

export function ProductBuyBox({
  product,
  images,
  size,
  colorLabel,
  sizeLabel,
}: {
  product: Product;
  images: string[];
  size: string;
  colorLabel: string;
  sizeLabel: string;
}) {
  const [faxOption, setFaxOption] = useState(false);
  const [tierIndex, setTierIndex] = useState<number | "custom">(0);
  const [optionIndex, setOptionIndex] = useState(0);
  const isCustom = tierIndex === "custom";

  const productLabel = joinBrandName(product.brand, product.name);
  const isLaser = (product.category === "mfp" || product.category === "printer") && product.printTech === "laser";
  const isInkjet = product.printTech === "inkjet";
  const hasPlanTiers = isLaser && product.color === "color";
  const hasMonoPlanTiers = isLaser && product.color === "mono";
  const hasInkjetTiers = isInkjet;
  const showTierSelector = hasPlanTiers || hasMonoPlanTiers || hasInkjetTiers;
  const canToggleFax = isLaser && size === "a3";
  const faxIncluded = isLaser && size === "a4";

  // 이 모델의 실제 등록 가격을 기준으로 요금제 3단계 금액을 계산합니다 (모델마다 결과가 달라집니다).
  const scaledTiers = useMemo(() => getScaledColorTiers(product), [product]);

  // 흑백 전용 모델의 등급별 요금도 이 모델의 실제 등록 가격 기준으로 비례 계산합니다.
  const scaledMonoTiers = useMemo(() => getScaledMonoTiers(product), [product]);

  // 잉크젯은 흑백·컬러 구분 없이 총 출력량 구간별 고정 요금입니다 (estimate.ts의 실제 회사 정책, 모델 공통).
  const inkjetTiers = useMemo(() => getInkjetTiers(), []);

  const activeTiers = hasPlanTiers ? scaledTiers : hasMonoPlanTiers ? scaledMonoTiers : hasInkjetTiers ? inkjetTiers : [];
  const selectedTier = !isCustom && activeTiers.length > 0 ? activeTiers[tierIndex as number] : null;
  const selectedOption =
    selectedTier && "options" in selectedTier ? (selectedTier.options[optionIndex] ?? selectedTier.options[0]) : null;

  const baseVolumeText = isCustom
    ? "고객 사용량에 맞춰 상담"
    : selectedOption
      ? `흑백 ${selectedOption.mono.toLocaleString()}매 / 컬러 ${selectedOption.color.toLocaleString()}매`
      : selectedTier && "monoPages" in selectedTier
        ? `흑백 월 ${selectedTier.monoPages.toLocaleString()}매까지`
        : selectedTier && "pages" in selectedTier
          ? `흑백·컬러 구분 없이 월 ${selectedTier.pages.toLocaleString()}매까지`
          : "상담 시 확정";
  const monoOverage = "10원";
  const colorOverage = size === "a3" ? "200원" : "100원";
  const overageText = hasPlanTiers
    ? `흑백 매당 ${monoOverage} · 컬러 매당 ${colorOverage} (VAT 별도)`
    : hasMonoPlanTiers
      ? `흑백 매당 ${monoOverage} (VAT 별도)`
      : isInkjet
        ? `매당 ${INKJET_PRICING.overagePerPage}원 (VAT 별도)`
        : "상담 시 확정";
  const speedSpec = findSpec(product.specs, "출력 속도", "출력속도") ?? "상담 시 확인";

  const basePrice = isCustom ? null : selectedTier ? selectedTier.price : product.priceMonthly;
  const faxSurcharge = canToggleFax && faxOption ? FAX_OPTION_PRICE : 0;
  const totalPrice = basePrice != null ? basePrice + faxSurcharge : null;

  const contactExtra = [
    isCustom ? "맞춤상담 요청" : selectedTier ? `${selectedTier.label} 요금제` : null,
    canToggleFax && faxOption ? "팩스 옵션 포함" : null,
  ]
    .filter(Boolean)
    .join(", ");
  const contactLabel = contactExtra ? `${productLabel} (${contactExtra})` : productLabel;
  const contactHref = `/contact?product=${encodeURIComponent(contactLabel)}${isCustom ? "&usage=1" : ""}`;

  const applyParams = new URLSearchParams({ product: product.id });
  if (selectedTier) applyParams.set("plan", selectedTier.label);
  if (product.termMonths) applyParams.set("term", String(product.termMonths));
  if (canToggleFax && faxOption) applyParams.set("fax", "1");
  if (totalPrice != null) applyParams.set("price", String(totalPrice));
  if (baseVolumeText) applyParams.set("vol", baseVolumeText);
  const applyHref = `/rental/apply?${applyParams.toString()}`;

  function selectTier(i: number) {
    setTierIndex(i);
    setOptionIndex(0);
  }

  return (
    <>
      {/* 사진과 구매 패널을 한 그리드에 묶어, 그리드 높이가 구매 패널 높이만큼 커져도
          아래 조건 요약 카드는 이 그리드의 바깥(형제 블록)이라 영향을 받지 않습니다. */}
      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start">
        <ProductGallery images={images} alt={productLabel} />

        {/* 사진과 나란히 붙는 구매 패널: 가격·요금제 선택·팩스 옵션·신청 버튼을 한 덩어리로 유지합니다.
            내용이 길어지면서 sticky가 아래 상세정보 영역과 겹쳐 보이는 문제가 있어 일반 배치로 되돌렸습니다. */}
        <div className="rounded-2xl border border-border bg-background p-6">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground-soft">{product.brand}</span>
          {CATEGORY_BADGE[product.category] && (
            <span className="rounded-full bg-brand px-3 py-1 text-xs font-bold text-white">{CATEGORY_BADGE[product.category]}</span>
          )}
        </div>
        <h1 className="mt-3 text-2xl font-bold leading-snug">{product.name}</h1>
        {product.termMonths && (
          <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-brand-ink">
            <span aria-hidden>•</span> {product.termMonths}개월 약정 · 보증금 없음
          </p>
        )}
        <p className="mt-2 text-sm leading-relaxed text-foreground-soft">
          약정·기본 제공 매수·설치 조건에 따라 최종 견적이 달라질 수 있습니다. 필요한 사용 조건으로 상담해 주세요.
        </p>

        <div className="mt-5 rounded-xl bg-surface p-5">
          <p className="text-xs text-foreground-soft">월 렌탈료</p>
          {totalPrice != null ? (
            <p className="mt-1 text-3xl font-bold text-brand-ink">
              {totalPrice.toLocaleString()}원
              <span className="ml-1 text-sm font-normal text-foreground-soft">/월</span>
            </p>
          ) : isCustom ? (
            <p className="mt-1 text-lg font-semibold">사용 매수를 알려주시면 맞춤 요금을 안내해 드립니다.</p>
          ) : (
            <p className="mt-1 text-lg font-semibold">정확한 렌탈료는 전화 문의 시 안내해 드립니다.</p>
          )}
          {faxSurcharge > 0 && (
            <p className="mt-1 text-xs text-foreground-soft">
              기본 {basePrice?.toLocaleString()}원 + 팩스 옵션 {faxSurcharge.toLocaleString()}원
            </p>
          )}
          <p className="mt-1 text-xs text-foreground-soft">부가세 별도 · 약정 및 기본 매수는 아래 조건표를 확인해 주세요.</p>
        </div>

        {showTierSelector && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-foreground-soft">요금제 (이 모델 기준)</p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {activeTiers.map((t, i) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => selectTier(i)}
                  className={`rounded-lg border-2 px-2 py-2.5 text-center transition ${
                    tierIndex === i ? "bg-brand-soft" : "border-border hover:border-brand/50"
                  }`}
                  style={tierIndex === i ? { borderColor: t.accent } : undefined}
                >
                  <span className="block text-xs font-bold" style={{ color: t.accent }}>
                    {t.label}
                  </span>
                  <span className="mt-1 block text-sm font-bold text-foreground">{formatManwon(t.price)}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setTierIndex("custom")}
                className={`rounded-lg border-2 px-2 py-2.5 text-center transition ${
                  isCustom ? "border-brand-ink bg-brand-soft" : "border-border hover:border-brand/50"
                }`}
              >
                <span className="block text-xs font-bold text-foreground-soft">맞춤상담</span>
                <span className="mt-1 block text-sm font-bold text-foreground">직접 문의</span>
              </button>
            </div>

            {isCustom ? (
              <p className="mt-3 text-xs text-foreground-soft">
                제공되는 요금제와 사용량이 맞지 않으신가요? 견적 문의 시 월 사용 매수를 알려주시면 맞춤 요금제로 안내해 드립니다.
              </p>
            ) : selectedTier && "options" in selectedTier ? (
              <>
                <p className="mt-3 text-xs font-semibold text-foreground-soft">월 사용량 선택 ({selectedTier.label})</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedTier.options.map((o, i) => (
                    <button
                      key={`${o.mono}-${o.color}`}
                      type="button"
                      onClick={() => setOptionIndex(i)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        optionIndex === i ? "border-brand bg-brand-soft text-brand-ink" : "border-border text-foreground-soft hover:border-brand/50"
                      }`}
                    >
                      흑백 {o.mono.toLocaleString()} / 컬러 {o.color.toLocaleString()}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-foreground-soft">
                  같은 요금제 안에서는 흑백·컬러 매수 비중만 선택하며 가격은 동일합니다. 부가세 별도.
                </p>
              </>
            ) : selectedTier && "monoPages" in selectedTier ? (
              <p className="mt-3 text-xs text-foreground-soft">
                흑백 월 {selectedTier.monoPages.toLocaleString()}매까지 포함되며, 초과분은 매당 {monoOverage}(VAT 별도)이
                추가됩니다.
              </p>
            ) : (
              selectedTier &&
              "pages" in selectedTier && (
                <p className="mt-3 text-xs text-foreground-soft">
                  흑백·컬러 구분 없이 월 {selectedTier.pages.toLocaleString()}매까지 포함되며, 초과분은 매당{" "}
                  {INKJET_PRICING.overagePerPage}원(VAT 별도)이 추가됩니다.
                </p>
              )
            )}
          </div>
        )}

        {(canToggleFax || faxIncluded) && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-foreground-soft">팩스 기능</p>
            {canToggleFax ? (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFaxOption(false)}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
                    !faxOption ? "border-brand bg-brand-soft text-brand-ink" : "border-border text-foreground-soft hover:border-brand/50"
                  }`}
                >
                  팩스 미사용
                </button>
                <button
                  type="button"
                  onClick={() => setFaxOption(true)}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
                    faxOption ? "border-brand bg-brand-soft text-brand-ink" : "border-border text-foreground-soft hover:border-brand/50"
                  }`}
                >
                  팩스 장착 (+{FAX_OPTION_PRICE.toLocaleString()}원)
                </button>
              </div>
            ) : (
              <p className="mt-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-foreground-soft">
                기본 포함 (별도 옵션 없음)
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <div className="flex gap-3">
            <Link
              href={applyHref}
              className="flex-1 rounded-full bg-brand py-3.5 text-center text-sm font-bold text-white hover:opacity-90"
            >
              렌탈 신청 →
            </Link>
            <WishlistButton productId={product.id} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href={contactHref}
              className="rounded-full border border-border bg-background py-3.5 text-center text-sm font-bold hover:opacity-80"
            >
              렌탈 견적 문의
            </Link>
            <a
              href={siteConfig.kakaoChatUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#FEE500] py-3.5 text-center text-sm font-bold text-[#3C1E1E] hover:opacity-90"
            >
              카카오톡 상담
            </a>
          </div>
        </div>

        <div className="mt-5 space-y-1 text-sm">
          <p>
            <span className="text-foreground-soft">배송</span>{" "}
            <span className="font-medium">상담 시 지역·배송 및 설치 조건 확정</span>
          </p>
          <p>
            <span className="text-foreground-soft">문의</span>{" "}
            <span className="font-medium">
              {siteConfig.phone} ({siteConfig.businessHours.weekday}) · 카카오 채널
            </span>
          </p>
        </div>
        </div>
      </div>

      {/* 조건 요약 카드: 그리드 바깥의 완전한 형제 블록이라 항상 전체 너비로, 구매 패널 높이와 무관하게 바로 이어집니다 */}
      <div className="mt-8 rounded-2xl border border-border bg-background p-6">
        <p className="text-sm font-bold">조건 요약</p>
        <div className="mt-3 overflow-hidden rounded-xl border border-border sm:grid sm:grid-cols-2 sm:divide-x sm:divide-border">
          <div>
            <SpecRow label="공급 상태" value={product.priceMonthly ? "판매중 (원본 등록정보 기준)" : "상담 문의"} />
            <SpecRow label="부가세" value="별도 (10%)" />
            <SpecRow label="약정 기간" value={product.termMonths ? `${product.termMonths}개월` : "36개월"} />
            <SpecRow label="렌탈 보증금" value="없음 (기본요금 선청구 방식)" />
            <SpecRow label="월 기본 흑백 / 컬러" value={baseVolumeText} />
            <SpecRow label="흑백 / 컬러 초과 단가" value={overageText} />
          </div>
          <div>
            <SpecRow label="출력" value={colorLabel} />
            <SpecRow label="최대 용지" value={sizeLabel} />
            <SpecRow label="출력 속도" value={speedSpec} />
            <SpecRow label="배송·설치" value="상담 시 지역·배송 및 설치 조건 확정" />
            <SpecRow label="유지보수" value="기종별 유지보수 범위는 상담 시 확정" />
          </div>
        </div>
        <p className="mt-3 text-xs text-foreground-soft">
          동일 기종도 약정과 기본 매수에 따라 금액이 달라집니다. 정확한 조건은 상담을 통해 확정해 드립니다.
        </p>
      </div>
    </>
  );
}
