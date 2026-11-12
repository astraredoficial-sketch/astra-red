"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { ChartWheel } from "@/components/ChartWheel";
import { useSession } from "@/hooks/useSession";
import {
  formatDegree,
  houseSystemLabel,
  PLANET_META,
} from "@/lib/astro/constants";
import {
  calculateSolarReturn,
  type SolarReturnInput,
  type SolarReturnResult,
} from "@/lib/astro/solarReturn";
import { supabase } from "@/lib/supabase/client";
import type { PlanetId } from "@/lib/types";

interface BirthDetails {
  birth_date: string;
  birth_time: string | null;
  birth_time_unknown: boolean;
  city_id: string;
  location_city: string;
  location_country: string;
  birth_latitude: number;
  birth_longitude: number;
  birth_timezone: string;
}

interface BirthDetailsState {
  userId: string;
  data: BirthDetails | null;
  error: string;
}

const DISPLAY_PLANETS: PlanetId[] = [
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
];

const READING_ICONS: Record<SolarReturnResult["readings"][number]["id"], string> = {
  cycle: "01",
  relationships: "02",
  "work-resources": "03",
  wellbeing: "04",
  growth: "05",
};

function subscribeToCurrentYear() {
  return () => {};
}

function getCurrentYear(): string {
  return String(new Date().getFullYear());
}

function getServerYear(): string {
  return "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function isBirthDetails(value: unknown): value is BirthDetails {
  if (!isRecord(value)) return false;
  return (
    typeof value.birth_date === "string" &&
    (typeof value.birth_time === "string" || value.birth_time === null) &&
    typeof value.birth_time_unknown === "boolean" &&
    typeof value.city_id === "string" &&
    typeof value.location_city === "string" &&
    typeof value.location_country === "string" &&
    typeof value.birth_latitude === "number" &&
    Number.isFinite(value.birth_latitude) &&
    typeof value.birth_longitude === "number" &&
    Number.isFinite(value.birth_longitude) &&
    typeof value.birth_timezone === "string"
  );
}

function formatLocalInstant(instant: string, timeZone: string): string {
  return new Intl.DateTimeFormat("es", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone,
  }).format(new Date(instant));
}

