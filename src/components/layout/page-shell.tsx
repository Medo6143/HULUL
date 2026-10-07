import type { ReactNode } from "react";
import { PageHero } from "./page-hero";

/** Simple inner page: designed header band plus a readable content column. */
export function PageShell({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children?: ReactNode;
}) {
  return (
    <main id="main">
      <PageHero title={title} eyebrow={eyebrow} />
      {children ? (
        <section className="bg-surface-muted py-12 md:py-20">
          <div className="ms-auto me-auto max-w-3xl ps-4 pe-4 md:ps-6 md:pe-6">
            <div className="space-y-4 rounded-card border border-surface-line bg-surface p-6 text-[17px] leading-[1.8] text-text-muted shadow-card md:p-10">
              {children}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
