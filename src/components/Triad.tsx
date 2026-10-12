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
          className="rounded-2xl border border-[#b79656]/35 bg-[#f6edd8]/75 px-3 py-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]"
        >
          <div className="font-serif text-2xl text-[#a17c3f]">{PLANET_META[item.p.id].glyph}</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-[#81765f]">
            {item.label}
          </div>
          <div className="font-serif text-xl text-[#1c2b43]">{item.p.sign}</div>
          <div className="text-xs text-[#81765f]">{formatDegree(item.p.degreeInSign)}</div>
        </div>
      ))}
    </div>
  );
}
