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
    changeFrequency: route.startsWith("/guias") ? "monthly" : "yearly",
    priority: route === "" ? 1 : route.startsWith("/guias") ? 0.7 : 0.4,
  }));
}
