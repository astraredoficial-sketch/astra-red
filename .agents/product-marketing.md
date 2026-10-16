# AstraRed product and marketing context

## Product and deployment

- AstraRed is a Spanish-language astrology, self-reflection, and connection app for a Latin American audience.
- `https://astrared.vip` is the public canonical URL and email-confirmation destination.
- Vercel remains the hosting/deployment platform; do not remove it or change DNS as part of domain canonicalization.
- AstraRed is positioned as a public product, not a beta.
- Launch promotion: one month at no cost from the public inauguration date, which is still to be announced.
- After the promotion, Calendario astral and Hilo Rojo require VIP membership. Approved prices are USD $4.99 for one month or USD $34.99 for one year, as one-time non-renewing purchases. No membership checkout or charges are active yet; never imply that a purchase can already be completed.
- Before checkout goes live, disclose total price, tax treatment, payment provider, duration, refund conditions, and access rules, and require explicit purchase confirmation. Do not implement recurring billing.
- During the launch promotion, Hilo Rojo eligibility is controlled by the `beta_vip_access` flag in `public.app_feature_flags`; its Supabase migration must be applied for the server-side RPC to enable it. After the promotion, turn this flag off through the protected server-side table and verify VIP access in production; never bypass the RPC in client code.

## Audience, content, and UX

- Audience: Spanish-speaking adults (18+) interested in natal charts, lunar calendars, and meaningful connections; they may be single or partnered.
- Use neutral Latin American Spanish. Keep the homepage concise and make only account creation and sign-in the primary home calls to action.
- AstraRed treats astrology as symbolic reflection, not scientific prediction or professional advice.
- Prefer a restrained, premium celestial editorial style: dark backgrounds, existing rose/purple/gold brand colors, readable contrast, and measured motion.
- Replace decorative emoji with SVG icons. Keep meaningful lunar and zodiac symbols where they communicate actual calendar or chart information.
- Publish a few useful original guides, not mass-generated pages for every sign or pairing.
- No third-party analytics or ad tracking are approved. Do not add them without explicit consent.

## Privacy and legal

- Minimum age is 18. Registration collects a self-declared birth date; no identity document is requested.
- Birth date, birth time, and precise birthplace are private chart inputs.
- Public operator name: AstraRed. Contact: `astrared.oficial@gmail.com`. Jurisdictional context: Venezuela.
- The current infrastructure includes Vercel hosting and Supabase authentication, database, and storage.
- Ko-fi support page: `https://ko-fi.com/astrared` (PayPal is linked as a payment method on Ko-fi).
- Legal pages are published product policies, but a Venezuela-qualified lawyer should review the operator identity, address, consumer subscription disclosures, and privacy obligations before paid memberships launch.
- Public legal operator currently identified as AstraRed, based in Barinas, Venezuela; contact: `astrared.oficial@gmail.com`. No street mailing address or incorporated legal entity has been provided.

## Product and technical safeguards

- Keep email confirmation redirects on `https://astrared.vip`; existing emails may retain their original redirect.
- Do not claim Search Console indexing, traffic, conversion, retention, revenue, or fundraising results without verified data.
- Preserve user-owned untracked work and stage only files relevant to a requested change.
- Change promotional/VIP access server-side through the protected `public.app_feature_flags` table, never by bypassing the RPC in client code.
