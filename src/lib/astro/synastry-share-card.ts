import {
  ASPECT_META,
  PLANET_META,
  SIGN_GLYPHS,
} from "@/lib/astro/constants";
import type { SynastryAspect, SynastryResult } from "@/lib/types";
import {
  buildSynastryCompatibilityOverview,
  buildSynastrySummary,
  describeSynastryAspect,
} from "./synastry-summary";

const CARD_WIDTH = 720;
const CARD_HEIGHT = 1280;
const IMAGE_WIDTH = 768;
const IMAGE_HEIGHT = 1365;
const ASPECT_GLYPHS = {
  conjunction: "☌",
  sextile: "⚹",
  square: "□",
  trine: "△",
  opposition: "☍",
} as const;
const SIGN_GLYPH_COLORS = [
  "#ff9875",
  "#a8d98c",
  "#77ddeb",
  "#9aabff",
  "#ffc766",
  "#91d6aa",
  "#83dfff",
  "#d29aff",
  "#ff9c6e",
  "#c6d28a",
  "#75dcff",
  "#b89cff",
] as const;
const PLANET_GLYPH_COLORS: Record<keyof typeof PLANET_META, string> = {
  sun: "#ffd166",
  moon: "#c5d2ff",
  mercury: "#7ce5cf",
  venus: "#ff91cf",
  mars: "#ff806f",
  jupiter: "#c19aff",
  saturn: "#dcc18c",
  uranus: "#72ddf5",
  neptune: "#929fff",
  pluto: "#e89aff",
  node: "#8ce0c5",
  asc: "#ffbd7d",
};
const ASPECT_GLYPH_COLORS: Record<keyof typeof ASPECT_GLYPHS, string> = {
  conjunction: "#ff91d2",
  sextile: "#78ead1",
  square: "#ff887e",
  trine: "#83dfff",
  opposition: "#c59cff",
};

function drawText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth?: number,
  glowColor?: string,
): void {
  context.save();
  const fontSize = Number.parseFloat(context.font.match(/\d+(?:\.\d+)?px/)?.[0] ?? "16");
  context.lineJoin = "round";
  context.lineWidth = Math.min(7, Math.max(4, fontSize * 0.19));
  context.strokeStyle = "rgba(3, 4, 16, 0.98)";
  context.strokeText(text, x, y, maxWidth);
  context.shadowColor = glowColor ?? "rgba(1, 2, 12, 1)";
  context.shadowBlur = glowColor ? 16 : 13;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = glowColor ? 0 : 4;
  if (maxWidth === undefined) {
    context.fillText(text, x, y);
  } else {
    context.fillText(text, x, y, maxWidth);
  }
  context.restore();
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 2,
): number {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (let index = 0; index < words.length; index += 1) {
    const candidate = line ? `${line} ${words[index]}` : words[index];
    if (context.measureText(candidate).width <= maxWidth || !line) {
      line = candidate;
      continue;
    }

    lines.push(line);
    line = words[index];
    if (lines.length === maxLines - 1 && index < words.length - 1) {
      lines.push(context.measureText(line).width > maxWidth ? "…" : line);
      line = "";
      break;
    }
  }

  if (line && lines.length < maxLines) lines.push(line);
  lines.forEach((text, index) => {
    drawText(context, text, x, y + index * lineHeight);
  });
  return lines.length * lineHeight;
}

function drawFitText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontFamily: string,
  weight = "700",
  startSize = 24,
  minSize = 14,
): void {
  let size = startSize;
  while (size > minSize) {
    context.font = `${weight} ${size}px ${fontFamily}`;
    if (context.measureText(text).width <= maxWidth) break;
    size -= 1;
  }
  context.font = `${weight} ${size}px ${fontFamily}`;
  drawText(context, text, x, y, maxWidth);
}

function loadCardBackground(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("No se pudo cargar el fondo de la tarjeta."));
    image.src = "/synastry-share-background.png";
  });
}

function drawBackground(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
): void {
  context.drawImage(image, 0, 0, CARD_WIDTH, CARD_HEIGHT);
}

