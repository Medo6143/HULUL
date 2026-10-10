import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env.public";
import { baseUrl, isPlaceholderSite } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  // Until a real domain is configured, tell crawlers to stay away from everything.
  if (isPlaceholderSite(publicEnv.NEXT_PUBLIC_SITE_URL)) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    sitemap: `${baseUrl(publicEnv.NEXT_PUBLIC_SITE_URL)}/sitemap.xml`,
  };
}
