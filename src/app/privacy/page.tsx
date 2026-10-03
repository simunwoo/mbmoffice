import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";

export const metadata = buildMetadata({
  title: "개인정보처리방침",
  description: `${siteConfig.name} 개인정보처리방침`,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="text-3xl font-bold">개인정보처리방침</h1>
      <p className="mt-2 text-xs text-foreground-soft">
        아래 내용은 견적문의 폼 이용 안내를 위한 기본 문구입니다. 정식 개인정보처리방침으로 교체·법률 검토가
        필요합니다.
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground-soft">
        <p>
          {siteConfig.name}(이하 &apos;회사&apos;)은 「개인정보 보호법」 제30조에 따라 정보 주체의 개인정보를 보호하고
          이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같은 처리방침을 두고 있습니다.
        </p>
        <div>
          <p className="font-semibold text-foreground">1. 수집 항목</p>
          <p>이름, 연락처, 회사명(선택), 관심 상품, 문의 내용</p>
        </div>
        <div>
          <p className="font-semibold text-foreground">2. 수집 목적</p>
          <p>견적 상담 및 문의 응대</p>
        </div>
        <div>
          <p className="font-semibold text-foreground">3. 보유 및 이용 기간</p>
          <p>상담 처리 완료 후 1년간 보관 후 파기</p>
        </div>
        <div>
          <p className="font-semibold text-foreground">4. 동의 거부 권리</p>
          <p>정보 주체는 개인정보 수집·이용에 대한 동의를 거부할 권리가 있으며, 동의하지 않을 경우 온라인 견적문의 접수가 제한될 수 있습니다.</p>
        </div>
        <div>
          <p className="font-semibold text-foreground">문의</p>
          <p>
            {siteConfig.contactEmail} / {siteConfig.phone}
          </p>
        </div>
      </div>
    </div>
  );
}
