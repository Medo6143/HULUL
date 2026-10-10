// Pure builders for the security headers. next.config.ts applies them to every route.

const ANALYTICS_SCRIPT = [
  "https://www.googletagmanager.com",
  "https://www.clarity.ms",
  "https://scripts.clarity.ms",
  "https://connect.facebook.net",
  "https://sc-static.net",
  "https://analytics.tiktok.com",
];
const ANALYTICS_CONNECT = [
  "https://www.google-analytics.com",
  "https://region1.google-analytics.com",
  "https://www.googletagmanager.com",
  "https://www.clarity.ms",
  "https://*.clarity.ms",
  "https://www.facebook.com",
  "https://tr.snapchat.com",
  "https://analytics.tiktok.com",
];
const RECAPTCHA = ["https://www.google.com/recaptcha/", "https://www.gstatic.com/recaptcha/"];

/**
 * Content Security Policy. Next.js injects small inline scripts, so `script-src` keeps 'unsafe-inline';
 * the policy still blocks every other origin, framing, plugins, and form posts to other sites.
 */
export function buildCsp(opts: { dev: boolean }): string {
  const scriptSrc = ["'self'", "'unsafe-inline'", ...(opts.dev ? ["'unsafe-eval'"] : []), ...ANALYTICS_SCRIPT, ...RECAPTCHA];
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": scriptSrc,
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", "https://www.google-analytics.com", "https://www.facebook.com", "https://tr.snapchat.com", "https://analytics.tiktok.com", "https://www.googletagmanager.com", "https://res.cloudinary.com"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", "https://api.cloudinary.com", ...ANALYTICS_CONNECT, ...(opts.dev ? ["ws:", "wss:"] : [])],
    "frame-src": ["https://www.google.com/recaptcha/", "https://recaptcha.google.com/recaptcha/"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(" ")}`)
    .join("; ");
}

export function securityHeaders(opts: { dev: boolean }): { key: string; value: string }[] {
  const headers = [
    { key: "Content-Security-Policy", value: buildCsp(opts) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  ];
  // HSTS only in production: it would pin localhost to HTTPS during development.
  if (!opts.dev) headers.push({ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" });
  return headers;
}
