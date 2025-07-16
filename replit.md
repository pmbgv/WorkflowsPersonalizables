# Request Management System

## Overview

This is a full-stack request management application built with React frontend and Express backend. The system allows users to create, view, filter, and manage various types of requests (primarily permission requests) with an approval workflow system. It features a modern UI built with shadcn/ui components and uses PostgreSQL with Drizzle ORM for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a modern full-stack architecture with clear separation between client and server:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Bundler**: Vite for development and build
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Session Management**: Express sessions with PostgreSQL store
- **API Design**: RESTful endpoints with JSON responses

## Key Components

### Database Schema
The system uses three main tables:
- **requests**: Core request data including type, dates, status, description, and metadata
- **approval_schemas**: Template definitions for approval workflows by request type
- **approval_steps**: Individual steps within approval schemas defining approval hierarchy

### Frontend Components
- **Dashboard**: Main interface with tabbed navigation for requests and approval schemas
- **RequestTable**: Paginated table with sorting, filtering, and status management
- **CreateRequestModal**: Form for creating new requests with file upload support
- **RequestDetailsModal**: Detailed view of individual requests
- **FiltersSection**: Advanced filtering interface for requests
- **ApprovalSchemas**: Management interface for approval workflow templates

### API Endpoints
- `GET /api/requests` - Fetch requests with optional filtering
- `GET /api/requests/:id` - Fetch specific request details
- `POST /api/requests` - Create new request
- `PATCH /api/requests/:id/status` - Update request status
- Approval schema management endpoints (implied by frontend usage)

## Data Flow

1. **Request Creation**: Users fill out a form which validates data client-side before sending to API
2. **Request Listing**: Dashboard fetches requests with applied filters, cached by React Query
3. **Status Updates**: Status changes trigger optimistic updates with server synchronization
4. **Approval Workflows**: Schemas define multi-step approval processes with role-based authorization
5. **Real-time Updates**: React Query handles cache invalidation and refetching

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe database ORM with PostgreSQL dialect
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Headless UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **zod**: Runtime type validation
- **react-hook-form**: Form state management

### Development Dependencies
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production
- **vite**: Fast development server and build tool
- **drizzle-kit**: Database schema management and migrations

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

### Build Process
- **Development**: `tsx` runs the Express server with Vite middleware for HMR
- **Production**: Vite builds the frontend to `dist/public`, esbuild bundles the server to `dist/index.js`
- **Database**: Drizzle migrations managed via `drizzle-kit push` command

### Environment Configuration
- **DATABASE_URL**: Required environment variable for PostgreSQL connection
- **NODE_ENV**: Controls development vs production behavior
- **REPL_ID**: Enables Replit-specific development tools

### Server Configuration
- Express serves static files in production
- Vite dev server integration in development
- Request logging middleware for API monitoring
- Error handling and response formatting

The architecture prioritizes developer experience with hot reloading, type safety, and modern tooling while maintaining production readiness with proper error handling and database management.