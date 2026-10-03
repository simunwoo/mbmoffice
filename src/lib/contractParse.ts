// buildContractTerms()가 만드는 고정된 평문 구조(제목 → 당사자 정보 [갑]/[을] → "- 記 -" →
// 제N조 조항들 → 마무리 문구)를 그대로 파싱해 화면에 예쁘게 그리기 위한 헬퍼입니다.
// 해시·저장·이메일 발송은 항상 평문(getRaw text) 그대로 쓰고, 이 파서는 순수 표시용입니다.

export type ContractRow = { label: string; value: string };
export type ContractParty = { name: string; rows: ContractRow[] };
export type ContractArticle = { heading: string; lines: string[] };
export type ParsedContract = {
  title: string;
  intro: string[];
  parties: ContractParty[];
  articles: ContractArticle[];
  closing: string[];
};

const ARTICLE_RE = /^제\d+조/;
const FIELD_RE = /^ {2}\S.*:/;

export function parseContractText(text: string): ParsedContract {
  const lines = text.split("\n");
  let i = 0;

  const title = (lines[i] ?? "").trim();
  i++;
  while (i < lines.length && lines[i].trim() === "") i++;

  const intro: string[] = [];
  while (i < lines.length && !lines[i].startsWith("[")) {
    if (lines[i].trim() !== "") intro.push(lines[i]);
    i++;
  }

  const parties: ContractParty[] = [];
  while (i < lines.length && lines[i].startsWith("[")) {
    const name = lines[i].replace(/[[\]]/g, "").trim();
    i++;
    const rows: ContractRow[] = [];
    while (i < lines.length && lines[i].trim() !== "") {
      const line = lines[i].trim();
      const idx = line.indexOf(":");
      if (idx >= 0) rows.push({ label: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() });
      i++;
    }
    parties.push({ name, rows });
    while (i < lines.length && lines[i].trim() === "") i++;
  }

  // "- 記 -" 구분선 등 조항 시작 전까지 건너뜁니다.
  while (i < lines.length && !ARTICLE_RE.test(lines[i])) i++;

  const articles: ContractArticle[] = [];
  while (i < lines.length && ARTICLE_RE.test(lines[i])) {
    const heading = lines[i];
    i++;
    const body: string[] = [];
    while (i < lines.length && lines[i].trim() !== "") {
      body.push(lines[i]);
      i++;
    }
    articles.push({ heading, lines: body });
    while (i < lines.length && lines[i].trim() === "") i++;
  }

  const closing = lines.slice(i).filter((l) => l.trim() !== "");

  return { title, intro, parties, articles, closing };
}

export function isFieldLine(line: string): boolean {
  return FIELD_RE.test(line);
}

export function splitField(line: string): ContractRow {
  const trimmed = line.trim();
  const idx = trimmed.indexOf(":");
  return { label: trimmed.slice(0, idx).trim(), value: trimmed.slice(idx + 1).trim() };
}
