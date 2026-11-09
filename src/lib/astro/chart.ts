import * as Astronomy from "astronomy-engine";
import { findCity } from "@/lib/cities";
import type { BirthData, NatalChart, Placement, PlanetId } from "@/lib/types";
import { signFromLongitude } from "./constants";
import { civilToUtc } from "./time";

const BODIES: { id: Exclude<PlanetId, "asc" | "node">; body: Astronomy.Body }[] =
  [
    { id: "sun", body: Astronomy.Body.Sun },
    { id: "moon", body: Astronomy.Body.Moon },
    { id: "mercury", body: Astronomy.Body.Mercury },
    { id: "venus", body: Astronomy.Body.Venus },
    { id: "mars", body: Astronomy.Body.Mars },
    { id: "jupiter", body: Astronomy.Body.Jupiter },
    { id: "saturn", body: Astronomy.Body.Saturn },
    { id: "uranus", body: Astronomy.Body.Uranus },
    { id: "neptune", body: Astronomy.Body.Neptune },
    { id: "pluto", body: Astronomy.Body.Pluto },
  ];

function norm(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function eclipticLongitude(body: Astronomy.Body, time: Astronomy.AstroTime): number {
  if (body === Astronomy.Body.Moon) {
    return norm(Astronomy.EclipticGeoMoon(time).lon);
  }
  const vec = Astronomy.GeoVector(body, time, true);
  return norm(Astronomy.Ecliptic(vec).elon);
}

export function computePlanetaryLongitudesAtUtc(
  instant: Date,
): Partial<Record<PlanetId, number>> {
  if (!(instant instanceof Date) || !Number.isFinite(instant.getTime())) {
    throw new RangeError("El instante UTC no es válido.");
  }

  const astroTime = Astronomy.MakeTime(instant);
  return Object.fromEntries(
    BODIES.map(({ id, body }) => [id, eclipticLongitude(body, astroTime)]),
  );
}

function meanNorthNode(time: Astronomy.AstroTime): number {
  const T = time.tt / 36525;
  return norm(125.04452 - 1934.136261 * T + 0.0020708 * T * T + T ** 3 / 450000);
}

function ascendant(ramcDeg: number, latDeg: number, obliquityDeg: number): number {
  const ramc = (ramcDeg * Math.PI) / 180;
  const lat = (latDeg * Math.PI) / 180;
  const eps = (obliquityDeg * Math.PI) / 180;
  const y = Math.cos(ramc);
  const x = -(Math.sin(ramc) * Math.cos(eps) + Math.tan(lat) * Math.sin(eps));
  return norm((Math.atan2(y, x) * 180) / Math.PI);
}

class PlacidusUnavailableError extends RangeError {}
class PlacidusSolutionUnavailableError extends RangeError {}

function signedDegrees(deg: number): number {
  return ((deg + 540) % 360) - 180;
}

function equatorialCoordinates(
  eclipticLongitudeDeg: number,
  obliquityDeg: number,
): { rightAscension: number; declination: number } {
  const longitude = (eclipticLongitudeDeg * Math.PI) / 180;
  const obliquity = (obliquityDeg * Math.PI) / 180;
  return {
    rightAscension:
      (Math.atan2(
        Math.sin(longitude) * Math.cos(obliquity),
        Math.cos(longitude),
      ) *
        180) /
      Math.PI,
    declination:
      (Math.asin(Math.sin(longitude) * Math.sin(obliquity)) * 180) /
      Math.PI,
  };
}

function semiDiurnalArc(
  longitude: number,
  latitudeDeg: number,
  obliquityDeg: number,
): number {
  const { declination } = equatorialCoordinates(longitude, obliquityDeg);
  const argument =
    -Math.tan((latitudeDeg * Math.PI) / 180) *
    Math.tan((declination * Math.PI) / 180);

  if (argument < -1 - 1e-12 || argument > 1 + 1e-12) {
    throw new PlacidusUnavailableError(
      "Placidus no está definido para esta latitud.",
    );
  }

  return (
    (Math.acos(Math.max(-1, Math.min(1, argument))) * 180) /
    Math.PI
  );
}

function solvePlacidusCusp(
  startLongitude: number,
  endLongitude: number,
  ramcDeg: number,
  latitudeDeg: number,
  obliquityDeg: number,
  fraction: number,
  lowerHemisphere: boolean,
): number {
  // Placidus divides each semi-arc into temporal thirds, not equal ecliptic arcs.
  const longitudeSpan = norm(endLongitude - startLongitude);
  const equation = (offset: number) => {
    const longitude = norm(startLongitude + offset);
    const { rightAscension } = equatorialCoordinates(longitude, obliquityDeg);
    const hourAngle = signedDegrees(ramcDeg - rightAscension);
    const semiArc = semiDiurnalArc(longitude, latitudeDeg, obliquityDeg);
    return lowerHemisphere
      ? hourAngle + semiArc + fraction * (180 - semiArc)
      : hourAngle + fraction * semiArc;
  };

  let low = 0;
  let high = longitudeSpan;
  const lowValue = equation(low);
  const highValue = equation(high);
  if (lowValue < 0 || highValue > 0) {
    throw new PlacidusSolutionUnavailableError(
      "No se pudieron resolver las cúspides Placidus para esta fecha y latitud.",
    );
  }

  for (let iteration = 0; iteration < 64; iteration += 1) {
    const middle = (low + high) / 2;
    const middleValue = equation(middle);
    if (middleValue > 0) {
      low = middle;
    } else {
      high = middle;
    }
  }

  return norm(startLongitude + (low + high) / 2);
}

function placidusHouses(
  ramcDeg: number,
  ascLongitude: number,
  latitudeDeg: number,
  obliquityDeg: number,
): number[] {
  const ramc = (ramcDeg * Math.PI) / 180;
  const obliquity = (obliquityDeg * Math.PI) / 180;
  const mcLongitude = norm(
    (Math.atan2(
      Math.sin(ramc),
      Math.cos(ramc) * Math.cos(obliquity),
    ) *
      180) /
      Math.PI,
  );
  const icLongitude = norm(mcLongitude + 180);
  const descendant = norm(ascLongitude + 180);
  const cusp11 = solvePlacidusCusp(
    mcLongitude,
    ascLongitude,
    ramcDeg,
    latitudeDeg,
    obliquityDeg,
    1 / 3,
    false,
  );
  const cusp12 = solvePlacidusCusp(
    mcLongitude,
    ascLongitude,
    ramcDeg,
    latitudeDeg,
    obliquityDeg,
    2 / 3,
    false,
  );
  const cusp2 = solvePlacidusCusp(
    ascLongitude,
    icLongitude,
    ramcDeg,
    latitudeDeg,
    obliquityDeg,
    1 / 3,
    true,
  );
  const cusp3 = solvePlacidusCusp(
    ascLongitude,
    icLongitude,
    ramcDeg,
    latitudeDeg,
    obliquityDeg,
    2 / 3,
    true,
  );

  return [
    ascLongitude,
    cusp2,
    cusp3,
    icLongitude,
    norm(cusp11 + 180),
    norm(cusp12 + 180),
    descendant,
    norm(cusp2 + 180),
    norm(cusp3 + 180),
    mcLongitude,
    cusp11,
    cusp12,
  ];
}

function houseOf(longitude: number, cusps: number[]): number {
  for (let i = 0; i < 12; i++) {
    const a = cusps[i];
    const b = cusps[(i + 1) % 12];
    if (a < b) {
      if (longitude >= a && longitude < b) return i + 1;
    } else if (longitude >= a || longitude < b) {
      return i + 1;
    }
  }
  return 1;
}

function placement(id: PlanetId, longitude: number, houses: number[]): Placement {
  const sign = signFromLongitude(longitude);
  return {
    id,
    longitude,
    sign: sign.sign,
    signIndex: sign.signIndex,
    degreeInSign: sign.degreeInSign,
    house: houseOf(longitude, houses),
  };
}

function chartAnglesAtUtc(
  instant: Date,
  latitude: number,
  longitude: number,
): {
  ramc: number;
  obliquity: number;
  ascendant: number;
  midheaven: number;
} {
  const astroTime = Astronomy.MakeTime(instant);
  const obliquity = 23.4392911 - (46.815 / 3600) * (astroTime.tt / 36525);
  const gastHours = Astronomy.SiderealTime(astroTime);
  const lstHours = ((gastHours + longitude / 15) % 24 + 24) % 24;
  const ramc = lstHours * 15;
  const ramcRadians = (ramc * Math.PI) / 180;
  const obliquityRadians = (obliquity * Math.PI) / 180;

  return {
    ramc,
    obliquity,
    ascendant: ascendant(ramc, latitude, obliquity),
    midheaven: norm(
      (Math.atan2(
        Math.sin(ramcRadians),
        Math.cos(ramcRadians) * Math.cos(obliquityRadians),
      ) *
        180) /
        Math.PI,
    ),
  };
}

export function computeNatalAnglesAtUtc(
  instant: Date,
  latitude: number,
  longitude: number,
): { ascendant: number; midheaven: number; descendant: number; imumCoeli: number } {
  if (!(instant instanceof Date) || !Number.isFinite(instant.getTime())) {
    throw new RangeError("El instante UTC no es válido.");
  }
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new RangeError("Las coordenadas geográficas no son válidas.");
  }

  const angles = chartAnglesAtUtc(instant, latitude, longitude);
  return {
    ascendant: angles.ascendant,
    midheaven: angles.midheaven,
    descendant: norm(angles.ascendant + 180),
    imumCoeli: norm(angles.midheaven + 180),
  };
}

