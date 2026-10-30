// 네이버 블로그(blog.naver.com/mbmoffice) RSS 피드에서 새 글을 찾아옵니다.
// RSS의 <description>은 글 앞부분 요약 + 대표 이미지 1장 정도만 담고 있어 전체 본문만큼
// 풍부하진 않지만, 서버리스 함수에서 매일 돌리기엔 가볍고 안정적입니다.
import * as cheerio from "cheerio";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const RSS_URL = "https://rss.blog.naver.com/mbmoffice.xml";

export type NaverRssItem = {
  title: string;
  sourceUrl: string;
  category: string | null;
  body: string;
  bodyHtml: string;
  images: string[];
  date: string | null;
};

function cleanNaverLink(rawLink: string): string {
  // ".../mbmoffice/223655891488?fromRss=true&trackingCode=rss" → 추적 파라미터 제거
  return rawLink.split("?")[0];
}

export async function discoverNaverBlogPosts(): Promise<NaverRssItem[]> {
  const res = await fetch(RSS_URL, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`naver rss fetch failed ${res.status}`);
  const xml = await res.text();
  const $ = cheerio.load(xml, { xmlMode: true });

  const out: NaverRssItem[] = [];
  $("item").each((_, el) => {
    const $el = $(el);
    const title = $el.find("title").first().text().trim();
    const rawLink = $el.find("link").first().text().trim();
    if (!title || !rawLink) return;
    const category = $el.find("category").first().text().trim() || null;
    const pubDate = $el.find("pubDate").first().text().trim() || null;
    const descriptionHtml = $el.find("description").first().text().trim();

    const $desc = cheerio.load(descriptionHtml);
    const body = $desc.root().text().replace(/\s+/g, " ").trim();
    const images = $desc("img")
      .map((__, img) => $desc(img).attr("src") ?? "")
      .get()
      .filter(Boolean);

    out.push({
      title,
      sourceUrl: cleanNaverLink(rawLink),
      category,
      body,
      bodyHtml: descriptionHtml,
      images,
      date: pubDate ? new Date(pubDate).toISOString() : null,
    });
  });

  return out;
}
