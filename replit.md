# LLM Platform

## Overview
This full-stack LLM platform integrates local model management and external API capabilities through a React frontend, Express.js backend, and PostgreSQL database. It offers a modern UI for managing and interacting with AI models, focusing on ease of use and comprehensive model interaction. The platform aims to provide a versatile environment for experimenting with and deploying large language models, including advanced features like a BYOD (Bring Your Own Data) RAG system for enhanced contextual understanding.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features a modern, responsive UI built with shadcn/ui and Tailwind CSS, supporting dark/light modes. Design elements include technical grid backgrounds, monospace typography, gradient effects, and interactive components to create a professional developer tool aesthetic. Navigation is handled by a sidebar and top navigation bar, incorporating system health status indicators.

### Technical Implementations
- **Frontend**: React 18 with TypeScript, Wouter for routing, TanStack Query for state management, Vite for builds.
- **Backend**: Node.js with Express.js, TypeScript, RESTful API design.
- **Database**: PostgreSQL 16 with Drizzle ORM for type-safe schema definitions and Drizzle Kit for migrations.
- **Core Features**:
    - **Model Management**: Upload, listing, and synchronization of local models, alongside configuration for external API models.
    - **Playground**: Interactive chat interface with configurable parameters for testing both local and external LLMs.
    - **BYOD RAG System**: Document upload (PDF, DOCX, TXT, MD, HTML, JSON, CSV), multi-index management, hybrid search (vector and TF-IDF keyword), automatic text extraction and chunking. A separate Express server handles RAG endpoints.
    - **DeepSeek Integration**: API client for DeepSeek local server, dedicated pages for models and generation, and comprehensive documentation.

### System Design Choices
The application uses a component-based architecture for the frontend, ensuring modularity and reusability. Data flow is structured to manage model interactions, chat history, and external API integrations seamlessly. The RAG system incorporates `Natural` library for TF-IDF keyword search and supports persistence with index reloading.

## External Dependencies

### Frontend
- **React Ecosystem**: React, React DOM, React Query.
- **UI Libraries**: Radix UI primitives, Lucide React icons, shadcn/ui.
- **Utilities**: clsx, tailwind-merge, date-fns.

### Backend
- **Database**: Drizzle ORM, Neon serverless driver, PostgreSQL.
- **Validation**: Zod.
- **RAG System**: Natural library (for TF-IDF keyword search in the RAG simple-server.ts).

### Development Tools
- **Build**: Vite, PostCSS, esbuild.
- **Type Checking**: TypeScript.
- **Runtime**: tsx.