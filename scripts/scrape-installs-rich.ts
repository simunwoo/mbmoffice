/**
 * data/raw/installs.json 각 설치사례의 sourceUrl을 다시 방문해, 원본 서식(굵게/글자크기/정렬/인용구)과
 * 본문 중간 설치 사진을 그대로 담은 bodyHtml을 채워 넣습니다. 기존 body(순수 텍스트)는 유지하고
 * bodyHtml만 추가/갱신합니다.
 *
 * 실행: npx tsx scripts/scrape-installs-rich.ts  (일부만 테스트하려면 SCRAPE_LIMIT=2 npx tsx ...)
 */
import fs from "node:fs";
import path from "node:path";
import { scrapeImwebRichBody } from "./lib/imweb-rich-content";

const INSTALLS_FILE = path.join(process.cwd(), "data", "raw", "installs.json");

function main() {
  const all = JSON.parse(fs.readFileSync(INSTALLS_FILE, "utf-8")) as Array<{ id: string; sourceUrl: string; title: string }>;
  const limit = process.env.SCRAPE_LIMIT ? Number(process.env.SCRAPE_LIMIT) : all.length;
  const raw = all.slice(0, limit);
  let ok = 0;
  let failed = 0;

  const updatedSlice = raw.map((item) => {
    process.stdout.write(`[${item.id}] ${item.title.slice(0, 30)}... `);
    try {
      const bodyHtml = scrapeImwebRichBody(item.sourceUrl);
      if (!bodyHtml) {
        console.log("본문 컨테이너 없음/비어있음, 건너뜀");
        failed++;
        return item;
      }
      console.log(`OK (${bodyHtml.length}자)`);
      ok++;
      return { ...item, bodyHtml };
    } catch (err) {
      console.log("에러:", (err as Error).message);
      failed++;
      return item;
    }
  });

  const updated = [...updatedSlice, ...all.slice(limit)];
  fs.writeFileSync(INSTALLS_FILE, JSON.stringify(updated, null, 2) + "\n", "utf-8");
  console.log(`\n완료: 성공 ${ok}건, 실패 ${failed}건 / 총 ${raw.length}건 (전체 ${all.length}건 중)`);
}

main();
