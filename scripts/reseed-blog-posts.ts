/**
 * blog_posts 테이블을 로컬 데이터(data/raw/blog_site.json, blog_naver.json) 기준으로 완전히 새로
 * 채웁니다. service_role 키로 RLS를 우회해 직접 Supabase에 씁니다 (SQL Editor 수작업 대체).
 *
 * 실행: npx tsx scripts/reseed-blog-posts.ts
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { normalizeBlogPost } from "../src/lib/data/normalize";
import type { BlogPost } from "../src/lib/data/types";
import type { BlogPostInsert } from "../src/lib/supabase/types";

function loadEnvLocal(): Record<string, string> {
  const file = path.join(process.cwd(), ".env.local");
  const text = fs.readFileSync(file, "utf-8");
  const env: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return env;
}

function readJson<T>(filename: string): T[] {
  const file = path.join(process.cwd(), "data", "raw", filename);
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function toInsert(p: BlogPost): BlogPostInsert {
  return {
    title: p.title,
    category: p.category,
    body: p.body,
    body_html: p.bodyHtml ?? null,
    images: p.images,
    post_date: p.date,
    source: p.source,
    status: "published",
  };
}

async function main() {
  const env = loadEnvLocal();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const rawSite = readJson<Record<string, unknown>>("blog_site.json");
  const rawNaver = readJson<Record<string, unknown>>("blog_naver.json");
  const posts: BlogPost[] = [
    ...rawSite.map((r) => normalizeBlogPost(r, "site")).filter((p): p is BlogPost => p !== null),
    ...rawNaver.map((r) => normalizeBlogPost(r, "naver")).filter((p): p is BlogPost => p !== null),
  ];
  console.log("로컬 데이터 기준 총 글 수:", posts.length);

  console.log("기존 blog_posts 비우는 중...");
  const { error: deleteError } = await supabase.from("blog_posts").delete().not("id", "is", null);
  if (deleteError) throw new Error(`삭제 실패: ${deleteError.message}`);

  const rows = posts.map(toInsert);
  const BATCH_SIZE = 20;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("blog_posts").insert(batch);
    if (error) throw new Error(`삽입 실패 (batch ${i}): ${error.message}`);
    inserted += batch.length;
    process.stdout.write(`\r${inserted}/${rows.length}건 삽입...`);
  }
  console.log("\n완료.");

  const { count } = await supabase.from("blog_posts").select("*", { count: "exact", head: true });
  console.log("최종 blog_posts 개수:", count);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
