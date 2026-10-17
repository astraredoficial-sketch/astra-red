import type { AspectName, HouseSystem, PlanetId } from "@/lib/types";

export const SIGNS = [
  "Aries",
  "Tauro",
  "Géminis",
  "Cáncer",
  "Leo",
  "Virgo",
  "Libra",
  "Escorpio",
  "Sagitario",
  "Capricornio",
  "Acuario",
  "Piscis",
] as const;

export const SIGN_GLYPHS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

export function houseSystemLabel(system?: HouseSystem): string {
  if (system === "placidus") return "Casas Placidus";
  if (system === "equal-high-latitude") {
    return "Casas iguales · Placidus no aplicable a esta latitud";
  }
  return "Casas iguales";
}

export const PLANET_META: Record<
  PlanetId,
  { name: string; glyph: string }
> = {
  sun: { name: "Sol", glyph: "☉" },
  moon: { name: "Luna", glyph: "☽" },
  mercury: { name: "Mercurio", glyph: "☿" },
  venus: { name: "Venus", glyph: "♀" },
  mars: { name: "Marte", glyph: "♂" },
  jupiter: { name: "Júpiter", glyph: "♃" },
  saturn: { name: "Saturno", glyph: "♄" },
  uranus: { name: "Urano", glyph: "♅" },
  neptune: { name: "Neptuno", glyph: "♆" },
  pluto: { name: "Plutón", glyph: "♇" },
  node: { name: "Nodo Norte", glyph: "☊" },
  asc: { name: "Ascendente", glyph: "Asc" },
};

export const ASPECT_META: Record<
  AspectName,
  { name: string; angle: number; orb: number }
> = {
  conjunction: { name: "conjunción", angle: 0, orb: 8 },
  sextile: { name: "sextil", angle: 60, orb: 6 },
  square: { name: "cuadratura", angle: 90, orb: 7 },
  trine: { name: "trígono", angle: 120, orb: 8 },
  opposition: { name: "oposición", angle: 180, orb: 8 },
};

export function signFromLongitude(longitude: number): {
  sign: string;
  signIndex: number;
  degreeInSign: number;
} {
  const lon = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(lon / 30);
  return {
    sign: SIGNS[signIndex],
    signIndex,
    degreeInSign: lon - signIndex * 30,
  };
}

export function formatDegree(degreeInSign: number): string {
  const deg = Math.floor(degreeInSign);
  const minutes = Math.round((degreeInSign - deg) * 60);
  return `${deg}°${String(minutes).padStart(2, "0")}′`;
}

export function angleDelta(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}
