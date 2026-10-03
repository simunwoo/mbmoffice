/**
 * mbmoffice.co.kr(Imweb) 게시글 공용 스크래핑 유틸. 블로그(scrape-blog-rich.ts)와 설치사례
 * (scrape-installs-rich.ts) 스크립트가 함께 사용합니다.
 */
import { execFileSync } from "node:child_process";
import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

export const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
// mbmoffice.co.kr 게시글(블로그·설치사례 공통) 본문 컨테이너의 고정 클래스명 (여러 글/게시판에서 동일하게 확인됨).
export const CONTENT_SELECTOR = ".margin-top-xxl._comment_body_m202406104f9883e2ac1cf";
const ALLOWED_STYLE_PROPS = new Set(["font-size", "font-weight", "text-align", "color", "text-decoration"]);

export function fetchHtml(url: string): string {
  return execFileSync("curl", ["-s", "-A", UA, url], { maxBuffer: 1024 * 1024 * 20, encoding: "utf-8" });
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
  const $el = $(el);
  if ($el.find("img").length > 0) return false;
  const text = $el
    .text()
    .replace(/﻿/g, "")
    .replace(/ /g, " ")
    .trim();
  return text.length === 0 && $el.find("br").length === 0;
}

export function sanitizeContent(innerHtml: string): string {
  const $ = cheerio.load(`<div id="__root">${innerHtml}</div>`);

  $("script, style, iframe, noscript").remove();
  $('[style*="display:none"], [style*="display: none"]').remove();

  $("#__root")
    .find("*")
    .each((_, el) => {
      const $el = $(el);
      const attribs = { ...(el as unknown as { attribs: Record<string, string> }).attribs };
      for (const name of Object.keys(attribs)) {
        if (name.toLowerCase().startsWith("on")) $el.removeAttr(name);
      }
      if (el.tagName === "a") {
        const href = $el.attr("href") ?? "";
        if (href.trim().toLowerCase().startsWith("javascript:")) $el.removeAttr("href");
        $el.removeAttr("class");
      } else if (el.tagName === "img") {
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

  // 빈 문단/편집기 잔여 spacer 요소 제거 (이미지·줄바꿈·실제 텍스트가 없는 것만).
  let removedAny = true;
  while (removedAny) {
    removedAny = false;
    $("#__root")
      .find("p, div, span")
      .each((_, el) => {
        if ($(el).children().length === 0 && isEmptyNode($, el) && !$(el).is("br")) {
          $(el).remove();
          removedAny = true;
        }
      });
  }

  return ($("#__root").html() ?? "").trim();
}

/** sourceUrl을 방문해 본문 컨테이너를 찾아 정제된 HTML을 반환합니다. 실패 시 null. */
export function scrapeImwebRichBody(sourceUrl: string): string | null {
  const html = fetchHtml(sourceUrl);
  const $ = cheerio.load(html);
  const container = $(CONTENT_SELECTOR).first();
  if (container.length === 0) return null;
  const bodyHtml = sanitizeContent(container.html() ?? "");
  if (!bodyHtml || bodyHtml.length < 20) return null;
  return bodyHtml;
}
