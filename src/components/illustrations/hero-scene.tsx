import { BarChart3, Check, Smartphone } from "lucide-react";
import { SaudiMan, SaudiWoman } from "./people";

/**
 * Decorative product scene with two illustrated Saudi professionals.
 * No numbers or labels: nothing here can be read as a claim about results.
 */
export function HeroScene() {
  return (
    <div aria-hidden="true" className="relative mx-auto aspect-[5/4.4] w-full max-w-[540px]">
      <div className="absolute inset-0 overflow-hidden rounded-panel border border-surface/10 bg-gradient-to-br from-ink-800 via-ink-900 to-ink-950 shadow-[0_30px_80px_rgb(0_0_0/0.5)]">
        <div className="absolute -top-16 end-4 size-64 rounded-full bg-brand/25 blur-[80px]" />

        {/* dashboard window */}
        <div className="absolute start-6 top-6 w-[62%] rounded-2xl border border-surface/10 bg-ink-950/70 p-3 backdrop-blur">
          <div className="flex gap-1.5">
            <b className="size-2 rounded-full bg-surface/25" />
            <b className="size-2 rounded-full bg-surface/25" />
            <b className="size-2 rounded-full bg-surface/25" />
          </div>
          <div className="mt-3 grid gap-2">
            <div className="h-2.5 w-3/5 rounded-full bg-gradient-to-r from-brand-strong to-brand" />
            <div className="h-2.5 w-4/5 rounded-full bg-surface/15" />
          </div>
          <div className="mt-3 flex h-16 items-end gap-2">
            {[40, 64, 48, 82, 60, 100].map((h, i) => (
              <span
                key={i}
                style={{ height: `${h}%`, animationDelay: `${i * 110}ms` }}
                className="flex-1 origin-bottom rounded-t-md bg-gradient-to-t from-brand-strong/40 to-brand motion-safe:animate-[grow-y_1000ms_ease-out_both]"
              />
            ))}
          </div>
        </div>

        {/* phone */}
        <div className="absolute end-6 top-10 w-[24%] rounded-[22px] border-4 border-ink-700 bg-ink-800 p-2 shadow-xl">
          <div className="h-12 rounded-xl bg-gradient-to-br from-brand-strong to-brand" />
          <div className="mt-2 grid gap-1.5">
            <div className="h-5 rounded-lg bg-ink-700" />
            <div className="h-5 rounded-lg bg-ink-700" />
            <div className="h-5 rounded-lg bg-ink-700" />
          </div>
        </div>

        {/* people on a light stage so the abaya and ghutra read clearly */}
        <div className="absolute inset-x-0 bottom-0 h-[52%] rounded-t-[48px] bg-gradient-to-t from-brand-soft to-surface/90" />
        <SaudiWoman className="absolute bottom-0 start-[6%] w-[38%]" />
        <SaudiMan className="absolute bottom-0 end-[8%] w-[40%]" />
      </div>

      {/* floating chips */}
      <div className="absolute -start-3 top-[42%] flex items-center gap-2 rounded-2xl border border-surface/10 bg-ink-900/90 p-2.5 shadow-xl backdrop-blur motion-safe:animate-[float-slow_6s_ease-in-out_infinite]">
        <span className="grid size-8 place-items-center rounded-full bg-success text-surface">
          <Check className="size-4" />
        </span>
        <span className="grid gap-1">
          <i className="h-1.5 w-14 rounded-full bg-surface/60" />
          <i className="h-1.5 w-9 rounded-full bg-surface/25" />
        </span>
      </div>
      <div className="absolute -end-2 bottom-[30%] flex items-center gap-2 rounded-2xl border border-surface/10 bg-ink-900/90 p-2.5 shadow-xl backdrop-blur motion-safe:animate-[float-slow_7s_ease-in-out_infinite]">
        <span className="grid size-8 place-items-center rounded-full bg-brand text-ink-950">
          <BarChart3 className="size-4" />
        </span>
        <Smartphone className="size-5 text-surface/70" />
      </div>
    </div>
  );
}
