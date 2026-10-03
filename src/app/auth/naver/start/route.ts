import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "crypto";

// 네이버 로그인은 Supabase가 기본 지원하지 않는 OAuth 제공자라, 인가 코드 요청부터 직접 구현합니다.
// 1) 여기서 CSRF 방지용 state를 만들어 쿠키에 심고 네이버 인가 화면으로 보냅니다.
// 2) 사용자가 동의하면 /auth/naver/callback으로 code와 state가 돌아옵니다.
export async function GET(request: NextRequest) {
  const clientId = process.env.NAVER_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/login?error=naver-not-configured", request.url));
  }

  const state = randomBytes(16).toString("hex");
  const redirectUri = new URL("/auth/naver/callback", request.url).toString();
  const next = new URL(request.url).searchParams.get("next") || "/mypage";

  const authorizeUrl = new URL("https://nid.naver.com/oauth2.0/authorize");
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl);
  const cookieOpts = { httpOnly: true, secure: true, sameSite: "lax" as const, maxAge: 600, path: "/" };
  response.cookies.set("naver_oauth_state", state, cookieOpts);
  response.cookies.set("naver_oauth_next", next, cookieOpts);
  return response;
}
