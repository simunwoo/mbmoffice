"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { BlogFormState } from "@/lib/actions/admin/blog";
import type { BlogPost } from "@/lib/data/types";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ImagesField } from "@/components/admin/ImagesField";
import { plainTextToHtml } from "@/lib/richText";

const inputClass = "w-full rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand";

const CATEGORY_OPTIONS = [
  "사무용 복합기",
  "사무기기 정보",
  "MBM 정보",
  "설치 사례",
  "제품 소개",
  "설치 방법",
  "복합기 설치방법",
  "PC 유지보수",
  "추천 제품",
  "공지사항",
];

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

function CategoryField({ defaultValue }: { defaultValue?: string | null }) {
  const [customMode, setCustomMode] = useState(!!defaultValue && !CATEGORY_OPTIONS.includes(defaultValue));

  if (customMode) {
    return (
      <div className="flex gap-2">
        <input name="category" defaultValue={defaultValue ?? ""} placeholder="새 카테고리 입력" className={inputClass} />
        <button
          type="button"
          onClick={() => setCustomMode(false)}
          className="shrink-0 rounded-lg border border-border px-3 text-xs font-semibold text-foreground-soft hover:bg-surface"
        >
          목록에서 선택
        </button>
      </div>
    );
  }

  return (
    <select
      name="category"
      defaultValue={defaultValue ?? ""}
      onChange={(e) => {
        if (e.target.value === "__custom__") setCustomMode(true);
      }}
      className={inputClass}
    >
      <option value="">카테고리 선택</option>
      {CATEGORY_OPTIONS.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
      <option value="__custom__">+ 새 카테고리 직접 입력</option>
    </select>
  );
}

export function BlogForm({
  action,
  post,
  initialStatus,
  submitLabel,
}: {
  action: (prevState: BlogFormState, formData: FormData) => Promise<BlogFormState>;
  post?: BlogPost;
  initialStatus?: "published" | "draft";
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, { status: "idle" } as BlogFormState);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="제목 *">
            <input name="title" required defaultValue={post?.title} className={inputClass} />
          </Field>
          <Field label="카테고리">
            <CategoryField defaultValue={post?.category} />
          </Field>
          <Field label="작성일">
            <input name="postDate" type="date" defaultValue={post?.date ?? today} className={inputClass} />
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
            defaultValue={post?.bodyHtml || (post?.body ? plainTextToHtml(post.body) : undefined)}
          />
        </Field>
      </div>

      <div>
        <ImagesField name="images" defaultImages={post?.images} />
      </div>

      <div className="lg:col-span-2">
        {state.status === "error" && <p className="mb-3 text-sm font-medium text-red-600">{state.message}</p>}
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
