# AstraRed product and marketing context

## Product and deployment

- AstraRed is a Spanish-language astrology, self-reflection, and connection app for a Latin American audience.
- `https://astrared.vip` is the public canonical URL and email-confirmation destination.
- Vercel remains the hosting/deployment platform; do not remove it or change DNS as part of domain canonicalization.
- The current product is a free beta. There are no active subscriptions or charges.
- All currently available beta features, including Hilo Rojo, should be usable without paid memberships. The `beta_vip_access` Supabase flag is the server-side switch; apply the migration before expecting this change in a deployed database.
- Potential future pricing is USD $4.99/month and $34.99/year. These are untested plans, not offers, and must not be shown as currently purchasable.

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
- Public operator name: AstraRed. Contact: `astraared.oficial@gmail.com`. Jurisdictional context: Venezuela.
- The current infrastructure includes Vercel hosting and Supabase authentication, database, and storage.
- Ko-fi support page: `https://ko-fi.com/astrared` (PayPal is linked as a payment method on Ko-fi).
- Legal pages are operational drafts and should receive local legal review before being treated as definitive legal advice.

## Product and technical safeguards

- Keep email confirmation redirects on `https://astrared.vip`; existing emails may retain their original redirect.
- Do not claim Search Console indexing, traffic, conversion, retention, revenue, or fundraising results without verified data.
- Preserve user-owned untracked work and stage only files relevant to a requested change.
- Change beta access server-side through the protected `public.app_feature_flags` table, never by bypassing the RPC in client code.
