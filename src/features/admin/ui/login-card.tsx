"use client";

import { Info, LockKeyhole } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Design only: nothing is submitted anywhere until Firebase Auth is connected. */
export function LoginCard() {
  const t = useTranslations("admin.login");
  const brand = useTranslations("brand");
  const [notice, setNotice] = useState(false);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setNotice(true);
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
        <form onSubmit={onSubmit} noValidate className="mt-6 grid gap-5">
          <Input label={t("email")} type="email" autoComplete="username" ltr />
          <Input label={t("password")} type="password" autoComplete="current-password" ltr />
          <Button type="submit" className="w-full">
            {t("submit")}
          </Button>
        </form>
        {notice ? (
          <p role="status" className="mt-4 flex items-start gap-2 rounded-xl bg-warning/10 p-4 text-[15px] text-warning">
            <Info className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            {t("pending")}
          </p>
        ) : null}
        <Link href="/ar" className="mt-6 inline-flex min-h-11 items-center text-[15px] font-semibold text-text-muted hover:text-text">
          {t("back")}
        </Link>
      </main>
    </div>
  );
}
