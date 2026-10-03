import type { BlogPost, InstallCase, Product } from "../data/types";
import type { BlogPostRow, InstallCaseRow, ProductRow } from "./types";

export function productFromRow(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category,
    size: row.size,
    color: row.color,
    printTech: row.print_tech,
    volumeMin: row.volume_min,
    volumeMax: row.volume_max,
    termMonths: row.term_months,
    priceMonthly: row.price_monthly,
    listPrice: row.list_price,
    purchasePrice: row.purchase_price,
    pricingType: row.pricing_type,
    priceNote: row.price_note,
    specs: row.specs,
    images: row.images,
    sourceUrl: row.source_url ?? undefined,
    status: row.status,
    stock: row.stock,
    descriptionHtml: row.description_html,
  };
}

export function installFromRow(row: InstallCaseRow): InstallCase {
  return {
    id: row.id,
    title: row.title,
    region: row.region,
    regionSlug: row.region_slug,
    industry: row.industry,
    industrySlug: row.industry_slug,
    brand: row.brand,
    model: row.model,
    category: row.category,
    body: row.body,
    bodyHtml: row.body_html,
    images: row.images,
    date: row.case_date,
    sourceUrl: "",
  };
}

export function blogPostFromRow(row: BlogPostRow): BlogPost {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    body: row.body,
    bodyHtml: row.body_html,
    images: row.images,
    date: row.post_date,
    sourceUrl: "",
    source: row.source === "naver" ? "naver" : "site",
  };
}
