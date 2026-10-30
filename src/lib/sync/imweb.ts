// www.mbmoffice.co.kr(imweb) 블로그 게시판에서 새 글을 찾아오는 스크래퍼.
// scripts/lib/imweb-rich-content.ts의 본문 정제 로직과 같은 선택자를 쓰되, 서버리스 함수에서 curl
// 서브프로세스를 쓸 수 없어 전부 fetch로 다시 작성했습니다.
import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const CONTENT_SELECTOR = ".margin-top-xxl._comment_body_m202406104f9883e2ac1cf";
const ALLOWED_STYLE_PROPS = new Set(["font-size", "font-weight", "text-align", "color", "text-decoration"]);
const BLOG_LIST_URL = "https://www.mbmoffice.co.kr/blog/";

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`fetch failed ${res.status}: ${url}`);
  return res.text();
}

export type DiscoveredPost = { idx: string; title: string; category: string | null; sourceUrl: string };

/** 블로그 목록 페이지에 보이는(최신순) 글들을 찾습니다 — 보통 최근 글 몇 개만 서버 렌더링됩니다. */
export async function discoverImwebBlogPosts(): Promise<DiscoveredPost[]> {
  const html = await fetchHtml(BLOG_LIST_URL);
  const $ = cheerio.load(html);
  const out: DiscoveredPost[] = [];
  const seen = new Set<string>();

  $("a.post_link_wrap").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const idxMatch = href.match(/idx=(\d+)/);
    if (!idxMatch) return;
    const idx = idxMatch[1];
    if (seen.has(idx)) return;
    seen.add(idx);

    const titleBlock = $(el).find(".title-block").first();
    const category = titleBlock.find("em").first().text().trim() || null;
    // 제목은 title-block 전체 텍스트에서 카테고리(em) 텍스트와 "공지" 배지를 뺀 나머지입니다.
    const fullText = titleBlock.clone().children("em").remove().end().text().replace(/\s+/g, " ").trim();
    const title = fullText.replace(/^공지\s*/, "").trim();
    if (!title) return;

    out.push({ idx, title, category, sourceUrl: `https://www.mbmoffice.co.kr/blog/?bmode=view&idx=${idx}` });
  });

  return out;
}

function sanitizeStyle(style: string | undefined): string | null {
  if (!style) return null;
  const kept = style
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((decl) => {
      const [prop] = decl.split(":").map((s) => s.trim().toLowerCase());
      return ALLOWED_STYLE_PROPS.has(prop);
    });
  return kept.length > 0 ? kept.join("; ") : null;
}

function isEmptyNode($: cheerio.CheerioAPI, el: AnyNode): boolean {
  const $el = $(el as never);
  if ($el.find("img").length > 0) return false;
  const text = $el.text().replace(/﻿/g, "").replace(/ /g, " ").trim();
  return text.length === 0 && $el.find("br").length === 0;
}

function sanitizeContent(innerHtml: string): string {
  const $ = cheerio.load(`<div id="__root">${innerHtml}</div>`);
  $("script, style, iframe, noscript").remove();
  $('[style*="display:none"], [style*="display: none"]').remove();

  $("#__root")
    .find("*")
    .each((_, el) => {
      const $el = $(el as never);
      const attribs = { ...(el as unknown as { attribs?: Record<string, string> }).attribs };
      for (const name of Object.keys(attribs)) {
        if (name.toLowerCase().startsWith("on")) $el.removeAttr(name);
      }
      const tagName = (el as { tagName?: string }).tagName;
      if (tagName === "a") {
        const href = $el.attr("href") ?? "";
        if (href.trim().toLowerCase().startsWith("javascript:")) $el.removeAttr("href");
        $el.removeAttr("class");
      } else if (tagName === "img") {
        const src = $el.attr("src") ?? "";
        $el.removeAttr("class");
        if (!src.startsWith("https://")) $el.remove();
      } else {
        $el.removeAttr("class");
        $el.removeAttr("id");
      }
      const cleanedStyle = sanitizeStyle($el.attr("style"));
      if (cleanedStyle) $el.attr("style", cleanedStyle);
      else $el.removeAttr("style");
    });

  let removedAny = true;
  while (removedAny) {
    removedAny = false;
    $("#__root")
      .find("p, div, span")
      .each((_, el) => {
        const $el = $(el as never);
        if ($el.children().length === 0 && isEmptyNode($, el) && !$el.is("br")) {
          $el.remove();
          removedAny = true;
        }
      });
  }

  return ($("#__root").html() ?? "").trim();
}

/** 게시글 상세 페이지를 방문해 정제된 본문 HTML과 이미지 목록, 순수 텍스트를 가져옵니다. */
export async function scrapeImwebPostBody(sourceUrl: string): Promise<{ bodyHtml: string; body: string; images: string[] } | null> {
  const html = await fetchHtml(sourceUrl);
  const $ = cheerio.load(html);
  const container = $(CONTENT_SELECTOR).first();
  if (container.length === 0) return null;
  const bodyHtml = sanitizeContent(container.html() ?? "");
  if (!bodyHtml || bodyHtml.length < 20) return null;

  const $clean = cheerio.load(bodyHtml);
  const body = $clean.root().text().replace(/\s+/g, " ").trim();
  const images = $clean("img")
    .map((_, img) => $clean(img).attr("src") ?? "")
    .get()
    .filter(Boolean);

  return { bodyHtml, body, images };
}
