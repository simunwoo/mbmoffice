"use client";

import { useState } from "react";

export function CopyLinkField({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="mt-2 flex gap-2">
      <input
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground-soft"
      />
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:border-brand hover:text-brand-ink"
      >
        {copied ? "복사됨" : "링크 복사"}
      </button>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:border-brand hover:text-brand-ink"
      >
        열기 ↗
      </a>
    </div>
  );
}
