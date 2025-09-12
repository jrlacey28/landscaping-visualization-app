# Environment Variables Documentation

This document lists all required and optional environment variables for the application.

## Required Environment Variables

### Database
- `DATABASE_URL` - PostgreSQL connection string (automatically provided by Replit)

### Admin Access
- `ADMIN_PASSWORD` - Password for admin authentication (no username required)
  - Example: `ADMIN_PASSWORD=your-secure-password-here`
  - Access admin panel at: `/admin`

### Stripe Configuration

#### Test Mode (Development/Testing)
- `STRIPE_TEST_API_KEY` - Stripe test mode secret key (starts with `sk_test_`)
  - Get from: https://dashboard.stripe.com/test/apikeys
  - Example: `STRIPE_TEST_API_KEY=sk_test_...`

- `STRIPE_TEST_WEBHOOK_SECRET` (Optional) - Webhook endpoint secret for test mode
  - Get from: https://dashboard.stripe.com/test/webhooks
  - Example: `STRIPE_TEST_WEBHOOK_SECRET=whsec_...`

#### Production Mode
- `STRIPE_SECRET_KEY` - Stripe live mode secret key (starts with `sk_live_`)
  - Get from: https://dashboard.stripe.com/apikeys
  - Example: `STRIPE_SECRET_KEY=sk_live_...`

- `STRIPE_WEBHOOK_SECRET` (Optional) - Webhook endpoint secret for live mode
  - Get from: https://dashboard.stripe.com/webhooks
  - Example: `STRIPE_WEBHOOK_SECRET=whsec_...`

**Note**: The application automatically detects whether to use test or production mode based on which keys are present. Test keys take priority if both are set.

### Authentication
- `JWT_SECRET` - Secret key for JWT token signing
  - Example: `JWT_SECRET=your-jwt-secret-key-here`
  - Generate a secure random string

- `SESSION_SECRET` - Secret key for session management
  - Example: `SESSION_SECRET=your-session-secret-key-here`
  - Generate a secure random string

### Google OAuth (Optional)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GOOGLE_CALLBACK_URL` - OAuth callback URL (e.g., `https://yourdomain.com/api/auth/google/callback`)

### Replit OAuth (Optional)
- `REPLIT_AUTH_DOMAIN` - Replit authentication domain (automatically set by Replit)

### AI Services
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `REPLICATE_API_TOKEN` - Replicate API token for image processing

## Optional Environment Variables

### Application
- `NODE_ENV` - Environment mode (`development`, `production`)
  - Default: `development`
- `PORT` - Server port number
  - Default: `5000`

### Email (Optional - for future features)
- `RESEND_API_KEY` - Resend API key for email sending
- `EMAIL_FROM` - Default sender email address

## Setting Environment Variables

### In Replit
1. Go to the "Secrets" tab in your Replit project
2. Add each environment variable as a key-value pair
3. Click "Add new secret" for each variable
4. The application will automatically restart when secrets are added

### Locally
1. Create a `.env` file in the project root
2. Add environment variables in the format: `KEY=value`
3. Never commit the `.env` file to version control

## Stripe Price IDs

The application uses different price IDs for test and production modes:

### Test Mode Price IDs
- Basic Plan: `price_1S6DdkBY2SPm2HvOxI9yuZdg`
- Pro Plan: `price_1S6De0BY2SPm2HvOX1t23IUg`

### Production Mode Price IDs
- Basic Plan: `price_1S5X1sBY2SPm2HvOuDHNzsIp`
- Pro Plan: `price_1S5X2XBY2SPm2HvO2he9Unto`

The application automatically selects the correct price IDs based on whether you're using test or production Stripe keys.

## Admin Functions

### Admin Login
- Navigate to `/admin`
- Enter the password set in `ADMIN_PASSWORD`
- No username is required

### Admin Capabilities
- View all users and their subscription status
- Change user subscription plans
- Reset user monthly usage
- Set custom usage limits for users
- View usage statistics

## Troubleshooting

### "Plan not found" Error
This usually means the database is missing subscription plan records. The application should automatically initialize these on startup, but you can manually run:
```bash
npm run init-db
```

### Admin Login Issues
- Ensure `ADMIN_PASSWORD` is set in environment variables
- The admin login uses password-only authentication (no username)
- Check browser console for any error messages

### Stripe Webhook Issues
- Webhook secrets are optional but recommended for production
- Use the correct webhook secret for your mode (test vs production)
- Ensure your webhook endpoint is accessible from the internet