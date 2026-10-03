import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import localFont from "next/font/local";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { SiteChrome } from "@/components/SiteChrome";
import { JsonLd, localBusinessSchema } from "@/lib/schema";
import { siteConfig } from "@/lib/site-config";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

const notoSans = Noto_Sans_KR({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

// 제목/헤드라인 전용 서체. 그래피스타(graphistar.kr) 참고 요청에 맞춰 모던 지오메트릭 무드의
// Pretendard를 로컬로 로드합니다 (실제 사용된 폰트를 특정할 수는 없어 가장 근접한 대안입니다).
const pretendard = localFont({
  variable: "--font-pretendard",
  display: "swap",
  src: [
    { path: "../../node_modules/pretendard/dist/web/static/woff2/Pretendard-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../node_modules/pretendard/dist/web/static/woff2/Pretendard-Bold.woff2", weight: "700", style: "normal" },
    { path: "../../node_modules/pretendard/dist/web/static/woff2/Pretendard-ExtraBold.woff2", weight: "800", style: "normal" },
    { path: "../../node_modules/pretendard/dist/web/static/woff2/Pretendard-Black.woff2", weight: "900", style: "normal" },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | ${siteConfig.shortDescription}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.shortDescription,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${notoSans.variable} ${pretendard.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans antialiased">
        <JsonLd data={localBusinessSchema()} />
        <SiteChrome>{children}</SiteChrome>
        {GA_MEASUREMENT_ID && <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />}
      </body>
    </html>
  );
}
