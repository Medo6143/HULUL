import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "whatsapp";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand text-ink-950 hover:bg-brand-strong",
  secondary: "border border-surface-line bg-surface text-text hover:bg-surface-muted",
  ghost: "border border-surface/40 bg-transparent text-surface hover:bg-surface/10",
  whatsapp: "bg-whatsapp text-ink-950 hover:bg-whatsapp/90",
};

export function buttonClassName(variant: ButtonVariant = "primary", className?: string): string {
  return cn(
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-control ps-6 pe-6 text-base font-semibold motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    className,
  );
}

type ButtonProps = {
  variant?: ButtonVariant;
  loading?: boolean;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant = "primary",
  loading = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClassName(variant, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 className="size-5 motion-safe:animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
