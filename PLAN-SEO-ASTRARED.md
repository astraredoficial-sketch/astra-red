# Plan de SEO y visibilidad de AstraRed

## Objetivo

Hacer que las páginas públicas de AstraRed sean fáciles de rastrear, entender e indexar por buscadores y asistentes de búsqueda, sin exponer las áreas de cuenta ni los datos privados. El mercado inicial es hispanohablante y la beta sigue siendo gratuita.

## Fase 1 — Fundamentos técnicos

- Mantener `https://astrared.vip` como dominio canónico.
- Publicar un sitemap que enumere únicamente páginas públicas, canónicas e indexables.
- Mantener `robots.txt` accesible y declarar allí el sitemap y la política para crawlers de búsqueda y de entrenamiento.
- Publicar `llms.txt` con descripciones verificables y enlaces absolutos a contenido público.
- Conservar `noindex` en las rutas privadas o de producto que no son páginas editoriales.
- Validar que robots, sitemap y llms respondan correctamente en producción y que las URL del sitemap devuelvan `200`.

**Criterio de salida:** todas las URL del sitemap son canónicas, públicas, indexables y responden `200`; el sitemap y `llms.txt` se sirven desde el dominio canónico.

## Fase 2 — Indexación y diagnóstico

- Verificar propiedad de dominio y enviar el sitemap en Google Search Console y Bing Webmaster Tools.
- Revisar páginas indexadas, exclusiones, consultas, impresiones, clics y errores de rastreo.
- Comprobar títulos, descripciones, canonical, jerarquía de encabezados, enlaces internos y datos estructurados en las páginas públicas.
- Revisar métricas de rendimiento y experiencia móvil antes de priorizar cambios.

**Criterio de salida:** hay una línea base documentada en Search Console y Bing; los problemas de indexación tienen una causa y una acción asignada.

## Fase 3 — Contenido editorial útil

- Mejorar primero las guías actuales de carta natal, sinastría y fases lunares con explicaciones originales, precisas y fáciles de verificar.
- Responder preguntas reales de lectores con encabezados claros, ejemplos y fuentes fiables cuando se hagan afirmaciones factuales.
- Explicar límites: astrología como reflexión simbólica, no ciencia, consejo profesional ni predicción garantizada.
- Publicar pocas guías completas; evitar páginas repetitivas por signo, pareja o palabra clave.

**Criterio de salida:** cada guía tiene una intención de búsqueda diferenciada, información útil propia y enlaces hacia guías relacionadas y el producto.

## Fase 4 — Preparación para búsqueda con IA

- Mantener `llms.txt` sincronizado con páginas, funciones y políticas reales.
- Permitir crawlers de búsqueda/citación y mantener separada la decisión sobre crawlers de entrenamiento.
- Comprobar que las páginas públicas entregan HTML legible, metadatos claros y enlaces rastreables.
- Revisar manualmente una muestra estable de consultas relevantes en Google, ChatGPT, Perplexity y otros asistentes; registrar la fecha, las consultas y las fuentes citadas. Una respuesta aislada no demuestra visibilidad sostenida.

**Criterio de salida:** los controles de rastreo reflejan la política elegida y se conserva un registro repetible de las comprobaciones.

## Fase 5 — Autoridad y mejora continua

- Fortalecer la identidad pública y la consistencia de AstraRed en sus canales oficiales.
- Buscar menciones y colaboraciones auténticas; no comprar reseñas, inventar avales ni publicar comparativas promocionales como si fueran independientes.
- Revisar Search Console mensualmente y actualizar páginas cuando cambien el producto, las políticas o las fuentes.
- Comparar resultados con la línea base antes de decidir nuevas páginas o inversión.

**Criterio de salida:** las decisiones editoriales y técnicas se priorizan por datos observados, valor para lectores y capacidad real de mantener el contenido.

## Cambios de esta primera entrega

- Sitemap reducido a las ocho páginas públicas seleccionadas; excluye `/calendario`, que es una superficie de la aplicación y no una guía indexable.
- Robots permite rastreo de búsqueda y citación, y bloquea GPTBot y ClaudeBot, identificados como crawlers de entrenamiento.
- Google-Extended permanece permitido porque su uso incluye grounding de Gemini; bloquearlo también podría reducir la posibilidad de aparecer como fuente en esas respuestas.
- `llms.txt` resume el producto y enlaza solo páginas públicas, sin divulgar entradas privadas ni afirmar métricas, ingresos o funciones de pago.
