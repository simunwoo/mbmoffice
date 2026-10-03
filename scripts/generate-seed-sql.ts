/**
 * data/raw/*.json (실제 크롤링 데이터)를 정규화해서 supabase/seed/ 아래에 여러 개의 작은 SQL 파일로
 * 나눠 생성합니다. Supabase SQL Editor는 한 번에 붙여넣을 수 있는 쿼리 크기에 제한이 있어서(특히 블로그
 * 글처럼 이미지·서식이 포함된 긴 본문이 많으면), 파일 하나가 너무 커지지 않도록 잘라둡니다.
 *
 * 실행: npx tsx scripts/generate-seed-sql.ts
 * 사용법: supabase/schema.sql을 먼저 실행한 뒤, supabase/seed/ 폴더 안 파일들을 파일명 순서대로
 *         하나씩 SQL Editor에 붙여넣어 실행하세요 (새 쿼리 탭에 하나씩).
 */
import fs from "node:fs";
import path from "node:path";
import { normalizeBlogPost, normalizeInstall, normalizeProduct } from "../src/lib/data/normalize";
import type { BlogPost, InstallCase, Product } from "../src/lib/data/types";

const RAW_DIR = path.join(process.cwd(), "data", "raw");
const OUT_DIR = path.join(process.cwd(), "supabase", "seed");
// SQL Editor에 한 번에 붙여넣을 파일의 목표 크기 (문자 수 기준). 넉넉히 여유를 둔 안전한 값입니다.
const MAX_CHARS_PER_FILE = 150_000;

function readJson<T>(filename: string): T[] {
  const file = path.join(RAW_DIR, filename);
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function sqlStr(v: string | null | undefined): string {
  if (v === null || v === undefined) return "null";
  return `'${v.replace(/'/g, "''")}'`;
}

function sqlNum(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "null";
  return String(v);
}

function sqlArr(v: string[] | undefined): string {
  if (!v || v.length === 0) return "'{}'";
  const items = v.map((s) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(",");
  return `'{${items}}'`;
}

/** 행 문자열 배열을 목표 크기 이하가 되도록 여러 묶음으로 나눕니다 (행 중간에서 자르지 않습니다). */
function chunkRows(rows: string[], maxChars: number): string[][] {
  const chunks: string[][] = [];
  let current: string[] = [];
  let currentSize = 0;

  for (const row of rows) {
    if (current.length > 0 && currentSize + row.length > maxChars) {
      chunks.push(current);
      current = [];
      currentSize = 0;
    }
    current.push(row);
    currentSize += row.length;
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
}

function writeTableFiles(order: number, table: string, columns: string, rows: string[]) {
  if (rows.length === 0) return 0;
  const chunks = chunkRows(rows, MAX_CHARS_PER_FILE);

  const partDigits = String(chunks.length).length;
  chunks.forEach((chunk, i) => {
    const part = chunks.length > 1 ? `-part${String(i + 1).padStart(partDigits, "0")}of${chunks.length}` : "";
    const fileName = `${String(order).padStart(2, "0")}-${table}${part}.sql`;
    const header = [
      `-- 자동 생성 파일 (scripts/generate-seed-sql.ts) — 직접 수정하지 마세요.`,
      chunks.length > 1
        ? `-- ${table} 데이터 ${i + 1}/${chunks.length}번째 묶음 (총 ${rows.length}행 중 ${chunk.length}행). 순서대로 실행하세요.`
        : `-- ${table} 데이터 (총 ${rows.length}행)`,
      "",
      `insert into ${table} (${columns}) values`,
    ];
    const sql = header.join("\n") + "\n" + chunk.join(",\n") + ";\n";
    fs.writeFileSync(path.join(OUT_DIR, fileName), sql, "utf-8");
  });

  return chunks.length;
}

const rawProducts = readJson<Parameters<typeof normalizeProduct>[0]>("products.json");
const products = rawProducts.map(normalizeProduct).filter((p): p is Product => p !== null);

const rawInstalls = readJson<Parameters<typeof normalizeInstall>[0]>("installs.json");
const installs: InstallCase[] = rawInstalls.map(normalizeInstall);

const rawBlogSite = readJson<Record<string, unknown>>("blog_site.json");
const rawBlogNaver = readJson<Record<string, unknown>>("blog_naver.json");
const blogPosts: BlogPost[] = [
  ...rawBlogSite.map((p) => normalizeBlogPost(p, "site")).filter((p): p is BlogPost => p !== null),
  ...rawBlogNaver.map((p) => normalizeBlogPost(p, "naver")).filter((p): p is BlogPost => p !== null),
];

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

const productRows = products.map(
  (p) =>
    `  (${sqlStr(p.name)}, ${sqlStr(p.brand)}, ${sqlStr(p.category)}, ${sqlStr(p.size ?? null)}, ${sqlStr(
      p.color ?? null
    )}, ${sqlStr(p.printTech ?? null)}, ${sqlNum(p.volumeMin)}, ${sqlNum(p.volumeMax)}, ${sqlNum(p.termMonths)}, ${sqlNum(
      p.priceMonthly
    )}, ${sqlNum(p.listPrice)}, ${sqlNum(p.purchasePrice)}, ${sqlStr(p.pricingType ?? "rental")}, ${sqlStr(
      p.priceNote
    )}, ${sqlArr(p.specs)}, ${sqlArr(p.images)}, 'selling', ${sqlStr(p.sourceUrl)})`
);
const productFiles = writeTableFiles(
  1,
  "products",
  "name, brand, category, size, color, print_tech, volume_min, volume_max, term_months, price_monthly, list_price, purchase_price, pricing_type, price_note, specs, images, status, source_url",
  productRows
);

const installRows = installs.map(
  (c) =>
    `  (${sqlStr(c.title)}, ${sqlStr(c.region)}, ${sqlStr(c.regionSlug)}, ${sqlStr(c.industry)}, ${sqlStr(
      c.industrySlug
    )}, ${sqlStr(c.brand)}, ${sqlStr(c.model)}, ${sqlStr(c.body)}, ${sqlStr(c.bodyHtml ?? null)}, ${sqlArr(
      c.images
    )}, ${sqlStr(c.date)}, 'published')`
);
const installFiles = writeTableFiles(
  2,
  "install_cases",
  "title, region, region_slug, industry, industry_slug, brand, model, body, body_html, images, case_date, status",
  installRows
);

const blogRows = blogPosts.map(
  (b) =>
    `  (${sqlStr(b.title)}, ${sqlStr(b.category)}, ${sqlStr(b.body)}, ${sqlStr(b.bodyHtml ?? null)}, ${sqlArr(
      b.images
    )}, ${sqlStr(b.date)}, ${sqlStr(b.source)}, 'published')`
);
const blogFiles = writeTableFiles(3, "blog_posts", "title, category, body, body_html, images, post_date, source, status", blogRows);

console.log(`Wrote SQL files to ${OUT_DIR}`);
console.log(
  `products: ${products.length}행 → ${productFiles}개 파일, installs: ${installs.length}행 → ${installFiles}개 파일, blogPosts: ${blogPosts.length}행 → ${blogFiles}개 파일`
);
