"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProductInsert } from "@/lib/supabase/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** 옵션 그룹·조합을 통째로 교체합니다(간단하고 안전 — 옵션 개수가 적어 전체 삭제 후 재삽입해도 부담 없습니다). */
async function syncProductOptions(supabase: SupabaseServerClient, productId: string, optionsJson: FormDataEntryValue | null) {
  let parsed: {
    groups?: { name: string; values: string[] }[];
    variants?: { combo: Record<string, string>; label: string; priceDelta: number; stock: number; status: "selling" | "soldout" }[];
  };
  try {
    parsed = JSON.parse(String(optionsJson ?? "{}"));
  } catch {
    parsed = {};
  }

  await supabase.from("product_variants").delete().eq("product_id", productId);
  await supabase.from("product_option_groups").delete().eq("product_id", productId);

  const groups = parsed.groups ?? [];
  if (groups.length > 0) {
    await supabase.from("product_option_groups").insert(
      groups.map((g, i) => ({ product_id: productId, name: g.name, values: g.values, sort_order: i }))
    );
  }
  const variants = parsed.variants ?? [];
  if (variants.length > 0) {
    await supabase.from("product_variants").insert(
      variants.map((v, i) => ({
        product_id: productId,
        option_combo: v.combo,
        label: v.label,
        price_delta: v.priceDelta,
        stock: v.stock,
        status: v.status,
        sort_order: i,
      }))
    );
  }
}

/** 추가 구매 상품 지정 목록을 통째로 교체합니다. */
async function syncProductAddons(supabase: SupabaseServerClient, productId: string, addonIdsCsv: FormDataEntryValue | null) {
  const ids = String(addonIdsCsv ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  await supabase.from("product_addons").delete().eq("product_id", productId);
  if (ids.length > 0) {
    await supabase.from("product_addons").insert(ids.map((addonProductId, i) => ({ product_id: productId, addon_product_id: addonProductId, sort_order: i })));
  }
}

export interface ProductFormState {
  status: "idle" | "error";
  message?: string;
}

function linesToArray(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function toNullableNumber(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

function buildProductInsert(formData: FormData): ProductInsert {
  const pricingType = String(formData.get("pricingType") || "rental") as "rental" | "purchase" | "maintenance";
  const size = String(formData.get("size") || "");
  const color = String(formData.get("color") || "");
  const printTech = String(formData.get("printTech") || "");

  return {
    name: String(formData.get("name") || "").trim(),
    brand: String(formData.get("brand") || "").trim() || "엠비엠",
    category: String(formData.get("category") || "mfp") as ProductInsert["category"],
    size: size === "a3" || size === "a4" ? size : null,
    color: color === "color" || color === "mono" ? color : null,
    print_tech: printTech === "laser" || printTech === "inkjet" ? printTech : null,
    volume_min: toNullableNumber(formData.get("volumeMin")),
    volume_max: toNullableNumber(formData.get("volumeMax")),
    term_months: toNullableNumber(formData.get("termMonths")),
    price_monthly: pricingType !== "purchase" ? toNullableNumber(formData.get("priceMonthly")) : null,
    list_price: toNullableNumber(formData.get("listPrice")),
    purchase_price: pricingType === "purchase" ? toNullableNumber(formData.get("purchasePrice")) : null,
    pricing_type: pricingType,
    price_note: String(formData.get("priceNote") || "").trim() || null,
    specs: linesToArray(String(formData.get("specs") || "")),
    images: linesToArray(String(formData.get("images") || "")),
    stock: toNullableNumber(formData.get("stock")),
    status: String(formData.get("status") || "selling") as ProductInsert["status"],
    source_url: String(formData.get("sourceUrl") || "").trim() || null,
    description_html: String(formData.get("descriptionHtml") || "").trim() || null,
  };
}

export async function createProduct(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  const payload = buildProductInsert(formData);
  if (!payload.name) {
    return { status: "error", message: "상품명을 입력해 주세요." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("products").insert(payload).select("id").single();
  if (error || !data) {
    return { status: "error", message: `등록 중 오류가 발생했습니다: ${error?.message ?? ""}` };
  }

  if (payload.pricing_type === "purchase") {
    await syncProductOptions(supabase, data.id, formData.get("optionsJson"));
    await syncProductAddons(supabase, data.id, formData.get("addonIds"));
  }

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function updateProduct(
  id: string,
  returnTo: string | null,
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const payload = buildProductInsert(formData);
  if (!payload.name) {
    return { status: "error", message: "상품명을 입력해 주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("products").update(payload).eq("id", id);
  if (error) {
    return { status: "error", message: `수정 중 오류가 발생했습니다: ${error.message}` };
  }

  // 구매 상품이 아니면(렌탈·유지보수로 바뀐 경우 포함) 옵션·추가상품 지정은 의미가 없으므로 비웁니다.
  await syncProductOptions(supabase, id, payload.pricing_type === "purchase" ? formData.get("optionsJson") : null);
  await syncProductAddons(supabase, id, payload.pricing_type === "purchase" ? formData.get("addonIds") : null);

  revalidatePath("/admin/products");
  // 외부 주소로 보내지 않도록, 반드시 우리 상품 목록 경로(쿼리 포함)일 때만 그 경로로 돌아갑니다.
  const safeReturnTo = returnTo && returnTo.startsWith("/admin/products") ? returnTo : "/admin/products";
  redirect(safeReturnTo);
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();
  await supabase.from("products").delete().eq("id", id);
  revalidatePath("/admin/products");
}

/** 목록에서 드롭다운으로 바로 상태만 바꿀 때 (전체 폼 수정 없이). */
export async function updateProductStatus(id: string, status: "selling" | "soldout" | "hidden") {
  const supabase = await createClient();
  await supabase.from("products").update({ status }).eq("id", id);
  revalidatePath("/admin/products");
}
