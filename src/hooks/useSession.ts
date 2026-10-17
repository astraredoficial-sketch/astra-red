"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { isMissingAuthSessionError } from "@/lib/supabase/session";
import { getProfilePhotoObjectPath } from "@/lib/profilePhotos";
import { computeNatalChart } from "@/lib/astro/chart";
import type {
  BirthData,
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
  avatar_url: string | null;
  chart: unknown;
};

type BirthDetailsRow = {
  birth_date: string;
  birth_time: string | null;
  birth_time_unknown: boolean;
  city_id: string;
  birth_latitude: number;
  birth_longitude: number;
  birth_timezone: string;
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

function isBirthDetails(value: unknown): value is BirthDetailsRow {
  if (!isRecord(value)) return false;
  return (
    typeof value.birth_date === "string" &&
    (typeof value.birth_time === "string" || value.birth_time === null) &&
    typeof value.birth_time_unknown === "boolean" &&
    typeof value.city_id === "string" &&
    typeof value.birth_latitude === "number" &&
    Number.isFinite(value.birth_latitude) &&
    typeof value.birth_longitude === "number" &&
    Number.isFinite(value.birth_longitude) &&
    typeof value.birth_timezone === "string"
  );
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
    (chart.houseSystem !== undefined &&
      !["placidus", "equal", "equal-high-latitude"].includes(
        chart.houseSystem as string,
      )) ||
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
    typeof row.id !== "string"
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
    avatarUrl: typeof row.avatar_url === "string" ? row.avatar_url : null,
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
          "id, name, gender, target_gender, looking_for, avatar_url, chart",
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

      let profilesWithoutSignedPhotos = (data as ProfileRow[])
        .map(toUserProfile)
        .filter((profile): profile is UserProfile => profile !== null);
      const currentProfile = profilesWithoutSignedPhotos.find(
        (profile) => profile.id === userId,
      );

      if (
        currentProfile &&
        (!currentProfile.chart.houseSystem ||
          currentProfile.chart.houseSystem === "equal")
      ) {
        const {
          data: birthDetailsData,
          error: birthDetailsError,
        } = await supabase
          .from("birth_details")
          .select(
            "birth_date, birth_time, birth_time_unknown, city_id, birth_latitude, birth_longitude, birth_timezone",
          )
          .eq("user_id", userId)
          .maybeSingle();
        if (!active) return;
        if (birthDetailsError) {
          setState({
            ready: true,
            store: null,
            me: null,
            error: `No se pudieron cargar los datos privados para actualizar tu carta: ${birthDetailsError.message}`,
          });
          return;
        }

        if (birthDetailsData) {
          if (!isBirthDetails(birthDetailsData)) {
            setState({
              ready: true,
              store: null,
              me: null,
              error:
                "Los datos privados de nacimiento no tienen un formato válido para actualizar tu carta.",
            });
            return;
          }
          if (!birthDetailsData.birth_time_unknown && !birthDetailsData.birth_time) {
            setState({
              ready: true,
              store: null,
              me: null,
              error:
                "Falta la hora de nacimiento guardada; actualiza tus datos para recalcular tu carta.",
            });
            return;
          }

          const birth: BirthData = {
            date: birthDetailsData.birth_date,
            time: birthDetailsData.birth_time?.slice(0, 5) ?? "12:00",
            cityId: birthDetailsData.city_id,
            timeUnknown: birthDetailsData.birth_time_unknown,
            location: {
              latitude: birthDetailsData.birth_latitude,
              longitude: birthDetailsData.birth_longitude,
              timeZone: birthDetailsData.birth_timezone,
            },
          };
          let updatedChart: NatalChart;
          try {
            updatedChart = computeNatalChart(birth);
          } catch (cause) {
            setState({
              ready: true,
              store: null,
              me: null,
              error: `No se pudo recalcular tu carta con Placidus: ${
                cause instanceof Error ? cause.message : "error desconocido."
              }`,
            });
            return;
          }

          const { error: chartUpdateError } = await supabase
            .from("profiles")
            .update({ chart: updatedChart, updated_at: new Date().toISOString() })
            .eq("id", userId);
          if (!active) return;
          if (chartUpdateError) {
            setState({
              ready: true,
              store: null,
              me: null,
              error: `No se pudo guardar la versión actualizada de tu carta: ${chartUpdateError.message}`,
            });
            return;
          }

          profilesWithoutSignedPhotos = profilesWithoutSignedPhotos.map(
            (profile) =>
              profile.id === userId
                ? { ...profile, chart: updatedChart }
                : profile,
          );
        }
      }

      const photoPaths = [
        ...new Set(
          profilesWithoutSignedPhotos.flatMap((profile) => {
            const path = getProfilePhotoObjectPath(profile.avatarUrl);
            return path ? [path] : [];
          }),
        ),
      ];
      const signedPhotoUrls = new Map<string, string>();

      if (photoPaths.length > 0) {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (!active) return;
        if (sessionError || !session?.access_token || session.user.id !== userId) {
          setState({
            ready: true,
            store: null,
            me: null,
            error: `No se pudo verificar la sesión para mostrar las fotos${
              sessionError ? `: ${sessionError.message}` : "."
            }`,
          });
          return;
        }

        const response = await fetch("/api/profile-photos/urls", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ paths: photoPaths }),
        });
        const result: unknown = await response.json();
        if (!active) return;
        if (
          !response.ok ||
          !result ||
          typeof result !== "object" ||
          !("signedUrls" in result) ||
          !Array.isArray(result.signedUrls)
        ) {
          const responseError =
            result &&
            typeof result === "object" &&
            "error" in result &&
            typeof result.error === "string"
              ? result.error
              : "No se pudieron preparar las fotos de perfil.";
          if (response.status === 401) {
            setState({
              ready: true,
              store: null,
              me: null,
              error: responseError,
            });
            return;
          }
          console.error(
            `No se pudieron cargar las fotos de perfil (HTTP ${response.status}); se continuará sin ellas:`,
            responseError,
          );
        } else {
          for (const photo of result.signedUrls) {
            if (
              photo &&
              typeof photo === "object" &&
              "path" in photo &&
              typeof photo.path === "string" &&
              "url" in photo &&
              typeof photo.url === "string"
            ) {
              signedPhotoUrls.set(photo.path, photo.url);
            }
          }
        }
      }

      const profiles = profilesWithoutSignedPhotos.map((profile) => {
        const path = getProfilePhotoObjectPath(profile.avatarUrl);
        return {
          ...profile,
          avatarUrl: path ? signedPhotoUrls.get(path) ?? null : null,
        };
      });
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
        if (isMissingAuthSessionError(error)) {
          setState({ ready: true, store: { profiles: [] }, me: null, error: "" });
          return;
        }

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

  useEffect(() => {
    if (!state.store?.currentUserId) return;

    const refreshTimer = window.setInterval(refresh, 50 * 60 * 1000);
    return () => window.clearInterval(refreshTimer);
  }, [refresh, state.store?.currentUserId]);

  return { ...state, refresh };
}
