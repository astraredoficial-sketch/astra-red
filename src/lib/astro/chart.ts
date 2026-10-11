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

function meanNorthNode(time: Astronomy.AstroTime): number {
  const T = time.tt / 36525;
  return norm(125.04452 - 1934.136261 * T + 0.0020708 * T * T + T ** 3 / 450000);
}

function ramcToMc(ramcDeg: number, obliquityDeg: number): number {
  const ramc = (ramcDeg * Math.PI) / 180;
  const eps = (obliquityDeg * Math.PI) / 180;
  return norm(
    (Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps)) * 180) / Math.PI,
  );
}

function ascendant(ramcDeg: number, latDeg: number, obliquityDeg: number): number {
  const ramc = (ramcDeg * Math.PI) / 180;
  const lat = (latDeg * Math.PI) / 180;
  const eps = (obliquityDeg * Math.PI) / 180;
  const y = Math.cos(ramc);
  const x = -(Math.sin(ramc) * Math.cos(eps) + Math.tan(lat) * Math.sin(eps));
  return norm((Math.atan2(y, x) * 180) / Math.PI);
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

export function computeNatalChart(birth: BirthData): NatalChart {
  const city = findCity(birth.cityId);
  if (!city) throw new Error("Ciudad no encontrada");

  const timeStr = birth.timeUnknown ? "12:00" : birth.time;
  const utc = civilToUtc(birth.date, timeStr, city.tz);
  const astroTime = Astronomy.MakeTime(utc);
  const obliquity = 23.4392911 - (46.815 / 3600) * (astroTime.tt / 36525);

  const gastHours = Astronomy.SiderealTime(astroTime);
  const lstHours = ((gastHours + city.lng / 15) % 24 + 24) % 24;
  const ramc = lstHours * 15;
  const ascLon = ascendant(ramc, city.lat, obliquity);
  const mcLon = ramcToMc(ramc, obliquity);
  void mcLon;

  const houses = Array.from({ length: 12 }, (_, i) => norm(ascLon + i * 30));

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
    julianDay: astroTime.ut + 2451545.0,
    houses,
    planets,
    triad: { sun, moon, asc },
    timeUnknown: birth.timeUnknown,
  };
}

