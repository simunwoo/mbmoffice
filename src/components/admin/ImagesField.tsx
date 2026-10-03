"use client";

import { useRef, useState } from "react";
import { uploadMedia } from "@/lib/actions/admin/media";

const inputClass = "w-full rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand";

/** 대표 이미지(썸네일) + 추가 이미지들을 하나의 images 배열(첫 줄이 대표 이미지)로 합쳐 폼에 실어 보냅니다. */
export function ImagesField({ name, defaultImages }: { name: string; defaultImages?: string[] }) {
  const [featured, setFeatured] = useState(defaultImages?.[0] ?? "");
  const [extra, setExtra] = useState<string[]>(defaultImages?.slice(1).filter(Boolean) ?? []);
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadingExtra, setUploadingExtra] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const extraFileRef = useRef<HTMLInputElement>(null);

  const combined = [featured, ...extra].filter(Boolean).join("\n");

  async function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadMedia(formData);
    setUploading(false);
    if (result.error) {
      alert(result.error);
      return;
    }
    if (result.url) setFeatured(result.url);
  }

  async function handleExtraPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setUploadingExtra(true);
    for (const file of files) {
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadMedia(formData);
      if (result.error) {
        alert(result.error);
        continue;
      }
      if (result.url) setExtra((prev) => [...prev, result.url as string]);
    }
    setUploadingExtra(false);
  }

  function removeExtra(index: number) {
    setExtra((prev) => prev.filter((_, i) => i !== index));
  }

  /** 추가 이미지 중 하나를 대표 이미지로 승격하고, 기존 대표 이미지는 추가 이미지 쪽으로 보냅니다. */
  function promoteToFeatured(index: number) {
    setExtra((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (featured) next.unshift(featured);
      return next;
    });
    setFeatured(extra[index]);
  }

  function reorderExtra(from: number, to: number) {
    if (from === to) return;
    setExtra((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function addUrlLines() {
    const lines = urlInput
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (lines.length > 0) setExtra((prev) => [...prev, ...lines]);
    setUrlInput("");
  }

  return (
    <div className="space-y-4">
      <input type="hidden" name={name} value={combined} readOnly />

      <div>
        <p className="text-sm font-semibold">대표 이미지</p>
        <p className="mt-0.5 text-xs text-foreground-soft">목록에서 썸네일로 사용됩니다.</p>
        <div className="mt-2 flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-surface">
          {featured ? (
            // eslint-disable-next-line @next/next/no-img-element -- 외부/업로드 URL 미리보기라 next/image 최적화 대상이 아닙니다.
            <img src={featured} alt="대표 이미지" className="h-full w-full object-contain" />
          ) : (
            <span className="text-xs text-foreground-soft">대표 이미지 없음</span>
          )}
        </div>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground-soft hover:border-brand hover:text-brand-ink disabled:opacity-50"
          >
            {uploading ? "업로드 중..." : featured ? "이미지 변경" : "이미지 업로드"}
          </button>
          {featured && (
            <button
              type="button"
              onClick={() => setFeatured("")}
              className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground-soft hover:border-red-300 hover:text-red-600"
            >
              삭제
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePick} />
      </div>

      <div>
        <p className="text-sm font-semibold">추가 이미지</p>
        <p className="mt-0.5 text-xs text-foreground-soft">
          상세 사진·갤러리용 이미지입니다. 여러 장을 한 번에 올릴 수 있고, 클릭하면 대표 이미지로 바뀝니다. 드래그해서 순서를 바꿀 수 있어요.
        </p>

        {extra.length > 0 && (
          <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
            {extra.map((url, i) => (
              <button
                key={`${url}-${i}`}
                type="button"
                draggable
                onClick={() => promoteToFeatured(i)}
                onDragStart={() => setDragIndex(i)}
                onDragEnter={() => setOverIndex(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIndex !== null) reorderExtra(dragIndex, i);
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                title="클릭: 대표 이미지로 설정 · 드래그: 순서 변경"
                className={`group relative aspect-square cursor-grab overflow-hidden rounded-lg border bg-surface transition active:cursor-grabbing ${
                  dragIndex === i ? "opacity-40" : overIndex === i ? "border-brand ring-2 ring-brand/40" : "border-border"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- 외부/업로드 URL 미리보기라 next/image 최적화 대상이 아닙니다. */}
                <img src={url} alt="" className="h-full w-full object-contain p-1" />
                <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-[11px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                  대표로 설정
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeExtra(i);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      removeExtra(i);
                    }
                  }}
                  aria-label="이미지 삭제"
                  className="absolute right-1 top-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-black/60 text-xs font-bold text-white opacity-0 transition group-hover:opacity-100"
                >
                  ✕
                </span>
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          disabled={uploadingExtra}
          onClick={() => extraFileRef.current?.click()}
          className="mt-2 w-full rounded-lg border border-dashed border-border px-3 py-2.5 text-xs font-semibold text-foreground-soft hover:border-brand hover:text-brand-ink disabled:opacity-50"
        >
          {uploadingExtra ? "업로드 중..." : "+ 이미지 추가 (여러 장 선택 가능)"}
        </button>
        <input ref={extraFileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleExtraPick} />

        <div className="mt-3">
          <label className="text-xs font-semibold text-foreground-soft">URL로 추가 (선택)</label>
          <div className="mt-1 flex gap-2">
            <textarea
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              rows={2}
              placeholder="한 줄에 하나씩 붙여넣고 추가 버튼을 눌러주세요"
              className={inputClass}
            />
            <button
              type="button"
              onClick={addUrlLines}
              className="shrink-0 self-start rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-surface"
            >
              추가
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
