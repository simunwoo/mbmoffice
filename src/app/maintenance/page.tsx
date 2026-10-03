import { buildMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbSchema } from "@/lib/schema";
import { serviceLines } from "@/lib/site-config";
import { getProductsByCategory } from "@/lib/data";
import { MaintenanceCatalog } from "@/components/MaintenanceCatalog";

const info = serviceLines.find((s) => s.slug === "maintenance")!;

export const metadata = buildMetadata({
  title: info.label,
  description: info.description,
  path: "/maintenance",
});

export default async function MaintenancePage() {
  const products = await getProductsByCategory("maintenance");

  return (
    <div>
      <JsonLd data={breadcrumbSchema([{ name: "홈", path: "/" }, { name: info.label, path: "/maintenance" }])} />
      <MaintenanceCatalog products={products} />
    </div>
  );
}
