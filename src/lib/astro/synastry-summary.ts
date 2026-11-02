import type { PlanetId, SynastryAspect, SynastryResult } from "@/lib/types";
import { ASPECT_META, PLANET_META } from "./constants";
import { synastryAspectContribution } from "./synastry";

export type SynastrySummary = {
  score: number;
  aspects: SynastryAspect[];
  total: number;
  harmonious: number;
  challenging: number;
  conjunctions: number;
  highlights: SynastryAspect[];
  timeApproximate: boolean;
};

export type SynastryAspectInsight = {
  title: string;
  explanation: string;
};

export type SynastryCompatibilityOverview = {
  compatibility: string;
  challenges: string;
  strengths: string;
};

const PLANET_THEMES: Record<PlanetId, string> = {
  sun: "identidad",
  moon: "emociones",
  mercury: "comunicación",
  venus: "afecto",
  mars: "iniciativa",
  jupiter: "crecimiento",
  saturn: "compromiso",
  uranus: "libertad",
  neptune: "sensibilidad",
  pluto: "transformación",
  node: "dirección personal",
  asc: "presencia",
};

function aspectContent(aspect: SynastryAspect): {
  title: string;
  theme: string;
} {
  const planets = new Set([aspect.a, aspect.b]);
  if (planets.has("sun") && planets.has("moon")) {
    return {
      title: "Compatibilidad profunda y emocional",
      theme: "la identidad y las necesidades emocionales",
    };
  }
  if (planets.has("venus") && planets.has("mars")) {
    return {
      title: "Pasión y romance",
      theme: "el afecto, la atracción y el deseo",
    };
  }
  if (planets.has("mercury") && planets.has("jupiter")) {
    return {
      title: "Comunicación y crecimiento",
      theme: "la comunicación y la expansión de ideas",
    };
  }
  const theme = `${PLANET_THEMES[aspect.a]} y ${PLANET_THEMES[aspect.b]}`;
  return { title: theme, theme };
}

export function describeSynastryAspect(
  aspect: SynastryAspect,
): SynastryAspectInsight {
  const { title, theme } = aspectContent(aspect);
  const explanations = {
    conjunction: `Intensifica la interacción entre ${theme}.`,
    sextile: `Facilita la afinidad entre ${theme}.`,
    square: `Pide diálogo y acuerdos entre ${theme}.`,
    trine: `Favorece la armonía entre ${theme}.`,
    opposition: `Invita a equilibrar ${theme}.`,
  } satisfies Record<SynastryAspect["type"], string>;

  return { title, explanation: explanations[aspect.type] };
}

function strongestThemes(aspects: SynastryAspect[]): string {
  const themes = [...aspects]
    .sort(
      (a, b) =>
        synastryAspectContribution(b) - synastryAspectContribution(a),
    )
    .map((aspect) => describeSynastryAspect(aspect).title);
  return [...new Set(themes)].slice(0, 2).join(" · ");
}

export function buildSynastryCompatibilityOverview(
  summary: SynastrySummary,
): SynastryCompatibilityOverview {
  const compatibility =
    summary.score >= 85
      ? "Excelente"
      : summary.score >= 70
        ? "Alta"
        : summary.score >= 55
          ? "Favorable"
          : "En desarrollo";
  const challenges = strongestThemes(
    summary.aspects.filter(
      ({ type }) => type === "square" || type === "opposition",
    ),
  );
  const strengths = strongestThemes(
    summary.aspects.filter(
      ({ type }) => type === "trine" || type === "sextile",
    ),
  );

  return {
    compatibility,
    challenges: challenges || "Sin retos destacados",
    strengths: strengths || "Sin fortalezas destacadas",
  };
}

export function buildSynastrySummary(
  result: SynastryResult,
): SynastrySummary {
  const aspects = result.aspects.filter((aspect) => {
    if (
      result.timeApproximate &&
      (aspect.a === "moon" ||
        aspect.a === "asc" ||
        aspect.b === "moon" ||
        aspect.b === "asc")
    ) {
      return false;
    }
    return true;
  });

  return {
    score: result.percent,
    aspects,
    total: aspects.length,
    harmonious: aspects.filter(
      ({ type }) => type === "trine" || type === "sextile",
    ).length,
    challenging: aspects.filter(
      ({ type }) => type === "square" || type === "opposition",
    ).length,
    conjunctions: aspects.filter(({ type }) => type === "conjunction").length,
    highlights: [...aspects]
      .sort(
        (a, b) =>
          synastryAspectContribution(b) - synastryAspectContribution(a),
      )
      .slice(0, 3),
    timeApproximate: result.timeApproximate,
  };
}

function aspectLine(
  aspect: SynastryAspect,
  ownerName: string,
  otherName: string,
): string {
  return (
    `${PLANET_META[aspect.a].name} de ${ownerName} · ` +
    `${ASPECT_META[aspect.type].name} · ` +
    `${PLANET_META[aspect.b].name} de ${otherName} ` +
    `(orbe ${aspect.orb.toFixed(2)}°)`
  );
}

export function buildSynastrySummaryText(
  ownerName: string,
  otherName: string,
  result: SynastryResult,
): string {
  const summary = buildSynastrySummary(result);
  const highlights = summary.highlights.length
    ? summary.highlights
        .map((aspect) => {
          const insight = describeSynastryAspect(aspect);
          return (
            `• ${aspectLine(aspect, ownerName, otherName)}\n` +
            `  ${insight.title}: ${insight.explanation}`
          );
        })
        .join("\n")
    : "• No hay contactos disponibles para destacar.";
  const overview = buildSynastryCompatibilityOverview(summary);

  const timeNote = summary.timeApproximate
    ? "\nAl menos una hora de nacimiento es aproximada; no se incluyen contactos de Luna ni Ascendente."
    : "";

  return [
    "SINASTRÍA · ASTRARED",
    `${ownerName} y ${otherName}`,
    `Compatibilidad astrológica: ${summary.score}/100.`,
    `Compatibilidad global: ${overview.compatibility}.`,
    "",
    "CONTACTOS DESTACADOS",
    highlights,
    "",
    `Retos potenciales: ${overview.challenges}.`,
    `Regalo cósmico: ${overview.strengths}.`,
    `Resumen: ${summary.total} contactos · ${summary.harmonious} armónicos · ${summary.challenging} de ajuste · ${summary.conjunctions} conjunciones.`,
    `${timeNote ? `${timeNote.trim()}\n` : ""}Lectura astrológica basada en los aspectos planetarios entre ambas cartas.`,
    "astrared.vip/guias/sinastria",
  ].join("\n");
}
