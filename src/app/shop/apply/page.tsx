import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { getProductById, getProductOptions, getProductAddons } from "@/lib/data";
import { joinBrandName } from "@/lib/data/types";
import { siteConfig } from "@/lib/site-config";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/lib/supabase/types";
import { PurchaseApplyForm } from "@/components/PurchaseApplyForm";

export const metadata = buildMetadata({
  title: "구매 주문",
  description: "주문 정보를 입력하고 토스페이먼츠로 바로 결제할 수 있습니다.",
  path: "/shop/apply",
});

export default async function ShopApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; variant?: string; addons?: string }>;
}) {
  const { product: productId, variant: variantId, addons: addonsCsv } = await searchParams;
  const product = productId ? await getProductById(productId) : undefined;
  const baseUnitPrice = product?.purchasePrice ?? product?.priceMonthly ?? null;

  if (!productId || !product || !baseUnitPrice) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">주문할 상품을 찾을 수 없습니다.</h1>
        <p className="mt-3 text-sm text-foreground-soft">
          구매 상품 상세페이지의 &ldquo;구매하기&rdquo; 버튼을 통해 접속해 주세요.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="rounded-full bg-brand px-6 py-3 text-sm font-bold text-white hover:opacity-90">
            구매 상품 보러가기
          </Link>
          <a href={siteConfig.phoneHref} className="rounded-full border border-border px-6 py-3 text-sm font-bold hover:bg-surface">
            전화 상담 {siteConfig.phone}
          </a>
        </div>
      </div>
    );
  }

  const productLabel = joinBrandName(product.brand, product.name);

  // 로그인한 회원이면 주문자 정보를 매번 새로 입력할 필요 없이 회원 정보로 미리 채워줍니다.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let defaultName = "";
  let defaultPhone = "";
  let defaultEmail = "";
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<ProfileRow>();
    defaultName = profile?.name ?? "";
    defaultPhone = profile?.phone ?? "";
    defaultEmail = user.email ?? "";
  }

  // 옵션·추가상품은 모두 서버에서 다시 조회해 검증합니다 — URL의 variant/addons 값은 참고만 하고,
  // 실제로 이 상품에 등록된 옵션·추가상품이 맞는지, 가격은 지금 DB 기준으로 다시 계산합니다.
  const { optionGroups, variants } = variantId ? await getProductOptions(product.id) : { optionGroups: [], variants: [] };
  const matchedVariant = variants.find((v) => v.id === variantId);

  if (optionGroups.length > 0 && (!matchedVariant || matchedVariant.status !== "selling" || matchedVariant.stock <= 0)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">선택한 옵션을 확인할 수 없습니다.</h1>
        <p className="mt-3 text-sm text-foreground-soft">상품 상세페이지에서 옵션을 다시 선택해 주세요.</p>
        <Link href="/shop" className="mt-6 inline-block rounded-full bg-brand px-6 py-3 text-sm font-bold text-white hover:opacity-90">
          구매 상품 보러가기
        </Link>
      </div>
    );
  }

  const unitPrice = baseUnitPrice + (matchedVariant?.priceDelta ?? 0);
  const optionLabel = matchedVariant?.label ?? null;

  const requestedAddonIds = (addonsCsv ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const availableAddons = requestedAddonIds.length > 0 ? await getProductAddons(product.id) : [];
  const addons = availableAddons
    .filter((a) => requestedAddonIds.includes(a.id) && a.purchasePrice)
    .map((a) => ({ productId: a.id, productName: joinBrandName(a.brand, a.name), image: a.images[0], unitPrice: a.purchasePrice! }));

  return (
    <div className="bg-[#fafafa]">
      <div className="mx-auto max-w-5xl px-4 py-14">
        <p className="text-sm text-foreground-soft">
          <Link href="/shop" className="hover:text-brand-ink">구매</Link> / 결제하기
        </p>
        <h1 className="mt-2 text-center text-2xl font-bold">결제하기</h1>

        <PurchaseApplyForm
          productId={product.id}
          productLabel={productLabel}
          productImage={product.images[0]}
          unitPrice={unitPrice}
          variantId={matchedVariant?.id ?? null}
          optionLabel={optionLabel}
          addons={addons}
          defaultName={defaultName}
          defaultPhone={defaultPhone}
          defaultEmail={defaultEmail}
        />
      </div>
    </div>
  );
}
