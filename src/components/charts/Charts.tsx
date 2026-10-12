"use client";

// Gráficas SVG propias. Paleta validada (CVD) en globals.css: --color-serie-1..4.
// Reglas: marcas delgadas, extremos redondeados en la base, separación de 2px,
// leyenda siempre presente con ≥2 series, tooltip al pasar/tocar, tabla alternativa.
import { useState } from "react";
import { money, moneyShort } from "@/lib/format";

export interface GroupedDatum {
  label: string;
  values: number[];
}

export function GroupedBars({
  data,
  series,
  height = 220,
  caption,
}: {
  data: GroupedDatum[];
  series: { name: string; color: string }[];
  height?: number;
  caption: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const W = 460;
  const H = height;
  const pad = { t: 12, r: 6, b: 30, l: 58 };
  const max = Math.max(1, ...data.flatMap((d) => d.values));
  const nice = niceMax(max);
  const ih = H - pad.t - pad.b;
  const iw = W - pad.l - pad.r;
  const band = iw / data.length;
  const barW = Math.min(26, (band * 0.62) / series.length);
  const y = (v: number) => pad.t + ih - (v / nice) * ih;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * nice);

  return (
    <figure className="relative">
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-tinta-2">
        {series.map((s) => (
          <span key={s.name} className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
        <button onClick={() => setTable((t) => !t)} className="ml-auto cursor-pointer rounded-lg px-2 py-1 font-semibold hover:bg-card-2">
          {table ? "Ver gráfica" : "Ver tabla"}
        </button>
      </div>
      {table ? (
        <table className="tabular w-full text-sm">
          <thead className="text-left text-xs text-tinta-2">
            <tr>
              <th className="py-1.5 font-semibold">Periodo</th>
              {series.map((s) => (
                <th key={s.name} className="py-1.5 text-right font-semibold">
                  {s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label} className="border-t border-linea">
                <td className="py-1.5">{d.label}</td>
                {d.values.map((v, i) => (
                  <td key={i} className="py-1.5 text-right">
                    {money(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" role="img" aria-label={caption}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--color-linea)" strokeDasharray={t === 0 ? undefined : "2 4"} />
              <text x={pad.l - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize="13" fill="var(--color-tinta-2)">
                {moneyShort(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const cx = pad.l + band * i + band / 2;
            const groupW = barW * series.length + 2 * (series.length - 1);
            return (
              <g key={d.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(i)}>
                <rect x={pad.l + band * i} y={pad.t} width={band} height={ih} fill={hover === i ? "var(--color-card-2)" : "transparent"} rx="8" />
                {d.values.map((v, k) => {
                  const x = cx - groupW / 2 + k * (barW + 2);
                  const h = Math.max(0, pad.t + ih - y(v));
                  return <path key={k} d={roundedTop(x, y(v), barW, h, 4)} fill={series[k].color} opacity={hover === null || hover === i ? 1 : 0.45} />;
                })}
                <text x={cx} y={H - 8} textAnchor="middle" fontSize="13" fill="var(--color-tinta-2)">
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      )}
      {!table && hover !== null && (
        <div
          className="pointer-events-none absolute top-8 z-10 min-w-40 rounded-xl border border-linea bg-fondo px-3 py-2 text-xs shadow-xl"
          style={{ left: `clamp(0px, calc(${((pad.l + band * hover + band / 2) / W) * 100}% - 80px), calc(100% - 170px))` }}
        >
          <p className="mb-1 font-semibold text-tinta">{data[hover].label}</p>
          {series.map((s, k) => (
            <p key={s.name} className="tabular flex items-center justify-between gap-4 text-tinta-2">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-sm" style={{ background: s.color }} />
                {s.name}
              </span>
              <span className="font-semibold text-tinta">{money(data[hover].values[k])}</span>
            </p>
          ))}
        </div>
      )}
      <figcaption className="sr-only">{caption}</figcaption>
    </figure>
  );
}

/** Barras horizontales de una sola medida (ej. gasto por categoría). */
export function HBars({ rows, total }: { rows: { label: string; value: number; color: string }[]; total?: number }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const sum = total ?? rows.reduce((a, r) => a + r.value, 0);
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label} className="group">
          <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
            <span className="inline-flex items-center gap-2 text-tinta">
              <span className="size-2.5 rounded-sm" style={{ background: r.color }} />
              {r.label}
            </span>
            <span className="tabular text-tinta-2">
              <b className="font-semibold text-tinta">{money(r.value)}</b> · {sum ? Math.round((r.value / sum) * 100) : 0}%
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-card-2">
            <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${(r.value / max) * 100}%`, background: r.color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Medidor de proporción (ej. reparto inversionista / dueño). */
export function SplitBar({ parts }: { parts: { label: string; value: number; color: string }[] }) {
  const sum = parts.reduce((a, p) => a + p.value, 0) || 1;
  return (
    <div>
      <div className="flex h-4 gap-0.5 overflow-hidden rounded-full">
        {parts.map((p) => (
          <div key={p.label} style={{ width: `${(p.value / sum) * 100}%`, background: p.color }} className="transition-[width] duration-700 first:rounded-l-full last:rounded-r-full" />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-tinta-2">
        {parts.map((p) => (
          <span key={p.label} className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: p.color }} />
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function roundedTop(x: number, y: number, w: number, h: number, r: number) {
  if (h <= 0) return "";
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}

function niceMax(v: number) {
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / exp;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * exp;
}
