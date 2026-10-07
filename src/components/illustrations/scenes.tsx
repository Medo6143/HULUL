import { Check, Rocket, ShieldCheck, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { SkylineArt } from "./about-art";
import { SaudiMan, SaudiWoman } from "./people";

// Decorative scenes in the same flat style as the characters. They carry no text, numbers, or claims.

export type SceneVariant =
  | "web"
  | "mobile"
  | "design"
  | "process"
  | "smes"
  | "startups"
  | "agencies"
  | "enterprise"
  | "work";

function Browser({ className, accent = true }: { className?: string; accent?: boolean }) {
  return (
    <div className={cn("rounded-xl border border-surface/10 bg-ink-950/70 p-[3%] backdrop-blur", className)}>
      <div className="flex gap-1">
        <b className="size-1.5 rounded-full bg-surface/30" />
        <b className="size-1.5 rounded-full bg-surface/30" />
        <b className="size-1.5 rounded-full bg-surface/30" />
      </div>
      <div className="mt-2 grid gap-1.5">
        <i className={cn("h-2 w-3/5 rounded-full", accent ? "bg-gradient-to-r from-brand-strong to-brand" : "bg-surface/30")} />
        <i className="h-2 w-4/5 rounded-full bg-surface/15" />
        <div className="mt-1 grid grid-cols-3 gap-1.5">
          <i className="h-8 rounded-md bg-surface/10" />
          <i className="h-8 rounded-md bg-surface/10" />
          <i className="h-8 rounded-md bg-surface/10" />
        </div>
      </div>
    </div>
  );
}

function Phone({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-[18px] border-[3px] border-ink-700 bg-ink-800 p-[3%] shadow-xl", className)}>
      <i className="block h-10 rounded-lg bg-gradient-to-br from-brand-strong to-brand" />
      <div className="mt-1.5 grid gap-1">
        <i className="h-4 rounded-md bg-ink-700" />
        <i className="h-4 rounded-md bg-ink-700" />
        <i className="h-4 w-2/3 rounded-md bg-ink-700" />
      </div>
    </div>
  );
}

function Swatches({ className }: { className?: string }) {
  return (
    <div className={cn("flex gap-1.5 rounded-xl border border-surface/10 bg-ink-950/70 p-2 backdrop-blur", className)}>
      <i className="size-7 rounded-lg bg-brand" />
      <i className="size-7 rounded-lg bg-brand-strong" />
      <i className="size-7 rounded-lg bg-surface" />
      <i className="size-7 rounded-lg bg-ink-700" />
    </div>
  );
}

function Board({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-surface/10 bg-ink-950/70 p-3 backdrop-blur", className)}>
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((col) => (
          <div key={col} className="grid content-start gap-1.5">
            <i className="h-1.5 w-2/3 rounded-full bg-surface/30" />
            <i className={cn("h-6 rounded-md", col === 0 ? "bg-brand/80" : "bg-surface/10")} />
            <i className="h-6 rounded-md bg-surface/10" />
            {col === 2 ? null : <i className="h-6 rounded-md bg-surface/5" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function Bars({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-14 items-end gap-1.5 rounded-xl border border-surface/10 bg-ink-950/70 p-2 backdrop-blur", className)}>
      {[35, 55, 45, 75, 60, 95].map((h, i) => (
        <span
          key={i}
          style={{ height: `${h}%`, animationDelay: `${i * 90}ms` }}
          className="w-2.5 origin-bottom rounded-t bg-gradient-to-t from-brand-strong/40 to-brand motion-safe:animate-[grow-y_900ms_ease-out_both]"
        />
      ))}
    </div>
  );
}

function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "absolute grid size-9 place-items-center rounded-full border border-surface/10 bg-ink-900/90 text-brand shadow-lg backdrop-blur motion-safe:animate-[float-slow_6s_ease-in-out_infinite]",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SceneCard({ variant, className }: { variant: SceneVariant; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative aspect-[10/7] w-full overflow-hidden rounded-card border border-surface/10 bg-gradient-to-br from-ink-800 via-ink-900 to-ink-950",
        className,
      )}
    >
      <div className="absolute -top-8 end-4 size-40 rounded-full bg-brand/25 blur-[60px]" />

      {variant === "web" && <Browser className="absolute inset-x-[8%] top-[8%] w-[62%]" />}
      {variant === "mobile" && (
        <Phone className="absolute end-[14%] top-[6%] w-[24%]" />
      )}
      {variant === "design" && (
        <>
          <Swatches className="absolute start-[8%] top-[8%]" />
          <Browser className="absolute end-[8%] top-[10%] w-[46%]" accent={false} />
        </>
      )}
      {variant === "process" && <Board className="absolute inset-x-[8%] top-[8%]" />}
      {variant === "smes" && (
        <>
          <Browser className="absolute end-[8%] top-[8%] w-[52%]" />
          <Chip className="start-[10%] top-[14%]">
            <Check className="size-4" />
          </Chip>
        </>
      )}
      {variant === "startups" && (
        <>
          <Phone className="absolute end-[12%] top-[6%] w-[22%]" />
          <Bars className="absolute start-[8%] top-[10%] w-[34%]" />
          <Chip className="start-[40%] top-[8%]">
            <Rocket className="size-4" />
          </Chip>
        </>
      )}
      {variant === "agencies" && (
        <>
          <Browser className="absolute start-[8%] top-[8%] w-[46%]" accent={false} />
          <Browser className="absolute end-[8%] top-[18%] w-[46%]" />
        </>
      )}
      {variant === "enterprise" && (
        <>
          <SkylineArt className="absolute inset-x-0 bottom-[42%] h-[34%] w-full opacity-30" />
          <Chip className="end-[12%] top-[10%]">
            <ShieldCheck className="size-4" />
          </Chip>
          <Board className="absolute start-[8%] top-[10%] w-[40%]" />
        </>
      )}
      {variant === "work" && (
        <div className="absolute inset-x-[8%] top-[8%] grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <i key={i} className="aspect-[4/3] rounded-lg border border-dashed border-surface/25 bg-surface/5" />
          ))}
        </div>
      )}

      {variant === "design" && <Chip className="start-[44%] top-[44%]"><Sparkles className="size-4" /></Chip>}

      <div className="absolute inset-x-0 bottom-0 h-[44%] rounded-t-[40px] bg-gradient-to-t from-brand-soft to-surface/90" />
      {variant === "web" || variant === "design" || variant === "work" || variant === "smes" ? (
        <SaudiWoman className="absolute bottom-0 start-[10%] w-[34%]" />
      ) : null}
      {variant === "mobile" || variant === "startups" ? (
        <SaudiMan shemagh="red" className="absolute bottom-0 start-[10%] w-[34%]" />
      ) : null}
      {variant === "process" || variant === "agencies" || variant === "enterprise" ? (
        <>
          <SaudiWoman className="absolute bottom-0 start-[8%] w-[32%]" />
          <SaudiMan shemagh={variant === "agencies" ? "red" : "white"} className="absolute bottom-0 end-[8%] w-[32%]" />
        </>
      ) : null}
      {variant === "smes" || variant === "web" ? (
        <SaudiMan className="absolute bottom-0 end-[8%] w-[32%]" />
      ) : null}
    </div>
  );
}
