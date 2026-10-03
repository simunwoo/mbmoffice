/** 리치 에디터가 없던 시절 저장된 평문 본문을 에디터 초기값으로 쓰기 위해 문단 단위 HTML로 변환합니다. */
export function plainTextToHtml(text: string): string {
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return text
    .split("\n")
    .map((line) => `<p>${escape(line) || "<br>"}</p>`)
    .join("");
}

/** 원본에 섞여 있던 맨 앞/뒤의 완전히 빈 문단(<p></p>, <p><br></p>)을 제거합니다 — 이런 빈 문단은
 * 높이가 거의 없어 클릭으로 커서를 놓기 어렵고, 보여줄 때도 의미 없는 여백만 남기므로 정리합니다. */
export function trimEmptyEdgeParagraphs(html: string): string {
  const emptyParagraph = /^\s*<p>\s*(?:<br\s*\/?>)?\s*<\/p>\s*/i;
  const emptyParagraphEnd = /\s*<p>\s*(?:<br\s*\/?>)?\s*<\/p>\s*$/i;
  let result = html;
  while (emptyParagraph.test(result)) result = result.replace(emptyParagraph, "");
  while (emptyParagraphEnd.test(result)) result = result.replace(emptyParagraphEnd, "");
  return result;
}
