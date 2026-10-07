import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/cn";

type Tone = "light" | "muted" | "dark";

const tones: Record<Tone, string> = {
  light: "bg-surface text-text",
  muted: "bg-surface-muted text-text",
  dark: "relative isolate overflow-hidden bg-ink-950 text-surface",
};

export function Section({
  id,
  tone = "light",
  labelledBy,
  children,
}: {
  id?: string;
  tone?: Tone;
  labelledBy?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn("py-16 md:py-24", tones[tone])}>
      {tone === "dark" ? (
        <>
          <div aria-hidden="true" className="bg-aurora absolute inset-0 -z-10 opacity-60" />
          <div
            aria-hidden="true"
            className="absolute -top-24 start-1/4 -z-10 size-[380px] rounded-full bg-brand/15 blur-[120px]"
          />
        </>
      ) : null}
      <div className="ms-auto me-auto max-w-page ps-4 pe-4 md:ps-6 md:pe-6">{children}</div>
    </section>
  );
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  intro,
  dark = false,
}: {
  id: string;
  eyebrow: string;
  title: string;
  intro?: string;
  dark?: boolean;
}) {
  return (
    <Reveal className="ms-auto me-auto mb-12 max-w-2xl text-center md:mb-16">
      <p
        className={cn(
          "inline-flex rounded-full py-1.5 ps-4 pe-4 text-[15px] font-semibold",
          dark ? "border border-surface/10 bg-surface/5 text-brand" : "bg-brand-soft text-ink-900",
        )}
      >
        {eyebrow}
      </p>
      <h2 id={id} className="mt-4 text-[28px] font-bold leading-[1.3] md:text-[40px]">
        {title}
      </h2>
      {intro ? (
        <p className={cn("mt-4 text-[17px] leading-[1.8]", dark ? "text-surface/75" : "text-text-muted")}>
          {intro}
        </p>
      ) : null}
    </Reveal>
  );
}
