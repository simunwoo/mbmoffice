"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:border-brand hover:text-brand-ink"
    >
      🖨 인쇄
    </button>
  );
}
