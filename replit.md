# DreamBuilder - Landscaping Visualization App

## Overview

DreamBuilder is a white-label SaaS platform that enables landscaping companies to provide AI-powered design visualization services to their customers. The application allows users to upload property images and apply various landscaping styles (curbing, landscape materials, patio options) using Google's Gemini AI for streamlined image processing. The platform uses Gemini's advanced multimodal capabilities for intelligent prompt generation, image analysis, and landscape transformation in a single unified workflow.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**October 13, 2025**: Team Invitation Flow and Quota Sharing Implementation
- **Complete Team Invitation System**: Full end-to-end invitation flow now working
  - Added secure invitation tokens to teamMembers schema
  - Team invitation emails include unique acceptance link with token
  - Created /accept-invitation page for seamless onboarding
  - Users receive email → click link → sign in with invited email → accept invitation
  - Backend validates email matches invitation before linking to team
- **Shared Visualization Quota**: Business Pro team members now share monthly limits
  - Team owner's 500 visualizations are shared across all team members
  - Usage tracking aggregates all team members' usage (no double-counting)
  - Both owner and members see combined team usage in dashboard
  - Plan name displays as "Business Pro (Team)" for team members
- **Watermark Redesign**: Completely rewrote watermark for free tier downloads
  - Reduced size to 4% of image width (much smaller and cleaner)
  - Removed all shadow effects and background boxes
  - Simple design: tiny logo + bold white "DreamBuilder" text (matches header font)
  - Paid plans (Contractor, Business Pro, Enterprise) still download clean images without watermarks
  - Fixed Halloween page to use new minimal watermark function
- **Email Service Integration**: Professional team invitation emails
  - Integrated Resend API for transactional emails
  - Professional HTML/text email templates with team branding
  - Requires RESEND_API and EMAIL_FROM secrets in environment
  - Supports testing with onboarding@resend.dev or custom verified domains
  - DNS records (SPF, DKIM, DMARC) required for custom sending domains
- **Admin Dashboard Production Fix**: Fixed session-based authentication
  - Added `credentials: "include"` to all admin API calls (login, logout, status checks)
  - Fixed admin session persistence in production for proper cookie handling
  - User deletion and other admin operations now work correctly in production

**October 9, 2025**: Major pricing and Business Pro features update
- **Pricing Restructure**: 
  - Removed Basic plan ($20/month)
  - Renamed Pro to "Contractor" ($100/month, 100 visualizations)
  - Added Business Pro ($300/month, 500 visualizations) with team collaboration
  - Enterprise remains at $750/month
- **Team Management System**: Business Pro users can:
  - Create teams with up to 3 users included
  - Add additional team members at $50/month each
  - Manage team invitations and roles through dashboard
  - Team data stored in teams and teamMembers tables
- **Watermark System**:
  - Free tier downloads include visible DreamBuilder AI watermark (15% image size, centered)
  - Paid plans (Contractor, Business Pro, Enterprise) download clean images without watermarks
- **Custom Prompt Chat**: Business Pro users get AI customization chat
  - Custom instructions during visualization generation
  - Inline prompt feature for advanced customization
  - Integrated with landscape, pool, and other visualization pages
- **Stripe Integration**: Business Pro configured with price_1SGN4YBY2SPm2HvOrpREWCn1

**October 3, 2025**: Simplified Halloween feature to single Spooky Mode
- **SIMPLIFIED UX**: Removed individual decoration categories - now just one "Create Spooky Halloween Scene" button
- **Random Generation**: AI automatically generates comprehensive scary Halloween scene with 3-4 random decorations
- **Mobile Responsiveness**: Fixed layout issues on Halloween page for mobile devices
- **Spookify Button**: Changed main action button text to "Spookify" for better UX

**October 3, 2025**: Fixed authentication issues
- Email/password signups now automatically receive free subscription (matching Google OAuth behavior)
- Email verification set to true by default since no email sending is configured
- Resolved unverified account status for email signups in production

**August 30, 2025**: Fixed critical prompting issue
- Problem: Gemini was changing entire yards instead of only selected features
- Solution: Completely rewrote prompting system with precise, targeted instructions
- For natural stone curbing: Only adds curbing around existing beds, preserves all lawn/plants
- For landscape materials: Only replaces mulch in existing beds, keeps bed shapes
- For patios: Only adds patio in appropriate area, preserves existing landscaping
- Added detailed preservation rules to maintain house, lawn, trees, and overall layout

## System Architecture

### Frontend Architecture
- **React + TypeScript** - Component-based UI with type safety
- **Tailwind CSS** - Utility-first styling framework for responsive design
- **Wouter** - Lightweight client-side routing
- **TanStack Query** - Server state management and caching
- **Vite** - Fast build tool and development server
- **Shadcn/ui Components** - Pre-built accessible UI component library

### Backend Architecture
- **Express.js + TypeScript** - RESTful API server with type safety
- **Multi-tenant Design** - Supports white-label customization per landscaping company
- **File Upload System** - Multer middleware for image handling
- **Sharp** - Image processing and optimization
- **Session Management** - Connect-pg-simple for PostgreSQL session storage

### Data Storage Solutions
- **PostgreSQL with Drizzle ORM** - Primary database with type-safe queries
- **Database Schema**:
  - `tenants` - Company branding and configuration
  - `leads` - Customer contact information and project details
  - `visualizations` - Roofing and siding visualization jobs
  - `poolVisualizations` - Pool design visualizations
  - `landscapeVisualizations` - Landscape design visualizations
  - `halloweenVisualizations` - Halloween decoration visualizations (seasonal feature)
  - `users` - User accounts with authentication
  - `subscriptions` - User subscription plans and billing
  - `userUsage` - Monthly usage tracking per user
- **File Storage** - Local filesystem for uploaded and generated images

### AI Integration Pipeline
- **Google Gemini 2.5-pro** - Generates professional landscape design prompts based on selected styles
- **Gemini Image Generation** - Handles complete image processing workflow with 1920x1080 size constraints
- **Streamlined Processing** - Single API call handles prompt generation, image analysis, and transformation
- **Multimodal Capabilities** - Combines text and image understanding for optimal results

### Authentication and Authorization
- **Multi-tenant Architecture** - Tenant identification via slug routing
- **Admin Dashboard** - Separate interface for tenant management
- **Lead Capture System** - Form validation with Zod schemas

## External Dependencies

### AI Services
- **Google Gemini API** - Complete AI processing pipeline
  - Gemini 2.5-pro for intelligent prompt generation and image analysis
  - Gemini 2.0-flash-preview-image-generation for image transformation
  - Integrated multimodal processing with automatic size optimization (1920x1080)

### Database and Infrastructure
- **Neon PostgreSQL** - Serverless PostgreSQL hosting
- **Drizzle Kit** - Database migrations and schema management

### Communication Services
- **Resend** - Transactional email service for team invitations
  - Professional email templates with HTML/text formats
  - Requires RESEND_API environment variable
  - Supports custom domain verification for branded emails

### Development Tools
- **ESBuild** - Production build bundling
- **TSX** - TypeScript execution for development
- **Replit Integration** - Development environment with hot reload

### UI Libraries
- **Radix UI Primitives** - Accessible component foundations
- **Lucide React** - Icon library
- **React Hook Form** - Form state management
- **Date-fns** - Date manipulation utilities