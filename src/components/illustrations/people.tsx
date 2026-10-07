import { useId } from "react";

// Decorative flat illustrations of Saudi professionals. They are drawings, not photos of the team or clients,
// and must never be captioned or used as testimonials. Swap for real photos when they are supplied.

type Shemagh = "white" | "red";

const SKIN = "#E3B08A";
const SKIN_SHADE = "#CF9A73";
const INK = "#0F172A";

export function SaudiMan({
  shemagh = "white",
  className,
}: {
  shemagh?: Shemagh;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const cloth = shemagh === "red" ? `url(#check-${uid})` : "#FFFFFF";

  return (
    <svg viewBox="0 0 240 300" className={className} aria-hidden="true" focusable="false">
      {shemagh === "red" ? (
        <defs>
          <pattern id={`check-${uid}`} width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="#FFFFFF" />
            <path d="M0 0h10M0 5h10M0 0v10M5 0v10" stroke="#DC2626" strokeWidth="1.6" opacity="0.85" />
          </pattern>
        </defs>
      ) : null}
      {/* thobe */}
      <path
        d="M22 300c2-44 8-70 36-82 20-8 36-12 62-12s42 4 62 12c28 12 34 38 36 82z"
        fill="#F8FAFC"
        stroke="#E2E8F0"
        strokeWidth="2"
      />
      <path d="M120 206v94" stroke="#E2E8F0" strokeWidth="2" />
      <circle cx="126" cy="238" r="2.6" fill="#CBD5E1" />
      <circle cx="126" cy="258" r="2.6" fill="#CBD5E1" />
      {/* neck */}
      <path d="M102 168h36v42c-10 8-26 8-36 0z" fill={SKIN_SHADE} />
      {/* ghutra drape behind the face */}
      <path
        d="M56 116C56 40 184 40 184 116c0 30 6 62 18 96-24 22-48 16-62-8H100c-14 24-38 30-62 8 12-34 18-66 18-96z"
        fill={cloth}
        stroke="#E2E8F0"
        strokeWidth="2"
      />
      {/* face */}
      <ellipse cx="120" cy="116" rx="40" ry="50" fill={SKIN} />
      <ellipse cx="80" cy="120" rx="6" ry="10" fill={SKIN_SHADE} />
      <ellipse cx="160" cy="120" rx="6" ry="10" fill={SKIN_SHADE} />
      {/* ghutra band over forehead */}
      <path d="M78 96c6-26 78-26 84 0-18-12-66-12-84 0z" fill={cloth} stroke="#E2E8F0" strokeWidth="1.5" />
      {/* agal */}
      <ellipse cx="120" cy="58" rx="54" ry="14" fill="none" stroke={INK} strokeWidth="6" />
      <ellipse cx="120" cy="66" rx="52" ry="12" fill="none" stroke={INK} strokeWidth="3" opacity="0.7" />
      {/* beard */}
      <path
        d="M80 122c0 52 80 52 80 0 0 22-14 30-40 30s-40-8-40-30z"
        fill="#1F2937"
      />
      <path d="M104 140c8-6 24-6 32 0-8 4-24 4-32 0z" fill="#1F2937" />
      {/* features */}
      <path d="M96 100q9-5 18 0M126 100q9-5 18 0" stroke="#1F2937" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <circle cx="105" cy="112" r="3.6" fill={INK} />
      <circle cx="135" cy="112" r="3.6" fill={INK} />
      <path d="M120 114v14q-5 3-9 0" stroke={SKIN_SHADE} strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M108 146q12 8 24 0" stroke="#F8FAFC" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function SaudiWoman({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 300" className={className} aria-hidden="true" focusable="false">
      {/* abaya and hijab */}
      <path
        d="M50 122C50 36 190 36 190 122c0 40 12 70 30 102 6 12 8 44 8 76H12c0-32 2-64 8-76 18-32 30-62 30-102z"
        fill="#111827"
      />
      <path d="M120 214c-26 0-44 8-60 20M120 214c26 0 44 8 60 20" stroke="#1F2937" strokeWidth="3" fill="none" />
      <path d="M120 236v64" stroke="#1F2937" strokeWidth="3" />
      {/* hijab trim */}
      <path d="M62 150c10 40 4 60-8 86M178 150c-10 40-4 60 8 86" stroke="#00D2FF" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.55" />
      {/* face */}
      <ellipse cx="120" cy="118" rx="38" ry="48" fill="#EBBB97" />
      <path d="M82 104c8-34 68-34 76 0-14-14-62-14-76 0z" fill="#111827" />
      {/* features */}
      <path d="M97 102q9-5 18 0M125 102q9-5 18 0" stroke="#3B2A22" strokeWidth="3" strokeLinecap="round" fill="none" />
      <ellipse cx="106" cy="115" rx="4.4" ry="3.6" fill="#1F2937" />
      <ellipse cx="134" cy="115" rx="4.4" ry="3.6" fill="#1F2937" />
      <path d="M100 111l-4-3M140 111l4-3" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
      <path d="M120 118v13q-4 3-8 0" stroke="#D49A76" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M108 142q12 9 24 0" stroke="#B4535A" strokeWidth="4" strokeLinecap="round" fill="none" />
      <circle cx="94" cy="130" r="7" fill="#E58E8E" opacity="0.28" />
      <circle cx="146" cy="130" r="7" fill="#E58E8E" opacity="0.28" />
    </svg>
  );
}
