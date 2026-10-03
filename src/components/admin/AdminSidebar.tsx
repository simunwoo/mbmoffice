"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/admin-auth";

const NAV = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/leads", label: "리드 (견적문의)" },
  { href: "/admin/rental-applications", label: "렌탈신청" },
  { href: "/admin/rental-contracts", label: "렌탈계약관리" },
  { href: "/admin/purchase-orders", label: "구매주문" },
  { href: "/admin/as-requests", label: "A/S·토너 요청" },
  { href: "/admin/members", label: "회원관리" },
  { href: "/admin/products", label: "상품 관리" },
  { href: "/admin/blog", label: "블로그" },
  { href: "/admin/cases", label: "설치사례" },
];

export function AdminSidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-background">
      <div className="border-b border-border p-5">
        <div className="flex items-center gap-2">
          <Image src="/mbm-logo.png" alt="MBM" width={100} height={30} className="h-7 w-auto" />
          <span className="text-sm font-extrabold text-foreground-soft">관리자</span>
        </div>
        <p className="mt-2 truncate text-xs text-foreground-soft">{userEmail}</p>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                active ? "bg-brand-soft text-brand-ink" : "text-foreground-soft hover:bg-surface"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-border p-3">
        <Link href="/" target="_blank" className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground-soft hover:bg-surface">
          사이트 바로가기 ↗
        </Link>
        <form action={logout}>
          <button type="submit" className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-foreground-soft hover:bg-surface">
            로그아웃
          </button>
        </form>
      </div>
    </aside>
  );
}
