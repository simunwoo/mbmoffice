"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/**
 * 로그인 상태 표시는 클라이언트에서만 조회합니다. 서버 컴포넌트에서 cookies()로 세션을 읽으면
 * Header가 모든 페이지에 들어가는 특성상 사이트 전체가 정적 렌더링에서 동적 렌더링으로 바뀌어
 * 버리므로(SEO/속도에 불리), 로그인 배지 하나 때문에 그 대가를 치르지 않도록 분리했습니다.
 */
export function AuthStatus({ variant }: { variant: "desktop" | "mobile" }) {
  const [loggedIn, setLoggedIn] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      setLoggedIn(!!user);
    }

    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (loggedIn === undefined) return null; // 로그인 여부 확인 전에는 깜빡임 방지를 위해 아무것도 표시하지 않습니다.

  if (variant === "mobile") {
    return (
      <Link href={loggedIn ? "/mypage" : "/login"} className="text-foreground-soft hover:text-brand-ink">
        {loggedIn ? "마이페이지" : "로그인"}
      </Link>
    );
  }

  return (
    <Link
      href={loggedIn ? "/mypage" : "/login"}
      className="hidden whitespace-nowrap text-sm text-foreground-soft hover:text-brand-ink xl:inline-block"
    >
      {loggedIn ? "마이페이지" : "로그인"}
    </Link>
  );
}
