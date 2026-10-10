"use client";

type Grecaptcha = {
  ready(callback: () => void): void;
  execute(siteKey: string, options: { action: string }): Promise<string>;
};

let loading: Promise<void> | null = null;

function load(siteKey: string): Promise<void> {
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("recaptcha_load_failed"));
    document.head.appendChild(script);
  });
  return loading;
}

/**
 * Returns a token for the given action, or undefined when no site key is configured or Google cannot be reached.
 * The form still sends; the server decides whether a missing token is acceptable.
 */
export async function getCaptchaToken(action: string): Promise<string | undefined> {
  // Must be read by this exact name: Next.js inlines it into the browser bundle at build time.
  // The validated `publicEnv` object cannot be used here because `process.env` is empty in the browser.
  const siteKey = process.env.NEXT_PUBLIC_APPCHECK_RECAPTCHA_SITE_KEY ?? "";
  if (!siteKey || !/^[\w-]{20,60}$/.test(siteKey)) return undefined;
  try {
    await load(siteKey);
    const grecaptcha = (window as unknown as { grecaptcha?: Grecaptcha }).grecaptcha;
    if (!grecaptcha) return undefined;
    await new Promise<void>((resolve) => grecaptcha.ready(resolve));
    return await grecaptcha.execute(siteKey, { action });
  } catch {
    return undefined;
  }
}
