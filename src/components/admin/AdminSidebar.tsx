"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/admin-auth";

const NAV_GROUPS: { label: string | null; items: { href: string; label: string }[] }[] = [
  { label: null, items: [{ href: "/admin", label: "대시보드" }] },
  {
    label: "영업",
    items: [
      { href: "/admin/leads", label: "리드 (견적문의)" },
      { href: "/admin/chats", label: "AI 상담 내역" },
    ],
  },
  {
    label: "렌탈",
    items: [
      { href: "/admin/rental-applications", label: "렌탈신청" },
      { href: "/admin/rental-contracts", label: "렌탈계약관리" },
    ],
  },
  {
    label: "구매·정산",
    items: [
      { href: "/admin/purchase-orders", label: "구매주문" },
      { href: "/admin/settlements", label: "정산내역" },
    ],
  },
  {
    label: "고객",
    items: [
      { href: "/admin/as-requests", label: "A/S·토너 요청" },
      { href: "/admin/members", label: "회원관리" },
    ],
  },
  {
    label: "콘텐츠",
    items: [
      { href: "/admin/products", label: "상품 관리" },
      { href: "/admin/blog", label: "블로그" },
      { href: "/admin/cases", label: "설치사례" },
    ],
  },
];

export function AdminSidebar({ userEmail, newOrderCount = 0 }: { userEmail: string; newOrderCount?: number }) {
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

      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {NAV_GROUPS.map((group, i) => (
          <div key={group.label ?? `group-${i}`} className="space-y-1">
            {group.label && (
              <p className="px-3 pt-1 text-[11px] font-bold tracking-wider text-foreground-soft/60">{group.label}</p>
            )}
            {group.items.map((item) => {
              const active = item.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(item.href);
              const badge = item.href === "/admin/purchase-orders" ? newOrderCount : 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                    active ? "bg-brand-soft text-brand-ink" : "text-foreground-soft hover:bg-surface"
                  }`}
                >
                  <span>{item.label}</span>
                  {badge > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
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
