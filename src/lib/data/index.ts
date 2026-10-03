import fs from "node:fs";
import path from "node:path";
import type { BlogPost, InstallCase, Product, ProductOptionGroup, ProductVariant } from "./types";
import { seedBlogPosts, seedInstalls, seedProducts } from "./seed";
import { normalizeBlogPost, normalizeInstall, normalizeProduct } from "./normalize";
import { createClient, isSupabaseConfigured } from "../supabase/server";
import { blogPostFromRow, installFromRow, productFromRow } from "../supabase/mappers";

const RAW_DIR = path.join(process.cwd(), "data", "raw");

function readJsonArray<T = unknown>(filename: string): T[] | null {
  const file = path.join(RAW_DIR, filename);
  if (!fs.existsSync(file)) return null;
  try {
    const raw = fs.readFileSync(file, "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed as T[];
  } catch {
    return null;
  }
}

// 로컬 파일 데이터는 배포 사이에 바뀌지 않으므로 캐시해도 안전합니다.
let productsFileCache: Product[] | null = null;
let installsFileCache: InstallCase[] | null = null;
let blogFileCache: BlogPost[] | null = null;

function getProductsFromFile(): Product[] {
  if (productsFileCache) return productsFileCache;
  const raw = readJsonArray<Parameters<typeof normalizeProduct>[0]>("products.json");
  if (!raw) {
    productsFileCache = seedProducts;
    return productsFileCache;
  }
  const normalized = raw.map(normalizeProduct).filter((p): p is Product => p !== null);
  productsFileCache = normalized.length > 0 ? normalized : seedProducts;
  return productsFileCache;
}

function sortByDateDesc<T extends { date: string | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

function getInstallsFromFile(): InstallCase[] {
  if (installsFileCache) return installsFileCache;
  const raw = readJsonArray<Parameters<typeof normalizeInstall>[0]>("installs.json");
  if (!raw) {
    installsFileCache = sortByDateDesc(seedInstalls);
    return installsFileCache;
  }
  installsFileCache = sortByDateDesc(raw.map(normalizeInstall));
  return installsFileCache;
}

function getBlogPostsFromFile(): BlogPost[] {
  if (blogFileCache) return blogFileCache;
  const site = readJsonArray<Record<string, unknown>>("blog_site.json");
  const naver = readJsonArray<Record<string, unknown>>("blog_naver.json");

  const normalizedSite = site?.map((p) => normalizeBlogPost(p, "site")).filter((p): p is BlogPost => p !== null) ?? [];
  const normalizedNaver = naver?.map((p) => normalizeBlogPost(p, "naver")).filter((p): p is BlogPost => p !== null) ?? [];

  const combined = [...normalizedSite, ...normalizedNaver];
  const withFallback = combined.length > 0 ? combined : seedBlogPosts;
  blogFileCache = sortByDateDesc(withFallback);
  return blogFileCache;
}

/**
 * Supabase가 연결되어 있으면 실시간 데이터(관리자 페이지에서 작성한 내용 포함)를 우선 사용하고,
 * 실패하거나 미설정이면 크롤링 당시의 로컬 파일로 대체합니다. 관리자 페이지에서 바로 반영되도록
 * Supabase 조회 결과는 캐시하지 않습니다.
 */
export async function getProducts(): Promise<Product[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .neq("status", "hidden")
        .order("created_at", { ascending: true });
      if (!error && data && data.length > 0) return data.map(productFromRow);
    } catch {
      // 아래 로컬 파일로 대체
    }
  }
  return getProductsFromFile();
}

export async function getInstalls(): Promise<InstallCase[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.from("install_cases").select("*").eq("status", "published");
      if (!error && data && data.length > 0) return sortByDateDesc(data.map(installFromRow));
    } catch {
      // 아래 로컬 파일로 대체
    }
  }
  return getInstallsFromFile();
}

