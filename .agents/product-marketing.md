# AstraRed product and marketing context

## Product and deployment

- AstraRed is a Spanish-language astrology, self-reflection, and connection app for a Latin American audience.
- `https://astrared.vip` is the public canonical URL and email-confirmation destination.
- Vercel remains the hosting/deployment platform; do not remove it or change DNS as part of domain canonicalization.
- AstraRed is positioned as a public product, not a beta.
- All AstraRed features are free. There are no VIP tiers, paid memberships, advertising, or membership checkout. The only support option is a voluntary Ko-fi donation; it never unlocks features or changes access.
- The Android APK is distributed directly from `https://astrared.vip` and is not currently published on Google Play. Do not imply Play Store availability, Play approval, or Play Protect certification.

## Audience, content, and UX

- Audience: Spanish-speaking adults (18+) interested in natal charts, lunar calendars, and meaningful connections; they may be single or partnered.
- Use neutral Latin American Spanish. Keep the homepage concise and make only account creation and sign-in the primary home calls to action.
- AstraRed treats astrology as symbolic reflection, not scientific prediction or professional advice.
- Prefer a restrained, premium celestial editorial style: dark backgrounds, existing rose/purple/gold brand colors, readable contrast, and measured motion.
- Replace decorative emoji with SVG icons. Keep meaningful lunar and zodiac symbols where they communicate actual calendar or chart information.
- Publish a few useful original guides, not mass-generated pages for every sign or pairing.
- No advertising, advertising SDKs, or third-party analytics are approved. Do not add advertising or paid feature gates; keep the Ko-fi donation voluntary and external.

## Privacy and legal

- Minimum age is 18. Registration collects a self-declared birth date; no identity document is requested.
- Birth date, birth time, and precise birthplace are private chart inputs.
- Public operator name: AstraRed. Contact: `astrared.oficial@gmail.com`. Jurisdictional context: Venezuela.
- The current infrastructure includes Vercel hosting and Supabase authentication, database, and storage.
- Ko-fi support page: `https://ko-fi.com/astrared` (PayPal is linked as a payment method on Ko-fi).
- Legal pages are published product policies, but a Venezuela-qualified lawyer should review the operator identity, address, donation disclosures, and privacy obligations.
- Public legal operator currently identified as AstraRed, based in Barinas, Venezuela; contact: `astrared.oficial@gmail.com`. No street mailing address or incorporated legal entity has been provided.

## Product and technical safeguards

- Keep email confirmation redirects on `https://astrared.vip`; existing emails may retain their original redirect.
- Do not claim Search Console indexing, traffic, conversion, retention, revenue, or fundraising results without verified data.
- Preserve user-owned untracked work and stage only files relevant to a requested change.
- The launch `beta_vip_access` flag is disabled by `supabase/migrations/20261112000100_free_access_without_vip.sql`; membership tables and RPCs remain intact for possible future use. Apply the migration before releasing the free-access update to production; never bypass authorization in client code.
