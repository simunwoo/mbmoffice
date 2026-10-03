"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { ProductFormState } from "@/lib/actions/admin/products";
import type { Product } from "@/lib/data/types";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ImagesField } from "@/components/admin/ImagesField";
import { ProductOptionsField } from "@/components/admin/ProductOptionsField";
import { ProductAddonPicker, type AddonCandidate } from "@/components/admin/ProductAddonPicker";

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "mfp", label: "복합기" },
  { value: "printer", label: "프린터" },
  { value: "pc", label: "PC" },
  { value: "notebook", label: "노트북" },
  { value: "nas", label: "NAS" },
  { value: "shredder", label: "문서세단기" },
  { value: "maintenance", label: "IT·PC 유지보수" },
  { value: "supplies", label: "복합기 소모품" },
  { value: "parts", label: "부품" },
];

function Field({
  label,
  children,
  hint,
  className,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-sm font-semibold">{label}</label>
      {hint && <p className="mt-0.5 text-xs text-foreground-soft">{hint}</p>}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

const inputClass = "w-full rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60">
      {pending ? "저장 중..." : label}
    </button>
  );
}

export function ProductForm({
  action,
  product,
  submitLabel,
  addonCandidates,
  defaultAddonIds,
}: {
  action: (prevState: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  product?: Product;
  submitLabel: string;
  /** 구매 상품일 때만 사용하는 추가 구매 상품 후보 목록(자기 자신 제외). */
  addonCandidates?: AddonCandidate[];
  defaultAddonIds?: string[];
}) {
  const [state, formAction] = useActionState(action, { status: "idle" } as ProductFormState);
  const [pricingType, setPricingType] = useState<"rental" | "purchase" | "maintenance">(product?.pricingType ?? "rental");

  return (
    <form action={formAction} className="mt-6 max-w-5xl space-y-5">
      <ImagesField name="images" defaultImages={product?.images} />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="상품명 *" className="sm:col-span-2 lg:col-span-3">
          <input name="name" required defaultValue={product?.name} className={inputClass} />
        </Field>
        <Field label="브랜드">
          <input name="brand" defaultValue={product?.brand} placeholder="예: 캐논, 후지필름" className={inputClass} />
        </Field>
        <Field label="카테고리">
          <select name="category" defaultValue={product?.category ?? "mfp"} className={inputClass}>
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="판매 방식">
          <select
            name="pricingType"
            defaultValue={pricingType}
            onChange={(e) => setPricingType(e.target.value as "rental" | "purchase" | "maintenance")}
            className={inputClass}
          >
            <option value="rental">렌탈</option>
            <option value="purchase">구매</option>
            <option value="maintenance">유지보수</option>
          </select>
        </Field>
        <Field label="용지 크기 (복합기·프린터)">
          <select name="size" defaultValue={product?.size ?? ""} className={inputClass}>
            <option value="">해당없음</option>
            <option value="a3">A3</option>
            <option value="a4">A4</option>
          </select>
        </Field>
        <Field label="컬러 (복합기·프린터)">
          <select name="color" defaultValue={product?.color ?? ""} className={inputClass}>
            <option value="">해당없음</option>
            <option value="color">컬러</option>
            <option value="mono">흑백</option>
          </select>
        </Field>
        <Field label="인쇄 방식 (복합기·프린터)">
          <select name="printTech" defaultValue={product?.printTech ?? ""} className={inputClass}>
            <option value="">해당없음</option>
            <option value="laser">레이저젯</option>
            <option value="inkjet">잉크젯</option>
          </select>
        </Field>
        <Field label="상태">
          <select name="status" defaultValue={product?.status ?? "selling"} className={inputClass}>
            <option value="selling">판매중</option>
            <option value="soldout">품절</option>
            <option value="hidden">숨김</option>
          </select>
        </Field>

        {pricingType === "purchase" ? (
          <Field label="구매가 (원)">
            <input name="purchasePrice" type="number" defaultValue={product?.purchasePrice ?? ""} className={inputClass} />
          </Field>
        ) : (
          <Field label={pricingType === "maintenance" ? "월 이용료 (원)" : "월 렌탈료 (원)"}>
            <input name="priceMonthly" type="number" defaultValue={product?.priceMonthly ?? ""} className={inputClass} />
          </Field>
        )}
        <Field label="정가 (할인 전, 선택)">
          <input name="listPrice" type="number" defaultValue={product?.listPrice ?? ""} className={inputClass} />
        </Field>
        <Field label="약정 개월 수">
          <input name="termMonths" type="number" defaultValue={product?.termMonths ?? ""} className={inputClass} />
        </Field>
        <Field label="재고 수량 (선택)">
          <input name="stock" type="number" defaultValue={product?.stock ?? ""} className={inputClass} />
        </Field>
        <Field label="월 권장 출력량 최소 (매)">
          <input name="volumeMin" type="number" defaultValue={product?.volumeMin ?? ""} className={inputClass} />
        </Field>
        <Field label="월 권장 출력량 최대 (매)">
          <input name="volumeMax" type="number" defaultValue={product?.volumeMax ?? ""} className={inputClass} />
        </Field>
      </div>

      <Field label="가격 비고 (자유 문구, 선택)">
        <input name="priceNote" defaultValue={product?.priceNote ?? ""} className={inputClass} />
      </Field>

      <Field label="스펙" hint="한 줄에 하나씩 입력해 주세요.">
        <textarea name="specs" rows={4} defaultValue={product?.specs?.join("\n")} className={inputClass} />
      </Field>

      <Field label="상품 상세 설명" hint="입력하면 상세페이지 탭에 노출됩니다.">
        <RichTextEditor htmlFieldName="descriptionHtml" textFieldName="descriptionText" defaultValue={product?.descriptionHtml ?? undefined} />
      </Field>

      {pricingType === "purchase" && (
        <>
          <ProductOptionsField defaultGroups={product?.optionGroups} defaultVariants={product?.variants} />
          <ProductAddonPicker candidates={addonCandidates ?? []} defaultSelectedIds={defaultAddonIds} />
        </>
      )}

      <Field label="원본 링크 (선택)">
        <input name="sourceUrl" defaultValue={product?.sourceUrl ?? ""} className={inputClass} />
      </Field>

      {state.status === "error" && <p className="text-sm font-medium text-red-600">{state.message}</p>}

      <SubmitButton label={submitLabel} />
    </form>
  );
}
