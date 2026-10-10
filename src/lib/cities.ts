export type City = {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  tz: string;
};

export const CITIES: City[] = [
  { id: "mx-cdmx", name: "Ciudad de México", country: "México", lat: 19.4326, lng: -99.1332, tz: "America/Mexico_City" },
  { id: "mx-gdl", name: "Guadalajara", country: "México", lat: 20.6597, lng: -103.3496, tz: "America/Mexico_City" },
  { id: "mx-mty", name: "Monterrey", country: "México", lat: 25.6866, lng: -100.3161, tz: "America/Monterrey" },
  { id: "mx-cun", name: "Cancún", country: "México", lat: 21.1619, lng: -86.8515, tz: "America/Cancun" },
  { id: "es-mad", name: "Madrid", country: "España", lat: 40.4168, lng: -3.7038, tz: "Europe/Madrid" },
  { id: "es-bcn", name: "Barcelona", country: "España", lat: 41.3874, lng: 2.1686, tz: "Europe/Madrid" },
  { id: "es-vlc", name: "Valencia", country: "España", lat: 39.4699, lng: -0.3763, tz: "Europe/Madrid" },
  { id: "es-sev", name: "Sevilla", country: "España", lat: 37.3891, lng: -5.9845, tz: "Europe/Madrid" },
  { id: "ar-bue", name: "Buenos Aires", country: "Argentina", lat: -34.6037, lng: -58.3816, tz: "America/Argentina/Buenos_Aires" },
  { id: "ar-cor", name: "Córdoba", country: "Argentina", lat: -31.4201, lng: -64.1888, tz: "America/Argentina/Cordoba" },
  { id: "co-bog", name: "Bogotá", country: "Colombia", lat: 4.711, lng: -74.0721, tz: "America/Bogota" },
  { id: "co-med", name: "Medellín", country: "Colombia", lat: 6.2442, lng: -75.5812, tz: "America/Bogota" },
  { id: "cl-scl", name: "Santiago", country: "Chile", lat: -33.4489, lng: -70.6693, tz: "America/Santiago" },
  { id: "pe-lim", name: "Lima", country: "Perú", lat: -12.0464, lng: -77.0428, tz: "America/Lima" },
  { id: "ve-ccs", name: "Caracas", country: "Venezuela", lat: 10.4806, lng: -66.9036, tz: "America/Caracas" },
  { id: "uy-mvd", name: "Montevideo", country: "Uruguay", lat: -34.9011, lng: -56.1645, tz: "America/Montevideo" },
  { id: "ec-uio", name: "Quito", country: "Ecuador", lat: -0.1807, lng: -78.4678, tz: "America/Guayaquil" },
  { id: "bo-lpb", name: "La Paz", country: "Bolivia", lat: -16.5, lng: -68.15, tz: "America/La_Paz" },
  { id: "py-asu", name: "Asunción", country: "Paraguay", lat: -25.2637, lng: -57.5759, tz: "America/Asuncion" },
  { id: "cr-sjo", name: "San José", country: "Costa Rica", lat: 9.9281, lng: -84.0907, tz: "America/Costa_Rica" },
  { id: "pa-pty", name: "Ciudad de Panamá", country: "Panamá", lat: 8.9824, lng: -79.5199, tz: "America/Panama" },
  { id: "do-sdq", name: "Santo Domingo", country: "Rep. Dominicana", lat: 18.4861, lng: -69.9312, tz: "America/Santo_Domingo" },
  { id: "pr-sju", name: "San Juan", country: "Puerto Rico", lat: 18.4655, lng: -66.1057, tz: "America/Puerto_Rico" },
  { id: "us-nyc", name: "Nueva York", country: "EE. UU.", lat: 40.7128, lng: -74.006, tz: "America/New_York" },
  { id: "us-mia", name: "Miami", country: "EE. UU.", lat: 25.7617, lng: -80.1918, tz: "America/New_York" },
  { id: "us-la", name: "Los Ángeles", country: "EE. UU.", lat: 34.0522, lng: -118.2437, tz: "America/Los_Angeles" },
  { id: "us-chi", name: "Chicago", country: "EE. UU.", lat: 41.8781, lng: -87.6298, tz: "America/Chicago" },
  { id: "us-hou", name: "Houston", country: "EE. UU.", lat: 29.7604, lng: -95.3698, tz: "America/Chicago" },
  { id: "gb-lon", name: "Londres", country: "Reino Unido", lat: 51.5074, lng: -0.1278, tz: "Europe/London" },
  { id: "fr-par", name: "París", country: "Francia", lat: 48.8566, lng: 2.3522, tz: "Europe/Paris" },
  { id: "it-rom", name: "Roma", country: "Italia", lat: 41.9028, lng: 12.4964, tz: "Europe/Rome" },
  { id: "de-ber", name: "Berlín", country: "Alemania", lat: 52.52, lng: 13.405, tz: "Europe/Berlin" },
  { id: "pt-lis", name: "Lisboa", country: "Portugal", lat: 38.7223, lng: -9.1393, tz: "Europe/Lisbon" },
  { id: "br-sao", name: "São Paulo", country: "Brasil", lat: -23.5558, lng: -46.6396, tz: "America/Sao_Paulo" },
  { id: "br-rio", name: "Río de Janeiro", country: "Brasil", lat: -22.9068, lng: -43.1729, tz: "America/Sao_Paulo" },
  { id: "jp-tyo", name: "Tokio", country: "Japón", lat: 35.6762, lng: 139.6503, tz: "Asia/Tokyo" },
  { id: "in-del", name: "Nueva Delhi", country: "India", lat: 28.6139, lng: 77.209, tz: "Asia/Kolkata" },
  { id: "au-syd", name: "Sídney", country: "Australia", lat: -33.8688, lng: 151.2093, tz: "Australia/Sydney" },
];

export function findCity(id: string): City | undefined {
  return CITIES.find((c) => c.id === id);
}

export function searchCities(query: string): City[] {
  const q = query.trim().toLowerCase();
  if (!q) return CITIES.slice(0, 8);
  return CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q),
  ).slice(0, 10);
}
