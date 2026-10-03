import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

// 네이버 인가 코드를 받아 액세스 토큰으로 교환하고, 프로필(이메일)을 가져와 Supabase 계정을
// 찾거나 만든 뒤 매직링크 토큰을 즉시 소진해 로그인 세션을 만듭니다 (Supabase가 네이버를 기본
// 지원하지 않아 비밀번호 없이 서버에서 로그인시키는 표준 우회 방법입니다).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const cookieState = request.cookies.get("naver_oauth_state")?.value;
  const next = request.cookies.get("naver_oauth_next")?.value || "/mypage";

  function fail(reason: string) {
    const res = NextResponse.redirect(`${origin}/login?error=${reason}`);
    res.cookies.delete("naver_oauth_state");
    res.cookies.delete("naver_oauth_next");
    return res;
  }

  if (!isSupabaseConfigured() || !process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
    return fail("naver-not-configured");
  }
  if (!code || !state || !cookieState || state !== cookieState) {
    return fail("naver-state");
  }

  const redirectUri = new URL("/auth/naver/callback", request.url).toString();
  const tokenParams = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: process.env.NAVER_CLIENT_ID,
    client_secret: process.env.NAVER_CLIENT_SECRET,
    code,
    state,
    redirect_uri: redirectUri,
  });

  const tokenRes = await fetch(`https://nid.naver.com/oauth2.0/token?${tokenParams.toString()}`);
  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok || !tokenJson.access_token) {
    return fail("naver-token");
  }

  const profileRes = await fetch("https://openapi.naver.com/v1/nid/me", {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  const profileJson = await profileRes.json();
  const naverProfile = profileJson?.response as { email?: string; name?: string; mobile?: string } | undefined;
  const email = naverProfile?.email;

  if (!email) {
    return fail("naver-email-required");
  }

  const admin = createAdminClient();

  // 신규 가입이면 여기서 계정이 만들어지고, 이미 가입된 이메일이면 에러가 나지만 무시합니다 —
  // 어느 쪽이든 바로 아래 generateLink가 해당 계정을 찾아 로그인 토큰을 내줍니다.
  await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { name: naverProfile?.name, phone: naverProfile?.mobile, provider: "naver" },
  });

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (linkError || !linkData?.properties?.hashed_token) {
    return fail("naver-session");
  }

  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: "magiclink",
  });
  if (verifyError) {
    return fail("naver-verify");
  }

  const res = NextResponse.redirect(`${origin}${next}`);
  res.cookies.delete("naver_oauth_state");
  res.cookies.delete("naver_oauth_next");
  return res;
}
