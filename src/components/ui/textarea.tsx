import { useId, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { fieldClassName } from "./input";

type TextareaProps = { label: ReactNode; hint?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ label, hint, id, className, ...props }: TextareaProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hintId = `${fieldId}-hint`;

  return (
    <label htmlFor={fieldId} className="grid gap-2 text-[15px] font-semibold leading-[1.6]">
      <span>{label}</span>
      <textarea
        id={fieldId}
        aria-describedby={hint ? hintId : undefined}
        className={cn(fieldClassName(), "min-h-28 py-3", className)}
        {...props}
      />
      {hint ? (
        <span id={hintId} className="font-normal text-text-muted">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
