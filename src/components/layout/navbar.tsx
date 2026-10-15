"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { buttonClassName } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
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
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  // While the menu is open: Escape closes it, the page behind does not scroll, and focus moves into it.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const opener = toggle.current;
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header data-track-location="navbar" className="sticky top-0 z-30 border-b border-surface/10 bg-ink-950/75 text-surface backdrop-blur-xl">
        <div className="ms-auto me-auto flex h-16 max-w-page items-center justify-between gap-4 ps-4 pe-4 md:ps-6 md:pe-6">
          <Link href="/" className="inline-flex items-center gap-4" aria-label={brand("name")}>
            <Image src="/icons/nav-logo.png" alt={brand("logoAlt")} width={32} height={32} className="h-8 w-8 object-contain" />
            <span className="text-[18px] font-bold">{brand("name")}</span>
          </Link>

          <nav aria-label={t("services")} className="hidden items-center gap-1 rounded-full border border-surface/10 bg-surface/5 p-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "rounded-full ps-4 pe-4 py-2 text-[15px] motion-safe:transition-colors hover:bg-surface/10 hover:text-surface",
                  isActive(link.href) ? "bg-surface/15 text-surface" : "text-surface/80",
                )}
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <LangSwitch />
            <Link href="/start" data-track="cta_click" className={buttonClassName("primary", "min-h-11 text-[15px]")}>
              {t("consultation")}
            </Link>
          </div>

          <button
            ref={toggle}
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
      </header>

      {/*
        The menu is a sibling of the header on purpose: the header uses backdrop-filter, and a fixed element inside a
        filtered parent is sized to that parent instead of the screen (which made the menu collapse over the page).
      */}
      {open ? (
        <div
          id="mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label={t("openMenu")}
          className="fixed inset-0 z-50 flex h-dvh flex-col overflow-y-auto bg-ink-950 text-surface md:hidden"
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-surface/10 ps-4 pe-4">
            <span className="inline-flex items-center gap-3 text-[18px] font-bold">
              <Image src="/icons/nav-logo.png" alt="" width={32} height={32} className="h-8 w-8 object-contain" />
              {brand("name")}
            </span>
            <button
              ref={closeButton}
              type="button"
              className="inline-flex size-12 items-center justify-center rounded-control border border-surface/30"
              aria-label={t("closeMenu")}
              onClick={() => setOpen(false)}
            >
              <X aria-hidden="true" />
            </button>
          </div>
          <nav className="grid gap-1 ps-4 pe-4 pt-6" aria-label={t("services")}>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "flex min-h-14 items-center rounded-xl ps-4 pe-4 text-[19px] font-semibold",
                  isActive(link.href) ? "bg-surface/10 text-brand" : "hover:bg-surface/5",
                )}
                onClick={() => setOpen(false)}
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>
          <div className="mt-auto grid gap-3 border-t border-surface/10 p-4">
            <Link href="/start" className={buttonClassName("primary", "w-full")} onClick={() => setOpen(false)}>
              {t("consultation")}
            </Link>
            <div className="flex justify-center">
              <LangSwitch />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
