import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { productFromRow } from "@/lib/supabase/mappers";
import { getProductOptions } from "@/lib/data";
import { ProductForm } from "@/components/admin/ProductForm";
import { updateProduct } from "@/lib/actions/admin/products";

type Params = { id: string };

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const supabase = await createClient();
  const { data: row } = await supabase.from("products").select("*").eq("id", id).single();
  if (!row) notFound();

  const product = productFromRow(row);
  const action = updateProduct.bind(null, id, from ?? null);

  const [{ optionGroups, variants }, { data: otherRows }, { data: addonLinks }] = await Promise.all([
    getProductOptions(id),
    supabase.from("products").select("id, name, brand, images, purchase_price").eq("pricing_type", "purchase").neq("id", id),
    supabase.from("product_addons").select("addon_product_id").eq("product_id", id),
  ]);
  product.optionGroups = optionGroups;
  product.variants = variants;

  const addonCandidates = (otherRows ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    brand: r.brand,
    image: r.images?.[0],
    purchasePrice: r.purchase_price,
  }));
  const defaultAddonIds = (addonLinks ?? []).map((l) => l.addon_product_id);

  return (
    <div>
      <h1 className="text-2xl font-bold">상품 수정</h1>
      <p className="mt-1 text-sm text-foreground-soft">{product.name}</p>
      <ProductForm
        action={action}
        product={product}
        submitLabel="변경사항 저장"
        addonCandidates={addonCandidates}
        defaultAddonIds={defaultAddonIds}
      />
    </div>
  );
}
