# Landscaping Visualization App

A white-label SaaS platform for landscaping companies that leverages cutting-edge AI technologies to provide intelligent, context-aware design visualization and modification tools with advanced region detection and precision editing.

## Features

- **AI-Powered Visualization**: Uses Stable Diffusion XL inpainting for high-quality landscape transformations
- **Intelligent Prompts**: OpenAI o3-mini generates professional landscape design prompts
- **Precision Editing**: Canvas-based mask drawing for targeted area modifications
- **White-Label Ready**: Multi-tenant architecture for landscaping businesses
- **Responsive Design**: Modern React frontend with Tailwind CSS
- **Full-Color UI**: Enhanced visual hierarchy with gradient backgrounds

## Technology Stack

### Frontend
- **React** with TypeScript
- **Tailwind CSS** for styling
- **Wouter** for routing
- **TanStack Query** for data fetching
- **React Hook Form** with Zod validation
- **Shadcn/ui** components

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** with Drizzle ORM
- **Multer** for file handling
- **Sharp** for image processing

### AI Integration
- **Replicate API** - Stable Diffusion XL inpainting
- **OpenAI API** - o3-mini model for prompt generation

## Key Components

### Inpainting Interface
- Large 800px canvas for precise mask creation
- Brush/eraser tools with adjustable sizes (10-80px)
- Real-time mask preview with overlay
- Automatic mask data generation

### Style Selection
- **Decorative Curbing**: Natural Stone, River Rock, Flagstone
- **Landscape Type**: River Rock, Premium Mulch, Decorative Gravel
- **Concrete Patio**: Stamped, Colored, Textured options
- Full-color gradient boxes with white text

### Results Page
- Image toggle between original and generated
- Solid-color action buttons (Download, View Original, Try Another)
- Lead capture integration
- Professional presentation layout

## Database Schema

```sql
-- Tenants (landscaping companies)
tenants: id, slug, companyName, primaryColor, secondaryColor

-- Customer leads
leads: id, tenantId, firstName, lastName, email, phone, address

-- AI visualizations
visualizations: id, tenantId, originalImageUrl, generatedImageUrl, 
                selectedCurbing, selectedLandscape, selectedPatio, 
                replicateId, status
```

## Environment Variables

```env
DATABASE_URL=postgresql://...
REPLICATE_API_TOKEN=your_replicate_token
OPENAI_API_KEY=your_openai_key
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/jrlacey28/landscaping-visualization-app.git
cd landscaping-visualization-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env and add your actual API keys:
# OPENAI_API_KEY=your_openai_api_key
# REPLICATE_API_TOKEN=your_replicate_token
# DATABASE_URL=your_database_url
```

**Important**: Never commit your actual API keys to version control. Use environment variables or Replit Secrets for production deployments.

4. Run database migrations:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

## API Endpoints

- `GET /api/tenant/:slug` - Get tenant configuration
- `POST /api/upload` - Upload image and generate visualization
- `GET /api/visualizations/:id/status` - Check generation status
- `POST /api/leads` - Submit lead capture form

## AI Models Used

- **Stable Diffusion XL Inpainting** (`stability-ai/stable-diffusion-xl-inpainting`)
- **OpenAI o3-mini** for intelligent prompt generation

## Deployment

The app is designed for deployment on platforms like Replit, Vercel, or Railway with PostgreSQL database support.

## License

MIT License - see LICENSE file for details.