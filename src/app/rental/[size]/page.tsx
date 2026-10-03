import Link from "next/link";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbSchema } from "@/lib/schema";
import { colorLabels, sizeLabels } from "@/lib/site-config";
import { getProductsBySizeColor } from "@/lib/data";

type Params = { size: string };

function assertSize(size: string) {
  if (!(size in sizeLabels)) notFound();
}

export async function generateStaticParams() {
  return Object.keys(sizeLabels).map((size) => ({ size }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { size } = await params;
  assertSize(size);
  const label = sizeLabels[size];
  return buildMetadata({
    title: `${label} 복합기 렌탈 | 컬러·흑백`,
    description: `${label} 규격 복합기를 컬러·흑백으로 나눠 렌탈 조건을 확인하세요.`,
    path: `/rental/${size}`,
  });
}

export default async function RentalSizePage({ params }: { params: Promise<Params> }) {
  const { size } = await params;
  assertSize(size);
  const label = sizeLabels[size];

  const colorEntries = Object.entries(colorLabels);
  const counts = await Promise.all(colorEntries.map(([colorSlug]) => getProductsBySizeColor(size, colorSlug).then((ps) => ps.length)));

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <JsonLd
        data={breadcrumbSchema([
          { name: "홈", path: "/" },
          { name: "복합기 렌탈", path: "/rental" },
          { name: `${label} 복합기 렌탈`, path: `/rental/${size}` },
        ])}
      />
      <p className="text-sm text-foreground-soft">
        <Link href="/rental" className="hover:text-brand-ink">복합기 렌탈</Link> / {label}
      </p>
      <h1 className="mt-2 text-3xl font-bold">{label} 복합기 렌탈</h1>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {colorEntries.map(([colorSlug, colorLabel], i) => (
          <Link
            key={colorSlug}
            href={`/rental/${size}/${colorSlug}`}
            className="rounded-xl border border-border p-6 hover:border-brand hover:shadow-sm"
          >
            <p className="text-lg font-bold">{label} {colorLabel} 복합기</p>
            <p className="mt-2 text-sm text-foreground-soft">{counts[i]}개 모델 보기</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
