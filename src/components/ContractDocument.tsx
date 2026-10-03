import { isFieldLine, parseContractText, splitField } from "@/lib/contractParse";

/** buildContractTerms()가 만든 평문 계약서를 종이 계약서처럼 보기 좋게 그립니다 (표시 전용). */
export function ContractDocument({ text }: { text: string }) {
  const { title, intro, parties, articles, closing } = parseContractText(text);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
      <div className="h-1.5 bg-gradient-to-r from-brand to-brand-ink" />
      <div className="p-6 sm:p-10">
        <p className="text-center text-[11px] font-bold tracking-[0.3em] text-brand-ink">ELECTRONIC CONTRACT</p>
        <h2 className="mt-2 text-center text-xl font-bold sm:text-2xl">{title}</h2>
        <div className="mx-auto mt-4 h-px w-16 bg-border" />

        {intro.length > 0 && (
          <p className="mt-6 text-center text-sm leading-relaxed text-foreground-soft">{intro.join(" ")}</p>
        )}

        {parties.length > 0 && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {parties.map((p) => (
              <div key={p.name} className="rounded-xl border border-border p-4">
                <p className="text-xs font-bold text-brand-ink">{p.name}</p>
                <dl className="mt-2 space-y-1.5 text-sm">
                  {p.rows.map((r) => (
                    <div key={r.label} className="flex justify-between gap-3">
                      <dt className="shrink-0 text-foreground-soft">{r.label}</dt>
                      <dd className="text-right font-medium">{r.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        )}

        {articles.length > 0 && (
          <>
            <div className="mt-8 flex items-center gap-3 text-xs font-semibold text-foreground-soft">
              <div className="h-px flex-1 bg-border" /> 記 <div className="h-px flex-1 bg-border" />
            </div>

            <div className="mt-6 space-y-6">
              {articles.map((a) => (
                <div key={a.heading} className="border-l-2 border-brand-soft pl-4">
                  <p className="text-sm font-bold text-foreground">{a.heading}</p>
                  <div className="mt-1.5 space-y-1 text-sm leading-relaxed text-foreground-soft">
                    {a.lines.map((line, idx) =>
                      isFieldLine(line) ? (
                        <div key={idx} className="flex flex-wrap items-baseline justify-between gap-2 rounded-md bg-surface px-2.5 py-1.5">
                          <span className="font-medium text-foreground-soft">{splitField(line).label}</span>
                          <span className="font-semibold text-foreground">{splitField(line).value}</span>
                        </div>
                      ) : (
                        <p key={idx}>{line.trim()}</p>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {closing.length > 0 && (
          <div className="mt-8 rounded-xl border border-dashed border-border p-4 text-center text-xs italic leading-relaxed text-foreground-soft">
            {closing.map((l, i) => (
              <p key={i}>{l.trim()}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
