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
  const [activeTab, setActiveTab] = useState<"country" | "city">("country");
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [countryQuery, setCountryQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [cities, setCities] = useState<CityResult[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityResult | null>(null);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
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
    setActiveTab(countryCode ? "city" : "country");
    setCityQuery("");
    setCities([]);
    setSelectedCity(null);
    onSelectCity(null);
    setError("");
  }

  function handleCityChange(query: string) {
    setCityQuery(query);
    setSelectedCity(null);
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

  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <h2 className="font-serif text-2xl font-bold text-white">
          Lugar de nacimiento
        </h2>
        <p className="text-xs leading-5 text-slate-400">
          Elige el país y busca la ciudad donde naciste para calcular el huso
          horario y la posición de tu carta.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Ubicación de nacimiento"
        className="grid grid-cols-2 rounded-xl border border-slate-800 bg-slate-950 p-1"
      >
        {([
          { id: "country", label: "1. País" },
          { id: "city", label: "2. Ciudad" },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            disabled={tab.id === "city" && !selectedCountry}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-3 py-2 text-sm transition ${
              activeTab === tab.id
                ? "bg-purple-900/70 text-white"
                : "text-slate-400 hover:text-white"
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "country" ? (
        <div role="tabpanel" className="space-y-2">
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
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
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
      ) : (
        <div role="tabpanel" className="space-y-2">
        <label
          htmlFor="birth-city-search"
          className="block text-xs font-bold uppercase tracking-wider text-amber-400"
        >
          Ciudad{currentCountry ? ` · ${currentCountry.name}` : ""}
        </label>
        <input
          id="birth-city-search"
          value={cityQuery}
          onChange={(event) => handleCityChange(event.target.value)}
          placeholder={
            selectedCountry
              ? "Escribe al menos dos letras de tu ciudad"
              : "Selecciona primero un país"
          }
          autoComplete="off"
          disabled={!selectedCountry}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white focus:border-rose-500 focus:outline-none disabled:opacity-50"
        />

        {loadingCities && (
          <p className="text-xs text-slate-400">Buscando ciudades...</p>
        )}
        {!loadingCities &&
          cityQuery.trim().length >= 2 &&
          cities.length === 0 &&
          !selectedCity &&
          !error && (
            <p className="text-xs text-slate-400">
              No encontramos coincidencias. Revisa la escritura o prueba otra
              parte del nombre.
            </p>
          )}
        {cities.length > 0 && (
          <ul className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950">
            {cities.map((city) => (
              <li key={city.id}>
                <button
                  type="button"
                  onClick={() => handleCitySelect(city)}
                  className="w-full border-b border-slate-800 px-3 py-2.5 text-left text-sm text-slate-200 last:border-0 hover:bg-purple-950/60"
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
      </div>
      )}

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
