import { CaseForm } from "@/components/admin/CaseForm";
import { createInstallCase } from "@/lib/actions/admin/cases";

export default function NewCasePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">새 설치사례 작성</h1>
      <CaseForm action={createInstallCase} submitLabel="게시하기" />
    </div>
  );
}
