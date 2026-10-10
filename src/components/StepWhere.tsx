"use client";

import React, { useState, useEffect } from "react";

export interface CityResult {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lng: number;
}

interface StepWhereProps {
  onSelectCity: (city: CityResult) => void;
}

// Base de datos estructurada por Países y Ciudades
const COUNTRIES_AND_CITIES: Record<string, Array<{ name: string; state?: string; lat: number; lng: number }>> = {
  "Venezuela": [
    { name: "Barinas", state: "Barinas", lat: 8.6226, lng: -70.2075 },
    { name: "Guanare", state: "Portuguesa", lat: 9.0419, lng: -69.7423 },
    { name: "Caracas", state: "Distrito Capital", lat: 10.4806, lng: -66.9036 },
    { name: "Maracaibo", state: "Zulia", lat: 10.6666, lng: -71.6124 },
    { name: "Valencia", state: "Carabobo", lat: 10.1623, lng: -68.0077 },
    { name: "Barquisimeto", state: "Lara", lat: 10.0647, lng: -69.3570 },
    { name: "Maracay", state: "Aragua", lat: 10.2354, lng: -67.5910 },
    { name: "Mérida", state: "Mérida", lat: 8.5984, lng: -71.1450 },
    { name: "San Cristóbal", state: "Táchira", lat: 7.7669, lng: -72.2250 },
    { name: "Puerto La Cruz", state: "Anzoátegui", lat: 10.2117, lng: -64.6307 },
    { name: "Ciudad Bolívar", state: "Bolívar", lat: 8.1256, lng: -63.5438 },
    { name: "Puerto Ordaz", state: "Bolívar", lat: 8.3097, lng: -62.7256 },
    { name: "Acarigua", state: "Portuguesa", lat: 9.5593, lng: -69.1973 },
    { name: "Valera", state: "Trujillo", lat: 9.3108, lng: -70.6057 },
    { name: "Coro", state: "Falcón", lat: 11.4042, lng: -69.6732 },
    { name: "Maturín", state: "Monagas", lat: 9.7456, lng: -63.1832 },
    { name: "San Fernando de Apure", state: "Apure", lat: 7.8878, lng: -67.4725 },
    { name: "Los Teques", state: "Miranda", lat: 10.3444, lng: -67.0431 },
  ],
  "España": [
    { name: "Madrid", state: "Madrid", lat: 40.4168, lng: -3.7038 },
    { name: "Barcelona", state: "Cataluña", lat: 41.3851, lng: 2.1734 },
    { name: "Valencia", state: "Comunidad Valenciana", lat: 39.4699, lng: -0.3763 },
    { name: "Sevilla", state: "Andalucía", lat: 37.3891, lng: -5.9845 },
  ],
  "Colombia": [
    { name: "Bogotá", state: "Cundinamarca", lat: 4.7110, lng: -74.0721 },
    { name: "Medellín", state: "Antioquia", lat: 6.2442, lng: -75.5812 },
    { name: "Cali", state: "Valle del Cauca", lat: 3.4516, lng: -76.5320 },
  ],
  "Argentina": [
    { name: "Buenos Aires", state: "Buenos Aires", lat: -34.6037, lng: -58.3816 },
    { name: "Córdoba", state: "Córdoba", lat: -31.4201, lng: -64.1888 },
  ],
  "México": [
    { name: "Ciudad de México", state: "CDMX", lat: 19.4326, lng: -99.1332 },
    { name: "Guadalajara", state: "Jalisco", lat: 20.6597, lng: -103.3496 },
    { name: "Monterrey", state: "Nuevo León", lat: 25.6866, lng: -100.3161 },
  ],
  "Estados Unidos": [
    { name: "Miami", state: "Florida", lat: 25.7617, lng: -80.1918 },
    { name: "Nueva York", state: "Nueva York", lat: 40.7128, lng: -74.0060 },
    { name: "Houston", state: "Texas", lat: 29.7604, lng: -95.3698 },
  ]
};

