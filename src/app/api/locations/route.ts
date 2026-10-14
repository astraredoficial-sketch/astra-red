import { City, Country } from "country-state-city";
import tzLookup from "tz-lookup";

type CityEntry = {
  name: string;
  countryCode: string;
  stateCode: string;
  latitude?: string | null;
  longitude?: string | null;
};

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

type NominatimResult = {
  place_id: number;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  name?: string;
  display_name?: string;
  category?: string;
  class?: string;
  type: string;
  addresstype?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    hamlet?: string;
    suburb?: string;
    quarter?: string;
    country?: string;
    country_code?: string;
    state?: string;
    state_district?: string;
  };
};

let lastNominatimRequestAt = 0;
let nominatimQueue: Promise<void> = Promise.resolve();

async function searchNominatim(url: URL) {
  const request = nominatimQueue.then(async () => {
    const wait = Math.max(0, 1100 - (Date.now() - lastNominatimRequestAt));
    if (wait) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    lastNominatimRequestAt = Date.now();
    return fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "AstraRed/1.0 (https://astrared.vip; contact: astrared.oficial@gmail.com)",
      },
      next: { revalidate: 86400 },
    });
  });

  nominatimQueue = request.then(
    () => undefined,
    () => undefined,
  );
  return request;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const countryCode = params.get("country")?.toUpperCase();

  if (!countryCode) {
    const query = normalize(params.get("q")?.trim() ?? "");
    const countries = Country.getAllCountries()
      .filter((country) => !query || normalize(country.name).includes(query))
      .map(({ isoCode, name, flag }) => ({ isoCode, name, flag }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return Response.json(countries);
  }

  const country = Country.getCountryByCode(countryCode);
  if (!country) {
    return Response.json({ error: "País no válido." }, { status: 400 });
  }
  const countryName =
    new Intl.DisplayNames(["es"], { type: "region" }).of(countryCode) ??
    country.name;

  const query = normalize(params.get("q")?.trim() ?? "");
  if (params.get("source") === "osm") {
    const rawQuery = params.get("q")?.trim() ?? "";
    if (rawQuery.length < 3 || rawQuery.length > 100) {
      return Response.json(
        { error: "Escribe entre 3 y 100 caracteres para buscar." },
        { status: 400 },
      );
    }

    const searchUrl = new URL("https://nominatim.openstreetmap.org/search");
    searchUrl.searchParams.set("q", `${rawQuery}, ${countryName}`);
    searchUrl.searchParams.set("format", "jsonv2");
    searchUrl.searchParams.set("addressdetails", "1");
    searchUrl.searchParams.set("countrycodes", countryCode.toLowerCase());
    searchUrl.searchParams.set("featuretype", "settlement");
    searchUrl.searchParams.set("limit", "8");

    let response: Response;
    try {
      response = await searchNominatim(searchUrl);
    } catch (cause) {
      console.error("No se pudo conectar con OpenStreetMap:", cause);
      return Response.json(
        { error: "No se pudo consultar OpenStreetMap. Inténtalo más tarde." },
        {
          status: 502,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }
    if (!response.ok) {
      console.error(
        `La búsqueda de localidades de OpenStreetMap respondió ${response.status}.`,
      );
      return Response.json(
        { error: "No se pudo consultar OpenStreetMap. Inténtalo más tarde." },
        {
          status: 502,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    const results = (await response.json()) as NominatimResult[];
    const cities = results
      .filter(
        (place) =>
          (place.category === "place" ||
            place.class === "place" ||
            ["city", "town", "village", "hamlet", "municipality"].includes(
              place.addresstype ?? "",
            )) &&
          (!place.address?.country_code ||
            place.address.country_code.toUpperCase() === countryCode),
      )
      .map((place) => {
        const address = place.address ?? {};
        const latitude = Number(place.lat);
        const longitude = Number(place.lon);
        const name =
          address.city ??
          address.town ??
          address.village ??
          address.municipality ??
          address.hamlet ??
          address.suburb ??
          address.quarter ??
          place.name ??
          place.display_name?.split(",")[0];

        if (
          !name ||
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude)
        ) {
          return null;
        }

        return {
          id: `osm:${place.osm_type}:${place.osm_id || place.place_id}`,
          name,
          state: address.state ?? address.state_district ?? null,
          countryCode: address.country_code?.toUpperCase() ?? countryCode,
          country: address.country ?? countryName,
          latitude,
          longitude,
          timeZone: tzLookup(latitude, longitude),
          source: "osm" as const,
        };
      })
      .filter((city) => city !== null);

    return Response.json(cities, {
      headers: {
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  }

  if (query.length < 2) return Response.json([]);

  const cities = (City.getCitiesOfCountry(countryCode) ?? [])
    .filter(
      (city: CityEntry) =>
        normalize(city.name).includes(query) ||
        normalize(city.stateCode).includes(query),
    )
    .map((city: CityEntry) => {
      const latitude = Number(city.latitude);
      const longitude = Number(city.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
      }

      return {
        id: `${city.countryCode}:${city.stateCode}:${city.name}:${latitude}:${longitude}`,
        name: city.name,
        state: city.stateCode || null,
        countryCode: city.countryCode,
        country: countryName,
        latitude,
        longitude,
        timeZone: tzLookup(latitude, longitude),
      };
    })
    .filter((city) => city !== null)
    .sort((a, b) => {
      const score = (name: string) =>
        normalize(name) === query
          ? 0
          : normalize(name).startsWith(query)
            ? 1
            : 2;
      return score(a.name) - score(b.name) || a.name.localeCompare(b.name);
    })
    .slice(0, 40);

  return Response.json(cities);
}
