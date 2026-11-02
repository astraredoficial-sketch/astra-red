import { jsPDF } from "jspdf";
import type {
  AspectName,
  NatalChart,
  PlanetId,
  SynastryAspect,
  SynastryResult,
} from "@/lib/types";
import { ASPECT_META, PLANET_META } from "./constants";
import { buildSynastrySummary } from "./synastry-summary";

const COLORS = {
  background: [8, 20, 38] as [number, number, number],
  gold: [230, 196, 126] as [number, number, number],
  blue: [143, 201, 232] as [number, number, number],
  text: [38, 48, 65] as [number, number, number],
  muted: [105, 115, 130] as [number, number, number],
  conjunction: [190, 145, 65] as [number, number, number],
  sextile: [70, 145, 120] as [number, number, number],
  square: [190, 90, 80] as [number, number, number],
  trine: [75, 125, 175] as [number, number, number],
  opposition: [145, 105, 175] as [number, number, number],
};

const PLANET_ORDER: PlanetId[] = [
  "sun", "moon", "mercury", "venus", "mars",
  "jupiter", "saturn", "uranus", "neptune", "pluto", "node",
];

const ASPECT_ORDER: AspectName[] = [
  "conjunction", "opposition", "trine", "sextile", "square",
];

const PLANET_LABELS: Record<PlanetId, string> = {
  sun: "SOL",
  moon: "LUN",
  mercury: "MER",
  venus: "VEN",
  mars: "MAR",
  jupiter: "JUP",
  saturn: "SAT",
  uranus: "URA",
  neptune: "NEP",
  pluto: "PLU",
  node: "N.N.",
  asc: "ASC",
};

const SIGNS = [
  "ARI", "TAU", "GEM", "CÁN",
  "LEO", "VIR", "LIB", "ESC",
  "SAG", "CAP", "ACU", "PIS",
];

function normalize(value: number): number {
  return ((value % 360) + 360) % 360;
}