export function StepWhere({ onSelectCity }: StepWhereProps) {
  const [selectedCountry, setSelectedCountry] = useState<string>("Venezuela");
  const [countryQuery, setCountryQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [selectedCityObj, setSelectedCityObj] = useState<{ name: string; state?: string; lat: number; lng: number } | null>(
    COUNTRIES_AND_CITIES["Venezuela"][0] // Por defecto Barinas, Venezuela
  );

  const normalizeText = (text: string) => {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  const countriesList = Object.keys(COUNTRIES_AND_CITIES);
  const filteredCountries = countriesList.filter((c) =>
    normalizeText(c).includes(normalizeText(countryQuery))
  );

  const currentCities = COUNTRIES_AND_CITIES[selectedCountry] || [];
  const filteredCities = currentCities.filter(
    (city) =>
      normalizeText(city.name).includes(normalizeText(cityQuery)) ||
      (city.state && normalizeText(city.state).includes(normalizeText(cityQuery)))
  );

  const handleSelectCountry = (country: string) => {
    setSelectedCountry(country);
    setCountryQuery("");
    setCityQuery("");
    // Seleccionar por defecto la primera ciudad del país
    const firstCity = COUNTRIES_AND_CITIES[country][0];
    setSelectedCityObj(firstCity);
    onSelectCity({
      name: firstCity.name,
      country: country,
      state: firstCity.state,
      lat: firstCity.lat,
      lng: firstCity.lng,
    });
  };

  const handleSelectCity = (city: { name: string; state?: string; lat: number; lng: number }) => {
    setSelectedCityObj(city);
    setCityQuery("");
    onSelectCity({
      name: city.name,
      country: selectedCountry,
      state: city.state,
      lat: city.lat,
      lng: city.lng,
    });
  };

  return (
    <div className="space-y-5 max-w-md mx-auto relative">
      <div className="space-y-1 text-center sm:text-left">
        <span className="text-[10px] text-rose-400 font-bold uppercase tracking-widest font-mono">
          PASO 3 DE 3 · UBICACIÓN NATAL
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold font-serif text-white">
          ¿Dónde naciste?
        </h2>
        <p className="text-xs text-slate-400">
          Primero selecciona tu país y luego tu ciudad para garantizar la precisión de tu Carta Astral.
        </p>
      </div>

      {/* SECCIÓN 1: SELECCIÓN DE PAÍS */}
      <div className="space-y-2 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider">
          1. País de Nacimiento
        </label>
        
        <div className="flex items-center justify-between bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5">
          <span className="text-sm font-bold text-white">🌍 {selectedCountry}</span>
          <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
            Seleccionado
          </span>
        </div>

        <input
          type="text"
          placeholder="Filtrar otro país (ej: España, Colombia...)"
          value={countryQuery}
          onChange={(e) => setCountryQuery(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
        />

        {countryQuery.trim().length > 0 && (
          <div className="grid grid-cols-2 gap-1 pt-1 max-h-32 overflow-y-auto">
            {filteredCountries.map((c, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectCountry(c)}
                className="text-left text-xs p-2 rounded-lg bg-slate-950 hover:bg-purple-950/60 border border-slate-800 text-slate-200 transition cursor-pointer font-medium"
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* SECCIÓN 2: SELECCIÓN DE CIUDAD */}
      <div className="space-y-2 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider">
          2. Ciudad o Municipio en {selectedCountry}
        </label>

        <input
          type="text"
          placeholder="Busca tu ciudad (ej: Barinas, Guanare, Caracas...)"
          value={cityQuery}
          onChange={(e) => setCityQuery(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-medium"
        />

        {/* LISTA DE CIUDADES FILTRADAS */}
        <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto pt-1 divide-y divide-slate-800/60">
          {(cityQuery.trim().length > 0 ? filteredCities : currentCities).map((city, idx) => {
            const isSelected = selectedCityObj?.name === city.name;
            return (
              <div
                key={idx}
                onClick={() => handleSelectCity(city)}
                className={
                  "p-2.5 rounded-xl cursor-pointer transition flex items-center justify-between text-xs " +
                  (isSelected
                    ? "bg-amber-500/10 border border-amber-500/40 text-white font-bold"
                    : "hover:bg-slate-950 text-slate-300")
                }
              >
                <div>
                  <span>{city.name}</span>
                  {city.state && <span className="text-[10px] text-slate-400 ml-1">({city.state})</span>}
                </div>
                <span className="text-[9px] text-amber-300 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  📍 {city.lat.toFixed(2)}°, {city.lng.toFixed(2)}°
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {selectedCityObj && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 p-3 rounded-2xl flex items-center justify-between text-xs text-emerald-300 animate-in fade-in">
          <span>📍 Ubicación Astronómica Configurada</span>
          <span className="font-mono font-bold text-[10px]">
            {selectedCityObj.name}, {selectedCountry} ({selectedCityObj.lat.toFixed(2)}°, {selectedCityObj.lng.toFixed(2)}°)
          </span>
        </div>
      )}
    </div>
  );
}
