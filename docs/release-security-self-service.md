# Security and business setup release

## Included

- Server sessions for new sign-ins; OAuth state validation; server logout and bearer invalidation.
- Email verification, password recovery, versioned agreement acceptance, and a resumable business setup page.
- Workspace-owned company settings, logo and exterior product/color libraries; paid, verified publishing and a hosted visualizer link.
- Private visualization access checks with scoped, expiring result capabilities for anonymous embeds.
- Team mutation scoping, verified invitation recipients, bounded image decoding, distributed rate limits and generation leases.
- Safer outbound HTTPS requests with pinned public DNS destinations, no redirects, timeouts and streaming size limits.
- Stripe event deduplication and processing leases; failed processing remains retryable and subscription updates retrieve current Stripe state.
- Optional exterior selection with brush, eraser and keyboard-accessible rectangle controls. Final PNG compositing preserves normalized source pixels outside the selection. Product appearance inside the selection still needs real-photo review; this is not a claim of exact material/color reproduction.
- Usage is charged after successful generation; existing plan allowances and prices remain in effect.
- Patched dependencies. Full npm audit reported zero vulnerabilities on September 5, 2026.

## Release preparation

The live Replit app is RoofingSidingAIVisualizer, serving dreambuilderai.com. Its Replit-only commits must be preserved when merging the update branch. Do not reset the live checkout to the local branch.

Before publishing, ensure independent cryptographically random SESSION_SECRET and JWT_SECRET values of at least 32 characters. APP_URL must be the canonical HTTPS origin. Google sign-in is gracefully unavailable when its secret is absent; password sign-in continues to work. Confirm the OAuth callback configuration before claiming Google works.

RESEND_API_KEY (or existing RESEND_API) and a verified EMAIL_FROM are required for verification/reset/quote email. Production database TLS now verifies certificates; configure DATABASE_SSL_CA for a private CA if required, rather than disabling validation. Confirm the database connection before publishing.

Startup applies additive user columns and security tables. These tables are included in the Drizzle schema so future schema pushes preserve them. Take the normal deployment backup before applying changes. Existing customer data and paid plans are retained. Newly created businesses require verified email and completed publishing before their public embed runs.

New sessions and refreshed client assets should be used together. Older anonymous results without a capability need a signed-in owner to retrieve them. Rotating the signing secrets invalidates prior authentication and result tokens.

## Verification

- TypeScript check and production build.
- Existing tenant siding, exterior selection/color, enterprise embed-access and CRM regression checks.
- Isolated local integration suite: registration requires acceptance; session persistence/logout; invalidated bearer rejection; cross-company reads and member mutations; setup persistence and rejected extra settings; CSRF rejection; verification/plan publishing gates and successful publish; invalid/oversized image uploads; capability scoping; concurrent lease exclusion; private-address rejection; exact outside-mask preservation.
- Drizzle schema push against the isolated integration database reports no changes after additive startup schema creation.
- Built signup page served locally with HTTP 200 and security headers. Development optimizer hit a local filesystem sandbox issue, so the built application was used for the local preview.

No real payment, outbound email, or paid AI generation was performed in these local tests. Production OAuth, email delivery, Stripe event replay and real-photo visual quality must be checked in the deployment environment. Admin MFA, a durable generation/CRM delivery queue, retention controls and a contractor image-quality benchmark remain follow-up improvements; this release does not claim those are implemented.

To run the integration suite, initialize a dedicated local PGlite database at .local/security-integration with the local schema script, then run test:security-onboarding. The test explicitly isolates storage and disables external providers. Do not run another process against that database simultaneously.
