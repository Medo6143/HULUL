import { useId, type ReactNode, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { fieldClassName } from "./input";

type SelectProps = { label: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ label, id, className, children, ...props }: SelectProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <label htmlFor={fieldId} className="grid gap-2 text-[15px] font-semibold leading-[1.6]">
      <span>{label}</span>
      <select id={fieldId} className={cn(fieldClassName(), "pe-4", className)} {...props}>
        {children}
      </select>
    </label>
  );
}
