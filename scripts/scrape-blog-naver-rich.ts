/**
 * data/raw/blog_naver.json 각 글의 sourceUrl(blog.naver.com/mbmoffice/{logNo})을 다시 방문해,
 * 네이버 스마트에디터(SE3) 본문의 문단 서식(굵게/글자크기/인용구/구분선)과 본문 중간 이미지를
 * 최대한 보존한 bodyHtml을 채워 넣습니다. 기존 body(순수 텍스트)는 유지하고 bodyHtml만 추가/갱신합니다.
 *
 * 실행: npx tsx scripts/scrape-blog-naver-rich.ts
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import { UA } from "./lib/imweb-rich-content";

const RAW_DIR = path.join(process.cwd(), "data", "raw");
const NAVER_FILE = path.join(RAW_DIR, "blog_naver.json");

function fetchHtml(url: string): string {
  return execFileSync("curl", ["-sL", "-A", UA, url], { maxBuffer: 1024 * 1024 * 20, encoding: "utf-8" });
}

function toPostViewUrl(sourceUrl: string): string | null {
  const m = sourceUrl.match(/blog\.naver\.com\/([^/]+)\/(\d+)/);
  if (!m) return null;
  const [, blogId, logNo] = m;
  return `https://blog.naver.com/PostView.naver?blogId=${blogId}&logNo=${logNo}&redirect=Dlog&widgetTypeCall=true&noTrackingCode=true&directAccess=false`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** se-fs-fsNN 클래스에서 글자 크기(px)를 추출합니다. 기본 본문 크기(15~16px)는 굳이 인라인 스타일로 남기지 않습니다. */
function fontSizeFromClass(cls: string): number | null {
  const m = cls.match(/se-fs-fs(\d+)/);
  if (!m) return null;
  const size = Number(m[1]);
  return size >= 19 ? size : null;
}

function serializeInline($: cheerio.CheerioAPI, node: AnyNode): string {
  if (node.type === "text") {
    return escapeHtml((node.data ?? "").replace(/​/g, ""));
  }
  if (node.type !== "tag") return "";
  const $node = $(node);
  const tag = node.tagName?.toLowerCase();
  const inner = (node.children ?? []).map((c) => serializeInline($, c)).join("");
  if (tag === "br") return "<br>";
  if (!inner.trim() && tag !== "br") {
    if (tag === "img") {
      const src = $node.attr("data-lazy-src") || $node.attr("src") || "";
      if (src.startsWith("https://")) return `<img referrerpolicy="no-referrer" src="${src}">`;
      return "";
    }
    return "";
  }
  if (tag === "b" || tag === "strong") return `<strong>${inner}</strong>`;
  if (tag === "i" || tag === "em") return `<em>${inner}</em>`;
  if (tag === "u") return `<u>${inner}</u>`;
  if (tag === "a") {
    const href = $node.attr("href") ?? "";
    if (href && href !== "#" && !href.toLowerCase().startsWith("javascript:")) {
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${inner}</a>`;
    }
    return inner;
  }
  const cls = $node.attr("class") ?? "";
  const fontSize = fontSizeFromClass(cls);
  if (fontSize) return `<span style="font-size:${fontSize}px">${inner}</span>`;
  return inner;
}

function paragraphToHtml($: cheerio.CheerioAPI, p: AnyNode): string {
  const $p = $(p);
  const alignMatch = ($p.attr("class") ?? "").match(/se-text-paragraph-align-(left|center|right)/);
  const align = alignMatch ? ` style="text-align:${alignMatch[1]}"` : "";
  const inner = $p
    .contents()
    .toArray()
    .map((c) => serializeInline($, c))
    .join("");
  return `<p${align}>${inner || "&nbsp;"}</p>`;
}

// 네이버 이미지 CDN은 ?type= 크기 파라미터가 없으면 아주 작은 기본 이미지를 내려줘서, 쿼리스트링을
// 지우지 않고 그대로 유지합니다 (지워버리면 사진이 흐릿하거나 거의 안 보일 정도로 작게 나옵니다).
// 또한 외부 사이트(Referer)에서 접근하면 403으로 막기 때문에, referrerpolicy="no-referrer"를 붙여
// 브라우저가 Referer를 아예 보내지 않도록 합니다.
function imageComponentToHtml($: cheerio.CheerioAPI, component: AnyNode): string {
  const img = $(component).find("img.se-image-resource").first();
  if (img.length === 0) return "";
  const src = img.attr("data-lazy-src") || img.attr("src") || "";
  if (!src.startsWith("https://")) return "";
  return `<p><img referrerpolicy="no-referrer" src="${src}"></p>`;
}

function extractSeMain($: cheerio.CheerioAPI): string {
  const main = $(".se-main-container").first();
  if (main.length === 0) return "";
  const out: string[] = [];

  main.children(".se-component").each((_, comp) => {
    const $comp = $(comp);
    const classes = $comp.attr("class") ?? "";

    if (classes.includes("se-horizontal")) {
      out.push("<hr>");
      return;
    }
    if (classes.includes("se-image")) {
      const html = imageComponentToHtml($, comp);
      if (html) out.push(html);
      return;
    }
    if (classes.includes("se-quotation")) {
      const paras = $comp
        .find(".se-text-paragraph")
        .toArray()
        .map((p) => paragraphToHtml($, p))
        .join("");
      if (paras) out.push(`<blockquote>${paras}</blockquote>`);
      return;
    }
    if (classes.includes("se-text")) {
      $comp.find(".se-text-paragraph").each((__, p) => {
        out.push(paragraphToHtml($, p));
      });
      return;
    }
    // se-video, se-places, se-sticker, se-document, se-code 등 재구성이 어려운 임베드 컴포넌트는 건너뜁니다.
  });

  return out.join("");
}

function main() {
  const all = JSON.parse(fs.readFileSync(NAVER_FILE, "utf-8")) as Array<{ id: string; sourceUrl: string; title: string }>;
  const limit = process.env.SCRAPE_LIMIT ? Number(process.env.SCRAPE_LIMIT) : all.length;
  const raw = all.slice(0, limit);
  let ok = 0;
  let failed = 0;

  const updatedSlice = raw.map((post) => {
    process.stdout.write(`[${post.id}] ${post.title.slice(0, 30)}... `);
    try {
      const postViewUrl = toPostViewUrl(post.sourceUrl);
      if (!postViewUrl) {
        console.log("URL 파싱 실패, 건너뜀");
        failed++;
        return post;
      }
      const html = fetchHtml(postViewUrl);
      const $ = cheerio.load(html);
      const bodyHtml = extractSeMain($);
      if (!bodyHtml || bodyHtml.replace(/<[^>]+>/g, "").trim().length < 10) {
        console.log("본문이 비어있음, 건너뜀");
        failed++;
        return post;
      }
      console.log(`OK (${bodyHtml.length}자)`);
      ok++;
      return { ...post, bodyHtml };
    } catch (err) {
      console.log("에러:", (err as Error).message);
      failed++;
      return post;
    }
  });

  const updated = [...updatedSlice, ...all.slice(limit)];
  fs.writeFileSync(NAVER_FILE, JSON.stringify(updated, null, 2) + "\n", "utf-8");
  console.log(`\n완료: 성공 ${ok}건, 실패 ${failed}건 / 총 ${raw.length}건 (전체 ${all.length}건 중)`);
}

main();
