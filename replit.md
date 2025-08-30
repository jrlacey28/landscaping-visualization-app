# Landscaping Visualization App

## Overview

This is a white-label SaaS platform that enables landscaping companies to provide AI-powered design visualization services to their customers. The application allows users to upload property images and apply various landscaping styles (curbing, landscape materials, patio options) using Google's Gemini AI for streamlined image processing. The platform uses Gemini's advanced multimodal capabilities for intelligent prompt generation, image analysis, and landscape transformation in a single unified workflow.

## User Preferences

Preferred communication style: Simple, everyday language.

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
  - `visualizations` - Image processing jobs and results
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

### Development Tools
- **ESBuild** - Production build bundling
- **TSX** - TypeScript execution for development
- **Replit Integration** - Development environment with hot reload

### UI Libraries
- **Radix UI Primitives** - Accessible component foundations
- **Lucide React** - Icon library
- **React Hook Form** - Form state management
- **Date-fns** - Date manipulation utilities