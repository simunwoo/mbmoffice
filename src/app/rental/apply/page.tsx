import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { getProductById } from "@/lib/data";
import { joinBrandName } from "@/lib/data/types";
import { siteConfig } from "@/lib/site-config";
import { RentalApplyForm } from "@/components/RentalApplyForm";

export const metadata = buildMetadata({
  title: "렌탈 신청",
  description: "렌탈 신청 정보를 남겨주시면 담당 매니저가 연락드려 계약 조건과 설치 일정을 안내해 드립니다.",
  path: "/rental/apply",
});

export default async function RentalApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; plan?: string; term?: string; fax?: string; price?: string; vol?: string }>;
}) {
  const { product: productId, plan, term, fax, price, vol } = await searchParams;
  const product = productId ? await getProductById(productId) : undefined;

  if (!productId || !product) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">신청할 상품을 찾을 수 없습니다.</h1>
        <p className="mt-3 text-sm text-foreground-soft">
          렌탈 상품 상세페이지의 &ldquo;렌탈 신청&rdquo; 버튼을 통해 접속해 주세요.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/rental" className="rounded-full bg-brand px-6 py-3 text-sm font-bold text-white hover:opacity-90">
            렌탈 상품 보러가기
          </Link>
          <a href={siteConfig.phoneHref} className="rounded-full border border-border px-6 py-3 text-sm font-bold hover:bg-surface">
            전화 상담 {siteConfig.phone}
          </a>
        </div>
      </div>
    );
  }

  const productLabel = joinBrandName(product.brand, product.name);

  return (
    <div className="bg-[#fafafa]">
      <div className="mx-auto max-w-2xl px-4 py-14">
        <p className="text-sm text-foreground-soft">
          <Link href="/rental" className="hover:text-brand-ink">복합기 렌탈</Link> / 렌탈 신청
        </p>
        <h1 className="mt-2 text-2xl font-bold">렌탈 신청</h1>
        <p className="mt-2 text-sm text-foreground-soft">
          아래 내용을 남겨주시면 담당 매니저가 직접 연락드려 계약 조건과 설치 일정, 결제 방법을 안내해 드립니다.
        </p>

        <RentalApplyForm
          productId={product.id}
          productLabel={productLabel}
          planLabel={plan || null}
          termMonths={term ? Number(term) : product.termMonths ?? null}
          faxOption={fax === "1"}
          monthlyPrice={price ? Number(price) : null}
          usageSummary={vol || null}
        />
      </div>
    </div>
  );
}
