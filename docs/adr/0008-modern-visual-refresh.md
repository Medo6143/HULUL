# ADR-0008: Modern visual refresh and illustrated Saudi characters

## Context

The first pass followed the design tokens but looked like a skeleton: thin sections, a single hero block, pages with only a title. The owner asked for a modern look, complete pages, and Saudi people on the home page.

## Decision

- Visual language: dark hero with grid and soft glow, glass navigation, larger type, 24px cards and 32px panels, gradient icon tiles, large numerals, one shadow. Colors still come only from the design tokens. `card` radius moved from 16px to 24px, `control` from 12px to 14px, and `panel` (32px) was added. `01-design-system.md` still lists the old radii and should be updated when the owner approves this look.
- Every inner page uses the same dark `PageHero`, then sections, then the shared final call to action. Segment pages (`/for/*`) were built from the four segments in the master plan.
- People: the design system asks for real photos. None exist yet, so the home, about, and request pages use flat illustrations of Saudi professionals (`components/illustrations/people.tsx`). They are decorative drawings. They must not be captioned as the team or as clients, and they do not replace testimonials. Replace them with real photos once supplied.
- Sections that need real data (work, testimonials) read from `config/` and stay hidden or show an honest empty state until the data exists.

## Consequences

Swapping illustrations for photos touches `hero-scene.tsx`, `consult-section.tsx`, `final-cta.tsx`, `about/page.tsx`, and `request-page.tsx` only.

## Motion, charts, and scenes

- Motion: `components/motion` holds `Reveal` (fade and rise on scroll), `CountUp`, and `GrowBar`. They are visible on the server and without JavaScript, only hide elements that start below the fold, and do nothing for visitors who prefer reduced motion.
- Charts: the home page market section draws figures from `config/market-data.ts` (DataReportal Digital 2026 and the Qoyod SME report 2026, both taken from the master plan). Each chart prints its source. The figures must be re-checked before launch, and the TikTok number stays out because the plan flags it as doubtful. No chart shows invented company statistics.
- Scenes: `components/illustrations/scenes.tsx` renders a text-free scene per service, segment, process, and work page, in the same flat style as the characters.
