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
  // app/opengraph-image.png 파일 규칙은 루트("/") 세그먼트에만 자동 적용되고, 페이지가 자체
  // openGraph 객체를 반환하는 다른 라우트에는 상속되지 않습니다(실제로 확인됨 — 홈 이외 모든
  // 페이지에서 og:image가 통째로 빠져 있었습니다). 그래서 images를 지정 안 한 페이지는 항상
  // 기본 공유 이미지를 명시적으로 채워 넣습니다.
  const images = opts.images ?? [absoluteUrl("/opengraph-image.png")];
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
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images,
    },
  };
}
