import { SaudiMan, SaudiWoman } from "./people";

// Decorative illustrations for the about page. Pure drawings: no numbers, no claims.

/** Three illustrated professionals in front of a planning board. */
export function TeamScene() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto h-[340px] w-full max-w-[460px] overflow-hidden rounded-panel border border-surface/10 bg-gradient-to-br from-ink-800 to-ink-900 shadow-[0_30px_80px_rgb(0_0_0/0.45)]"
    >
      <div className="absolute -top-10 end-6 size-56 rounded-full bg-brand/25 blur-[70px]" />
      {/* planning board */}
      <div className="absolute inset-x-6 top-6 rounded-2xl border border-surface/10 bg-ink-950/60 p-4 backdrop-blur">
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((col) => (
            <div key={col} className="grid gap-2">
              <i className="h-2 w-2/3 rounded-full bg-surface/30" />
              <i
                className={`h-9 rounded-lg ${col === 0 ? "bg-brand/80" : "bg-surface/10"}`}
              />
              <i className="h-9 rounded-lg bg-surface/10" />
            </div>
          ))}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[50%] rounded-t-[44px] bg-gradient-to-t from-brand-soft to-surface/90" />
      <SaudiWoman className="absolute bottom-0 start-[3%] w-[36%]" />
      <SaudiMan className="absolute bottom-0 start-[32%] z-10 w-[38%]" />
      <SaudiMan shemagh="red" className="absolute bottom-0 end-[1%] w-[34%]" />
    </div>
  );
}

/** Laptop, phone, and design swatches: the three things we build. */
export function DevicesArt() {
  return (
    <svg
      viewBox="0 0 520 380"
      className="h-auto w-full"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="da-brand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#00D2FF" />
          <stop offset="1" stopColor="#00A9D1" />
        </linearGradient>
        <linearGradient id="da-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E0F8FF" />
          <stop offset="1" stopColor="#FFFFFF" />
        </linearGradient>
      </defs>
      <rect width="520" height="380" rx="32" fill="url(#da-bg)" />
      <circle cx="430" cy="70" r="90" fill="#00D2FF" opacity="0.12" />
      <circle cx="70" cy="320" r="70" fill="#00A9D1" opacity="0.1" />

      {/* laptop */}
      <rect x="70" y="70" width="290" height="190" rx="14" fill="#0A1628" />
      <rect x="82" y="82" width="266" height="166" rx="8" fill="#0F2038" />
      <rect x="96" y="96" width="120" height="10" rx="5" fill="url(#da-brand)" />
      <rect x="96" y="116" width="170" height="8" rx="4" fill="#1B2F4D" />
      <rect x="96" y="132" width="140" height="8" rx="4" fill="#1B2F4D" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={96 + i * 82} y="156" width="70" height="70" rx="10" fill="#1B2F4D" />
      ))}
      <rect x="108" y="196" width="10" height="22" rx="3" fill="url(#da-brand)" />
      <rect x="124" y="184" width="10" height="34" rx="3" fill="url(#da-brand)" />
      <rect x="140" y="170" width="10" height="48" rx="3" fill="url(#da-brand)" />
      <path d="M40 262h350l-18 20H58z" fill="#CBD5E1" />
      <rect x="170" y="262" width="90" height="6" rx="3" fill="#94A3B8" />

      {/* phone */}
      <rect x="330" y="120" width="120" height="220" rx="22" fill="#0A1628" />
      <rect x="338" y="132" width="104" height="196" rx="14" fill="#0F2038" />
      <rect x="348" y="144" width="84" height="54" rx="10" fill="url(#da-brand)" />
      <rect x="348" y="208" width="84" height="22" rx="8" fill="#1B2F4D" />
      <rect x="348" y="238" width="84" height="22" rx="8" fill="#1B2F4D" />
      <rect x="348" y="268" width="52" height="22" rx="8" fill="#1B2F4D" />
      <circle cx="420" cy="302" r="10" fill="#00D2FF" />

      {/* design swatches and pen */}
      <g transform="translate(60 290)">
        <rect width="34" height="34" rx="10" fill="#00D2FF" />
        <rect x="42" width="34" height="34" rx="10" fill="#0A1628" />
        <rect x="84" width="34" height="34" rx="10" fill="#E0F8FF" stroke="#CBD5E1" />
      </g>
      <path
        d="M470 250l-10 36 36-10 38-38-26-26z"
        transform="translate(-48 18) scale(0.9)"
        fill="#00A9D1"
      />
    </svg>
  );
}

/** Flat skyline strip used behind the location card. Generic shapes, not a specific landmark. */
export function SkylineArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 140" className={className} aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMax slice">
      <g fill="#0A1628" opacity="0.92">
        <rect x="10" y="70" width="46" height="70" rx="4" />
        <rect x="64" y="40" width="38" height="100" rx="4" />
        <path d="M120 140V30q0-10 10-10h30q10 0 10 10v110z" />
        <path d="M150 20v-10M150 20" stroke="#0A1628" strokeWidth="4" />
        <rect x="190" y="62" width="52" height="78" rx="4" />
        <path d="M262 140V50l24-30 24 30v90z" />
        <rect x="330" y="76" width="44" height="64" rx="4" />
        <rect x="382" y="34" width="40" height="106" rx="4" />
        <rect x="430" y="64" width="50" height="76" rx="4" />
        <rect x="488" y="48" width="36" height="92" rx="4" />
        <rect x="532" y="80" width="58" height="60" rx="4" />
      </g>
      <g fill="#00D2FF" opacity="0.85">
        {[
          [74, 56], [74, 76], [74, 96], [132, 44], [132, 64], [132, 84], [198, 78], [198, 98],
          [392, 50], [392, 72], [392, 94], [498, 64], [498, 86], [440, 80], [440, 100],
        ].map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="8" height="8" rx="2" />
        ))}
      </g>
    </svg>
  );
}
