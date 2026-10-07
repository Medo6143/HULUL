"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { buttonClassName } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { LangSwitch } from "./lang-switch";

const links = [
  { href: "/services", key: "services" },
  { href: "/work", key: "work" },
  { href: "/process", key: "process" },
  { href: "/about", key: "about" },
] as const;

export function Navbar() {
  const t = useTranslations("nav");
  const brand = useTranslations("brand");
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-surface/10 bg-ink-950/75 text-surface backdrop-blur-xl">
      <div className="ms-auto me-auto flex h-16 max-w-page items-center justify-between gap-4 ps-4 pe-4 md:ps-6 md:pe-6">
        <Link href="/" className="inline-flex items-center gap-4" aria-label={brand("name")}>
          <Image
            src="/icons/nav-logo.png"
            alt={brand("logoAlt")}
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
          <span className="text-[18px] font-bold">{brand("name")}</span>
        </Link>

        <nav
          aria-label={t("services")}
          className="hidden items-center gap-1 rounded-full border border-surface/10 bg-surface/5 p-1 md:flex"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full ps-4 pe-4 py-2 text-[15px] text-surface/80 motion-safe:transition-colors hover:bg-surface/10 hover:text-surface"
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LangSwitch />
          <Link href="/start" className={buttonClassName("primary", "min-h-11 text-[15px]")}>
            {t("consultation")}
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex size-12 items-center justify-center rounded-control border border-surface/30 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? t("closeMenu") : t("openMenu")}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>

      {open ? (
        <div id="mobile-nav" className="fixed inset-0 z-50 flex flex-col bg-ink-900 ps-4 pe-4 pt-4 md:hidden">
          <div className="flex items-center justify-between">
            <span className="text-[18px] font-bold">{brand("name")}</span>
            <button
              type="button"
              className="inline-flex size-12 items-center justify-center rounded-control border border-surface/30"
              aria-label={t("closeMenu")}
              onClick={() => setOpen(false)}
            >
              <X aria-hidden="true" />
            </button>
          </div>
          <nav className="mt-8 grid gap-2" aria-label={t("services")}>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex min-h-12 items-center text-[18px] font-semibold"
                onClick={() => setOpen(false)}
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>
          <div className="mt-6 flex flex-wrap gap-3">
            <LangSwitch />
            <Link
              href="/start"
              className={buttonClassName("primary")}
              onClick={() => setOpen(false)}
            >
              {t("consultation")}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
