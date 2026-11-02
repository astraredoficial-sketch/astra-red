import {
  ASPECT_META,
  PLANET_META,
  SIGN_GLYPHS,
} from "@/lib/astro/constants";
import type {
  NatalChart,
  PlanetId,
  SynastryAspect,
} from "@/lib/types";

type SynastryWheelProps = {
  chartA: NatalChart;
  chartB: NatalChart;
  aspects: SynastryAspect[];
  nameA: string;
  nameB: string;
};

const PLANET_ORDER: PlanetId[] = [
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

const ASPECT_COLORS = {
  conjunction: "#e6c47e",
  sextile: "#83c5ad",
  square: "#e58d85",
  trine: "#83b5df",
  opposition: "#bd9cdb",
} as const;

const PERSON_A = "#e8c77e";
const PERSON_B = "#8fc9e8";

function normalize(longitude: number): number {
  return ((longitude % 360) + 360) % 360;
}

/**
 * Referencia zodiacal común:
 * 0° Aries arriba y longitudes crecientes en sentido horario.
 * No depende del Ascendente de ninguna de las dos cartas.
 */
function polar(longitude: number, radius: number) {
  const angle = ((normalize(longitude) - 90) * Math.PI) / 180;

  return {
    x: 220 + radius * Math.cos(angle),
    y: 220 + radius * Math.sin(angle),
  };
}

function houseMidpoint(start: number, end: number): number {
  const arc = normalize(end - start);
  return normalize(start + arc / 2);
}

function isVisiblePlanet(
  id: PlanetId,
  chart: NatalChart,
): boolean {
  if (id === "asc") return false;
  if (chart.timeUnknown && id === "moon") return false;
  return true;
}

export function SynastryWheel({
  chartA,
  chartB,
  aspects,
  nameA,
  nameB,
}: SynastryWheelProps) {
  const planetsA = new Map(
    chartA.planets.map((planet) => [planet.id, planet]),
  );

  const planetsB = new Map(
    chartB.planets.map((planet) => [planet.id, planet]),
  );

  const visibleAspects = aspects.filter((aspect) => {
    if (
      chartA.timeUnknown &&
      (aspect.a === "moon" || aspect.a === "asc")
    ) {
      return false;
    }

    if (
      chartB.timeUnknown &&
      (aspect.b === "moon" || aspect.b === "asc")
    ) {
      return false;
    }

    const first = planetsA.get(aspect.a);
    const second = planetsB.get(aspect.b);

    return Boolean(
      first &&
      second &&
      isVisiblePlanet(aspect.a, chartA) &&
      isVisiblePlanet(aspect.b, chartB),
    );
  });

  return (
    <section className="space-y-4 rounded-2xl border border-amber-200/20 bg-[#081426] p-3 sm:p-5">
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-200">
          Geometría de la relación
        </p>
        <h4 className="font-serif text-xl text-white">
          Rueda doble de sinastría
        </h4>
        <p className="text-xs leading-5 text-slate-400">
          Ambas cartas comparten la misma referencia zodiacal.
          Las conexiones representan exclusivamente los aspectos
          registrados por el cálculo de sinastría.
        </p>
      </div>

      <div className="mx-auto w-full max-w-[560px]">
        <svg
          viewBox="0 0 440 440"
          className="h-auto w-full"
          role="img"
          aria-label={`Rueda doble de sinastría entre ${nameA} y ${nameB}`}
        >
          <defs>
            <radialGradient id="synastry-wheel-background">
              <stop offset="0%" stopColor="#142744" />
              <stop offset="75%" stopColor="#0b192e" />
              <stop offset="100%" stopColor="#071020" />
            </radialGradient>
          </defs>

          <circle
            cx="220"
            cy="220"
            r="210"
            fill="url(#synastry-wheel-background)"
            stroke="#c9a96b"
            strokeWidth="1.5"
          />

          {/* Anillo zodiacal común */}
          <circle
            cx="220"
            cy="220"
            r="181"
            fill="none"
            stroke={PERSON_B}
            strokeOpacity="0.7"
          />
          <circle
            cx="220"
            cy="220"
            r="199"
            fill="none"
            stroke={PERSON_A}
            strokeOpacity="0.75"
          />

          {Array.from({ length: 12 }, (_, index) => {
            const longitude = index * 30;
            const innerA = polar(longitude, 199);
            const outerA = polar(longitude, 207);
            const innerB = polar(longitude, 181);
            const outerB = polar(longitude, 187);

            return (
              <g key={`zodiac-${index}`}>
                <line
                  x1={innerA.x}
                  y1={innerA.y}
                  x2={outerA.x}
                  y2={outerA.y}
                  stroke={PERSON_A}
                  strokeOpacity="0.8"
                />
                <line
                  x1={innerB.x}
                  y1={innerB.y}
                  x2={outerB.x}
                  y2={outerB.y}
                  stroke={PERSON_B}
                  strokeOpacity="0.8"
                />
              </g>
            );
          })}

          {Array.from({ length: 12 }, (_, index) => {
            const position = polar(index * 30 + 15, 202);

            return (
              <text
                key={`sign-a-${index}`}
                x={position.x}
                y={position.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={PERSON_A}
                fontSize="13"
                fontFamily="serif"
              >
                {SIGN_GLYPHS[index]}
              </text>
            );
          })}

          {Array.from({ length: 12 }, (_, index) => {
            const position = polar(index * 30 + 15, 173);

            return (
              <text
                key={`sign-b-${index}`}
                x={position.x}
                y={position.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={PERSON_B}
                fontSize="12"
                fontFamily="serif"
              >
                {SIGN_GLYPHS[index]}
              </text>
            );
          })}

          {/* Casas de Persona A */}
          {!chartA.timeUnknown && (
            <>
              <circle
                cx="220"
                cy="220"
                r="155"
                fill="none"
                stroke={PERSON_A}
                strokeOpacity="0.65"
              />

              {chartA.houses.map((cusp, index) => {
                const outer = polar(cusp, 155);
                const inner = polar(cusp, 112);
                const label = polar(
                  houseMidpoint(
                    cusp,
                    chartA.houses[(index + 1) % 12],
                  ),
                  143,
                );

                return (
                  <g key={`house-a-${index}`}>
                    <line
                      x1={inner.x}
                      y1={inner.y}
                      x2={outer.x}
                      y2={outer.y}
                      stroke={PERSON_A}
                      strokeOpacity={index % 3 === 0 ? 0.8 : 0.35}
                      strokeWidth={index % 3 === 0 ? 1.3 : 0.8}
                    />
                    <text
                      x={label.x}
                      y={label.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={PERSON_A}
                      fontSize="9"
                    >
                      {index + 1}
                    </text>
                  </g>
                );
              })}
            </>
          )}

          {/* Casas de Persona B */}
          {!chartB.timeUnknown && (
            <>
              <circle
                cx="220"
                cy="220"
                r="105"
                fill="none"
                stroke={PERSON_B}
                strokeOpacity="0.65"
              />

              {chartB.houses.map((cusp, index) => {
                const outer = polar(cusp, 105);
                const inner = polar(cusp, 59);
                const label = polar(
                  houseMidpoint(
                    cusp,
                    chartB.houses[(index + 1) % 12],
                  ),
                  94,
                );

                return (
                  <g key={`house-b-${index}`}>
                    <line
                      x1={inner.x}
                      y1={inner.y}
                      x2={outer.x}
                      y2={outer.y}
                      stroke={PERSON_B}
                      strokeOpacity={index % 3 === 0 ? 0.8 : 0.35}
                      strokeWidth={index % 3 === 0 ? 1.3 : 0.8}
                    />
                    <text
                      x={label.x}
                      y={label.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={PERSON_B}
                      fontSize="9"
                    >
                      {index + 1}
                    </text>
                  </g>
                );
              })}
            </>
          )}

          {/* Aspectos cruzados: no se recalculan aquí */}
          {visibleAspects.map((aspect, index) => {
            const first = planetsA.get(aspect.a);
            const second = planetsB.get(aspect.b);

            if (!first || !second) return null;

            const from = polar(first.longitude, 130);
            const to = polar(second.longitude, 82);

            return (
              <line
                key={`aspect-${aspect.a}-${aspect.b}-${aspect.type}-${index}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={ASPECT_COLORS[aspect.type]}
                strokeOpacity="0.68"
                strokeWidth="1.25"
              />
            );
          })}

          {/* Planetas de Persona A */}
          {PLANET_ORDER.map((id) => {
            const planet = planetsA.get(id);

            if (!planet || !isVisiblePlanet(id, chartA)) return null;

            const position = polar(planet.longitude, 130);

            return (
              <g key={`planet-a-${id}`}>
                <circle
                  cx={position.x}
                  cy={position.y}
                  r="11"
                  fill="#17243a"
                  stroke={PERSON_A}
                  strokeWidth="1.4"
                />
                <text
                  x={position.x}
                  y={position.y + 0.5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={PERSON_A}
                  fontSize="12"
                  fontFamily="serif"
                >
                  {PLANET_META[id].glyph}
                </text>
              </g>
            );
          })}

          {/* Planetas de Persona B */}
          {PLANET_ORDER.map((id) => {
            const planet = planetsB.get(id);

            if (!planet || !isVisiblePlanet(id, chartB)) return null;

            const position = polar(planet.longitude, 82);

            return (
              <g key={`planet-b-${id}`}>
                <circle
                  cx={position.x}
                  cy={position.y}
                  r="10"
                  fill="#10283a"
                  stroke={PERSON_B}
                  strokeWidth="1.4"
                />
                <text
                  x={position.x}
                  y={position.y + 0.5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={PERSON_B}
                  fontSize="12"
                  fontFamily="serif"
                >
                  {PLANET_META[id].glyph}
                </text>
              </g>
            );
          })}

          <circle
            cx="220"
            cy="220"
            r="43"
            fill="#0a1729"
            stroke="#c9a96b"
            strokeOpacity="0.55"
          />

          <text
            x="220"
            y="214"
            textAnchor="middle"
            fill="#ead39d"
            fontSize="10"
            letterSpacing="1"
          >
            SINASTRÍA
          </text>
          <text
            x="220"
            y="230"
            textAnchor="middle"
            fill="#f5ead0"
            fontSize="9"
          >
            {visibleAspects.length} aspectos
          </text>
        </svg>
      </div>

      {/* Identificación de las dos cartas */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-amber-200/25 bg-slate-900/60 p-3">
          <div className="mb-1 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
            <p className="text-xs font-bold text-amber-200">Persona A</p>
          </div>
          <p className="truncate text-sm font-semibold text-white">{nameA}</p>
          <p className="mt-1 text-[10px] text-slate-400">
            {chartA.timeUnknown
              ? "Hora desconocida: casas y Luna omitidas"
              : "Casas y posiciones horarias disponibles"}
          </p>
        </div>

        <div className="rounded-xl border border-sky-200/25 bg-slate-900/60 p-3">
          <div className="mb-1 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-300" />
            <p className="text-xs font-bold text-sky-200">Persona B</p>
          </div>
          <p className="truncate text-sm font-semibold text-white">{nameB}</p>
          <p className="mt-1 text-[10px] text-slate-400">
            {chartB.timeUnknown
              ? "Hora desconocida: casas y Luna omitidas"
              : "Casas y posiciones horarias disponibles"}
          </p>
        </div>
      </div>

      {/* Leyenda de aspectos */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-700/70 pt-3">
        {(
          Object.keys(ASPECT_COLORS) as Array<keyof typeof ASPECT_COLORS>
        ).map((type) => (
          <div key={type} className="flex items-center gap-1.5">
            <span
              className="h-2 w-5 rounded-full"
              style={{ backgroundColor: ASPECT_COLORS[type] }}
            />
            <span className="text-[10px] text-slate-300">
              {ASPECT_META[type].name}
            </span>
          </div>
        ))}
      </div>

      <p className="text-[10px] leading-4 text-slate-500">
        Los números de las casas pertenecen a cada carta y sus cúspides
        originales. Cuando se desconoce una hora natal, no se representan
        casas, Ascendente ni Luna como posiciones exactas.
      </p>
    </section>
  );
}