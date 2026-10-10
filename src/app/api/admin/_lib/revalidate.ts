import { revalidateTag } from "next/cache";

/** Marks public content stale right away so a publish/unpublish shows on the site without waiting for the cache. */
export const refreshPublicContent = (tag: "testimonials" | "case-studies") => revalidateTag(tag, { expire: 0 });
