import type { MetadataRoute } from "next";
import { siteConfig, serviceLines, regionCopy, industryCopy, brandLabels, shopCategories } from "@/lib/site-config";
import { getProducts, getInstalls, getBlogPosts, getPurchaseProductsByCategories } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/estimate`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/cases`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/recommend`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    ...serviceLines.map((s) => ({
      url: `${base}/${s.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...Object.keys(brandLabels).map((slug) => ({
      url: `${base}/brand/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...Object.keys(regionCopy).map((slug) => ({
      url: `${base}/region/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...Object.keys(industryCopy).map((slug) => ({
      url: `${base}/industry/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];

  const [allProducts, installs, blogPosts, shopCategoryProducts] = await Promise.all([
    getProducts(),
    getInstalls(),
    getBlogPosts(),
    Promise.all(shopCategories.map((c) => getPurchaseProductsByCategories(c.categories))),
  ]);

  const rentalProducts = allProducts
    .filter((p) => (p.category === "mfp" || p.category === "printer") && p.size && p.color && p.pricingType === "rental")
    .map((p) => ({
      url: `${base}/rental/${p.size}/${p.color}/${p.id}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  const shopRoutes: MetadataRoute.Sitemap = shopCategories.flatMap((c, i) => [
    { url: `${base}/shop/${c.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.6 },
    ...shopCategoryProducts[i].map((p) => ({
      url: `${base}/shop/${c.slug}/${p.id}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ]);

  const cases = installs.map((c) => ({
    url: `${base}/cases/${c.id}`,
    lastModified: c.date ? new Date(c.date) : now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  const posts = blogPosts.map((p) => ({
    url: `${base}/blog/${p.id}`,
    lastModified: p.date ? new Date(p.date) : now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...rentalProducts, ...shopRoutes, ...cases, ...posts];
}
