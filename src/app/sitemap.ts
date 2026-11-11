import type { MetadataRoute } from "next";

const publicRoutes = [
  "",
  "/horoscopo",
  "/guias",
  "/guias/carta-natal",
  "/guias/calendario-lunar",
  "/guias/sinastria",
  "/guias/destinos-astrales",
  "/guias/ciclo-personal",
  "/guias/revolucion-solar",
  "/guias/rectificacion-natal",
  "/privacidad",
  "/terminos",
  "/android",
  "/seguridad",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((route) => ({
    url: `https://astrared.vip${route || "/"}`,
  }));
}
