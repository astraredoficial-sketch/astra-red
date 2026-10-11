import { formatDegree, PLANET_META } from "@/lib/astro/constants";
import type { NatalChart } from "@/lib/types";

export function Triad({ chart }: { chart: NatalChart }) {
  const items = [
    { label: "Sol", p: chart.triad.sun },
    { label: "Luna", p: chart.triad.moon },
    { label: "Ascendente", p: chart.triad.asc },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-4 text-center"
        >
          <div className="text-thread text-xl">{PLANET_META[item.p.id].glyph}</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-muted">
            {item.label}
          </div>
          <div className="font-serif text-xl text-ink">{item.p.sign}</div>
          <div className="text-xs text-muted">{formatDegree(item.p.degreeInSign)}</div>
        </div>
      ))}
    </div>
  );
}

