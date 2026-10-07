export type WaLocale = "ar" | "en";

export type WaContext = "general" | "web" | "mobile" | "design" | "agency" | "enterprise";

const TEXT: Record<WaLocale, Record<WaContext, string>> = {
  ar: {
    general: "هلا، ودّي أحجز استشارة مجانية مع حلول تك.",
    web: "هلا، ودّي أستفسر عن بناء موقع إلكتروني لنشاطي.",
    mobile: "هلا، ودّي أستفسر عن بناء تطبيق جوال.",
    design: "هلا، ودّي أستفسر عن تصميم هوية أو واجهات.",
    agency: "هلا، أمثّل وكالة وودّي أعرف عن التعاون معكم.",
    enterprise: "هلا، ودّي أرتّب اجتماعاً تقنياً لمشروع مؤسسي.",
  },
  en: {
    general: "Hello, I would like to book a free consultation with HULOL TECH.",
    web: "Hello, I would like to discuss building a website for my business.",
    mobile: "Hello, I would like to discuss building a mobile app.",
    design: "Hello, I would like to discuss brand or UI/UX design.",
    agency: "Hello, I represent an agency and would like to discuss partnering.",
    enterprise: "Hello, I would like to arrange a technical meeting for an enterprise project.",
  },
};

export function contextFromPath(pathname: string): WaContext {
  const path = pathname.toLowerCase();
  if (path.includes("/services/web")) return "web";
  if (path.includes("/services/mobile")) return "mobile";
  if (path.includes("/services/design")) return "design";
  if (path.includes("/for/agencies") || path.includes("/agencies")) return "agency";
  if (path.includes("/for/enterprise") || path.includes("/enterprise")) return "enterprise";
  return "general";
}

export function buildWaLink(input: {
  phone: string;
  locale: WaLocale;
  context: WaContext;
}): string | null {
  const digits = input.phone.replace(/[^\d]/g, "");
  if (!/^[1-9]\d{7,14}$/.test(digits)) return null;
  const text = TEXT[input.locale][input.context];
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function whatsappMessages(): Record<WaLocale, Record<WaContext, string>> {
  return TEXT;
}
