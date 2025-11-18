# DreamBuilder - Landscaping Visualization App

## Overview

DreamBuilder is a white-label SaaS platform designed for landscaping companies. It provides AI-powered design visualization services, allowing users to upload property images and apply various landscaping styles (curbing, materials, patios) using Google's Gemini AI. The platform leverages Gemini's multimodal capabilities for intelligent prompt generation, image analysis, and landscape transformation, aiming to streamline the design process for landscapers and their clients. A new Christmas lights visualization feature has also been added, expanding the platform's seasonal offerings.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React + TypeScript**: Component-based UI with type safety.
- **Tailwind CSS**: Utility-first styling for responsive design.
- **Wouter**: Lightweight client-side routing.
- **TanStack Query**: Server state management and caching.
- **Vite**: Fast build tool.
- **Shadcn/ui Components**: Pre-built accessible UI components.

### Backend Architecture
- **Express.js + TypeScript**: RESTful API server.
- **Multi-tenant Design**: Supports white-label customization per company.
- **File Upload System**: Multer middleware for image handling.
- **Sharp**: Image processing and optimization.
- **Session Management**: Connect-pg-simple for PostgreSQL session storage.
- **Team Management System**: Allows Business Pro users to create and manage teams, sharing visualization quotas.

### Data Storage Solutions
- **PostgreSQL with Drizzle ORM**: Primary database for application data.
  - **Key Schemas**: `tenants`, `leads`, `visualizations`, `poolVisualizations`, `landscapeVisualizations`, `halloweenVisualizations`, `christmasLightsVisualizations`, `users`, `subscriptions`, `userUsage`, `teams`, `teamMembers`.
- **File Storage**: Local filesystem for uploaded and generated images.

### AI Integration Pipeline
- **Google Gemini 2.5-pro**: Generates professional landscape design prompts, handles image analysis, and transformation.
- **Gemini Image Generation**: Processes images with 1920x1080 size constraints.
- **Streamlined Processing**: Single API call for prompt generation, analysis, and transformation.
- **Multimodal Capabilities**: Combines text and image understanding for optimal results.
- **Targeted Prompting**: Precision prompting ensures AI only modifies selected features, preserving existing elements.

### Authentication and Authorization
- **Multi-tenant Architecture**: Tenant identification via slug routing.
- **Admin Dashboard**: Separate interface for tenant management and user administration.
- **Lead Capture System**: Form validation with Zod schemas.
- **Subscription-based Features**: Paid plans offer features like no watermarks, team collaboration, and custom prompt chat.

## External Dependencies

### AI Services
- **Google Gemini API**: Utilizes Gemini 2.5-pro for prompt generation and analysis, and Gemini 2.0-flash-preview-image-generation for image transformation.

### Database and Infrastructure
- **Neon PostgreSQL**: Serverless PostgreSQL hosting.
- **Drizzle Kit**: Database migrations and schema management.

### Communication Services
- **Resend**: Transactional email service for team invitations and other system emails.

### Development Tools
- **ESBuild**: Production build bundling.
- **TSX**: TypeScript execution for development.
- **Replit Integration**: Development environment.

### UI Libraries
- **Radix UI Primitives**: Accessible component foundations.
- **Lucide React**: Icon library.
- **React Hook Form**: Form state management.
- **Date-fns**: Date manipulation utilities.