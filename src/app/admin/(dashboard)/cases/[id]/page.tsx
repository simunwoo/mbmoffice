import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { installFromRow } from "@/lib/supabase/mappers";
import { CaseForm } from "@/components/admin/CaseForm";
import { updateInstallCase } from "@/lib/actions/admin/cases";

type Params = { id: string };

export default async function EditCasePage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: row } = await supabase.from("install_cases").select("*").eq("id", id).single();
  if (!row) notFound();

  const item = installFromRow(row);
  const action = updateInstallCase.bind(null, id);

  return (
    <div>
      <h1 className="text-2xl font-bold">설치사례 수정</h1>
      <p className="mt-1 text-sm text-foreground-soft">{item.title}</p>
      <CaseForm action={action} item={item} initialStatus={row.status} submitLabel="변경사항 저장" />
    </div>
  );
}
