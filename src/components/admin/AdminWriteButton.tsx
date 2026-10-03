"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/** 관리자로 로그인한 상태에서만 공개 사이트에 "글쓰기" 바로가기를 보여줍니다. */
export function AdminWriteButton({ href, label = "글쓰기" }: { href: string; label?: string }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    async function check() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (active && profile?.role === "admin") setIsAdmin(true);
    }
    check();
    return () => {
      active = false;
    };
  }, []);

  if (!isAdmin) return null;

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#12241c] px-4 py-2 text-sm font-bold text-white hover:opacity-90"
    >
      ✏️ {label}
    </Link>
  );
}
