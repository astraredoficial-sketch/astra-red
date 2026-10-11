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
