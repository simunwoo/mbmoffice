import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export default async function AdminDashboardLayout({ children }: LayoutProps<"/admin">) {
  if (!isSupabaseConfigured()) redirect("/admin/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  return (
    <div className="flex min-h-screen bg-surface print:bg-white">
      <div className="print:hidden">
        <AdminSidebar userEmail={user.email ?? ""} />
      </div>
      <main className="min-w-0 flex-1 overflow-x-hidden px-6 py-8 sm:px-10 print:p-0">{children}</main>
    </div>
  );
}
