import type { ReactNode } from "react";

/** Dark header band shared by every inner page. Matches the home hero language. */
export function PageHero({
  eyebrow,
  title,
  intro,
  actions,
  aside,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  actions?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <header className="relative isolate overflow-hidden bg-ink-950 text-surface">
      <div aria-hidden="true" className="bg-aurora absolute inset-0 -z-10" />
      <div
        aria-hidden="true"
        className="absolute -top-24 end-0 -z-10 size-[420px] rounded-full bg-brand/20 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-32 start-0 -z-10 size-[360px] rounded-full bg-brand-strong/20 blur-[120px]"
      />
      <div className="ms-auto me-auto grid max-w-page items-center gap-10 py-16 ps-4 pe-4 md:py-24 md:ps-6 md:pe-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          {eyebrow ? (
            <p className="mb-4 inline-flex rounded-full border border-surface/10 bg-surface/5 py-1.5 ps-4 pe-4 text-[15px] font-semibold text-brand">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="max-w-3xl text-[32px] font-bold leading-[1.3] md:text-[48px]">{title}</h1>
          {intro ? (
            <p className="mt-4 max-w-2xl text-[17px] leading-[1.75] text-surface/75 md:text-[19px]">
              {intro}
            </p>
          ) : null}
          {actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}
        </div>
        {aside ? <div className="hidden lg:block">{aside}</div> : null}
      </div>
    </header>
  );
}
