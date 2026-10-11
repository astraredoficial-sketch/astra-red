"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type {
  NatalChart,
  PlanetId,
  TargetGender,
  UserProfile,
} from "@/lib/types";

export interface Store {
  profiles: UserProfile[];
  currentUserId?: string;
}

type SessionState = {
  ready: boolean;
  store: Store | null;
  me: UserProfile | null;
  error: string;
};

type ProfileRow = {
  id: string;
  name: string;
  gender: string;
  target_gender: string;
  looking_for: string;
  location_city: string;
  location_country: string;
  chart: unknown;
};

const PLANET_IDS = new Set<PlanetId>([
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
  "asc",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function isNatalChart(value: unknown): value is NatalChart {
  if (!value || typeof value !== "object") return false;
  const chart = value as Record<string, unknown>;
  const triad = chart.triad;
  const isPlacement = (placement: unknown, id: PlanetId) =>
    isRecord(placement) &&
    placement.id === id &&
    typeof placement.longitude === "number" &&
    Number.isFinite(placement.longitude) &&
    typeof placement.sign === "string" &&
    typeof placement.signIndex === "number" &&
    Number.isInteger(placement.signIndex) &&
    typeof placement.degreeInSign === "number" &&
    typeof placement.house === "number" &&
    Number.isInteger(placement.house) &&
    placement.house >= 1 &&
    placement.house <= 12;

  if (!Array.isArray(chart.planets) || !Array.isArray(chart.houses)) {
    return false;
  }
  const planets = chart.planets as unknown[];
  const houses = chart.houses as unknown[];
  const planetIds = planets.flatMap((planet) =>
    isRecord(planet) && typeof planet.id === "string" ? [planet.id] : [],
  );
  if (
    new Set(planetIds).size !== PLANET_IDS.size ||
    !planets.every(
      (planet) =>
        isRecord(planet) &&
        PLANET_IDS.has(planet.id as PlanetId) &&
        isPlacement(planet, planet.id as PlanetId),
    ) ||
    !houses.every(
      (house) => typeof house === "number" && Number.isFinite(house),
    )
  ) {
    return false;
  }

  return (
    planets.length === PLANET_IDS.size &&
    houses.length === 12 &&
    typeof chart.generatedAt === "string" &&
    typeof chart.julianDay === "number" &&
    Number.isFinite(chart.julianDay) &&
    typeof chart.timeUnknown === "boolean" &&
    isRecord(triad) &&
    isPlacement(triad.sun, "sun") &&
    isPlacement(triad.moon, "moon") &&
    isPlacement(triad.asc, "asc")
  );
}

function toUserProfile(row: ProfileRow): UserProfile | null {
  if (!isNatalChart(row.chart)) return null;
  if (
    typeof row.name !== "string" ||
    !row.name.trim() ||
    typeof row.location_city !== "string" ||
    !row.location_city ||
    typeof row.location_country !== "string" ||
    !row.location_country
  ) {
    return null;
  }
  if (!["hombre", "mujer", "otro"].includes(row.gender)) return null;
  if (!["hombre", "mujer", "ambos"].includes(row.target_gender)) return null;
  if (!["amistad", "pareja", "ambos"].includes(row.looking_for)) return null;

  return {
    id: row.id,
    name: row.name,
    gender: row.gender as UserProfile["gender"],
    targetGender: row.target_gender as TargetGender,
    lookingFor: row.looking_for as UserProfile["lookingFor"],
    locationCity: row.location_city,
    locationCountry: row.location_country,
    chart: row.chart,
  };
}

export function useSession() {
  const [state, setState] = useState<SessionState>({
    ready: false,
    store: null,
    me: null,
    error: "",
  });
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((current) => current + 1), []);

  useEffect(() => {
    let active = true;

    async function loadProfiles(userId: string | null) {
      if (!userId) {
        if (active) {
          setState({ ready: true, store: { profiles: [] }, me: null, error: "" });
        }
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, name, gender, target_gender, looking_for, location_city, location_country, chart",
        );

      if (!active) return;
      if (error) {
        setState({
          ready: true,
          store: null,
          me: null,
          error: `No se pudieron cargar los perfiles desde Supabase: ${error.message}`,
        });
        return;
      }

      const profiles = (data as ProfileRow[])
        .map(toUserProfile)
        .filter((profile): profile is UserProfile => profile !== null);
      setState({
        ready: true,
        store: { profiles, currentUserId: userId },
        me: profiles.find((profile) => profile.id === userId) ?? null,
        error: "",
      });
    }

    async function initialize() {
      const { data, error } = await supabase.auth.getUser();

      if (!active) return;
      if (error) {
        setState({
          ready: true,
          store: null,
          me: null,
          error: `No se pudo verificar la sesión: ${error.message}`,
        });
        return;
      }

      await loadProfiles(data.user?.id ?? null);
    }

    void initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        if (active) void loadProfiles(session?.user.id ?? null);
      }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [revision]);

  return { ...state, refresh };
}
