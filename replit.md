# Replit Configuration Guide

## Overview

This is a full-stack web application for managing employee requests and approvals, built with a modern tech stack including React, Express, PostgreSQL, and TypeScript. The application features a comprehensive request management system with approval workflows, user management, and file handling capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Radix UI components with Tailwind CSS for styling
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with custom GeoVictoria design system variables
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured route handling
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Session Management**: Express sessions with PostgreSQL storage

### Database Architecture
- **Primary Database**: PostgreSQL (Neon serverless)
- **Schema Management**: Drizzle migrations and schema definitions
- **Key Tables**: 
  - `requests` - Main request management
  - `approval_schemas` - Configurable approval workflows
  - `user_vacation_balance` - Vacation day tracking
  - `approval_steps` - Multi-step approval processes

## Key Components

### Request Management System
- **Create Requests**: Modal-based request creation with form validation
- **Request Types**: Support for multiple request types (Vacaciones, Permiso, etc.)
- **Status Tracking**: Pending, Approved, Rejected states with history
- **File Attachments**: Upload and manage supporting documents
- **Bulk Operations**: Multi-select operations for batch processing

### Approval Workflow Engine
- **Schema Configuration**: Drag-and-drop approval step ordering
- **Permission-based Access**: Role-based visibility and approval rights
- **Multi-step Approvals**: Sequential approval processes
- **Approval History**: Complete audit trail of all approval actions

### User Management
- **Group-based Organization**: Users organized by departments/groups
- **Role-based Permissions**: Different access levels for different user types
- **User Selection**: Advanced user picker with search and filtering
- **Vacation Balance Tracking**: Automatic calculation of available vacation days

### UI/UX Components
- **Modern Design System**: Custom GeoVictoria color palette and typography
- **Responsive Design**: Mobile-first approach with responsive breakpoints
- **Accessibility**: ARIA-compliant components from Radix UI
- **Interactive Elements**: Drag-and-drop, modals, tooltips, and advanced filtering

## Data Flow

### Request Creation Flow
1. User selects group and individual user (if applicable)
2. Request form is populated with user-specific data
3. Form validation ensures required fields and business rules
4. File uploads are processed and attached
5. Request is submitted and enters approval workflow
6. Notifications are sent to relevant approvers

### Approval Process Flow
1. Request enters approval schema based on type and criteria
2. Approvers receive notifications based on their permissions
3. Each approval step is processed sequentially
4. Status changes trigger business logic (vacation balance updates, etc.)
5. Final approval triggers external system synchronization

### Data Synchronization
- **External API Integration**: Connects to GeoVictoria API for user data
- **Caching Strategy**: 30-minute cache for user data to reduce API calls
- **Real-time Updates**: React Query ensures UI stays synchronized with backend

## External Dependencies

### Core Dependencies
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/**: Complete UI component library for accessibility
- **drizzle-orm**: Type-safe database operations
- **@neondatabase/serverless**: PostgreSQL database driver
- **express**: Web application framework
- **vite**: Build tool and development server

### UI and Styling
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe component variants
- **@dnd-kit**: Drag-and-drop functionality
- **date-fns**: Date manipulation and formatting
- **lucide-react**: Icon library

### Development Tools
- **typescript**: Type safety across the application
- **tsx**: TypeScript execution for Node.js
- **esbuild**: Fast JavaScript bundler for production

## Deployment Strategy

### Development Environment
- **Replit Configuration**: Multi-module setup with Node.js, PostgreSQL, and Python
- **Hot Reload**: Vite HMR for instant development feedback
- **Port Configuration**: Express server on port 5000 with proxy setup

### Production Build
- **Frontend**: Vite builds optimized static assets to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations ensure schema consistency
- **Static Assets**: Express serves built frontend in production mode

### Environment Variables
- **DATABASE_URL**: PostgreSQL connection string (required)
- **NODE_ENV**: Environment mode (development/production)
- **REPL_ID**: Replit-specific configuration flag

### Scaling Considerations
- **Serverless Database**: Neon PostgreSQL scales automatically
- **Stateless Design**: Application designed for horizontal scaling
- **CDN Ready**: Static assets can be served from CDN in production

## Changelog
- June 18, 2025: Fixed approval step profile management and added system profiles (Seleccionar, Revisor, Aprobador, Supervisor) to support workflow-specific roles beyond user profiles
- June 18, 2025: Created comprehensive test suites validating profile saving, approval workflow logic, and request filtering with 100% accuracy
- June 17, 2025: Implemented complete approval schema logic where pending requests only appear for users whose profile matches the next pending approval step
- June 17, 2025: Created request_approval_steps table to track individual approval step states for each request
- June 17, 2025: Enhanced request creation to automatically generate approval steps based on configured schemas and motivos
- June 17, 2025: Implemented "Solicitudes pendientes" functionality for administrator users with organizational hierarchy support
- June 17, 2025: Created comprehensive test suites for pending requests logic and tab visibility authorization
- June 17, 2025: Enhanced getPendingApprovalRequests with real-time GeoVictoria API integration for organizational hierarchy validation
- June 17, 2025: Fixed critical bug where user-created requests weren't appearing in "Mis solicitudes" tab - improved user identification logic and database schema validation
- June 17, 2025: Enhanced database schema to support longer identifier fields (50 chars) to accommodate GeoVictoria API user IDs
- June 17, 2025: Implemented comprehensive request creation flow with proper user identification fallback (Identifier -> Id)
- June 16, 2025: Fixed "Mis solicitudes" tab filtering issue by implementing fallback identifier system for users without Identifier field
- June 16, 2025: Added robust user identification using Identifier field with Id fallback when Identifier is missing from GeoVictoria API
- June 16, 2025: Fixed approval schemas list filtering - admin users now see all schemas for configuration regardless of visibility permissions
- June 16, 2025: Implemented motivo-specific visibility filtering in Create Request Modal based on schema visibility permissions
- June 16, 2025: Implemented complete "Permitir solicitud a terceros" functionality with schema-specific validation
- June 16, 2025: Enhanced third-party request logic to check specific motivo schemas for Permiso requests
- June 16, 2025: Added dynamic user filtering based on approval schema configuration and user hierarchy
- June 16, 2025: Implemented profile-based filtering system for request tabs
- June 16, 2025: Fixed "Licencia Médica Estándar" visibility by updating schema permissions to include "Empleado" profile
- June 16, 2025: Resolved infinite re-render issue in ApprovalSchemas component with proper state management
- June 16, 2025: Enhanced motivo filtering to show only configured schema motivos in Create Request modal for Permiso requests
- June 16, 2025: Implemented user-centric filtering system with dedicated API endpoints for "Mis solicitudes" and "Solicitudes pendientes"
- June 13, 2025: Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.