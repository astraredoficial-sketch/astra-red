import {
  PLANET_META,
  SIGN_GLYPHS,
  signFromLongitude,
} from "@/lib/astro/constants";
import { getNatalAspects } from "@/lib/astro/aspects";
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
  const aspectColors = {
    conjunction: "#dca878",
    sextile: "#8fb7ad",
    square: "#ce8881",
    trine: "#8aacc5",
    opposition: "#b39bc9",
  } as const;

  const xy = (lon: number, r: number) => {
    const angle = ((lon - asc) * Math.PI) / 180;
    return {
      x: cx - r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const planetsById = new Map(chart.planets.map((planet) => [planet.id, planet]));
  const aspects = getNatalAspects(chart)
    .filter((aspect) => aspect.orb <= 5)
    .flatMap((aspect) => {
      const first = planetsById.get(aspect.a);
      const second = planetsById.get(aspect.b);
      if (!first || !second) return [];
      return [{
        from: first.longitude,
        to: second.longitude,
        color: aspectColors[aspect.type],
      }];
    });

  const stars = [
    [60, 67], [94, 43], [205, 48], [261, 72], [43, 130], [282, 119],
    [71, 232], [116, 273], [202, 267], [254, 230], [155, 35], [35, 190],
  ];

  return (
    <svg viewBox="0 0 320 320" className={className} role="img" aria-label="Carta natal">
      <defs>
        <radialGradient id="void" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#182b48" />
          <stop offset="72%" stopColor="#0b1930" />
          <stop offset="100%" stopColor="#071020" />
        </radialGradient>
        <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f0d99b" />
          <stop offset="50%" stopColor="#b8914e" />
          <stop offset="100%" stopColor="#e8d29a" />
        </linearGradient>
      </defs>
      <circle cx={cx} cy={cy} r="153" fill="#0a1426" stroke="url(#gold)" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r="148" fill="url(#void)" stroke="#927447" strokeOpacity="0.8" />
      <circle cx={cx} cy={cy} r="119" fill="none" stroke="#d1b579" strokeOpacity="0.82" strokeWidth="1.2" />
      <circle cx={cx} cy={cy} r="115" fill="none" stroke="#d1b579" strokeOpacity="0.25" strokeWidth="0.7" />
      <circle cx={cx} cy={cy} r="78" fill="none" stroke="#d1b579" strokeOpacity="0.6" strokeWidth="1" />
      <circle cx={cx} cy={cy} r="64" fill="none" stroke="#d1b579" strokeOpacity="0.26" strokeWidth="0.7" />

      {stars.map(([x, y], index) => (
        <circle
          key={index}
          cx={x}
          cy={y}
          r={index % 3 === 0 ? 1.5 : 0.9}
          fill="#f0d99b"
          fillOpacity={index % 2 === 0 ? 0.75 : 0.42}
        />
      ))}

      {aspects.map((aspect, index) => {
        const from = xy(aspect.from, 62);
        const to = xy(aspect.to, 62);
        return (
          <line
            key={index}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={aspect.color}
            strokeOpacity="0.62"
            strokeWidth="1.1"
          />
        );
      })}

      {Array.from({ length: 12 }, (_, i) => {
        const lon = chart.houses[i];
        const outer = xy(lon, 148);
        const inner = xy(lon, 78);
        return (
          <g key={i}>
            <line
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke={i % 3 === 0 ? "#d9bd7c" : "#d9bd7c"}
              strokeOpacity={i % 3 === 0 ? 0.78 : 0.3}
              strokeWidth={i % 3 === 0 ? 1.3 : 0.75}
            />
          </g>
        );
      })}

      {Array.from({ length: 12 }, (_, i) => {
        const longitude = i * 30 + 15;
        const glyphPos = xy(longitude, 133);
        const sign = signFromLongitude(longitude);
        return (
          <text
            key={i}
            x={glyphPos.x}
            y={glyphPos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#e4cf97"
            fontSize="12"
            fontFamily="serif"
          >
            {SIGN_GLYPHS[sign.signIndex]}
          </text>
        );
      })}

      {RING_PLANETS.map((id) => {
        const p = chart.planets.find((x) => x.id === id);
        if (!p) return null;
        const pos = xy(p.longitude, 98);
        return (
          <g key={id}>
            <circle cx={pos.x} cy={pos.y} r="10.5" fill="#101a2c" stroke="#d2b675" strokeOpacity="0.86" />
            <text
              x={pos.x}
              y={pos.y + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={id === "sun" || id === "moon" ? "#f0d99b" : "#f5ead0"}
              fontSize="12"
              fontFamily="serif"
            >
              {PLANET_META[id].glyph}
            </text>
          </g>
        );
      })}

      <circle cx={cx} cy={cy} r="31" fill="#0c1729" fillOpacity="0.9" stroke="#d1b579" strokeOpacity="0.46" />
      <text x={cx} y={cy - 5} textAnchor="middle" fill="#edcf88" fontSize="10" fontFamily="serif" letterSpacing="1.5">
        ASCENDENTE
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#f6edd9" fontSize="12" fontFamily="serif">
        {chart.triad.asc.sign}
      </text>
    </svg>
  );
}
