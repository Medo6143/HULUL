import type { LegalSection } from "@/config/legal";

/** Renders a legal text with the "draft pending legal review" notice on top. */
export function LegalDocument({ banner, sections }: { banner: string; sections: LegalSection[] }) {
  return (
    <div className="grid gap-8">
      <p role="note" className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-[15px] font-semibold text-text">
        {banner}
      </p>
      {sections.map((section) => (
        <section key={section.heading} className="grid gap-3">
          <h2 className="text-[22px] font-bold text-text">{section.heading}</h2>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {section.items ? (
            <ul className="grid list-disc gap-2 ps-6">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </div>
  );
}
