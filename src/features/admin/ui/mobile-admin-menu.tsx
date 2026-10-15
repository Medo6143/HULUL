"use client";

import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { SidebarBody } from "./sidebar-body";

/** The phone and tablet menu: a button in the top bar that opens the sidebar as a drawer from the start edge. */
export function MobileAdminMenu({ user }: { user: { name: string; role: string } }) {
  const t = useTranslations("admin.nav");
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const close = useRef<HTMLButtonElement>(null);

  // Escape closes it, the page behind stops scrolling, focus moves inside and returns to the button afterwards.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    close.current?.focus();
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

  return (
    <>
      <button
        ref={toggle}
        type="button"
        aria-expanded={open}
        aria-controls="admin-drawer"
        aria-label={t("openMenu")}
        onClick={() => setOpen(true)}
        className="grid size-11 place-items-center rounded-xl border border-surface/25 text-surface hover:bg-surface/10"
      >
        <Menu className="size-6" aria-hidden="true" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label={t("closeMenu")} tabIndex={-1} onClick={() => setOpen(false)} className="absolute inset-0 bg-ink-950/60" />
          <div
            id="admin-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={t("menu")}
            className="absolute inset-y-0 start-0 flex w-[min(86vw,320px)] flex-col overflow-y-auto bg-ink-950 p-5 text-surface shadow-2xl"
          >
            <button
              ref={close}
              type="button"
              aria-label={t("closeMenu")}
              onClick={() => setOpen(false)}
              className="absolute end-3 top-3 grid size-11 place-items-center rounded-xl border border-surface/25 text-surface hover:bg-surface/10"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
            <SidebarBody user={user} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
