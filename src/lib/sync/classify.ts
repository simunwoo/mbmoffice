// 자동 수집한 글이 "설치사례"면 install_cases로, 아니면 blog_posts로 보냅니다.
// 설치사례로 분류될 때 제목에서 지역·업종·제조사·모델을 최대한 뽑아 채워 둡니다(관리자가 나중에
// 손보기 쉽도록 — 못 찾으면 그냥 비워둡니다).
import { regionCopy, industryCopy } from "@/lib/site-config";
import { matchSlug } from "@/lib/data/normalize";

const INSTALL_CASE_CATEGORY_RE = /설치\s*사례/;

export function isInstallCaseCategory(category: string | null): boolean {
  return !!category && INSTALL_CASE_CATEGORY_RE.test(category);
}

export function regionFromTitle(title: string): { region: string | null; regionSlug: string | null } {
  const slug = matchSlug(title, regionCopy);
  return slug ? { region: regionCopy[slug].label, regionSlug: slug } : { region: null, regionSlug: null };
}

export function industryFromTitle(title: string): { industry: string | null; industrySlug: string | null } {
  const slug = matchSlug(title, industryCopy);
  return slug ? { industry: industryCopy[slug].label, industrySlug: slug } : { industry: null, industrySlug: null };
}

const BRAND_KEYWORDS: [string, string][] = [
  ["후지필름", "후지필름"],
  ["후지제록스", "후지필름"],
  ["캐논", "캐논"],
  ["교세라", "교세라"],
  ["신도리코", "신도리코"],
];

export function brandFromTitle(title: string): string | null {
  for (const [kw, label] of BRAND_KEYWORDS) {
    if (title.includes(kw)) return label;
  }
  return null;
}

export function modelFromTitle(title: string): string | null {
  const m = title.match(/[A-Za-z]{1,6}[-\s]?(?:ADV\s?DX\s?)?[A-Za-z]*\d{3,5}/);
  return m ? m[0].trim() : null;
}
