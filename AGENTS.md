<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## AstraRed project context

- Public canonical domain: `https://astrared.vip`. Vercel remains the hosting and deployment platform.
- Product: Spanish (Latin American) astrology and connection app for adults 18+.
- Beta is free; do not implement charges or present future prices as offers without explicit approval. Planned prices, if later approved, are USD 4.99/month and USD 34.99/year.
- During beta, Hilo Rojo eligibility is controlled by the `beta_vip_access` flag in `public.app_feature_flags`; its Supabase migration must be applied for the server-side RPC to enable it.
- Birth date/time and birthplace are private chart inputs. Do not expose them in public profile data.
- Keep the interface concise, responsive, dark/editorial, and accessible. Use SVG icons instead of decorative emoji; preserve functional lunar/zodiac symbols.
- SEO is Spanish-first and editorial: create a small number of original guides, avoid mass-generated zodiac pages, and do not invent traffic, reviews, or product claims.
- No third-party analytics are approved. Legal contact: `astrared.oficial@gmail.com`; public operator name: AstraRed.
- Read `.agents/product-marketing.md` before changing product positioning, pricing, beta access, legal copy, or SEO strategy.
- Use `npm run lint`, `npm test`, and `npm run build` for validation. Supabase migrations are versioned under `supabase/migrations/`.
