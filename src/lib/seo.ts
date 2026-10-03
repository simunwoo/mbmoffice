import type { Metadata } from "next";
import { siteConfig } from "./site-config";

export function absoluteUrl(pathname: string): string {
  return new URL(pathname, siteConfig.url).toString();
}

export function buildMetadata(opts: {
  title: string;
  description: string;
  path: string;
  images?: string[];
}): Metadata {
  const url = absoluteUrl(opts.path);
  // images를 명시적으로 지정하지 않은 페이지는 키 자체를 비워 둬야, Next.js가 app/opengraph-image.png
  // 파일 규칙(사이트 공통 기본 공유 이미지)을 그대로 적용합니다 — undefined를 넣으면 오히려
  // "이미지 없음"으로 덮어써져서 기본 이미지가 안 뜹니다.
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: siteConfig.name,
      type: "website",
      locale: "ko_KR",
      ...(opts.images ? { images: opts.images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      ...(opts.images ? { images: opts.images } : {}),
    },
  };
}