export function computeNatalChartAtUtc(
  birth: BirthData,
  instant: Date,
): NatalChart {
  const city =
    birth.location ??
    findCity(birth.cityId);
  if (!city) throw new Error("Ciudad no encontrada");
  if (!(instant instanceof Date) || !Number.isFinite(instant.getTime())) {
    throw new RangeError("El instante UTC no es válido.");
  }

  const astroTime = Astronomy.MakeTime(instant);
  const longitude = "longitude" in city ? city.longitude : city.lng;
  const latitude = "latitude" in city ? city.latitude : city.lat;
  const angles = chartAnglesAtUtc(instant, latitude, longitude);
  const ascLon = angles.ascendant;

  let houses: number[];
  let houseSystem: NatalChart["houseSystem"];
  try {
    houses = placidusHouses(
      angles.ramc,
      ascLon,
      latitude,
      angles.obliquity,
    );
    houseSystem = "placidus";
  } catch (error) {
    if (error instanceof PlacidusUnavailableError) {
      houseSystem = "equal-high-latitude";
    } else if (error instanceof PlacidusSolutionUnavailableError) {
      houseSystem = "equal";
    } else {
      throw error;
    }
    houses = Array.from({ length: 12 }, (_, i) => norm(ascLon + i * 30));
  }

  const planets: Placement[] = BODIES.map(({ id, body }) =>
    placement(id, eclipticLongitude(body, astroTime), houses),
  );
  const node = placement("node", meanNorthNode(astroTime), houses);
  const asc = placement("asc", ascLon, houses);
  planets.push(node, asc);

  const sun = planets.find((p) => p.id === "sun")!;
  const moon = planets.find((p) => p.id === "moon")!;

  return {
    generatedAt: new Date().toISOString(),
    houseSystem,
    houses,
    planets,
    triad: { sun, moon, asc },
    timeUnknown: birth.timeUnknown,
  };
}

export function computeNatalChart(birth: BirthData): NatalChart {
  const city = birth.location ?? findCity(birth.cityId);
  if (!city) throw new Error("Ciudad no encontrada");

  const utc = civilToUtc(
    birth.date,
    birth.timeUnknown ? "12:00" : birth.time,
    "timeZone" in city ? city.timeZone : city.tz,
  );
  return computeNatalChartAtUtc(birth, utc);
}
