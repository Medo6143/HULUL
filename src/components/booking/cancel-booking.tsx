"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type State = "idle" | "working" | "done" | "failed" | "invalid" | "gone";

/** Confirms and performs the cancellation for the link in the confirmation email. */
export function CancelBooking({ id, token }: { id: string; token: string }) {
  const t = useTranslations("booking.cancel");
  const [state, setState] = useState<State>("idle");

  async function cancel() {
    setState("working");
    try {
      const response = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, token }),
      });
      if (response.ok) return setState("done");
      const body = (await response.json().catch(() => null)) as { error?: { code?: string } } | null;
      const code = body?.error?.code;
      setState(code === "invalid_token" ? "invalid" : code === "already_cancelled" || code === "not_allowed" ? "gone" : "failed");
    } catch {
      setState("failed");
    }
  }

  if (!id || !token) return <p role="alert">{t("invalid")}</p>;
  if (state === "done") return <p role="status" className="text-[18px] font-semibold">{t("done")}</p>;
  if (state === "invalid") return <p role="alert">{t("invalid")}</p>;
  if (state === "gone") return <p role="status">{t("gone")}</p>;

  return (
    <div className="grid justify-items-start gap-4">
      <p className="text-text-muted">{t("body")}</p>
      <Button type="button" onClick={cancel} loading={state === "working"}>
        {t("confirm")}
      </Button>
      {state === "failed" ? (
        <p role="alert" className="text-danger">
          {t("failed")}
        </p>
      ) : null}
    </div>
  );
}
