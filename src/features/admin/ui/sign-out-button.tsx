"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

/** Clears the session cookie on the server, then goes to the login page. */
export function SignOutButton({ label }: { label: string }) {
  const router = useRouter();

  async function signOut() {
    try {
      await fetch("/api/admin/session", { method: "DELETE" });
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      aria-label={label}
      onClick={signOut}
      className="grid size-10 place-items-center rounded-xl text-surface/70 hover:bg-surface/10 hover:text-surface"
    >
      <LogOut className="size-5 rtl:-scale-x-100" aria-hidden="true" />
    </button>
  );
}