// "설치 사례" 카테고리 글은 /cases에 있는 설치사례와 내용이 겹쳐 블로그 목록에서는 제외합니다.
function excludeCaseStylePosts(posts: BlogPost[]): BlogPost[] {
  return posts.filter((p) => p.category !== "설치 사례");
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.from("blog_posts").select("*").eq("status", "published");
      if (!error && data && data.length > 0) return excludeCaseStylePosts(sortByDateDesc(data.map(blogPostFromRow)));
    } catch {
      // 아래 로컬 파일로 대체
    }
  }
  return excludeCaseStylePosts(getBlogPostsFromFile());
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find((p) => p.id === id);
}

export async function getProductsByCategory(category: Product["category"]): Promise<Product[]> {
  const products = await getProducts();
  return products.filter((p) => p.category === category);
}

export async function getProductsByCategories(categories: Product["category"][]): Promise<Product[]> {
  const products = await getProducts();
  return products.filter((p) => categories.includes(p.category));
}

export async function getPurchaseProductsByCategories(categories: Product["category"][]): Promise<Product[]> {
  const products = await getProductsByCategories(categories);
  return products.filter((p) => p.pricingType === "purchase");
}

export async function getProductsBySizeColor(size: string, color: string): Promise<Product[]> {
  // /rental 카탈로그는 렌탈 상품만 보여줍니다 (구매 전용 상품은 /shop에 노출).
  const products = await getProducts();
  return products.filter((p) => p.size === size && p.color === color && p.pricingType === "rental");
}

export async function getProductsByBrand(brandLabel: string): Promise<Product[]> {
  const products = await getProducts();
  return products.filter((p) => p.brand === brandLabel);
}

export async function getInstallsByRegionSlug(slug: string): Promise<InstallCase[]> {
  const installs = await getInstalls();
  return installs.filter((c) => c.regionSlug === slug);
}

export async function getInstallsByIndustrySlug(slug: string): Promise<InstallCase[]> {
  const installs = await getInstalls();
  return installs.filter((c) => c.industrySlug === slug);
}

export async function getBlogPostById(id: string): Promise<BlogPost | undefined> {
  const posts = await getBlogPosts();
  return posts.find((p) => p.id === id);
}

export async function getInstallById(id: string): Promise<InstallCase | undefined> {
  const installs = await getInstalls();
  return installs.find((c) => c.id === id);
}

/** 구매 상품의 조합형 옵션(그룹+조합별 재고)을 조회합니다. 옵션이 없는 상품이면 둘 다 빈 배열입니다. */
export async function getProductOptions(
  productId: string
): Promise<{ optionGroups: ProductOptionGroup[]; variants: ProductVariant[] }> {
  if (!isSupabaseConfigured()) return { optionGroups: [], variants: [] };
  try {
    const supabase = await createClient();
    const [{ data: groups }, { data: variants }] = await Promise.all([
      supabase.from("product_option_groups").select("*").eq("product_id", productId).order("sort_order"),
      supabase.from("product_variants").select("*").eq("product_id", productId).order("sort_order"),
    ]);
    return {
      optionGroups: (groups ?? []).map((g) => ({ name: g.name, values: g.values })),
      variants: (variants ?? []).map((v) => ({
        id: v.id,
        combo: v.option_combo,
        label: v.label,
        priceDelta: v.price_delta,
        stock: v.stock,
        status: v.status,
      })),
    };
  } catch {
    return { optionGroups: [], variants: [] };
  }
}

/** 상품 상세페이지에서 "함께 구매하면 좋은 상품"으로 보여줄, 관리자가 지정한 추가 구매 상품 목록입니다. */
export async function getProductAddons(productId: string): Promise<Product[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createClient();
    const { data: links } = await supabase
      .from("product_addons")
      .select("addon_product_id")
      .eq("product_id", productId)
      .order("sort_order");
    const addonIds = (links ?? []).map((l) => l.addon_product_id);
    if (addonIds.length === 0) return [];

    const { data: rows } = await supabase.from("products").select("*").in("id", addonIds).neq("status", "hidden");
    if (!rows) return [];
    const byId = new Map(rows.map((r) => [r.id, r]));
    return addonIds.map((id) => byId.get(id)).filter((r): r is NonNullable<typeof r> => !!r).map(productFromRow);
  } catch {
    return [];
  }
}
