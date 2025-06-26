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
- June 26, 2025. Removed Live Logs feature and navigation - replaced with External Logs page for monitoring Local LLM API activity only
- June 26, 2025. Implemented External Logs page for monitoring Local LLM API activity at 127.0.0.1:5000, featuring comprehensive log analysis, filtering, search, statistics dashboard, and export capabilities for both API and error logs
- June 26, 2025. Enhanced External Logs with prominent display of response_body, duration_ms, and content_type fields, plus dedicated Request ID filter for tracking specific API request lifecycles
- June 26, 2025. Modernized web application design with contemporary visual improvements including: updated color scheme with blue-purple gradients, glass-effect navigation with backdrop blur, enhanced typography with gradient text, modern card designs with hover animations, improved spacing and visual hierarchy, and modern utility classes for consistent styling across components
- June 26, 2025. Enhanced web application with advanced technical UI design including: technical grid backgrounds, monospace typography system, advanced shadow and glow effects, sophisticated data visualization cards with micro-animations, terminal-style components with gradient backgrounds, system monitoring indicators in navigation, animated status indicators, and comprehensive technical styling utilities for professional developer tool aesthetics
- June 26, 2025. Completely modernized all page headers with advanced technical styling featuring: gradient backgrounds with technical grid overlays, color-coded system status indicators, monospace typography for technical branding, animated pulse effects and glowing elements, contextual operational status displays, and comprehensive information architecture with each page having unique technical theming (Dashboard: blue-purple neural theme, Playground: emerald testing environment, Models: purple repository system, External APIs: cyan integration gateway, Cache: orange-red monitoring system, Logs: indigo-purple analytics interface)
- June 26, 2025. Changed font-family from monospace to normal system fonts for improved readability while maintaining the technical design aesthetic
- June 26, 2025. Added comprehensive API Documentation page featuring: detailed generate endpoint documentation, interactive API testing interface, code examples in multiple languages (cURL, JavaScript, Python, Node.js, PHP), parameter descriptions, response format examples, and live testing with model selection and parameter configuration
- June 26, 2025. Modernized model upload section with contemporary design including: enhanced drag-and-drop interface with modern loaders, sophisticated progress indicators with gradient animations, state-based visual feedback (uploading/success/error), file size formatting, animated background effects, celebration animations for successful uploads, and improved user experience with contextual messaging
- June 26, 2025. Optimized application layout for compact, responsive design with: reduced header heights, optimized component spacing, improved mobile responsiveness, 2x4 grid layout for stats, and better overall layout density while maintaining visual hierarchy
- June 26, 2025. Modernized model list section with contemporary card-based design featuring: gradient backgrounds with hover effects, enhanced visual hierarchy, modern status indicators with animated dots, gradient icons with shadow effects, progressive loading bars, smooth animations and micro-interactions, hidden delete buttons on hover, and improved information display with size and modification dates
- June 26, 2025. Updated template with modern, compact, and professional design including: clean neutral color scheme with better contrast, simplified navigation with compact header and streamlined sidebar, modern card components with subtle shadows and backdrop blur effects, professional background patterns (dots, grid, noise) for sidebar and main content areas, reduced visual clutter and improved spacing throughout, created professional utility classes for consistent styling, maintained responsive design for all screen sizes
- June 26, 2025. Transformed web application with modern colorful design including: updated primary colors to vibrant purple (#8B5CF6) and pink accent (#EC4899), enhanced gradients throughout with purple-to-pink and cyan-to-emerald combinations, colorful stat cards with gradient icon backgrounds, gradient navigation active states, colorful quick action buttons with themed backgrounds, vibrant brand colors and ring focus states, enhanced dark mode with brighter colorful variants, added colorful utility classes for consistent theming across components
- June 26, 2025. Created comprehensive Analytics Dashboard with advanced data visualization featuring: multi-dimensional log analysis with real-time updates, 13 different chart types including area charts, bar charts, line charts, pie charts, radar charts, and scatter plots, comprehensive metrics including request timelines, performance percentiles, status code distribution, geographic analysis, hourly patterns, and module activity tracking, enhanced mock data generation with realistic 7-day patterns and peak hour simulation, tabbed interface with Overview, Performance, Distribution, and Patterns sections, responsive design with gradient backgrounds and modern UI components, live refresh capabilities with configurable intervals
- June 26, 2025. Added comprehensive HuggingFace API integration featuring: complete model management system with add/edit/delete/load functionality, advanced text generation interface with direct generation and pipeline tasks support, comprehensive statistics and cache management dashboard, full REST API implementation with 15+ endpoints covering models, generation, pipelines, cache, statistics, and dependencies, modern UI components with technical styling, gradient backgrounds, and responsive design, mock data simulation for realistic development experience, sidebar navigation integration with HuggingFace section
- June 26, 2025. Refactored HuggingFace integration to use direct client-side API calls: removed all backend HuggingFace endpoints, updated API client to call HuggingFace Inference API directly from browser, implemented local storage for model registry and cache management, added proper API key authentication for external calls, maintained same UI functionality while eliminating server-side dependencies

## User Preferences

Preferred communication style: Simple, everyday language.