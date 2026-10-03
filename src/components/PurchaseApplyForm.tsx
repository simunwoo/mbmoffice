"use client";

import Image from "next/image";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/lib/site-config";
import { startPurchaseOrder } from "@/lib/actions/purchase-apply";
import type { TossPaymentsWidgets } from "@tosspayments/tosspayments-sdk";

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "";

const DELIVERY_MEMO_OPTIONS = [
  "배송메모를 선택해 주세요.",
  "문 앞에 놓아주세요.",
  "경비실(관리실)에 맡겨주세요.",
  "부재 시 연락 부탁드려요.",
  "배송 전 미리 연락해 주세요.",
  "직접 입력",
];

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: { oncomplete: (data: { zonecode: string; roadAddress: string; jibunAddress: string }) => void }) => {
        open: () => void;
      };
    };
  }
}

export interface ApplyAddonItem {
  productId: string;
  productName: string;
  image?: string;
  unitPrice: number;
}

export function PurchaseApplyForm({
  productId,
  productLabel,
  productImage,
  unitPrice,
  variantId,
  optionLabel,
  addons,
  defaultName,
  defaultPhone,
  defaultEmail,
}: {
  productId: string;
  productLabel: string;
  productImage?: string;
  unitPrice: number;
  variantId?: string | null;
  optionLabel?: string | null;
  addons?: ApplyAddonItem[];
  /** 로그인한 회원이면 회원 정보로 미리 채워줍니다. 비회원이면 빈 값입니다. */
  defaultName?: string;
  defaultPhone?: string;
  defaultEmail?: string;
}) {
  const [quantity, setQuantity] = useState(1);
  const [addonQuantities, setAddonQuantities] = useState<Record<string, number>>(
    () => Object.fromEntries((addons ?? []).map((a) => [a.productId, 1]))
  );
  const [excludedAddonIds, setExcludedAddonIds] = useState<string[]>([]);
  const [name, setName] = useState(defaultName ?? "");
  const [phone, setPhone] = useState(defaultPhone ?? "");
  const [email, setEmail] = useState(defaultEmail ?? "");

  const [sameAsOrderer, setSameAsOrderer] = useState(false);
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [deliveryMemo, setDeliveryMemo] = useState(DELIVERY_MEMO_OPTIONS[0]);
  const [customMemo, setCustomMemo] = useState("");
  const [notes, setNotes] = useState("");

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [widgetsReady, setWidgetsReady] = useState(false);
  const widgetsRef = useRef<TossPaymentsWidgets | null>(null);

  const allAgreed = agreeTerms && agreePrivacy;
  const includedAddons = (addons ?? []).filter((a) => !excludedAddonIds.includes(a.productId));
  const addonsTotal = includedAddons.reduce((sum, a) => sum + a.unitPrice * (addonQuantities[a.productId] ?? 1), 0);
  const totalAmount = unitPrice * quantity + addonsTotal;
  const effectiveReceiverName = sameAsOrderer ? name : receiverName;
  const effectiveReceiverPhone = sameAsOrderer ? phone : receiverPhone;

  // 토스페이먼츠 결제위젯을 결제수단/약관 영역에 직접 그립니다 — 버튼을 누르기 전에도
  // 카드·간편결제 등 실제 선택 UI가 보이고, 금액은 수량이 바뀔 때마다 즉시 갱신됩니다.
  useEffect(() => {
    if (!TOSS_CLIENT_KEY) return;
    let mounted = true;
    (async () => {
      const { loadTossPayments, ANONYMOUS } = await import("@tosspayments/tosspayments-sdk");
      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
      if (!mounted) return;
      const widgets = tossPayments.widgets({ customerKey: ANONYMOUS });
      widgetsRef.current = widgets;
      await widgets.setAmount({ currency: "KRW", value: totalAmount });
      await widgets.renderPaymentMethods({ selector: "#toss-payment-methods" });
      await widgets.renderAgreement({ selector: "#toss-agreement" });
      if (mounted) setWidgetsReady(true);
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 위젯은 한 번만 초기화하고, 금액 변경은 아래 effect에서 별도 처리합니다.
  }, []);

  useEffect(() => {
    widgetsRef.current?.setAmount({ currency: "KRW", value: totalAmount }).catch(() => {});
  }, [totalAmount]);

  function openPostcode() {
    if (!window.daum?.Postcode) return;
    new window.daum.Postcode({
      oncomplete: (data) => {
        setZipCode(data.zonecode);
        setAddress1(data.roadAddress || data.jibunAddress);
      },
    }).open();
  }

  async function handleSubmit() {
    setError(null);
    if (!name.trim() || !phone.trim()) {
      setError("주문자 이름·연락처를 입력해 주세요.");
      return;
    }
    if (!effectiveReceiverName.trim() || !effectiveReceiverPhone.trim() || !address1.trim()) {
      setError("수령인·연락처·배송 주소를 입력해 주세요.");
      return;
    }
    if (!allAgreed) {
      setError("약관에 모두 동의해 주세요.");
      return;
    }
    if (!TOSS_CLIENT_KEY || !widgetsRef.current || !widgetsReady) {
      setError("결제 모듈을 아직 불러오는 중입니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    setSubmitting(true);
    const memo = deliveryMemo === "직접 입력" ? customMemo : deliveryMemo === DELIVERY_MEMO_OPTIONS[0] ? "" : deliveryMemo;
    const result = await startPurchaseOrder({
      productId,
      productName: productLabel,
      unitPrice,
      quantity,
      variantId: variantId ?? null,
      optionLabel: optionLabel ?? null,
      addonItems: includedAddons.map((a) => ({
        productId: a.productId,
        productName: a.productName,
        unitPrice: a.unitPrice,
        quantity: addonQuantities[a.productId] ?? 1,
      })),
      applicantName: name,
      applicantPhone: phone,
      applicantEmail: email,
      companyName: "",
      businessRegNumber: "",
      receiverName: effectiveReceiverName,
      receiverPhone: effectiveReceiverPhone,
      zipCode,
      shippingAddress: `${address1} ${address2}`.trim(),
      deliveryMemo: memo,
      notes,
    });

    if (!result.success || !result.order) {
      setSubmitting(false);
      setError(result.message ?? "주문 생성 중 문제가 발생했습니다.");
      return;
    }

    try {
      await widgetsRef.current.requestPayment({
        orderId: result.order.tossOrderId,
        orderName: quantity > 1 ? `${productLabel} 외 ${quantity - 1}개` : productLabel,
        successUrl: `${window.location.origin}/shop/order/success`,
        failUrl: `${window.location.origin}/shop/order/fail`,
        customerEmail: email || undefined,
        customerName: name,
      });
    } catch (e) {
      setSubmitting(false);
      const message = e instanceof Error ? e.message : "결제 요청 중 문제가 발생했습니다.";
      setError(message);
    }
  }

  return (
    <div className="mt-6">
      <Script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="lazyOnload" />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
        {/* 좌측: 주문 상품 / 주문자 / 배송 정보 */}
        <div className="space-y-5">
          <Section title="주문 상품 정보">
            <div className="flex gap-4 rounded-xl border border-border p-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-surface">
                {productImage && <Image src={productImage} alt={productLabel} fill className="object-contain p-1.5" sizes="64px" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{productLabel}</p>
                {optionLabel && <p className="mt-0.5 text-xs text-foreground-soft">옵션: {optionLabel}</p>}
                <div className="mt-1.5 flex items-center gap-2">
                  <label className="text-xs text-foreground-soft">수량</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
                    className="w-16 rounded-lg border border-border bg-transparent px-2 py-1 text-sm outline-none focus:border-brand"
                  />
                </div>
                <p className="mt-1.5 text-sm font-bold">{(unitPrice * quantity).toLocaleString()}원</p>
              </div>
            </div>

            {(addons ?? []).length > 0 && (
              <div className="mt-3 space-y-2">
                {(addons ?? []).map((a) => {
                  const excluded = excludedAddonIds.includes(a.productId);
                  return (
                    <div
                      key={a.productId}
                      className={`flex items-center gap-3 rounded-xl border border-border p-3 ${excluded ? "opacity-50" : ""}`}
                    >
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-surface">
                        {a.image && <Image src={a.image} alt="" fill className="object-contain p-1" sizes="40px" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">{a.productName}</p>
                        <p className="text-xs text-foreground-soft">{a.unitPrice.toLocaleString()}원</p>
                      </div>
                      {!excluded && (
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={addonQuantities[a.productId] ?? 1}
                          onChange={(e) =>
                            setAddonQuantities((prev) => ({
                              ...prev,
                              [a.productId]: Math.max(1, Math.min(99, Number(e.target.value) || 1)),
                            }))
                          }
                          className="w-14 rounded-lg border border-border bg-transparent px-2 py-1 text-xs outline-none focus:border-brand"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setExcludedAddonIds((prev) => (excluded ? prev.filter((id) => id !== a.productId) : [...prev, a.productId]))
                        }
                        className="shrink-0 text-xs font-semibold text-foreground-soft underline hover:text-brand-ink"
                      >
                        {excluded ? "다시 담기" : "빼기"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-3 rounded-lg bg-surface px-4 py-2.5 text-center text-xs font-semibold text-foreground-soft">
              배송비 별도 (지역·설치 조건에 따라 상담 시 안내)
            </div>
          </Section>

          <Section title="주문자 정보">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="이름 *">
                <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="홍길동" />
              </Field>
              <Field label="연락처 *">
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="010-1234-5678" />
              </Field>
              <Field label="이메일">
                <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="선택 입력" />
              </Field>
            </div>
          </Section>

          <Section title="배송 정보">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={sameAsOrderer}
                onChange={(e) => setSameAsOrderer(e.target.checked)}
                className="h-4 w-4 accent-brand"
              />
              주문자 정보와 동일
            </label>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="수령인 *">
                <input
                  value={effectiveReceiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  disabled={sameAsOrderer}
                  className={`${inputClass} disabled:opacity-60`}
                />
              </Field>
              <Field label="연락처 *">
                <input
                  value={effectiveReceiverPhone}
                  onChange={(e) => setReceiverPhone(e.target.value)}
                  disabled={sameAsOrderer}
                  className={`${inputClass} disabled:opacity-60`}
                  placeholder="010-1234-5678"
                />
              </Field>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex gap-2">
                <input value={zipCode} readOnly placeholder="우편번호" className={`${inputClass} max-w-[140px]`} />
                <button
                  type="button"
                  onClick={openPostcode}
                  className="shrink-0 rounded-lg border border-border px-4 text-sm font-semibold hover:bg-surface"
                >
                  주소 찾기
                </button>
              </div>
              <input value={address1} readOnly placeholder="주소 찾기로 기본 주소를 입력해 주세요" className={inputClass} />
              <input
                value={address2}
                onChange={(e) => setAddress2(e.target.value)}
                placeholder="상세 주소 (동/호수 등)"
                className={inputClass}
              />
            </div>

            <div className="mt-4">
              <Field label="배송메모">
                <select value={deliveryMemo} onChange={(e) => setDeliveryMemo(e.target.value)} className={inputClass}>
                  {DELIVERY_MEMO_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </Field>
              {deliveryMemo === "직접 입력" && (
                <input
                  value={customMemo}
                  onChange={(e) => setCustomMemo(e.target.value)}
                  placeholder="예: 공동현관 비밀번호 105#1234"
                  className={`${inputClass} mt-2`}
                />
              )}
            </div>

            <div className="mt-4">
              <Field label="요청사항">
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inputClass} placeholder="선택 입력" />
              </Field>
            </div>
          </Section>
        </div>

        {/* 우측: 주문 요약 / 결제수단 / 약관 / 결제 버튼 */}
        <div className="space-y-5 lg:sticky lg:top-6">
          <Section title="주문 요약">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground-soft">상품가격</span>
                <span className="font-semibold">{totalAmount.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-soft">배송비</span>
                <span className="font-semibold">상담 시 안내</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base">
                <span className="font-bold">총 주문금액</span>
                <span className="font-bold text-brand-ink">{totalAmount.toLocaleString()}원</span>
              </div>
              <p className="text-xs text-foreground-soft">VAT 별도 · 배송비는 설치 지역에 따라 별도 안내해 드립니다.</p>
            </div>
          </Section>

          <Section title="결제 수단">
            {!TOSS_CLIENT_KEY ? (
              <p className="text-sm text-foreground-soft">결제 모듈이 아직 설정되지 않았습니다. 전화로 문의해 주세요.</p>
            ) : (
              <>
                <div id="toss-payment-methods" />
                <div id="toss-agreement" className="mt-3" />
              </>
            )}
          </Section>

          <Section title="이용 및 정보 제공 약관">
            <div className="space-y-2">
              <AgreeRow checked={agreeTerms} onChange={setAgreeTerms} label="[필수] 구매 이용약관에 동의합니다." />
              <AgreeRow
                checked={agreePrivacy}
                onChange={setAgreePrivacy}
                label="[필수] 주문·배송을 위한 개인정보 수집·이용에 동의합니다."
              />
            </div>
          </Section>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-xl bg-brand py-4 text-center text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "결제 요청 중..." : "결제하기"}
          </button>
          <p className="text-center text-xs text-foreground-soft">
            급하시면 전화 {siteConfig.phone}로 연결해 드립니다.
          </p>
        </div>
      </div>
    </div>
  );
}

const inputClass = "w-full rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-6">
      <p className="text-sm font-bold">{title}</p>
      <div className="mt-4">{children}</div>
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
