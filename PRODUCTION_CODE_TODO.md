# Production Code TODO

Goal: make the app reliable for the first 3-5 client accounts without overbuilding. Focus on reliability, billing correctness, usage tracking, and a clean client onboarding flow.

## P0 - Must Do Before Client Onboarding

- [ ] Fix public embed generation.
  - Current public embed flows must be tested from an incognito browser with no app login.
  - Add public tenant-scoped generation endpoints or signed embed tokens if the embed currently depends on authenticated upload/generation routes.
  - Acceptance: `/embed`, `/embed-roofing`, and `/embed-pools` can upload/generate without an app login, and usage is attributed to the correct tenant.

- [ ] Move uploaded/generated images out of database/base64/local disk storage.
  - Use object storage such as Cloudflare R2, S3, Supabase Storage, or equivalent.
  - Store object keys/URLs in the database instead of large image payloads.
  - Acceptance: generated images survive deploys/restarts, DB size does not grow quickly from image blobs, and older records still display or are migrated.

- [ ] Add strict upload validation.
  - Enforce max file size, allowed MIME types, image dimensions, and extension checks.
  - Return clean validation errors for unsupported or oversized uploads.
  - Acceptance: huge files, non-images, and unsupported formats are rejected before generation starts.

- [ ] Make generation status timeout-safe.
  - Prefer a job table/worker for image generation.
  - At minimum, store `processing`, `completed`, and `failed` states and expose a polling endpoint.
  - Acceptance: a failed AI request does not hang the client UI forever and admins can see failed jobs.

- [ ] Add production error logging.
  - Capture route, user/tenant ID, error type, request ID, and timing.
  - Do not log secrets, raw payment data, or sensitive prompt/image payloads.
  - Acceptance: a production failure can be traced without exposing private data.

- [ ] Add rate limits.
  - Cover auth/login, upload/generation, admin login, and public embed endpoints.
  - Use stricter limits for anonymous/public routes.
  - Acceptance: one user or bot cannot burn through usage or overload generation endpoints.

- [ ] Harden Stripe subscription handling.
  - Verify inactive/archived plans cannot be checked out.
  - Add webhook idempotency so repeated Stripe events do not duplicate changes.
  - Handle `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, and `invoice.payment_failed`.
  - Acceptance: dashboard subscription state matches Stripe after checkout, renewal, failed payment, cancellation, and retry.

- [ ] Centralize pricing and plan definitions.
  - Keep plan names, slugs, monthly limits, active flags, and Stripe price IDs in one backend source.
  - Avoid hardcoded plan prices in multiple UI/API files.
  - Acceptance: Contractor at $300/month and Professional at $500/month display consistently and checkout against the intended Stripe prices.

- [ ] Lock down CORS and cookies for production.
  - Replace broad origins with configured allowed origins.
  - Confirm secure cookie settings behind the production host/proxy.
  - Acceptance: login works on the production domain and cross-origin requests are limited to approved domains.

## P1 - Should Do Soon

- [ ] Make admin progress tracking more complete.
  - Add filters by client, user, service type, plan, month, and failed/completed status.
  - Show subscription status, usage count, usage limit, and recent generations per tenant.
  - Acceptance: admin can answer "who is using what and is billing active?" without checking the database manually.

- [ ] Add health and readiness endpoints.
  - Include database connectivity, required environment variables, Stripe configuration presence, AI provider configuration presence, and object storage availability.
  - Do not return secret values.
  - Acceptance: production monitoring can check `/api/health` or equivalent.

- [ ] Add database indexes for common queries.
  - Subscription lookup by user/status.
  - Usage lookup by user/tenant/month/year.
  - Tenant lookup by slug/domain.
  - Visualization lookup by user/tenant/status/created date.
  - Acceptance: admin and dashboard pages stay fast as records grow.

- [ ] Make usage increments transactional.
  - Prevent concurrent requests from exceeding monthly limits through race conditions.
  - Acceptance: rapid repeated requests cannot bypass plan limits.

- [ ] Add focused backend tests.
  - Checkout rejects inactive plans.
  - Stripe webhook events update subscriptions idempotently.
  - Usage limits are enforced.
  - Admin plan updates persist correctly.
  - Anonymous embed generation is attributed correctly.

- [ ] Add focused frontend smoke tests.
  - Pricing page shows only active plans.
  - Dashboard usage counter renders correctly.
  - Embed flow can upload and show generated result.
  - Admin dashboard can load subscription/usage data.

- [ ] Add image/data retention cleanup.
  - Decide how long to keep uploads, generated images, failed jobs, and temporary files.
  - Implement scheduled cleanup after the retention window.
  - Acceptance: storage cost and DB size remain predictable.

- [ ] Add audit logging for admin changes.
  - Track plan edits, subscription overrides, client/tenant edits, and manual usage changes.
  - Acceptance: important admin changes have timestamp, actor, target, and before/after metadata.

## P2 - Scale Later

- [ ] Move generation work to a real queue and worker process.
- [ ] Add dashboard charts for usage, failures, revenue, and client activity.
- [ ] Add per-client API keys or signed embed tokens with rotation.
- [ ] Put generated images behind a CDN.
- [ ] Add a Stripe billing portal flow for clients.
- [ ] Add automated database migrations as part of deploy.
- [ ] Add a rollback checklist and scripted deploy promotion.
- [ ] Add more detailed service-level metrics by landscaping, roofing, pools, and future verticals.

## Validation Commands

Run these before letting new clients use the app:

```powershell
npm run check
npm run build
```

After starting the app locally or in staging:

```powershell
Invoke-WebRequest http://localhost:5000/api/health -UseBasicParsing
```

Manual validation:

- [ ] Complete checkout with a Stripe test card.
- [ ] Send Stripe CLI test events for subscription created, updated, deleted, invoice paid, and invoice payment failed.
- [ ] Generate one visualization from an authenticated dashboard account.
- [ ] Generate one visualization from each public embed flow in incognito.
- [ ] Confirm usage increments in the dashboard and admin dashboard.
- [ ] Confirm failed generation states show a useful message and are visible to admin.

## Done Definition

- [ ] 3-5 clients can sign up, pay, log in, generate, and view usage.
- [ ] Public embeds work without requiring the visitor to log in.
- [ ] Admin can see subscription state, usage progress, failed generations, and client activity.
- [ ] Billing state stays synced with Stripe through webhooks.
- [ ] Production errors are logged and actionable.
- [ ] There is a known rollback path if a deploy breaks client usage.
