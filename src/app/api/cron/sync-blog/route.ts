// GET /api/cron/sync-blog — www.mbmoffice.co.kr 블로그 게시판과 네이버 블로그(mbmoffice)에서
// 새 글을 찾아 blog_posts(또는 "설치사례" 카테고리면 install_cases)에 자동으로 채워 넣습니다.
// vercel.json의 cron 설정으로 매일 호출되며, Vercel이 CRON_SECRET을 Authorization 헤더로 함께
// 보내므로 그 값을 확인해 외부에서 함부로 호출 못 하게 막습니다.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { discoverImwebBlogPosts, scrapeImwebPostBody } from "@/lib/sync/imweb";
import { discoverNaverBlogPosts } from "@/lib/sync/naver";
import { isInstallCaseCategory, regionFromTitle, industryFromTitle, brandFromTitle, modelFromTitle } from "@/lib/sync/classify";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_NEW_PER_SOURCE = 6;

type SyncOutcome = { checked: number; inserted: number; skipped: string[] };

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // 아직 설정 전이면 로컬 테스트를 막지 않습니다 (배포 전 반드시 설정 필요).
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

// Supabase 에러는 Error 인스턴스가 아니라 {message, code, ...} 평범한 객체라서 instanceof Error로 못 잡습니다.
function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) return String((err as { message: unknown }).message);
  return "unknown";
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const [{ data: existingPosts }, { data: existingCases }] = await Promise.all([
    admin.from("blog_posts").select("title"),
    admin.from("install_cases").select("title"),
  ]);
  const knownTitles = new Set<string>([
    ...(existingPosts ?? []).map((r) => r.title.trim()),
    ...(existingCases ?? []).map((r) => r.title.trim()),
  ]);

  async function saveAsInstallCase(input: { title: string; body: string; bodyHtml: string; images: string[]; caseDate: string | null }) {
    const { region, regionSlug } = regionFromTitle(input.title);
    const { industry, industrySlug } = industryFromTitle(input.title);
    const { error } = await admin.from("install_cases").insert({
      title: input.title,
      region,
      region_slug: regionSlug,
      industry,
      industry_slug: industrySlug,
      brand: brandFromTitle(input.title),
      model: modelFromTitle(input.title),
      body: input.body,
      body_html: input.bodyHtml,
      images: input.images,
      case_date: input.caseDate,
      status: "published",
    });
    if (error) throw error;
  }

  async function saveAsBlogPost(input: {
    title: string;
    category: string | null;
    body: string;
    bodyHtml: string;
    images: string[];
    postDate: string | null;
    source: "site" | "naver";
  }) {
    const { error } = await admin.from("blog_posts").insert({
      title: input.title,
      category: input.category,
      body: input.body,
      body_html: input.bodyHtml,
      images: input.images,
      post_date: input.postDate,
      source: input.source,
      status: "published",
    });
    if (error) throw error;
  }

  const naverResult: SyncOutcome = { checked: 0, inserted: 0, skipped: [] };
  try {
    const posts = await discoverNaverBlogPosts();
    naverResult.checked = posts.length;
    const fresh = posts.filter((p) => !knownTitles.has(p.title.trim())).slice(0, MAX_NEW_PER_SOURCE);
    for (const p of fresh) {
      try {
        if (isInstallCaseCategory(p.category)) {
          await saveAsInstallCase({ title: p.title, body: p.body, bodyHtml: p.bodyHtml, images: p.images, caseDate: p.date });
        } else {
          await saveAsBlogPost({ title: p.title, category: p.category, body: p.body, bodyHtml: p.bodyHtml, images: p.images, postDate: p.date, source: "naver" });
        }
        knownTitles.add(p.title.trim());
        naverResult.inserted++;
      } catch (err) {
        naverResult.skipped.push(`${p.title}: ${errorMessage(err)}`);
      }
    }
  } catch (err) {
    naverResult.skipped.push(`feed error: ${errorMessage(err)}`);
  }

  const siteResult: SyncOutcome = { checked: 0, inserted: 0, skipped: [] };
  try {
    const posts = await discoverImwebBlogPosts();
    siteResult.checked = posts.length;
    const fresh = posts.filter((p) => !knownTitles.has(p.title.trim())).slice(0, MAX_NEW_PER_SOURCE);
    for (const p of fresh) {
      try {
        const scraped = await scrapeImwebPostBody(p.sourceUrl);
        if (!scraped) {
          siteResult.skipped.push(`${p.title}: 본문을 찾지 못함`);
          continue;
        }
        if (isInstallCaseCategory(p.category)) {
          await saveAsInstallCase({ title: p.title, body: scraped.body, bodyHtml: scraped.bodyHtml, images: scraped.images, caseDate: null });
        } else {
          await saveAsBlogPost({ title: p.title, category: p.category, body: scraped.body, bodyHtml: scraped.bodyHtml, images: scraped.images, postDate: null, source: "site" });
        }
        knownTitles.add(p.title.trim());
        siteResult.inserted++;
      } catch (err) {
        siteResult.skipped.push(`${p.title}: ${errorMessage(err)}`);
      }
    }
  } catch (err) {
    siteResult.skipped.push(`listing error: ${errorMessage(err)}`);
  }

  return NextResponse.json({ naver: naverResult, site: siteResult });
}
