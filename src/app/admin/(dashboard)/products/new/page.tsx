import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/ProductForm";
import { createProduct } from "@/lib/actions/admin/products";

export default async function NewProductPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase.from("products").select("id, name, brand, images, purchase_price").eq("pricing_type", "purchase");
  const addonCandidates = (rows ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    brand: r.brand,
    image: r.images?.[0],
    purchasePrice: r.purchase_price,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold">새 상품 등록</h1>
      <p className="mt-1 text-sm text-foreground-soft">렌탈 또는 구매 상품을 카테고리에 맞게 등록하세요.</p>
      <ProductForm action={createProduct} submitLabel="상품 등록" addonCandidates={addonCandidates} />
    </div>
  );
}
