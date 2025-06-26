# LLM Platform

## Overview

This is a full-stack LLM (Large Language Model) platform that provides both local model management and external API integration capabilities. The application consists of a React frontend with TypeScript, an Express.js backend, and PostgreSQL database with Drizzle ORM. It features a modern UI built with shadcn/ui components and Tailwind CSS, designed for managing and interacting with AI models through a web interface.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Structure**: RESTful API design (routes not yet implemented)
- **Development**: tsx for TypeScript execution in development

### Database Architecture
- **Database**: PostgreSQL 16
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Migration Strategy**: Drizzle Kit for schema migrations
- **Connection**: Neon Database serverless driver

## Key Components

### Database Schema
The application defines three main tables:

1. **Models Table**: Stores local model metadata including name, path, size, modification date, status, and type
2. **External APIs Table**: Manages external API configurations with model names, endpoints, API keys, and provider information
3. **Chat Messages Table**: Logs chat interactions with content, role, model used, processing time, and token count

### Frontend Components
- **Dashboard**: Main overview with stats, model upload, and external API configuration
- **Playground**: Interactive chat interface for testing models with configurable parameters
- **Models Management**: Local model upload, listing, and management interface
- **External APIs**: Configuration interface for external LLM service integrations
- **Cache Status**: Monitoring and management of model cache

### UI Infrastructure
- **Theme System**: Dark/light mode support with context-based theme management
- **Notification System**: Toast-based notifications for user feedback
- **Navigation**: Sidebar navigation with top navigation bar including health status
- **Responsive Design**: Mobile-friendly interface with proper breakpoints

## Data Flow

### Model Management Flow
1. Users upload local models through the dashboard or models page
2. Models are stored locally and metadata is saved to the database
3. Model synchronization ensures database consistency with local files
4. Cache management allows clearing of loaded models

### Chat Interaction Flow
1. Users configure model parameters in the playground
2. Messages are sent to the selected model (local or external)
3. Responses are processed and stored in the chat messages table
4. Real-time UI updates show conversation history and processing metrics

### External API Integration Flow
1. Users configure external API credentials and endpoints
2. API configurations are stored securely in the database
3. Playground interface seamlessly switches between local and external models
4. All interactions are logged regardless of model type

## External Dependencies

### Frontend Dependencies
- **React Ecosystem**: React, React DOM, React Query for core functionality
- **UI Components**: Radix UI primitives, Lucide React icons, class-variance-authority for styling
- **Form Handling**: React Hook Form with resolvers for form validation
- **Utilities**: clsx, tailwind-merge for className management, date-fns for date operations

### Backend Dependencies
- **Database**: Drizzle ORM, Neon serverless driver, PostgreSQL session store
- **Validation**: Zod for runtime type validation with Drizzle integration
- **Development**: tsx for TypeScript execution, esbuild for production builds

### Development Tools
- **Build Tools**: Vite with React plugin, PostCSS with Tailwind and Autoprefixer
- **Type Safety**: TypeScript with strict configuration, path mapping for imports
- **Replit Integration**: Vite plugins for Replit-specific development features

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with HMR on port 5000
- **Database**: PostgreSQL 16 module in Replit environment
- **Environment Variables**: DATABASE_URL for database connection

### Production Build
- **Frontend**: Vite builds static assets to dist/public directory
- **Backend**: esbuild bundles server code to ESM format in dist directory
- **Deployment Target**: Autoscale deployment on Replit with external port 80

### Build Process
1. Frontend assets are built using Vite
2. Server code is bundled with esbuild for Node.js production
3. Both outputs are combined for deployment
4. Database migrations are applied using Drizzle Kit

## Changelog

Changelog:
- June 26, 2025. Initial setup
- June 26, 2025. Fixed DOM nesting warning in Sidebar navigation (changed nested `<a>` tags to `<div>`)
- June 26, 2025. Fixed React error in ChatInterface by adding type safety for message content rendering
- June 26, 2025. Added global error handlers for unhandled promise rejections and improved API error handling with retry logic
- June 26, 2025. Added ApiError component and graceful error handling for when Local LLM API is unavailable, providing clear user feedback and retry options
- June 26, 2025. Implemented Live Logs feature with real-time Server-Sent Events (SSE) streaming, request/response logging middleware, statistics dashboard, filtering capabilities, and export functionality

## User Preferences

Preferred communication style: Simple, everyday language.