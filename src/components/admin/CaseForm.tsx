"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { CaseFormState } from "@/lib/actions/admin/cases";
import type { InstallCase } from "@/lib/data/types";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ImagesField } from "@/components/admin/ImagesField";
import { plainTextToHtml } from "@/lib/richText";

const inputClass = "w-full rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand";

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="text-sm font-semibold">{label}</label>
      {hint && <p className="mt-0.5 text-xs text-foreground-soft">{hint}</p>}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60">
      {pending ? "저장 중..." : label}
    </button>
  );
}

export function CaseForm({
  action,
  item,
  initialStatus,
  submitLabel,
}: {
  action: (prevState: CaseFormState, formData: FormData) => Promise<CaseFormState>;
  item?: InstallCase;
  initialStatus?: "published" | "draft";
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, { status: "idle" } as CaseFormState);

  return (
    <form action={formAction} className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="제목 *">
            <input name="title" required defaultValue={item?.title} className={inputClass} />
          </Field>
          <Field label="설치일">
            <input name="caseDate" type="date" defaultValue={item?.date ?? ""} className={inputClass} />
          </Field>
          <Field label="지역">
            <input name="region" defaultValue={item?.region ?? ""} placeholder="예: 서울 강서구" className={inputClass} />
          </Field>
          <Field label="업종">
            <input name="industry" defaultValue={item?.industry ?? ""} placeholder="예: 건축사사무소" className={inputClass} />
          </Field>
          <Field label="브랜드">
            <input name="brand" defaultValue={item?.brand ?? ""} placeholder="예: 후지필름" className={inputClass} />
          </Field>
          <Field label="모델명">
            <input name="model" defaultValue={item?.model ?? ""} placeholder="예: Apeos C2561" className={inputClass} />
          </Field>
          <Field label="기기 종류" hint="관리자 목록 왼쪽 분류에 쓰입니다.">
            <input
              name="category"
              list="case-category-options"
              defaultValue={item?.category ?? ""}
              placeholder="예: 컬러복합기"
              className={inputClass}
            />
            <datalist id="case-category-options">
              <option value="컬러복합기" />
              <option value="흑백복합기" />
              <option value="복합기" />
              <option value="프린터" />
              <option value="PC·노트북" />
              <option value="문서세단기" />
            </datalist>
          </Field>
          <Field label="공개 상태">
            <select name="status" defaultValue={initialStatus ?? "published"} className={inputClass}>
              <option value="published">공개</option>
              <option value="draft">임시저장</option>
            </select>
          </Field>
        </div>

        <Field label="본문 *">
          <RichTextEditor
            htmlFieldName="bodyHtml"
            textFieldName="body"
            defaultValue={item?.bodyHtml || (item?.body ? plainTextToHtml(item.body) : undefined)}
          />
        </Field>
      </div>

      <div>
        <ImagesField name="images" defaultImages={item?.images} />
      </div>

      <div className="lg:col-span-2">
        {state.status === "error" && <p className="mb-3 text-sm font-medium text-red-600">{state.message}</p>}
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
