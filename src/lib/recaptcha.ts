// reCAPTCHA v3 for the public forms. The browser asks Google for a score-based token, the server checks it.
// It is optional: with no secret configured the check is skipped, so local development needs no keys.

export type CaptchaResult =
  | { ok: true }
  /** `detail` explains a rejection (Google error codes, score, action). It holds no secret or token. */
  | { ok: false; reason: "missing_token" | "rejected" | "unreachable"; detail: string };

type Fetch = typeof fetch;

/** Server side. `minScore` 0.5 is Google's default cut-off between people and bots. */
export async function verifyCaptcha(opts: {
  secret: string;
  token: string | undefined;
  action: string;
  minScore?: number;
  fetchImpl?: Fetch;
}): Promise<CaptchaResult> {
  if (!opts.secret) return { ok: true };
  if (!opts.token) return { ok: false, reason: "missing_token", detail: "no_token" };

  try {
    const response = await (opts.fetchImpl ?? fetch)("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: opts.secret, response: opts.token }),
      signal: AbortSignal.timeout(5_000),
    });
    const data = (await response.json()) as {
      success?: boolean;
      score?: number;
      action?: string;
      hostname?: string;
      "error-codes"?: string[];
    };
    const passed = data.success === true && (data.score ?? 0) >= (opts.minScore ?? 0.5) && data.action === opts.action;
    if (passed) return { ok: true };
    const detail =
      data.success !== true
        ? `google:${(data["error-codes"] ?? ["unknown"]).join(",")}${data.hostname ? ` host=${data.hostname}` : ""}`
        : data.action !== opts.action
          ? `action_mismatch:${data.action ?? "none"}`
          : `low_score:${data.score ?? 0}`;
    return { ok: false, reason: "rejected", detail };
  } catch {
    return { ok: false, reason: "unreachable", detail: "siteverify_unreachable" };
  }
}
