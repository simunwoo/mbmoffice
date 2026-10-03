/**
 * data/raw/blog_naver.json의 bodyHtml 안 모든 <img> 태그에 referrerpolicy="no-referrer"를 붙입니다.
 * 네이버 이미지 CDN(postfiles.pstatic.net)은 외부 사이트에서 Referer를 보내며 접근하면 403으로
 * 막아버려서, 브라우저가 Referer를 아예 보내지 않도록 해야 본문 이미지가 정상적으로 보입니다.
 *
 * 실행: npx tsx scripts/repair-naver-image-referrer.ts
 */
import fs from "node:fs";
import path from "node:path";

const FILE = path.join(process.cwd(), "data", "raw", "blog_naver.json");

function fixHtml(html: string): { html: string; fixed: number } {
  let fixed = 0;
  const result = html.replace(/<img(?![^>]*referrerpolicy)([^>]*)>/g, (match, rest) => {
    fixed++;
    return `<img referrerpolicy="no-referrer"${rest}>`;
  });
  return { html: result, fixed };
}

function main() {
  const posts = JSON.parse(fs.readFileSync(FILE, "utf-8")) as Array<{ id: string; title: string; bodyHtml?: string | null }>;
  let totalFixed = 0;
  let postsChanged = 0;

  const updated = posts.map((post) => {
    if (!post.bodyHtml) return post;
    const { html, fixed } = fixHtml(post.bodyHtml);
    if (fixed > 0) {
      totalFixed += fixed;
      postsChanged++;
      return { ...post, bodyHtml: html };
    }
    return post;
  });

  fs.writeFileSync(FILE, JSON.stringify(updated, null, 2) + "\n", "utf-8");
  console.log(`글 ${postsChanged}개, 이미지 태그 ${totalFixed}개에 referrerpolicy 추가 완료.`);
}

main();
