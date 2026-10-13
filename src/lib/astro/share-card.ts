import { formatDegree, PLANET_META, signFromLongitude, SIGN_GLYPHS } from "@/lib/astro/constants";
import type { PlanetReading } from "@/lib/astro/interpreter";
import type { NatalChart, PlanetId } from "@/lib/types";

const CARD_WIDTH = 1200;
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

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (character) => {
    const entities: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      '"': "&quot;",
      "'": "&apos;",
    };
    return entities[character];
  });
}

function wrapText(text: string, maxCharacters: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    if (line && `${line} ${word}`.length > maxCharacters) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function textBlock(
  text: string,
  x: number,
  y: number,
  maxCharacters: number,
  fontSize = 26,
  lineHeight = 38,
) {
  const lines = wrapText(text, maxCharacters);
  return {
    height: lines.length * lineHeight,
    svg: lines
      .map(
        (line, index) =>
          `<text x="${x}" y="${y + index * lineHeight}" fill="#e8dfca" font-family="serif" font-size="${fontSize}">${escapeXml(line)}</text>`,
      )
      .join(""),
  };
}

function createWheel(chart: NatalChart, centerX: number, centerY: number) {
  const ascendant = chart.triad.asc.longitude;
  const point = (longitude: number, radius: number) => {
    const angle = ((longitude - ascendant) * Math.PI) / 180;
    return {
      x: centerX - radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  const aspects = chart.planets.flatMap((planet, index) =>
    chart.planets.slice(index + 1).flatMap((other) => {
      const separation = Math.abs(planet.longitude - other.longitude);
      const angle = Math.min(separation, 360 - separation);
      const aspect = [
        { angle: 0, color: "#dca878" },
        { angle: 60, color: "#8fb7ad" },
        { angle: 90, color: "#ce8881" },
        { angle: 120, color: "#8aacc5" },
        { angle: 180, color: "#b39bc9" },
      ].find((target) => Math.abs(angle - target.angle) <= 5);
      if (!aspect) return [];
      return [{ from: planet.longitude, to: other.longitude, color: aspect.color }];
    }),
  );

  const houseLines = chart.houses
    .map((longitude, index) => {
      const inner = point(longitude, 190);
      const outer = point(longitude, 355);
      const glyphPosition = point(longitude + 15, 323);
      const sign = signFromLongitude(longitude);
      return `
        <line x1="${inner.x}" y1="${inner.y}" x2="${outer.x}" y2="${outer.y}"
          stroke="#d5b66f" stroke-opacity="${index % 3 === 0 ? "0.8" : "0.35"}" />
        <text x="${glyphPosition.x}" y="${glyphPosition.y}" text-anchor="middle" dominant-baseline="middle"
          fill="#e8d59f" font-size="27">${SIGN_GLYPHS[sign.signIndex]}</text>`;
    })
    .join("");

  const aspectLines = aspects
    .map((aspect) => {
      const from = point(aspect.from, 175);
      const to = point(aspect.to, 175);
      return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="${aspect.color}" stroke-opacity="0.58" stroke-width="2" />`;
    })
    .join("");

  const planets = RING_PLANETS.map((id) => {
    const placement = chart.planets.find((planet) => planet.id === id);
    if (!placement) return "";
    const position = point(placement.longitude, 248);
    return `
      <circle cx="${position.x}" cy="${position.y}" r="23" fill="#111b31" stroke="#d5b66f" stroke-width="2" />
      <text x="${position.x}" y="${position.y + 1}" text-anchor="middle" dominant-baseline="middle"
        fill="#f5e8c4" font-family="serif" font-size="25">${PLANET_META[id].glyph}</text>`;
  }).join("");

  return `
    <circle cx="${centerX}" cy="${centerY}" r="375" fill="#0b1427" stroke="#d5b66f" stroke-width="3" />
    <circle cx="${centerX}" cy="${centerY}" r="355" fill="none" stroke="#d5b66f" stroke-opacity="0.7" />
    <circle cx="${centerX}" cy="${centerY}" r="270" fill="none" stroke="#d5b66f" stroke-opacity="0.42" />
    <circle cx="${centerX}" cy="${centerY}" r="190" fill="none" stroke="#d5b66f" stroke-opacity="0.3" />
    ${aspectLines}
    ${houseLines}
    ${planets}
    <circle cx="${centerX}" cy="${centerY}" r="95" fill="#0b1427" stroke="#d5b66f" stroke-opacity="0.72" />
    <text x="${centerX}" y="${centerY - 12}" text-anchor="middle" fill="#e4c77f" font-family="serif" font-size="21" letter-spacing="3">
      ASCENDENTE
    </text>
    <text x="${centerX}" y="${centerY + 30}" text-anchor="middle" fill="#f5e8c4" font-family="serif" font-size="31">
      ${escapeXml(chart.triad.asc.sign)}
    </text>`;
}

function createCardSvg(
  chart: NatalChart,
  nickname: string,
  lifeSummary: string,
  readings: PlanetReading[],
) {
  const centerX = CARD_WIDTH / 2;
  const wheelCenterY = 930;
  let cursorY = 1390;
  const sections: string[] = [];
  const cardName = escapeXml(nickname.trim() || "Tu mapa celeste");
  const triad = [
    { name: "Sol", placement: chart.triad.sun },
    { name: "Luna", placement: chart.triad.moon },
    { name: "Ascendente", placement: chart.triad.asc },
  ];
  const cellWidth = 340;
  const firstCellX = 80;

  sections.push(`
    <text x="600" y="${cursorY}" text-anchor="middle" fill="#d9bd7c" font-family="serif" font-size="28" letter-spacing="6">
      TU TRÍADA ASTRAL
    </text>
    <line x1="80" y1="${cursorY + 28}" x2="1120" y2="${cursorY + 28}" stroke="#d5b66f" stroke-opacity="0.55" />`);
  cursorY += 70;
  triad.forEach((item, index) => {
    const x = firstCellX + index * (cellWidth + 30);
    sections.push(`
      <rect x="${x}" y="${cursorY}" width="${cellWidth}" height="155" rx="22" fill="#111b31" stroke="#d5b66f" stroke-opacity="0.55" />
      <text x="${x + cellWidth / 2}" y="${cursorY + 42}" text-anchor="middle" fill="#d9bd7c" font-family="serif" font-size="25">${item.name.toUpperCase()}</text>
      <text x="${x + cellWidth / 2}" y="${cursorY + 92}" text-anchor="middle" fill="#f5e8c4" font-family="serif" font-size="35">${escapeXml(item.placement.sign)}</text>
      <text x="${x + cellWidth / 2}" y="${cursorY + 130}" text-anchor="middle" fill="#c6bb9c" font-family="serif" font-size="23">${formatDegree(item.placement.degreeInSign)}</text>`);
  });
  cursorY += 205;

  sections.push(`
    <text x="80" y="${cursorY}" fill="#d9bd7c" font-family="serif" font-size="31" letter-spacing="3">
      POSICIONES PLANETARIAS
    </text>
    <line x1="80" y1="${cursorY + 19}" x2="1120" y2="${cursorY + 19}" stroke="#d5b66f" stroke-opacity="0.55" />`);
  cursorY += 58;
  chart.planets.forEach((planet, index) => {
    const rowY = cursorY + index * 55;
    const planetName = PLANET_META[planet.id].name;
    sections.push(`
      <rect x="80" y="${rowY - 28}" width="1040" height="48" rx="12" fill="${index % 2 ? "#111b31" : "#18243a"}" fill-opacity="0.86" />
      <text x="105" y="${rowY + 4}" fill="#e8dfca" font-family="serif" font-size="23">${PLANET_META[planet.id].glyph}  ${escapeXml(planetName)}</text>
      <text x="520" y="${rowY + 4}" fill="#f5e8c4" font-family="serif" font-size="23">${escapeXml(planet.sign)} · ${formatDegree(planet.degreeInSign)}</text>
      <text x="1040" y="${rowY + 4}" text-anchor="end" fill="#c6bb9c" font-family="serif" font-size="23">Casa ${planet.house}</text>`);
  });
  cursorY += chart.planets.length * 55 + 45;

  sections.push(`
    <text x="80" y="${cursorY}" fill="#d9bd7c" font-family="serif" font-size="31" letter-spacing="3">
      CÚSPIDES DE LAS CASAS
    </text>
    <line x1="80" y1="${cursorY + 19}" x2="1120" y2="${cursorY + 19}" stroke="#d5b66f" stroke-opacity="0.55" />`);
  cursorY += 60;
  chart.houses.forEach((longitude, index) => {
    const house = signFromLongitude(longitude);
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 90 + column * 530;
    const y = cursorY + row * 48;
    sections.push(`
      <text x="${x}" y="${y}" fill="#e8dfca" font-family="serif" font-size="23">
        Casa ${index + 1} · ${escapeXml(house.sign)} ${formatDegree(house.degreeInSign)}
      </text>`);
  });
  cursorY += Math.ceil(chart.houses.length / 2) * 48 + 45;

  sections.push(`
    <text x="80" y="${cursorY}" fill="#d9bd7c" font-family="serif" font-size="31" letter-spacing="3">
      TU ESENCIA ASTRAL
    </text>
    <line x1="80" y1="${cursorY + 19}" x2="1120" y2="${cursorY + 19}" stroke="#d5b66f" stroke-opacity="0.55" />`);
  cursorY += 60;
  for (const paragraph of lifeSummary.split(/\n\n/).filter(Boolean)) {
    const block = textBlock(paragraph, 82, cursorY, 79, 24, 36);
    sections.push(block.svg);
    cursorY += block.height + 24;
  }

  sections.push(`
    <text x="80" y="${cursorY}" fill="#d9bd7c" font-family="serif" font-size="31" letter-spacing="3">
      LECTURA DE CADA PLANETA
    </text>
    <line x1="80" y1="${cursorY + 19}" x2="1120" y2="${cursorY + 19}" stroke="#d5b66f" stroke-opacity="0.55" />`);
  cursorY += 62;
  for (const reading of readings) {
    sections.push(`
      <text x="82" y="${cursorY}" fill="#f0d99b" font-family="serif" font-size="26">
        ${escapeXml(reading.title)} · ${escapeXml(reading.sign)} · Casa ${reading.house}
      </text>`);
    cursorY += 38;
    const block = textBlock(reading.interpretation, 88, cursorY, 79, 23, 34);
    sections.push(block.svg);
    cursorY += block.height + 24;
  }

  if (chart.timeUnknown) {
    const note = "La hora de nacimiento es desconocida. La Luna, el Ascendente y las casas pueden variar; interpreta esas posiciones con cautela.";
    const block = textBlock(note, 82, cursorY + 8, 79, 22, 34);
    sections.push(block.svg);
    cursorY += block.height + 24;
  }
  const footerY = cursorY + 54;
  const cardHeight = footerY + 110;
  const stars = Array.from({ length: 120 }, (_, index) => {
    const x = (index * 197 + 83) % CARD_WIDTH;
    const y = (index * 317 + 41) % cardHeight;
    const radius = index % 6 === 0 ? 2.8 : 1.5;
    return `<circle cx="${x}" cy="${y}" r="${radius}" fill="#e9d69e" opacity="${index % 2 ? "0.2" : "0.38"}" />`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${cardHeight}" viewBox="0 0 ${CARD_WIDTH} ${cardHeight}">
    <defs>
      <radialGradient id="night" cx="50%" cy="15%" r="95%">
        <stop offset="0%" stop-color="#1c2943" /><stop offset="100%" stop-color="#070a15" />
      </radialGradient>
      <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#f0d99b" /><stop offset="1" stop-color="#a88648" />
      </linearGradient>
    </defs>
    <rect width="${CARD_WIDTH}" height="${cardHeight}" fill="url(#night)" />
    ${stars}
    <rect x="28" y="28" width="${CARD_WIDTH - 56}" height="${cardHeight - 56}" rx="36" fill="none" stroke="url(#gold)" stroke-width="3" />
    <rect x="48" y="48" width="${CARD_WIDTH - 96}" height="${cardHeight - 96}" rx="28" fill="none" stroke="#d5b66f" stroke-opacity="0.35" />
    <text x="600" y="145" text-anchor="middle" fill="#d9bd7c" font-family="serif" font-size="27" letter-spacing="8">
      ASTRARED · MAPA CELESTE PERSONAL
    </text>
    <text x="600" y="245" text-anchor="middle" fill="#f5e8c4" font-family="serif" font-size="76">
      Carta natal
    </text>
    <text x="600" y="320" text-anchor="middle" fill="#e4c77f" font-family="serif" font-size="43">
      ${cardName}
    </text>
    <text x="600" y="385" text-anchor="middle" fill="#c6bb9c" font-family="serif" font-size="24">
      ${escapeXml(chart.triad.sun.sign)} · ${escapeXml(chart.triad.moon.sign)} · ${escapeXml(chart.triad.asc.sign)}
    </text>
    ${createWheel(chart, centerX, wheelCenterY)}
    ${sections.join("")}
    <text x="600" y="${footerY}" text-anchor="middle" fill="#c6bb9c" font-family="serif" font-size="23">
      Zodiaco tropical · Casas iguales · Astrología para la reflexión
    </text>
  </svg>`;
}

export async function createNatalShareCard(
  chart: NatalChart,
  nickname: string,
  lifeSummary: string,
  readings: PlanetReading[],
): Promise<Blob> {
  const svg = createCardSvg(chart, nickname, lifeSummary, readings);
  const image = new Image();
  const source = URL.createObjectURL(
    new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
  );

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("No se pudo dibujar la tarjeta astral."));
      image.src = source;
    });

    const canvas = document.createElement("canvas");
    canvas.width = CARD_WIDTH;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Este navegador no permite generar la tarjeta.");
    context.drawImage(image, 0, 0, CARD_WIDTH, image.naturalHeight);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("No se pudo exportar la tarjeta como imagen."));
      }, "image/png");
    });
  } finally {
    URL.revokeObjectURL(source);
  }
}