function polar(
  longitude: number,
  radius: number,
  cx: number,
  cy: number,
) {
  const angle = ((normalize(longitude) - 90) * Math.PI) / 180;

  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function houseMidpoint(start: number, end: number): number {
  return normalize(start + normalize(end - start) / 2);
}


function aspectColor(type: AspectName) {
  return COLORS[type];
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

function visiblePlanet(id: PlanetId, chart: NatalChart): boolean {
  if (id === "asc") return false;
  if (chart.timeUnknown && id === "moon") return false;
  return true;
}

function visibleAspects(
  aspects: SynastryAspect[],
  chartA: NatalChart,
  chartB: NatalChart,
): SynastryAspect[] {
  const planetsA = new Map(chartA.planets.map((planet) => [planet.id, planet]));
  const planetsB = new Map(chartB.planets.map((planet) => [planet.id, planet]));

  return aspects.filter((aspect) => {
    if (
      chartA.timeUnknown &&
      (aspect.a === "moon" || aspect.a === "asc")
    ) return false;

    if (
      chartB.timeUnknown &&
      (aspect.b === "moon" || aspect.b === "asc")
    ) return false;

    return Boolean(
      planetsA.has(aspect.a) &&
      planetsB.has(aspect.b) &&
      visiblePlanet(aspect.a, chartA) &&
      visiblePlanet(aspect.b, chartB),
    );
  });
}

function drawWheel(
  doc: jsPDF,
  chartA: NatalChart,
  chartB: NatalChart,
  aspects: SynastryAspect[],
  nameA: string,
  nameB: string,
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const cx = pageWidth / 2;
  const cy = 143;
  const scale = 0.34;
  const radius = 210 * scale;

  const r = (value: number) => value * scale;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.text);
  doc.text("Rueda doble de sinastría", 15, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`${nameA} · Persona A`, 15, 25);
  doc.setTextColor(80, 130, 165);
  doc.text(`${nameB} · Persona B`, 15, 31);

  doc.setDrawColor(201, 169, 107);
  doc.setLineWidth(0.35);
  doc.circle(cx, cy, radius);

  doc.setDrawColor(...COLORS.gold);
  doc.circle(cx, cy, r(199));
  doc.setDrawColor(...COLORS.blue);
  doc.circle(cx, cy, r(181));

  for (let index = 0; index < 12; index++) {
    const longitude = index * 30;

    const outerA = polar(longitude, r(207), cx, cy);
    const innerA = polar(longitude, r(199), cx, cy);
    const outerB = polar(longitude, r(187), cx, cy);
    const innerB = polar(longitude, r(181), cx, cy);

    doc.setDrawColor(...COLORS.gold);
    doc.line(innerA.x, innerA.y, outerA.x, outerA.y);

    doc.setDrawColor(...COLORS.blue);
    doc.line(innerB.x, innerB.y, outerB.x, outerB.y);

    const signPosition = polar(longitude + 15, r(202), cx, cy);
    const innerSignPosition = polar(longitude + 15, r(173), cx, cy);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.5);
    doc.setTextColor(...COLORS.gold);
    doc.text(SIGNS[index], signPosition.x, signPosition.y, {
      align: "center",
    });

    doc.setTextColor(...COLORS.blue);
    doc.text(SIGNS[index], innerSignPosition.x, innerSignPosition.y, {
      align: "center",
    });
  }

  if (!chartA.timeUnknown) {
    doc.setDrawColor(...COLORS.gold);
    doc.circle(cx, cy, r(155));

    chartA.houses.forEach((cusp, index) => {
      const outer = polar(cusp, r(155), cx, cy);
      const inner = polar(cusp, r(112), cx, cy);
      const label = polar(
        houseMidpoint(cusp, chartA.houses[(index + 1) % 12]),
        r(143),
        cx,
        cy,
      );

      doc.setDrawColor(...COLORS.gold);
      doc.setLineWidth(index % 3 === 0 ? 0.35 : 0.18);
      doc.line(inner.x, inner.y, outer.x, outer.y);

      doc.setFontSize(4.5);
      doc.setTextColor(...COLORS.gold);
      doc.text(String(index + 1), label.x, label.y, { align: "center" });
    });
  }

  if (!chartB.timeUnknown) {
    doc.setDrawColor(...COLORS.blue);
    doc.circle(cx, cy, r(105));

    chartB.houses.forEach((cusp, index) => {
      const outer = polar(cusp, r(105), cx, cy);
      const inner = polar(cusp, r(59), cx, cy);
      const label = polar(
        houseMidpoint(cusp, chartB.houses[(index + 1) % 12]),
        r(94),
        cx,
        cy,
      );

      doc.setDrawColor(...COLORS.blue);
      doc.setLineWidth(index % 3 === 0 ? 0.35 : 0.18);
      doc.line(inner.x, inner.y, outer.x, outer.y);

      doc.setFontSize(4.5);
      doc.setTextColor(...COLORS.blue);
      doc.text(String(index + 1), label.x, label.y, { align: "center" });
    });
  }

  const planetsA = new Map(chartA.planets.map((planet) => [planet.id, planet]));
  const planetsB = new Map(chartB.planets.map((planet) => [planet.id, planet]));
  const shown = visibleAspects(aspects, chartA, chartB);

  shown.forEach((aspect) => {
    const first = planetsA.get(aspect.a);
    const second = planetsB.get(aspect.b);

    if (!first || !second) return;

    const from = polar(first.longitude, r(130), cx, cy);
    const to = polar(second.longitude, r(82), cx, cy);

    doc.setDrawColor(...aspectColor(aspect.type));
    doc.setLineWidth(0.28);
    doc.line(from.x, from.y, to.x, to.y);
  });

  for (const id of PLANET_ORDER) {
    const planet = planetsA.get(id);

    if (!planet || !visiblePlanet(id, chartA)) continue;

    const position = polar(planet.longitude, r(130), cx, cy);

    doc.setFillColor(23, 36, 58);
    doc.setDrawColor(...COLORS.gold);
    doc.circle(position.x, position.y, r(11), "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(4.5);
    doc.setTextColor(...COLORS.gold);
    doc.text(PLANET_LABELS[id], position.x, position.y + 1.8, {
      align: "center",
    });
  }

  for (const id of PLANET_ORDER) {
    const planet = planetsB.get(id);

    if (!planet || !visiblePlanet(id, chartB)) continue;

    const position = polar(planet.longitude, r(82), cx, cy);

    doc.setFillColor(16, 40, 58);
    doc.setDrawColor(...COLORS.blue);
    doc.circle(position.x, position.y, r(10), "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(4.5);
    doc.setTextColor(...COLORS.blue);
    doc.text(PLANET_LABELS[id], position.x, position.y + 1.8, {
      align: "center",
    });
  }

  doc.setFillColor(10, 23, 41);
  doc.setDrawColor(201, 169, 107);
  doc.circle(cx, cy, r(43), "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.gold);
  doc.text("SINASTRÍA", cx, cy - 1, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(245, 234, 208);
  doc.text(`${shown.length} aspectos visibles`, cx, cy + 4, {
    align: "center",
  });

  let legendY = Math.min(pageHeight - 38, cy + radius + 12);
  let legendX = 15;

  doc.setFontSize(6.5);

  for (const type of ASPECT_ORDER) {
    const label = ASPECT_META[type].name;
    const itemWidth = doc.getTextWidth(label) + 14;

    if (legendX + itemWidth > pageWidth - 15) {
      legendX = 15;
      legendY += 4;
    }

    doc.setDrawColor(...aspectColor(type));
    doc.setLineWidth(0.8);
    doc.line(legendX, legendY, legendX + 5, legendY);

    doc.setTextColor(...COLORS.text);
    doc.text(label, legendX + 7, legendY + 1);

    legendX += itemWidth;
  }

  doc.setFontSize(7);
  doc.setTextColor(...COLORS.muted);

  const notes = [
    chartA.timeUnknown
      ? `${nameA}: hora desconocida; casas y Luna omitidas.`
      : `${nameA}: casas y posiciones horarias disponibles.`,
    chartB.timeUnknown
      ? `${nameB}: hora desconocida; casas y Luna omitidas.`
      : `${nameB}: casas y posiciones horarias disponibles.`,
    "Los aspectos representados proceden del cálculo guardado; no se recalculan en el PDF.",
  ];

  let noteY = pageHeight - 24;

  for (const note of notes) {
    doc.text(note, 15, noteY);
    noteY += 4;
  }
}

export async function createSynastryPdf(
  ownerName: string,
  otherName: string,
  result: SynastryResult,
  createdAt: string,
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const maxWidth = pageWidth - margin * 2;
  const summary = buildSynastrySummary(result);

  let y = 20;

  function newPage() {
    doc.addPage();
    y = 20;
  }

  function ensureSpace(height: number) {
    if (y + height > pageHeight - 18) newPage();
  }

  function heading(title: string, size = 13) {
    ensureSpace(13);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(...COLORS.text);
    doc.text(title, margin, y);
    y += size * 0.55 + 4;
  }

  function paragraph(value: string, size = 9, indent = 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(...COLORS.text);

    const lines = doc.splitTextToSize(value, maxWidth - indent);
    const lineHeight = size * 0.48 + 1.5;

    for (const line of lines) {
      ensureSpace(lineHeight);
      doc.text(line, margin + indent, y);
      y += lineHeight;
    }

    y += 2;
  }

  // Portada
  doc.setFillColor(...COLORS.background);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.6);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.gold);
  doc.text("ASTRARED.VIP", pageWidth / 2, 45, { align: "center" });

  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("SINASTRÍA CÓSMICA", pageWidth / 2, 69, { align: "center" });

  doc.setDrawColor(...COLORS.gold);
  doc.line(45, 80, pageWidth - 45, 80);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.gold);
  doc.text(doc.splitTextToSize(ownerName, 145).slice(0, 2), pageWidth / 2, 96, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("y", pageWidth / 2, 112, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.blue);
  doc.text(doc.splitTextToSize(otherName, 145).slice(0, 2), pageWidth / 2, 124, {
    align: "center",
  });

  doc.setFontSize(30);
  doc.setTextColor(...COLORS.gold);
  doc.text(`${summary.score}/100`, pageWidth / 2, 163, { align: "center" });

  doc.setFontSize(8);
  doc.setTextColor(230, 230, 230);
  doc.text("Compatibilidad astrológica", pageWidth / 2, 174, {
    align: "center",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.gold);
  doc.text("CONTACTOS DESTACADOS", margin, 211);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(245, 234, 208);

  if (summary.highlights.length === 0) {
    doc.text("No hay contactos disponibles para destacar.", margin, 224);
  } else {
    summary.highlights.forEach((aspect, index) => {
      const line =
        `${index + 1}. ${PLANET_META[aspect.a].name} de A — ` +
        `${ASPECT_META[aspect.type].name} — ` +
        `${PLANET_META[aspect.b].name} de B · orbe ${aspect.orb.toFixed(2)}°`;
      doc.text(doc.splitTextToSize(line, maxWidth), margin, 224 + index * 12);
    });
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(230, 230, 230);
  doc.text(
    `${summary.total} contactos · ${summary.harmonious} armónicos · ` +
      `${summary.challenging} de ajuste · ${summary.conjunctions} conjunciones`,
    pageWidth / 2,
    260,
    { align: "center" },
  );
  if (summary.timeApproximate) {
    doc.text(
      "Hora aproximada: se omiten contactos de Luna y Ascendente.",
      pageWidth / 2,
      268,
      { align: "center" },
    );
  }
  doc.setFontSize(7);
  doc.text(
    `Calculado: ${formatDate(createdAt)}`,
    pageWidth / 2,
    278,
    { align: "center" },
  );

  // Detalle de aspectos
  newPage();
  heading("Aspectos registrados", 15);
  paragraph(
    "Se muestran los contactos calculados con sus datos guardados. " +
      "El orbe y la separación angular no se recalculan en el PDF.",
  );

  for (const type of ASPECT_ORDER) {
    const group = summary.aspects.filter((aspect) => aspect.type === type);
    if (group.length === 0) continue;

    heading(`${ASPECT_META[type].name} (${group.length})`, 10);
    for (const aspect of group) {
      paragraph(
        `${PLANET_META[aspect.a].name} de A — ${PLANET_META[aspect.b].name} de B`,
        8.5,
      );
      paragraph(
        `Orbe ${aspect.orb.toFixed(2)}° · separación ${aspect.exactAngle.toFixed(2)}°`,
        8,
        3,
      );
    }
  }

  heading("Criterio de lectura", 12);
  paragraph(
    "Este informe reúne los contactos planetarios entre ambas cartas para " +
      "explorar sus dinámicas.",
  );

  // Rueda doble
  if (result.charts) {
    newPage();

    drawWheel(
      doc,
      result.charts.a,
      result.charts.b,
      result.aspects,
      ownerName,
      otherName,
    );
  } else {
    newPage();
    heading("Rueda doble de sinastría", 14);
    paragraph(
      "Este registro histórico no conserva las cartas natales originales. " +
      "Por rigor, no es posible reconstruir la rueda, las posiciones, " +
      "las casas ni los signos que no quedaron guardados.",
    );
  }

  // Numeración de todas las páginas
  const totalPages = doc.getNumberOfPages();

  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);

    if (page === 1) continue;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);

    doc.text(
      "ASTRARED · Informe de sinastría",
      margin,
      pageHeight - 8,
    );

    doc.text(
      `${page} / ${totalPages}`,
      pageWidth - margin,
      pageHeight - 8,
      { align: "right" },
    );
  }

  return doc.output("blob");
}
