# Production Operations TODO

Goal: complete the non-code work needed to onboard the first 3-5 clients with clean billing, stable hosting, and a support process.

## P0 - Accounts, Secrets, And Billing

- [ ] Update Stripe live products/prices.
  - Archive or deactivate the Basic $20/month plan.
  - Set Contractor to $300/month.
  - Set Professional to $500/month.
  - Copy the live Stripe price IDs into the app environment/config if they changed.

- [ ] Configure the live Stripe webhook endpoint.
  - Endpoint path should match the backend route, likely `/api/stripe/webhook`.
  - Subscribe to `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, and `invoice.payment_failed`.
  - Save the live webhook signing secret in production as `STRIPE_WEBHOOK_SECRET`.

- [ ] Confirm production environment variables.
  - `DATABASE_URL`
  - `SESSION_SECRET`
  - `JWT_SECRET`
  - `APP_URL`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `VITE_STRIPE_PUBLIC_KEY` if the frontend uses Stripe directly
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GEMINI_API_KEY`
  - Object storage keys once storage is added

- [ ] Keep Stripe test and live keys separate.
  - Test mode should be used only in local/staging.
  - Live mode should be used only in production.
  - Never mix test price IDs with live secret keys.

- [ ] Choose and configure object storage.
  - Good small-scale options: Cloudflare R2, AWS S3, Supabase Storage, or the storage layer included with the hosting provider.
  - Create a production bucket.
  - Configure CORS for the production domain.
  - Add lifecycle rules for old temporary uploads.

## P0 - Deployment And Domains

- [ ] Pick the production hosting plan.
  - For 3-5 clients, a modest managed app host plus managed Postgres is likely fine if image storage is not kept in the database.
  - Upgrade only when CPU, memory, request timeouts, or generation concurrency become a real bottleneck.

- [ ] Attach the production custom domain and HTTPS.
  - Confirm `APP_URL` uses the final `https://` domain.
  - Confirm OAuth, Stripe, and embeds all use the same production domain.

- [ ] Provision managed Postgres with backups.
  - Enable daily backups.
  - Test a restore into a staging database before launch.
  - Document where backups live and who has access.

- [ ] Run production database setup and verify plan records.
  - Confirm Basic is inactive or removed from public checkout.
  - Confirm Contractor is $300/month.
  - Confirm Professional is $500/month.
  - Confirm monthly usage limits match what you intend to sell.

- [ ] Configure Google OAuth redirect URIs.
  - Add the production callback URL in Google Cloud.
  - Keep local callback URLs for development only.

- [ ] Smoke test production from outside your logged-in browser.
  - Use incognito.
  - Use a phone on cellular data.
  - Test login, dashboard load, pricing, checkout redirect, and embed load.

## P0 - Client Onboarding

- [ ] Create a client intake checklist.
  - Company name
  - Company logo
  - Brand colors
  - Contact phone/email
  - Website domain
  - Services enabled
  - Monthly usage limit
  - Embed destination page
  - Billing contact

- [ ] Prepare tenant/client records before launch.
  - Create records for the first 3-5 clients.
  - Verify each slug/domain.
  - Generate each embed code.
  - Test each embed in incognito before sending it to the client.

- [ ] Prepare a client handoff note.
  - Login URL
  - Embed instructions
  - Support contact
  - Expected AI limitations
  - What images work best
  - How billing and cancellation work

- [ ] Define who handles first-line support.
  - Decide response time expectations.
  - Decide what issues get escalated to code changes.
  - Keep a shared issue tracker or spreadsheet for client requests.

## P1 - Monitoring And Support

- [ ] Add error monitoring.
  - Options: Sentry, Logtail, Better Stack, Datadog, or hosting-provider logs.
  - Capture backend exceptions and frontend crashes.

- [ ] Add uptime monitoring.
  - Monitor the production health endpoint.
  - Alert by email or SMS when the site is down.

- [ ] Turn on Stripe alerts.
  - Failed payments
  - Disputes
  - Cancellations
  - Webhook delivery failures

- [ ] Create an incident checklist.
  - AI provider unavailable
  - Stripe webhook failing
  - Upload/image storage failing
  - Database unavailable
  - Login/OAuth failing
  - Client embed broken

- [ ] Review usage weekly after launch.
  - Failed generations
  - Heavy users
  - Storage growth
  - Support issues
  - Conversion from embed visitors to leads

## P1 - Legal And Trust

- [ ] Review terms and privacy policy after pricing changes.
- [ ] Add or confirm refund and cancellation policy.
- [ ] Decide how long uploaded/generated images are retained.
- [ ] Make sure clients have rights to use submitted homeowner/property photos.
- [ ] Add clear support and business contact information.
- [ ] Confirm invoices/receipts show the right business name and tax details.

## Launch Day Checklist

- [ ] Deploy production build.
- [ ] Confirm migrations/database setup completed.
- [ ] Complete one live checkout with your own card or a 100% discount coupon.
- [ ] Confirm Stripe webhook updates the admin dashboard subscription state.
- [ ] Generate one visualization from each major flow.
- [ ] Generate one public embed visualization in incognito.
- [ ] Confirm admin usage/progress views update.
- [ ] Confirm backups and uptime monitoring are active.
- [ ] Send the first client their embed code and handoff note.

## Weekly After Launch

- [ ] Review failed generations and fix recurring causes.
- [ ] Review usage by client against plan limits.
- [ ] Check Stripe failed payments and webhook failures.
- [ ] Check storage and database growth.
- [ ] Review support issues for patterns.
- [ ] Note feature requests, but only build what helps onboarding, retention, or reliability.