function drawHarmonyEmblem(
  context: CanvasRenderingContext2D,
  score: number,
  connectionLabel: string,
): void {
  const centerX = CARD_WIDTH / 2;
  const centerY = 625;
  const glow = context.createRadialGradient(
    centerX,
    centerY,
    16,
    centerX,
    centerY,
    184,
  );
  glow.addColorStop(0, "rgba(231, 183, 104, 0.36)");
  glow.addColorStop(1, "rgba(231, 183, 104, 0)");
  context.fillStyle = glow;
  context.fillRect(centerX - 190, centerY - 190, 380, 380);

  context.strokeStyle = "rgba(233, 195, 126, 0.62)";
  context.lineWidth = 1;
  for (const radius of [108, 132, 156]) {
    context.beginPath();
    context.ellipse(centerX, centerY, radius, radius * 0.39, 0, 0, Math.PI * 2);
    context.stroke();
  }
  for (let index = 0; index < 24; index += 1) {
    const angle = (index / 24) * Math.PI * 2;
    context.beginPath();
    context.moveTo(
      centerX + Math.cos(angle) * 104,
      centerY + Math.sin(angle) * 104,
    );
    context.lineTo(
      centerX + Math.cos(angle) * 124,
      centerY + Math.sin(angle) * 124,
    );
    context.stroke();
  }

  context.beginPath();
  context.arc(centerX, centerY, 98, 0, Math.PI * 2);
  context.fillStyle = "#0e1028";
  context.fill();
  context.strokeStyle = "#edcb7f";
  context.lineWidth = 4;
  context.stroke();
  context.textAlign = "center";
  context.fillStyle = "#fff2ce";
  context.font = "700 62px Georgia, serif";
  drawText(context, `${score}%`, centerX, centerY + 13);
  context.fillStyle = "#f1d28d";
  context.font = "700 11px Arial, sans-serif";
  drawText(context, connectionLabel, centerX, centerY + 43, 168);
}

function drawConnection(
  context: CanvasRenderingContext2D,
  aspect: SynastryAspect,
  index: number,
): void {
  const centerX = 129 + index * 231;
  const insight = describeSynastryAspect(aspect);

  context.textAlign = "center";
  context.fillStyle = PLANET_GLYPH_COLORS[aspect.a];
  context.font = "38px 'Segoe UI Symbol', 'Arial Unicode MS', serif";
  drawText(
    context,
    PLANET_META[aspect.a].glyph,
    centerX - 43,
    798,
    undefined,
    PLANET_GLYPH_COLORS[aspect.a],
  );
  context.fillStyle = ASPECT_GLYPH_COLORS[aspect.type];
  context.font = "24px 'Segoe UI Symbol', 'Arial Unicode MS', serif";
  drawText(
    context,
    ASPECT_GLYPHS[aspect.type],
    centerX,
    798,
    undefined,
    ASPECT_GLYPH_COLORS[aspect.type],
  );
  context.fillStyle = PLANET_GLYPH_COLORS[aspect.b];
  context.font = "38px 'Segoe UI Symbol', 'Arial Unicode MS', serif";
  drawText(
    context,
    PLANET_META[aspect.b].glyph,
    centerX + 43,
    798,
    undefined,
    PLANET_GLYPH_COLORS[aspect.b],
  );

  context.fillStyle = "#f3d9a1";
  context.font = "700 11px Arial, sans-serif";
  drawText(
    context,
    `${PLANET_META[aspect.a].name} & ${PLANET_META[aspect.b].name}`.toLocaleUpperCase("es"),
    centerX,
    825,
    198,
  );
  context.fillStyle = "#fff3d4";
  context.font = "700 13px Arial, sans-serif";
  drawWrappedText(
    context,
    insight.title.toLocaleUpperCase("es"),
    centerX,
    848,
    198,
    17,
    2,
  );
  context.fillStyle = "#e9c987";
  context.font = "600 12px Arial, sans-serif";
  drawText(
    context,
    ASPECT_META[aspect.type].name.toLocaleUpperCase("es"),
    centerX,
    882,
    198,
  );
  context.fillStyle = "#e6e2eb";
  context.font = "12px Arial, sans-serif";
  drawWrappedText(context, insight.explanation, centerX, 906, 198, 17, 3);
}

function connectionLabel(score: number): string {
  if (score >= 85) return "CONEXIÓN ALTA";
  if (score >= 70) return "AFINIDAD FAVORABLE";
  if (score >= 55) return "POTENCIAL DE ARMONÍA";
  return "DINÁMICA EN DESARROLLO";
}

