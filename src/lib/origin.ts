import { headers } from "next/headers";
import { siteConfig } from "@/lib/site-config";

/** 요청 헤더로 현재 오리진을 구합니다 (로컬 개발/프리뷰/프로덕션에서 콜백 URL이 항상 맞도록). */
export async function getOrigin() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("host");
  return host ? `${proto}://${host}` : siteConfig.url;
}
