import { describe, expect, it } from "vitest";
import { verifyCaptcha } from "@/lib/recaptcha";
import { buildCsp, securityHeaders } from "@/lib/security-headers";

const reply = (body: unknown): typeof fetch => (async () => new Response(JSON.stringify(body))) as unknown as typeof fetch;

describe("security headers", () => {
  it("blocks framing, plugins, and cross-site form posts", () => {
    const csp = buildCsp({ dev: false });
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("default-src 'self'");
    expect(csp).not.toContain("'unsafe-eval'");
  });
  it("only allows eval and websockets in development", () => {
    const dev = buildCsp({ dev: true });
    expect(dev).toContain("'unsafe-eval'");
    expect(dev).toContain("ws:");
  });
  it("sends HSTS only in production", () => {
    const names = (dev: boolean) => securityHeaders({ dev }).map((h) => h.key);
    expect(names(false)).toContain("Strict-Transport-Security");
    expect(names(true)).not.toContain("Strict-Transport-Security");
    expect(names(false)).toEqual(expect.arrayContaining(["X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy", "X-Frame-Options"]));
  });
  it("lets the analytics and reCAPTCHA hosts through and nothing broader", () => {
    const csp = buildCsp({ dev: false });
    expect(csp).toContain("https://www.googletagmanager.com");
    expect(csp).toContain("https://www.google.com/recaptcha/");
    expect(csp).not.toMatch(/(^|[ ;])\*($|[ ;])/);
  });
});

describe("verifyCaptcha", () => {
  const base = { secret: "s", action: "lead" };
  it("is skipped when no secret is configured", async () => {
    expect(await verifyCaptcha({ ...base, secret: "", token: undefined })).toEqual({ ok: true });
  });
  it("requires a token once a secret is configured", async () => {
    expect(await verifyCaptcha({ ...base, token: undefined })).toEqual({ ok: false, reason: "missing_token" });
  });
  it("accepts a good score for the right action", async () => {
    expect(await verifyCaptcha({ ...base, token: "t", fetchImpl: reply({ success: true, score: 0.9, action: "lead" }) })).toEqual({ ok: true });
  });
  it("rejects low scores, wrong actions, and failures", async () => {
    expect(await verifyCaptcha({ ...base, token: "t", fetchImpl: reply({ success: true, score: 0.2, action: "lead" }) })).toMatchObject({ ok: false, reason: "rejected" });
    expect(await verifyCaptcha({ ...base, token: "t", fetchImpl: reply({ success: true, score: 0.9, action: "contact" }) })).toMatchObject({ ok: false, reason: "rejected" });
    expect(await verifyCaptcha({ ...base, token: "t", fetchImpl: reply({ success: false }) })).toMatchObject({ ok: false, reason: "rejected" });
    const broken = (async () => {
      throw new Error("network");
    }) as unknown as typeof fetch;
    expect(await verifyCaptcha({ ...base, token: "t", fetchImpl: broken })).toMatchObject({ ok: false, reason: "unreachable" });
  });
});