export async function createSynastryShareCard(
  nameA: string,
  nameB: string,
  result: SynastryResult,
): Promise<Blob> {
  const canvasBackground = await loadCardBackground();
  const canvas = document.createElement("canvas");
  canvas.width = IMAGE_WIDTH;
  canvas.height = IMAGE_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Este navegador no permite generar la tarjeta.");
  context.scale(IMAGE_WIDTH / CARD_WIDTH, IMAGE_HEIGHT / CARD_HEIGHT);

  const summary = buildSynastrySummary(result);
  const overview = buildSynastryCompatibilityOverview(summary);
  drawBackground(context, canvasBackground);

  context.textAlign = "center";
  context.fillStyle = "#e9ce95";
  context.font = "700 22px Arial, sans-serif";
  drawText(context, "ASTRARED.VIP", CARD_WIDTH / 2, 176);

  context.fillStyle = "#fff8eb";
  context.font = "700 48px Georgia, serif";
  drawText(context, "SINASTRÍA CÓSMICA", CARD_WIDTH / 2, 230, 620);
  context.fillStyle = "#e9ce95";
  context.font = "600 16px Arial, sans-serif";
  drawText(context, "REPORTE DE COMPATIBILIDAD", CARD_WIDTH / 2, 278);

  context.fillStyle = "#f0d7a5";
  context.font = "700 15px Arial, sans-serif";
  drawText(context, "SINASTRÍA PARA", CARD_WIDTH / 2, 354);
  context.fillStyle = "#fff8eb";
  drawFitText(
    context,
    nameA,
    205,
    420,
    250,
    "Arial, sans-serif",
    "700",
    31,
    16,
  );
  context.fillStyle = "#efb0c1";
  context.font = "700 20px Arial, sans-serif";
  drawText(context, "Y", CARD_WIDTH / 2, 420);
  context.fillStyle = "#fff8eb";
  drawFitText(
    context,
    nameB,
    CARD_WIDTH - 205,
    420,
    250,
    "Arial, sans-serif",
    "700",
    31,
    16,
  );
  if (result.charts) {
    const signA = result.charts.a.triad.sun.signIndex;
    const signB = result.charts.b.triad.sun.signIndex;
    context.font = "30px 'Segoe UI Symbol', 'Arial Unicode MS', serif";
    drawText(
      context,
      SIGN_GLYPHS[signA],
      205,
      456,
      undefined,
      SIGN_GLYPH_COLORS[signA],
    );
    drawText(
      context,
      SIGN_GLYPHS[signB],
      CARD_WIDTH - 205,
      456,
      undefined,
      SIGN_GLYPH_COLORS[signB],
    );
  }

  context.fillStyle = "#e9ce95";
  context.font = "700 15px Arial, sans-serif";
  drawText(context, "PUNTUACIÓN DE ARMONÍA CÓSMICA", CARD_WIDTH / 2, 510);
  drawHarmonyEmblem(context, summary.score, connectionLabel(summary.score));

  context.fillStyle = "#f0d7a5";
  context.font = "700 18px Arial, sans-serif";
  drawText(context, "PUNTOS CLAVE DE CONEXIÓN", CARD_WIDTH / 2, 758);

  if (summary.highlights.length === 0) {
    context.fillStyle = "#e6e2eb";
    context.font = "15px Arial, sans-serif";
    drawText(
      context,
      "No hay contactos disponibles para destacar.",
      CARD_WIDTH / 2,
      838,
    );
  } else {
    summary.highlights.forEach((aspect, index) =>
      drawConnection(context, aspect, index),
    );
  }

  context.strokeStyle = "rgba(235, 201, 140, 0.38)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(48, 975);
  context.lineTo(CARD_WIDTH - 48, 975);
  context.stroke();

  context.textAlign = "center";
  context.fillStyle = "#f0d7a5";
  context.font = "700 22px Arial, sans-serif";
  drawText(context, "RESUMEN DE LA CONEXIÓN", CARD_WIDTH / 2, 1000);

  context.textAlign = "left";
  context.fillStyle = "#fff2ce";
  context.font = "700 16px Arial, sans-serif";
  drawText(
    context,
    `COMPATIBILIDAD GLOBAL: ${overview.compatibility.toLocaleUpperCase("es")}`,
    58,
    1038,
    CARD_WIDTH - 116,
  );
  context.fillStyle = "#e9c987";
  context.font = "700 15px Arial, sans-serif";
  drawText(context, "RETOS POTENCIALES:", 58, 1072);
  context.fillStyle = "#e6e2eb";
  context.font = "14px Arial, sans-serif";
  drawWrappedText(context, overview.challenges, 58, 1093, CARD_WIDTH - 116, 20, 2);

  context.fillStyle = "#e9c987";
  context.font = "700 15px Arial, sans-serif";
  drawText(context, "REGALO CÓSMICO:", 58, 1140);
  context.fillStyle = "#e6e2eb";
  context.font = "14px Arial, sans-serif";
  drawWrappedText(context, overview.strengths, 58, 1161, CARD_WIDTH - 116, 20, 2);

  context.textAlign = "center";
  context.fillStyle = "#f4dfb4";
  context.font = "600 14px Arial, sans-serif";
  drawText(
    context,
    `${summary.total} contactos · ${summary.harmonious} armónicos · ${summary.challenging} de ajuste`,
    CARD_WIDTH / 2,
    1212,
    CARD_WIDTH - 96,
  );

  if (summary.timeApproximate) {
    context.fillStyle = "#ddd5e3";
    context.font = "12px Arial, sans-serif";
    drawText(
      context,
      "Hora aproximada: se omiten contactos de Luna y Ascendente.",
      CARD_WIDTH / 2,
      1233,
      CARD_WIDTH - 90,
    );
  }

  context.fillStyle = "#e7c77f";
  for (let index = 0; index < 5; index += 1) {
    const x = CARD_WIDTH / 2 + (index - 2) * 22;
    context.beginPath();
    context.arc(x, 1260, 3, 0, Math.PI * 2);
    context.fill();
  }

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("No se pudo exportar la tarjeta como imagen."));
    }, "image/png");
  });
}
