import { PLANET_META, SIGN_GLYPHS } from "@/lib/astro/constants";
import type { NatalChart, PlanetId } from "@/lib/types";

const RING_PLANETS: PlanetId[] = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
  "node",
];

export function ChartWheel({ chart, className = "" }: { chart: NatalChart; className?: string }) {
  const cx = 160;
  const cy = 160;
  const asc = chart.triad.asc.longitude;

  const xy = (lon: number, r: number) => {
    const angle = ((lon - asc) * Math.PI) / 180;
    return {
      x: cx - r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  return (
    <svg viewBox="0 0 320 320" className={className} role="img" aria-label="Carta natal">
      <defs>
        <radialGradient id="void" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1a1028" />
          <stop offset="100%" stopColor="#07060c" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r="148" fill="url(#void)" stroke="rgba(138,43,226,0.45)" />
      <circle cx={cx} cy={cy} r="118" fill="none" stroke="rgba(255,42,95,0.25)" />
      <circle cx={cx} cy={cy} r="78" fill="none" stroke="rgba(255,255,255,0.08)" />

      {Array.from({ length: 12 }, (_, i) => {
        const lon = chart.houses[i];
        const outer = xy(lon, 148);
        const inner = xy(lon, 78);
        const glyphPos = xy(lon + 15, 133);
        return (
          <g key={i}>
            <line
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke={i % 3 === 0 ? "rgba(255,42,95,0.55)" : "rgba(255,255,255,0.12)"}
              strokeWidth={i % 3 === 0 ? 1.6 : 0.8}
            />
            <text
              x={glyphPos.x}
              y={glyphPos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#cbb8e8"
              fontSize="11"
            >
              {SIGN_GLYPHS[(chart.triad.asc.signIndex + i) % 12]}
            </text>
          </g>
        );
      })}

      {RING_PLANETS.map((id) => {
        const p = chart.planets.find((x) => x.id === id);
        if (!p) return null;
        const pos = xy(p.longitude, 98);
        return (
          <g key={id}>
            <circle cx={pos.x} cy={pos.y} r="10" fill="#120c1c" stroke="#8a2be2" />
            <text
              x={pos.x}
              y={pos.y + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={id === "sun" || id === "moon" ? "#ff2a5f" : "#f4eef8"}
              fontSize="11"
            >
              {PLANET_META[id].glyph}
            </text>
          </g>
        );
      })}

      <text x={cx} y={cy - 6} textAnchor="middle" fill="#ff2a5f" fontSize="11" fontFamily="serif">
        ASC
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#9b8fad" fontSize="10">
        {chart.triad.asc.sign}
      </text>
    </svg>
  );
}

