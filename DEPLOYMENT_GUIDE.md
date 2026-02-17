# Deployment Guide

## GitHub Repository Created

Your repository is now live at: **https://github.com/jrlacey28/landscaping-visualization-app**

## Upload Your Code

Since the git environment has some lock files, here's how to get your code uploaded:

### Option 1: Download and Upload (Recommended)

1. Download all your project files from this Replit workspace
2. Go to your GitHub repository: https://github.com/jrlacey28/landscaping-visualization-app
3. Click "uploading an existing file" or drag and drop your files
4. Upload all files except:
   - `node_modules/` folder
   - `.git/` folder  
   - `.cache/` folder
   - `.local/` folder

### Option 2: Clone and Push

If you have git installed locally:

```bash
git clone https://github.com/jrlacey28/landscaping-visualization-app.git
cd landscaping-visualization-app

# Copy your files here, then:
git add .
git commit -m "Initial commit: AI-powered landscaping visualization app"
git push origin main
```

## Key Files to Upload

Make sure these important files are included:

### Root Files
- `package.json` - Dependencies and scripts
- `package-lock.json` - Exact dependency versions
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Build configuration
- `tailwind.config.ts` - Styling configuration
- `drizzle.config.ts` - Database configuration
- `components.json` - UI components config
- `README.md` - Project documentation
- `.gitignore` - Files to ignore

### Server Files (`server/`)
- `index.ts` - Main server entry point
- `routes.ts` - API endpoints with AI integration
- `storage.ts` - Database operations
- `db.ts` - Database connection
- `openai.ts` - OpenAI o3-mini integration
- `vite.ts` - Development server

### Shared Files (`shared/`)
- `schema.ts` - Database schema and types

### Client Files (`client/`)
- All `.tsx` and `.ts` files in `src/`
- `index.html`
- All component files in `src/components/`
- All page files in `src/pages/`

## Environment Variables for Production

When deploying, make sure to set these environment variables:

```env
DATABASE_URL=your_postgresql_database_url
REPLICATE_API_TOKEN=your_replicate_token
OPENAI_API_KEY=your_openai_key
JWT_SECRET=a_long_random_secret_for_signing_tokens
JWT_EXPIRES_IN=15m
```

JWT settings:
- `JWT_SECRET` is mandatory outside development (`NODE_ENV` other than `development`) and startup will fail if it is not configured.
- Use short access-token expirations (example: `15m`) and implement refresh tokens to rotate sessions safely.

## Repository Features

Your repository includes:
- Complete AI-powered landscaping visualization platform
- Inpainting with Stable Diffusion XL
- OpenAI o3-mini prompt generation
- Multi-tenant white-label architecture
- Professional UI with full-color design
- PostgreSQL database integration
- Lead capture system

The repository is public and ready for deployment on platforms like Vercel, Railway, or back to Replit.
## Rate Limiting Configuration

Production API rate limiting is enabled with combined `IP + user-key` identities for better abuse resistance behind shared NATs and logged-in users.

### Endpoint policies

- `POST /api/auth/login`: `8 requests / 1 minute` burst, `30 requests / 15 minutes` steady
- `POST /api/admin/login`: `5 requests / 1 minute` burst, `20 requests / 15 minutes` steady
- `POST /api/stripe/webhook`: `20 requests / 1 minute` burst, `150 requests / 10 minutes` steady
- `POST /api/upload`, `POST /api/landscape/upload`, `POST /api/pools/upload`, `POST /api/analyze`:
  - cost-based budget of `12 cost / minute` burst and `70 cost / 15 minutes` steady
  - cost derived from `content-length` upload size bands

### Reverse proxy requirement

`server/index.ts` sets `trust proxy = 1` so the app can correctly read client IPs from `X-Forwarded-For` in production proxy environments.

### 429 response contract

Rate-limited responses include a JSON payload with `code = RATE_LIMIT_EXCEEDED`, policy metadata (`burst` or `steady`), and `Retry-After` to support client retries.
