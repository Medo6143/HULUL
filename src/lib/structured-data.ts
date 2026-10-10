import { baseUrl, localizedUrl, type SeoLocale } from "./seo";

// Structured data uses only confirmed facts: the name, the city, and the three services.
// No phone, email, address line, rating, or review is included until real ones exist.

export function organizationSchema(input: { base: string; name: string }) {
  const url = baseUrl(input.base);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: input.name,
    url,
    logo: `${url}/icons/icon-192.png`,
    address: { "@type": "PostalAddress", addressLocality: "Riyadh", addressCountry: "SA" },
  };
}

export function websiteSchema(input: { base: string; name: string; locale: SeoLocale }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: input.name,
    url: localizedUrl(input.base, input.locale, "/"),
    inLanguage: input.locale,
  };
}

export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function serviceSchema(input: {
  base: string;
  locale: SeoLocale;
  path: string;
  name: string;
  description: string;
  providerName: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    url: localizedUrl(input.base, input.locale, input.path),
    provider: { "@type": "Organization", name: input.providerName, url: baseUrl(input.base) },
    areaServed: { "@type": "Country", name: "Saudi Arabia" },
  };
}
