// 블로그 최신 글 RSS 피드 — 네이버 등 검색엔진이 사이트맵 전체를 다시 훑지 않고도
// 새로 올라온 글을 빠르게 가져갈 수 있도록 제공합니다.
import { siteConfig } from "@/lib/site-config";
import { getBlogPosts } from "@/lib/data";

const MAX_ITEMS = 30;

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRfc822(dateStr: string | null): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  return Number.isNaN(d.getTime()) ? new Date().toUTCString() : d.toUTCString();
}

export async function GET() {
  const posts = (await getBlogPosts()).slice(0, MAX_ITEMS);

  const items = posts
    .map((p) => {
      const link = `${siteConfig.url}/blog/${p.id}`;
      const description = (p.body || "").slice(0, 300);
      return `  <item>
    <title>${escapeXml(p.title)}</title>
    <link>${escapeXml(link)}</link>
    <guid isPermaLink="true">${escapeXml(link)}</guid>
    <pubDate>${toRfc822(p.date)}</pubDate>
    <description>${escapeXml(description)}</description>
  </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${escapeXml(siteConfig.name)} 블로그</title>
  <link>${escapeXml(siteConfig.url)}/blog</link>
  <description>${escapeXml(siteConfig.shortDescription)}</description>
  <language>ko</language>
${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
