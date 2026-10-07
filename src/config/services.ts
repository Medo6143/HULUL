export const services = [
  { slug: "web" },
  { slug: "mobile" },
  { slug: "design" },
] as const;

export type ServiceSlug = (typeof services)[number]["slug"];

export function isServiceSlug(value: string): value is ServiceSlug {
  return services.some((service) => service.slug === value);
}
