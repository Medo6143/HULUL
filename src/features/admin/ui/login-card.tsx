"use client";

import { Info, LockKeyhole } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Problem = "invalid" | "forbidden" | "notConfigured" | "tooMany" | null;

/** Staff sign-in. The server checks the credentials and the staff role, then sets an httpOnly session cookie. */
export function LoginCard() {
  const router = useRouter();
  const t = useTranslations("admin.login");
  const brand = useTranslations("brand");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<Problem>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setProblem(null);
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (response.ok) {
        router.replace("/admin/leads");
        router.refresh();
        return;
      }
      if (response.status === 403) setProblem("forbidden");
      else if (response.status === 429) setProblem("tooMany");
      else if (response.status === 503) setProblem("notConfigured");
      else setProblem("invalid");
    } catch {
      setProblem("invalid");
    } finally {
      setBusy(false);
      setPassword("");
    }
  }

  return (
    <div className="relative isolate grid min-h-screen place-items-center overflow-hidden bg-ink-950 p-4">
      <div aria-hidden="true" className="bg-aurora absolute inset-0 -z-10" />
      <div
        aria-hidden="true"
        className="absolute -top-24 end-0 -z-10 size-[420px] rounded-full bg-brand/20 blur-[120px]"
      />
      <main id="main" className="w-full max-w-md rounded-panel bg-surface p-8 shadow-[0_30px_80px_rgb(0_0_0/0.5)] md:p-10">
        <div className="mb-6 flex items-center gap-3">
          <Image src="/icons/nav-logo.png" alt="" width={40} height={40} className="size-10 object-contain" />
          <b className="text-[20px]">{brand("name")}</b>
        </div>
        <h1 className="flex items-center gap-2 text-[26px] font-bold leading-[1.3]">
          <LockKeyhole className="size-6 text-brand-strong" aria-hidden="true" />
          {t("title")}
        </h1>
        <p className="mt-1 text-text-muted">{t("intro")}</p>
        <form onSubmit={onSubmit} className="mt-6 grid gap-5">
          <Input
            label={t("email")}
            type="email"
            autoComplete="username"
            ltr
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label={t("password")}
            type="password"
            autoComplete="current-password"
            ltr
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" className="w-full" loading={busy}>
            {busy ? t("signingIn") : t("submit")}
          </Button>
        </form>
        {problem ? (
          <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-danger/10 p-4 text-[15px] text-danger">
            <Info className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            {t(problem)}
          </p>
        ) : null}
        <Link href="/ar" className="mt-6 inline-flex min-h-11 items-center text-[15px] font-semibold text-text-muted hover:text-text">
          {t("back")}
        </Link>
      </main>
    </div>
  );
}
