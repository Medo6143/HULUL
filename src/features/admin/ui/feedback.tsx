"use client";

import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: number;
  kind: ToastKind;
  text: string;
}

export interface ConfirmOptions {
  message: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Danger styles the confirm button red (deleting, cancelling something for good). */
  tone?: "danger" | "default";
}

interface Feedback {
  toast: (item: { kind: ToastKind; text: string }) => void;
  /** Resolves true when the person confirms, false on cancel, Escape, or a click outside. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

// Outside the provider (for example in a test) it falls back to the browser's own confirm and no toasts.
const FALLBACK: Feedback = {
  toast: () => undefined,
  confirm: async (options) => (typeof window === "undefined" ? false : window.confirm(options.message)),
};

const FeedbackContext = createContext<Feedback>(FALLBACK);

export const useAdminFeedback = (): Feedback => useContext(FeedbackContext);

const ICONS = { success: CheckCircle2, error: XCircle, info: Info } as const;
const TONES: Record<ToastKind, string> = {
  success: "border-success/40 bg-surface text-text [&_svg:first-child]:text-success",
  error: "border-danger/40 bg-surface text-text [&_svg:first-child]:text-danger",
  info: "border-brand-strong/40 bg-surface text-text [&_svg:first-child]:text-brand-strong",
};

/** Admin-wide toasts and a confirmation dialog, so results are never hidden off screen and deletes never use the browser's popup. */
export function AdminFeedbackProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("admin.feedback");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [pending, setPending] = useState<{ options: ConfirmOptions; resolve: (ok: boolean) => void } | null>(null);
  const nextId = useRef(1);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((item) => item.id !== id)), []);

  const toast = useCallback(
    ({ kind, text }: { kind: ToastKind; text: string }) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-3), { id, kind, text }]);
      setTimeout(() => dismiss(id), kind === "error" ? 8000 : 5000);
    },
    [dismiss],
  );

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setPending({ options, resolve })),
    [],
  );

  const answer = useCallback(
    (ok: boolean) => {
      setPending((current) => {
        current?.resolve(ok);
        return null;
      });
    },
    [],
  );

  // While the dialog is open: Escape cancels, Tab stays inside it, the page behind does not scroll.
  useEffect(() => {
    if (!pending) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") return answer(false);
      if (event.key !== "Tab") return;
      const first = cancelRef.current;
      const last = confirmRef.current;
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [pending, answer]);

  const value = useMemo<Feedback>(() => ({ toast, confirm }), [toast, confirm]);
  const danger = pending?.options.tone === "danger";

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] grid justify-items-center gap-2 ps-4 pe-4" aria-live="polite">
        {toasts.map((item) => {
          const Icon = ICONS[item.kind];
          return (
            <div
              key={item.id}
              role={item.kind === "error" ? "alert" : "status"}
              className={cn("pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border p-4 shadow-lg", TONES[item.kind])}
            >
              <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <p className="min-w-0 flex-1 text-[15px] leading-[1.6]">{item.text}</p>
              <button type="button" aria-label={t("close")} onClick={() => dismiss(item.id)} className="grid size-7 shrink-0 place-items-center rounded-lg text-text-muted hover:bg-surface-muted">
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>

      {pending ? (
        <div className="fixed inset-0 z-[80] grid place-items-center p-4">
          <button type="button" tabIndex={-1} aria-label={t("cancel")} onClick={() => answer(false)} className="absolute inset-0 bg-ink-950/60" />
          <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message" className="relative grid w-full max-w-md gap-5 rounded-2xl bg-surface p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <span className={cn("grid size-11 shrink-0 place-items-center rounded-full", danger ? "bg-danger/10 text-danger" : "bg-brand-soft text-ink-900")}>
                <AlertTriangle className="size-6" aria-hidden="true" />
              </span>
              <div className="grid gap-1">
                <h2 id="confirm-title" className="text-[18px] font-bold">
                  {pending.options.title ?? t("title")}
                </h2>
                <p id="confirm-message" className="text-[15px] leading-[1.7] text-text-muted">
                  {pending.options.message}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              <button ref={cancelRef} type="button" onClick={() => answer(false)} className="min-h-11 rounded-xl border border-surface-line ps-5 pe-5 font-semibold hover:border-ink-900">
                {pending.options.cancelLabel ?? t("cancel")}
              </button>
              <button
                ref={confirmRef}
                type="button"
                onClick={() => answer(true)}
                className={cn("min-h-11 rounded-xl ps-5 pe-5 font-semibold text-surface", danger ? "bg-danger hover:bg-danger/90" : "bg-ink-900 hover:bg-ink-800")}
              >
                {pending.options.confirmLabel ?? t("confirm")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </FeedbackContext.Provider>
  );
}

type OkMessage = { ok: boolean; text: string };
type KindMessage = { kind: "ok" | "warn" | "error"; text: string };

/** Like useState for an inline result message, and every message also pops up as a toast. */
export function useFlash(): [OkMessage | null, (message: OkMessage | null) => void] {
  const { toast } = useAdminFeedback();
  const [message, setMessage] = useState<OkMessage | null>(null);
  const set = useCallback(
    (next: OkMessage | null) => {
      setMessage(next);
      if (next) toast({ kind: next.ok ? "success" : "error", text: next.text });
    },
    [toast],
  );
  return [message, set];
}

export function useFlashKind(): [KindMessage | null, (message: KindMessage | null) => void] {
  const { toast } = useAdminFeedback();
  const [message, setMessage] = useState<KindMessage | null>(null);
  const set = useCallback(
    (next: KindMessage | null) => {
      setMessage(next);
      if (next) toast({ kind: next.kind === "ok" ? "success" : next.kind === "warn" ? "info" : "error", text: next.text });
    },
    [toast],
  );
  return [message, set];
}
