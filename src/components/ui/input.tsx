import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type InputProps = {
  label: ReactNode;
  error?: string;
  hint?: string;
  ltr?: boolean;
} & InputHTMLAttributes<HTMLInputElement>;

export const fieldClassName = (error?: string) =>
  cn(
    "min-h-12 w-full rounded-control border bg-surface ps-4 pe-4 text-base font-normal text-text",
    "placeholder:text-text-muted/60 motion-safe:transition-colors focus-visible:border-brand-strong",
    error ? "border-danger" : "border-surface-line hover:border-text-muted/40",
    "disabled:cursor-not-allowed disabled:opacity-50",
  );

export function Input({ label, error, hint, ltr = false, id, className, ...props }: InputProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");

  return (
    <label htmlFor={fieldId} className="grid gap-2 text-[15px] font-semibold leading-[1.6]">
      <span>{label}</span>
      <input
        id={fieldId}
        dir={ltr ? "ltr" : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={cn(fieldClassName(error), className)}
        {...props}
      />
      {hint ? (
        <span id={hintId} className="font-normal text-text-muted">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} role="alert" className="font-normal text-danger">
          {error}
        </span>
      ) : null}
    </label>
  );
}
