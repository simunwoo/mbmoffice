import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

/** 새 구매주문이 있으면 브라우저 탭 제목에도 "(N)"을 붙여, 사이드바를 안 보고 있어도 눈에 띄게 합니다. */
export async function generateMetadata() {
  if (!isSupabaseConfigured()) return {};
  const supabase = await createClient();
  const { count } = await supabase
    .from("purchase_orders")
    .select("*", { count: "exact", head: true })
    .eq("status", "paid")
    .eq("fulfillment_status", "preparing");
  return count ? { title: `(${count}) 관리자` } : {};
}

export default async function AdminDashboardLayout({ children }: LayoutProps<"/admin">) {
  if (!isSupabaseConfigured()) redirect("/admin/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  // 상품준비중으로 아직 손대지 않은(= 들어온 직후 그대로인) 결제완료 주문 수를 "새 구매주문" 알림 배지로 씁니다.
  const { count: newOrderCount } = await supabase
    .from("purchase_orders")
    .select("*", { count: "exact", head: true })
    .eq("status", "paid")
    .eq("fulfillment_status", "preparing");

  return (
    <div className="flex min-h-screen bg-surface print:bg-white">
      <div className="print:hidden">
        <AdminSidebar userEmail={user.email ?? ""} newOrderCount={newOrderCount ?? 0} />
      </div>
      <main className="min-w-0 flex-1 overflow-x-hidden px-6 py-8 sm:px-10 print:p-0">{children}</main>
    </div>
  );
}
