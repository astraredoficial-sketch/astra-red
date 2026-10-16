<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## AstraRed project context

- Public canonical domain: `https://astrared.vip`. Vercel remains the hosting and deployment platform.
- Product: Spanish (Latin American) astrology and connection app for adults 18+.
- AstraRed is positioned as a public product, not a beta. The launch promotion is one month free from an inauguration date still to be announced. Afterward, Calendario astral and Hilo Rojo require VIP: approved prices are USD 4.99 for one month or USD 34.99 for one year, sold as one-time non-renewing periods. No membership checkout or charges are active; do not imply purchases are available before payment integration and explicit confirmation are implemented.
- During the launch promotion, Hilo Rojo eligibility is controlled by `beta_vip_access` in `public.app_feature_flags`; apply the Supabase migration before expecting the server-side RPC to enable it. Once promotion ends, disable the flag server-side and verify the VIP entitlement flow.
- Birth date/time and birthplace are private chart inputs. Do not expose them in public profile data.
- Keep the interface concise, responsive, dark/editorial, and accessible. Use SVG icons instead of decorative emoji; preserve functional lunar/zodiac symbols.
- SEO is Spanish-first and editorial: create a small number of original guides, avoid mass-generated zodiac pages, and do not invent traffic, reviews, or product claims.
- No third-party analytics are approved. Legal contact: `astrared.oficial@gmail.com`; public operator name: AstraRed.
- Read `.agents/product-marketing.md` before changing product positioning, pricing, promotional/VIP access, legal copy, or SEO strategy.
- Use `npm run lint`, `npm test`, and `npm run build` for validation. Supabase migrations are versioned under `supabase/migrations/`.
