"use client";

import { useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";
import { trimEmptyEdgeParagraphs } from "@/lib/richText";

type TabKey = "detail" | "review" | "inquiry";

const TABS: { key: TabKey; label: string; count?: number }[] = [
  { key: "detail", label: "상세페이지" },
  { key: "review", label: "리뷰", count: 0 },
  { key: "inquiry", label: "상품문의", count: 0 },
];

export function ProductTabs({
  specs,
  contactHref,
  descriptionHtml,
}: {
  specs: string[];
  contactHref: string;
  descriptionHtml?: string | null;
}) {
  const [tab, setTab] = useState<TabKey>("detail");
  const cleanDescriptionHtml = descriptionHtml ? trimEmptyEdgeParagraphs(descriptionHtml) : descriptionHtml;
  const hasDetailContent = !!cleanDescriptionHtml || specs.length > 0;

  return (
    <div className="mt-16">
      <div className="flex border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-4 text-center text-sm font-semibold transition ${
              tab === t.key ? "border-brand-ink text-foreground" : "border-transparent text-foreground-soft hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count !== undefined && <span className="text-foreground-soft">({t.count})</span>}
          </button>
        ))}
      </div>

      <div className="py-8">
        {tab === "detail" &&
          (hasDetailContent ? (
            <div className="mx-auto max-w-2xl">
              {cleanDescriptionHtml && (
                <div
                  className="prose prose-neutral max-w-none [&_img]:max-w-full [&_img]:rounded-lg [&_table]:w-full [&_img]:my-0 [&_p:has(img)]:my-0"
                  dangerouslySetInnerHTML={{ __html: cleanDescriptionHtml }}
                />
              )}

              {specs.length > 0 && (
                <div className={cleanDescriptionHtml ? "mt-8" : ""}>
                  <p className="text-sm font-bold">제품 상세 사양</p>
                  <ul className="mt-3 space-y-2">
                    {specs.map((spec) => (
                      <li key={spec} className="flex gap-2 text-sm text-foreground-soft">
                        <span className="text-brand">•</span>
                        {spec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <EmptyState title="등록된 상세 정보가 없습니다." body="전화 또는 카카오톡 상담으로 추가 자료를 받아보실 수 있습니다." />
          ))}

        {tab === "review" && (
          <EmptyState
            title="아직 등록된 리뷰가 없습니다."
            body="렌탈 후 후기를 남겨주시면 다른 고객님께 큰 도움이 됩니다."
          />
        )}

        {tab === "inquiry" && (
          <EmptyState title="아직 등록된 상품문의가 없습니다." body="궁금하신 점은 아래 버튼으로 바로 문의해 주세요.">
            <Link
              href={contactHref}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
            >
              상품 문의하기 →
            </Link>
          </EmptyState>
        )}
      </div>
    </div>
  );
}

function EmptyState({ title, body, children }: { title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm text-foreground-soft">{body}</p>
      {children}
      <p className="mt-4 text-xs text-foreground-soft">
        급하신 문의는 전화 {siteConfig.phone}로 연결해 드립니다.
      </p>
    </div>
  );
}
