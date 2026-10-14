import type { MetadataRoute } from "next";

const publicRoutes = [
  "",
  "/guias",
  "/guias/carta-natal",
  "/guias/calendario-lunar",
  "/guias/sinastria",
  "/privacidad",
  "/terminos",
  "/seguridad",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((route) => ({
    url: `https://astrared.vip${route || "/"}`,
  }));
}