export default function RevolucionSolarUi() {
  const router = useRouter();
  const { ready, store, me, error: sessionError } = useSession();
  const currentYear = useSyncExternalStore(
    subscribeToCurrentYear,
    getCurrentYear,
    getServerYear,
  );
  const [birthState, setBirthState] = useState<BirthDetailsState | null>(null);
  const [year, setYear] = useState<string | null>(null);
  const [result, setResult] = useState<SolarReturnResult | null>(null);
  const [calculationError, setCalculationError] = useState("");
  const [calculating, setCalculating] = useState(false);

  const userId = me?.id;
  useEffect(() => {
    if (!userId) return;
    const currentUserId = userId;
    let active = true;

    async function loadBirthDetails() {
      const { data, error: detailsError } = await supabase
        .from("birth_details")
        .select(
          "birth_date, birth_time, birth_time_unknown, city_id, location_city, location_country, birth_latitude, birth_longitude, birth_timezone",
        )
        .eq("user_id", currentUserId)
        .maybeSingle();

      if (!active) return;
      if (detailsError) {
        setBirthState({
          userId: currentUserId,
          data: null,
          error: `No se pudieron cargar tus datos privados de nacimiento: ${detailsError.message}`,
        });
        return;
      }
      if (!data) {
        setBirthState({
          userId: currentUserId,
          data: null,
          error: "No encontramos tus datos de nacimiento. Completa tu perfil para continuar.",
        });
        return;
      }
      if (!isBirthDetails(data)) {
        setBirthState({
          userId: currentUserId,
          data: null,
          error: "Los datos privados de nacimiento no tienen un formato válido.",
        });
        return;
      }
      setBirthState({ userId: currentUserId, data, error: "" });
    }

    void loadBirthDetails();
    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!ready || sessionError || me) return;
    router.replace(
      store?.currentUserId ? "/onboarding" : "/acceso?mode=login",
    );
  }, [me, ready, router, sessionError, store?.currentUserId]);

  async function handleCalculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!birthDetails) return;

    setCalculating(true);
    setCalculationError("");
    setResult(null);
    try {
      const input: SolarReturnInput = {
        birthDate: birthDetails.birth_date,
        birthTime: birthDetails.birth_time?.slice(0, 5) ?? null,
        birthTimeUnknown: birthDetails.birth_time_unknown,
        cityId: birthDetails.city_id,
        latitude: birthDetails.birth_latitude,
        longitude: birthDetails.birth_longitude,
        timeZone: birthDetails.birth_timezone,
        city: birthDetails.location_city,
        country: birthDetails.location_country,
      };
      setResult(calculateSolarReturn(input, Number(year ?? currentYear)));
    } catch (cause) {
      setCalculationError(
        cause instanceof Error
          ? cause.message
          : "No se pudo calcular la revolución solar.",
      );
    } finally {
      setCalculating(false);
    }
  }

  const currentBirthState =
    me && birthState?.userId === me.id ? birthState : null;
  const birthDetails = currentBirthState?.data ?? null;
  const loadingBirthDetails = Boolean(me && !currentBirthState);

  if (!ready || (!me && !sessionError)) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#080d1b] text-amber-200">
        Consultando tus datos astrales...
      </div>
    );
  }

  if (sessionError || !me) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#080d1b] px-6 text-center">
        <p role="alert" className="max-w-xl text-sm leading-6 text-rose-300">
          {sessionError || "Inicia sesión para consultar tu revolución solar."}
        </p>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen w-full min-w-0 flex-col bg-[#080d1b] text-slate-100">
      <AppNav active="revolucion-solar" />
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-8 sm:px-6 lg:py-12">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200/75">
            Herramienta privada · Astronomy Engine
          </p>
          <h1 className="mt-3 font-serif text-4xl font-semibold text-white sm:text-5xl">
            Revolución solar
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Calcula el instante anual en que el Sol vuelve a su longitud natal y
            consulta la carta levantada en tu lugar de nacimiento. La lectura es
            simbólica y no constituye una predicción.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <form
            onSubmit={handleCalculate}
            className="space-y-5 rounded-3xl border border-white/10 bg-[#101827] p-5 sm:p-7"
          >
            <div>
              <h2 className="font-serif text-2xl text-white">
                Configurar el ciclo
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Lugar de cálculo: nacimiento
                {birthDetails
                  ? ` · ${birthDetails.location_city}, ${birthDetails.location_country}`
                  : ""}
              </p>
            </div>

            {loadingBirthDetails && (
              <p className="text-sm text-slate-300">Cargando lugar natal...</p>
            )}
            {currentBirthState?.error && (
              <p role="alert" className="text-sm leading-6 text-rose-300">
                {currentBirthState.error}
              </p>
            )}

            <div>
              <label
                htmlFor="solar-return-year"
                className="mb-2 block text-sm font-medium text-slate-100"
              >
                Año de la revolución solar
              </label>
              <input
                id="solar-return-year"
                type="number"
                inputMode="numeric"
                min={1900}
                max={2200}
                required
                value={year ?? currentYear}
                onChange={(event) => setYear(event.target.value)}
                className="min-h-12 w-full rounded-xl border border-white/15 bg-[#080d1b] px-4 text-base text-white outline-none transition focus:border-amber-200 focus:ring-2 focus:ring-amber-200/30"
              />
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Selecciona un año entre 1900 y 2200.
              </p>
            </div>

            <button
              type="submit"
              disabled={!birthDetails || loadingBirthDetails || calculating}
              className="min-h-12 w-full rounded-xl bg-amber-200 px-5 py-3 text-sm font-semibold text-[#151522] transition hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {calculating ? "Calculando el retorno..." : "Calcular revolución"}
            </button>
            {calculationError && (
              <p role="alert" className="text-sm leading-6 text-rose-300">
                {calculationError}
              </p>
            )}
          </form>

          <aside className="rounded-3xl border border-amber-100/15 bg-gradient-to-br from-[#1a1b2c] to-[#101522] p-5 sm:p-7">
            <h2 className="font-serif text-xl text-amber-100">
              Cómo se calcula
            </h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              <li>
                El motor local busca el retorno a la longitud eclíptica tropical
                aparente del Sol natal.
              </li>
              <li>
                La carta se levanta para el lugar natal, con zona IANA y
                coordenadas guardadas en tu perfil privado.
              </li>
              <li>
                Si tu hora natal es desconocida, se usa el mediodía local solo
                como estimación y se indica en el resultado.
              </li>
              <li>
                Las interpretaciones se generan con reglas locales; no se envían
                datos a servicios externos.
              </li>
            </ul>
          </aside>
        </section>

        {result && birthDetails && (
          <section aria-labelledby="solar-return-result" className="space-y-6">
            <header className="rounded-3xl border border-amber-100/15 bg-[#101827] p-5 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/75">
                Ciclo {result.year}
              </p>
              <h2
                id="solar-return-result"
                className="mt-2 font-serif text-2xl text-white sm:text-3xl"
              >
                {formatLocalInstant(result.returnAtUtc, result.location.timeZone)}
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                Hora local de {result.location.city}, {result.location.country}
              </p>
              {result.approximate && (
                <p className="mt-4 rounded-xl border border-amber-200/25 bg-amber-100/5 px-4 py-3 text-sm leading-6 text-amber-100">
                  Como la hora natal es desconocida, el retorno se basa en el
                  mediodía local. La longitud natal del Sol y el instante
                  resultante son aproximados; no representan una hora de
                  nacimiento confirmada.
                </p>
              )}
              <p className="mt-4 text-xs leading-5 text-slate-400">
                Método: Astronomy Engine · retorno tropical aparente ·{" "}
                {houseSystemLabel(result.chart.houseSystem)} · lugar natal.
              </p>
            </header>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
              <article className="rounded-3xl border border-white/10 bg-[#101827] p-5 sm:p-7">
                <h3 className="font-serif text-xl text-white">
                  Carta del retorno
                </h3>
                <ChartWheel
                  chart={result.chart}
                  ariaLabel="Carta de revolución solar"
                  className="mx-auto mt-4 w-full max-w-[360px]"
                />
                <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                  {DISPLAY_PLANETS.map((id) => {
                    const planet = result.chart.planets.find(
                      (item) => item.id === id,
                    );
                    if (!planet) return null;
                    return (
                      <li
                        key={id}
                        className="flex min-h-11 items-center justify-between gap-3 border-b border-white/5 py-2 text-sm"
                      >
                        <span className="text-slate-300">
                          {PLANET_META[id].name}
                        </span>
                        <span className="text-right text-amber-100">
                          {planet.sign} {formatDegree(planet.degreeInSign)} ·
                          casa {planet.house}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </article>

              <div className="space-y-4">
                <h3 className="px-1 font-serif text-xl text-white">
                  Lectura del ciclo
                </h3>
                {result.readings.map((reading) => (
                  <article
                    key={reading.id}
                    className="rounded-3xl border border-white/10 bg-[#101827] p-5 sm:p-6"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/70">
                      {READING_ICONS[reading.id]} · Reflexión simbólica
                    </p>
                    <h4 className="mt-2 font-serif text-xl text-white">
                      {reading.title}
                    </h4>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      {reading.text}
                    </p>
                    <p className="mt-3 border-l border-amber-200/50 pl-3 text-sm leading-6 text-amber-100">
                      {reading.reflection}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <p className="rounded-2xl border border-white/10 bg-[#0d1421] px-5 py-4 text-xs leading-6 text-slate-400">
              La astrología no cuenta con validación científica para predecir
              acontecimientos. Esta herramienta ofrece una lectura interpretativa
              y no debe usarse como sustituto de asesoramiento profesional.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
