import { siteConfig, serviceLines } from "./site-config";
import { absoluteUrl } from "./seo";
import { joinBrandName, type Product } from "./data/types";

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: siteConfig.name,
    url: siteConfig.url,
    telephone: siteConfig.phone,
    email: siteConfig.email,
    description: siteConfig.shortDescription,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.address.street,
      addressLocality: siteConfig.address.locality,
      addressRegion: siteConfig.address.region,
      postalCode: siteConfig.address.postalCode,
      addressCountry: siteConfig.address.country,
    },
    areaServed: siteConfig.areaServed.map((name) => ({ "@type": "City", name })),
    makesOffer: serviceLines.map((s) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: s.label },
    })),
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function productSchema(product: Product, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: joinBrandName(product.brand, product.name),
    brand: { "@type": "Brand", name: product.brand },
    url: absoluteUrl(path),
    image: product.images,
    offers: product.priceMonthly
      ? {
          "@type": "Offer",
          priceCurrency: "KRW",
          price: product.priceMonthly,
          availability: "https://schema.org/InStock",
          url: absoluteUrl(path),
        }
      : undefined,
  };
}

export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((qa) => ({
      "@type": "Question",
      name: qa.question,
      acceptedAnswer: { "@type": "Answer", text: qa.answer },
    })),
  };
}
