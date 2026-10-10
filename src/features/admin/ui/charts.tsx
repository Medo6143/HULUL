import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

// Small dependency-free SVG charts. They sit in an LTR box so time always runs left to right, and each one has a
// text summary for screen readers plus a native tooltip on every point.

const W = 640;
const H = 220;
const PAD = { top: 16, right: 16, bottom: 28, left: 32 };

export interface ChartPoint {
  label: string;
  value: number;
}

const niceMax = (max: number) => (max <= 4 ? 4 : Math.ceil(max / 4) * 4);

function Frame({ summary, children }: { summary: string; children: ReactNode }) {
  return (
    <figure dir="ltr" className="grid gap-2">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary} className="h-auto w-full">
        {children}
      </svg>
      <figcaption className="sr-only">{summary}</figcaption>
    </figure>
  );
}

function Grid({ max }: { max: number }) {
  return (
    <>
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = PAD.top + (H - PAD.top - PAD.bottom) * (1 - f);
        return (
          <g key={f}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} className="stroke-surface-line" strokeWidth={1} />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" className="fill-text-muted text-[11px]">
              {Math.round(max * f)}
            </text>
          </g>
        );
      })}
    </>
  );
}

function AxisLabels({ points, step }: { points: ChartPoint[]; step: number }) {
  const innerW = W - PAD.left - PAD.right;
  const x = (i: number) => PAD.left + (points.length === 1 ? innerW / 2 : (innerW * i) / (points.length - 1));
  return (
    <>
      {points.map((p, i) =>
        i % step === 0 || i === points.length - 1 ? (
          <text key={p.label + i} x={x(i)} y={H - 8} textAnchor="middle" className="fill-text-muted text-[11px]">
            {p.label}
          </text>
        ) : null,
      )}
    </>
  );
}

/** Line with a soft area fill, for a value over time. */
export function AreaChart({ points, summary }: { points: ChartPoint[]; summary: string }) {
  const max = niceMax(Math.max(...points.map((p) => p.value), 0));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length === 1 ? innerW / 2 : (innerW * i) / (points.length - 1));
  const y = (v: number) => PAD.top + innerH * (1 - v / max);
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(points.length - 1).toFixed(1)},${H - PAD.bottom} L${x(0).toFixed(1)},${H - PAD.bottom} Z`;
  return (
    <Frame summary={summary}>
      <Grid max={max} />
      <path d={area} className="fill-brand/20" />
      <path d={line} fill="none" className="stroke-brand-strong" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={p.label + i} cx={x(i)} cy={y(p.value)} r={p.value > 0 ? 3.5 : 2} className="fill-brand-strong">
          <title>{`${p.label}: ${p.value}`}</title>
        </circle>
      ))}
      <AxisLabels points={points} step={Math.max(1, Math.ceil(points.length / 6))} />
    </Frame>
  );
}

/** Vertical columns, for counts per day. */
export function ColumnChart({ points, summary, tone = "fill-brand-strong" }: { points: ChartPoint[]; summary: string; tone?: string }) {
  const max = niceMax(Math.max(...points.map((p) => p.value), 0));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = innerW / points.length;
  const barW = Math.min(28, slot * 0.6);
  return (
    <Frame summary={summary}>
      <Grid max={max} />
      {points.map((p, i) => {
        const h = (innerH * p.value) / max;
        const cx = PAD.left + slot * i + slot / 2;
        return (
          <g key={p.label + i}>
            <rect x={cx - barW / 2} y={H - PAD.bottom - h} width={barW} height={Math.max(h, p.value > 0 ? 2 : 0)} rx={4} className={tone}>
              <title>{`${p.label}: ${p.value}`}</title>
            </rect>
            {i % Math.max(1, Math.ceil(points.length / 7)) === 0 ? (
              <text x={cx} y={H - 8} textAnchor="middle" className="fill-text-muted text-[11px]">
                {p.label}
              </text>
            ) : null}
          </g>
        );
      })}
    </Frame>
  );
}

export interface DonutSlice {
  label: string;
  value: number;
  /** A full Tailwind stroke class, e.g. "stroke-brand". */
  stroke: string;
  /** Matching background class for the legend dot, e.g. "bg-brand". */
  dot: string;
}

/** Share of a whole. The legend carries the labels and numbers, so colour is never the only cue. */
export function DonutChart({ slices, center, summary }: { slices: DonutSlice[]; center: string; summary: string }) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const R = 70;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="grid items-center gap-6 sm:grid-cols-[180px_1fr]">
      <figure dir="ltr" className="mx-auto w-[180px]">
        <svg viewBox="0 0 180 180" role="img" aria-label={summary} className="size-[180px]">
          <circle cx={90} cy={90} r={R} fill="none" className="stroke-surface-muted" strokeWidth={22} />
          {total > 0
            ? slices.map((slice) => {
                const length = (slice.value / total) * C;
                const circle = (
                  <circle
                    key={slice.label}
                    cx={90}
                    cy={90}
                    r={R}
                    fill="none"
                    className={slice.stroke}
                    strokeWidth={22}
                    strokeDasharray={`${Math.max(length - 2, 0)} ${C - Math.max(length - 2, 0)}`}
                    strokeDashoffset={-offset}
                    transform="rotate(-90 90 90)"
                  >
                    <title>{`${slice.label}: ${slice.value}`}</title>
                  </circle>
                );
                offset += length;
                return circle;
              })
            : null}
          <text x={90} y={88} textAnchor="middle" className="fill-text text-[26px] font-bold">
            {total}
          </text>
          <text x={90} y={108} textAnchor="middle" className="fill-text-muted text-[12px]">
            {center}
          </text>
        </svg>
      </figure>
      <ul className="grid gap-2">
        {slices.map((slice) => (
          <li key={slice.label} className="flex items-center gap-3 text-[15px]">
            <span aria-hidden="true" className={cn("size-3 shrink-0 rounded-full", slice.dot)} />
            <span className="flex-1">{slice.label}</span>
            <b className="tabular-nums">{slice.value}</b>
            <span className="w-12 text-end text-[13px] text-text-muted tabular-nums">
              {total > 0 ? `${Math.round((slice.value / total) * 100)}%` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
