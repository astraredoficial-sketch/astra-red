"use client";

import { useEffect, useMemo, useState } from "react";

export type CityResult = {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  state: string | null;
  latitude: number;
  longitude: number;
  timeZone: string;
  source?: "osm";
};

type CountryOption = {
  isoCode: string;
  name: string;
  flag: string;
};

type StepWhereProps = {
  onSelectCity: (city: CityResult | null) => void;
};

export function StepWhere({ onSelectCity }: StepWhereProps) {
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [countryQuery, setCountryQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [cities, setCities] = useState<CityResult[]>([]);
  const [osmCities, setOsmCities] = useState<CityResult[]>([]);
  const [osmSearchQuery, setOsmSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<CityResult | null>(null);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingOsm, setLoadingOsm] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadCountries() {
      try {
        const response = await fetch("/api/locations", {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("No se pudo cargar la lista de países.");

        const data = (await response.json()) as CountryOption[];
        setCountries(data);
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "No se pudo cargar la lista de países.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoadingCountries(false);
      }
    }

    void loadCountries();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (selectedCity?.name === cityQuery) return;
    if (!selectedCountry || cityQuery.trim().length < 2) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoadingCities(true);
      setError("");

      try {
        const params = new URLSearchParams({
          country: selectedCountry,
          q: cityQuery.trim(),
        });
        const response = await fetch(`/api/locations?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("No se pudieron buscar ciudades.");

        setCities((await response.json()) as CityResult[]);
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "No se pudieron buscar ciudades.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoadingCities(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [cityQuery, selectedCity, selectedCountry]);

  const filteredCountries = useMemo(() => {
    const query = countryQuery.trim().toLocaleLowerCase();
    return countries.filter((country) => {
      const localized =
        new Intl.DisplayNames(["es"], { type: "region" }).of(country.isoCode) ??
        country.name;
      return (
        !query ||
        localized.toLocaleLowerCase().includes(query) ||
        country.name.toLocaleLowerCase().includes(query)
      );
    });
  }, [countries, countryQuery]);

  const currentCountry = countries.find(
    (country) => country.isoCode === selectedCountry,
  );

  function handleCountryChange(countryCode: string) {
    setSelectedCountry(countryCode);
    setCityQuery("");
    setCities([]);
    setOsmCities([]);
    setOsmSearchQuery("");
    setSelectedCity(null);
    onSelectCity(null);
    setError("");
  }

  function handleCityChange(query: string) {
    setCityQuery(query);
    setSelectedCity(null);
    setOsmCities([]);
    setOsmSearchQuery("");
    onSelectCity(null);
    if (query.trim().length < 2) {
      setCities([]);
      setLoadingCities(false);
    }
  }

  function handleCitySelect(city: CityResult) {
    setSelectedCity(city);
    setCityQuery(city.name);
    setCities([]);
    onSelectCity(city);
  }

  async function searchOpenStreetMap() {
    const query = cityQuery.trim();
    if (!selectedCountry || query.length < 3 || loadingOsm) return;

    setLoadingOsm(true);
    setError("");

    try {
      const params = new URLSearchParams({
        country: selectedCountry,
        q: query,
        source: "osm",
      });
      const response = await fetch(`/api/locations?${params}`);
      const payload = (await response.json()) as
        | CityResult[]
        | { error?: string };
      if (!response.ok) {
        throw new Error(
          !Array.isArray(payload) && payload.error
            ? payload.error
            : "No se pudieron buscar lugares en OpenStreetMap.",
        );
      }
      if (!Array.isArray(payload)) {
        throw new Error("La respuesta de OpenStreetMap no es válida.");
      }

      setOsmCities(payload);
      setOsmSearchQuery(query);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudieron buscar lugares en OpenStreetMap.",
      );
    } finally {
      setLoadingOsm(false);
    }
  }

  const displayedCities = [
    ...cities,
    ...osmCities.filter(
      (osmCity) =>
        !cities.some(
          (city) =>
            city.id === osmCity.id ||
            (city.name === osmCity.name &&
              city.countryCode === osmCity.countryCode),
        ),
    ),
  ];

  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <h2 className="font-serif text-2xl font-bold text-white">
          Lugar de nacimiento
        </h2>
        <p className="text-xs leading-5 text-slate-400">
          Elige el país y busca la ciudad donde naciste para calcular el huso
          horario y la posición de tu carta. Esta ubicación no se muestra en tu
          perfil público.
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <label
            htmlFor="birth-country-search"
            className="block text-xs font-bold uppercase tracking-wider text-amber-400"
          >
            País
          </label>
          <input
            id="birth-country-search"
            value={countryQuery}
            onChange={(event) => setCountryQuery(event.target.value)}
            placeholder="Filtra entre los países del mundo"
            autoComplete="country-name"
            className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
          />
          <select
            aria-label="Seleccionar país de nacimiento"
            value={selectedCountry}
            onChange={(event) => handleCountryChange(event.target.value)}
            disabled={loadingCountries}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white focus:border-amber-500 focus:outline-none disabled:opacity-60"
          >
            <option value="">
              {loadingCountries ? "Cargando países..." : "Selecciona un país"}
            </option>
            {filteredCountries.map((country) => {
              const name =
                new Intl.DisplayNames(["es"], { type: "region" }).of(
                  country.isoCode,
                ) ?? country.name;
              return (
                <option key={country.isoCode} value={country.isoCode}>
                  {country.flag} {name}
                </option>
              );
            })}
          </select>
          {selectedCountry && (
            <p className="text-xs text-slate-400">
              País seleccionado: {currentCountry?.name}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <label
            htmlFor="birth-city-search"
            className="block text-xs font-bold uppercase tracking-wider text-amber-400"
          >
            Localidad{currentCountry ? ` · ${currentCountry.name}` : ""}
          </label>
          <input
            id="birth-city-search"
            value={cityQuery}
            onChange={(event) => handleCityChange(event.target.value)}
            placeholder={
              selectedCountry
                ? "Escribe el nombre de tu localidad"
                : "Selecciona primero un país"
            }
            autoComplete="off"
            disabled={!selectedCountry}
            className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white focus:border-rose-500 focus:outline-none disabled:opacity-50"
          />
          {!selectedCountry && (
            <p className="text-xs leading-5 text-slate-400">
              Primero elige el país donde naciste para buscar la localidad.
            </p>
          )}

          {loadingCities && (
            <p role="status" className="text-xs text-slate-400">
              Buscando localidades...
            </p>
          )}
          {cityQuery.trim().length >= 3 && (
            <div className="space-y-1.5">
              <button
                type="button"
                disabled={loadingOsm || osmSearchQuery === cityQuery.trim()}
                onClick={() => void searchOpenStreetMap()}
                className="min-h-12 rounded-lg border border-slate-700 px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:border-rose-400/60 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingOsm
                  ? "Buscando en OpenStreetMap..."
                  : osmSearchQuery === cityQuery.trim()
                    ? "Búsqueda ampliada completada"
                    : "Buscar más localidades en OpenStreetMap"}
              </button>
              <p className="text-xs leading-5 text-slate-400">
                Búsqueda ampliada bajo demanda; solo se envían el nombre
                escrito y el país, no tu fecha ni hora de nacimiento.
              </p>
            </div>
          )}
          {!loadingCities &&
            cityQuery.trim().length >= 2 &&
            displayedCities.length === 0 &&
            !selectedCity &&
            !error &&
            osmSearchQuery !== cityQuery.trim() && (
              <p className="text-xs text-slate-400">
                No encontramos coincidencias en la lista inicial. Revisa la
                escritura o amplía la búsqueda con OpenStreetMap.
              </p>
            )}
          {osmSearchQuery === cityQuery.trim() &&
            osmCities.length === 0 &&
            !loadingOsm &&
            !error && (
              <p role="status" className="text-xs text-slate-400">
                OpenStreetMap no encontró coincidencias. Prueba otro nombre o
                revisa la localidad.
              </p>
            )}
          {displayedCities.length > 0 && (
            <ul className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950">
              {displayedCities.map((city) => (
                <li key={city.id}>
                  <button
                    type="button"
                    onClick={() => handleCitySelect(city)}
                    className="min-h-11 w-full border-b border-slate-800 px-3 py-2.5 text-left text-sm text-slate-200 last:border-0 hover:bg-purple-950/60"
                  >
                    {city.name}
                    {city.state && (
                      <span className="ml-2 text-xs text-slate-500">
                        ({city.state})
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {osmCities.length > 0 &&
            (osmSearchQuery === cityQuery.trim() ||
              selectedCity?.source === "osm") && (
              <p className="text-xs text-slate-400">
                Datos de localidades ©{" "}
                <a
                  href="https://www.openstreetmap.org/copyright"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2 hover:text-white"
                >
                  OpenStreetMap contributors
                </a>
                .
              </p>
            )}
        </div>
      </div>

      {selectedCity && (
        <p role="status" className="text-xs leading-5 text-emerald-300">
          {selectedCity.name}, {selectedCity.country} · zona horaria{" "}
          {selectedCity.timeZone}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-rose-300">
          {error}
        </p>
      )}
    </section>
  );
}
