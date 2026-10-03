/**
 * data/raw/blog_naver.json의 bodyHtml 안에서, 크기 파라미터(?type=) 없이 저장된
 * postfiles.pstatic.net 이미지 URL에 ?type=w966를 붙여줍니다. 네이버 이미지 CDN은 이 파라미터가
 * 없으면 아주 작은 기본 이미지를 내려주기 때문에, 예전 스크랩 결과에 남아있던 문제를 복구합니다.
 *
 * 실행: npx tsx scripts/repair-naver-image-sizes.ts
 */
import fs from "node:fs";
import path from "node:path";

const FILE = path.join(process.cwd(), "data", "raw", "blog_naver.json");

function fixHtml(html: string): { html: string; fixed: number } {
  let fixed = 0;
  const result = html.replace(/(<img src="https:\/\/postfiles\.pstatic\.net\/[^"?]+)"/g, (match, urlWithoutQuery) => {
    fixed++;
    return `${urlWithoutQuery}?type=w966"`;
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
  console.log(`글 ${postsChanged}개, 이미지 ${totalFixed}장 복구 완료.`);
}

main();
