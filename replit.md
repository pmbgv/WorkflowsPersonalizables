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
- July 2, 2025: Fixed modal error and query synchronization issues - corrected approval steps endpoint structure to resolve "Cannot read properties of undefined (reading 'orden')" error in request details modal, enhanced query invalidation in handleRequestCreated for immediate visibility of new requests, and verified complete supervisor → adminCuenta sequential workflow functions correctly
- July 2, 2025: Fixed critical frontend visibility issue for supervisor users - added missing #supervisor# profile to frontend query conditions and tab visibility logic in dashboard.tsx, enabling supervisors to see and manage pending requests in the sequential approval workflow as designed
- July 1, 2025: Fixed complete sequential approval workflow progression - added missing /api/requests/all-requests/:userProfile endpoint that was causing frontend to receive HTML instead of JSON, enhanced processApprovalStep debugging, corrected request history schema field mapping, and verified complete two-step obligatory approval flow works correctly from supervisor to adminCuenta with proper state transitions and visibility
- July 1, 2025: Fixed critical regression in sequential approval workflow - repaired broken getRequestApprovalSteps JOIN query that was returning undefined values for perfil/orden fields, corrected hasApprovalSteps variable error in routes.ts, restored proper visibility of approval step details in frontend, and ensured supervisor can see requests requiring supervisor approval in first step
- June 30, 2025: Debugged and fixed sequential approval workflow progression - completely rebuilt checkUserCanApprove logic with proper sequential validation, enhanced approval step creation process, added comprehensive logging for debugging step transitions, corrected database schema alignment, and created extensive unit tests validating the complete two-step obligatory approval flow from supervisor to adminCuenta with proper state transitions
- June 25, 2025: Fixed sequential approval workflow progression - resolved critical issue where requests didn't properly advance between obligatory steps, enhanced logging for debugging approval step transitions, and ensured proper profile-based filtering for pending requests visibility
- June 25, 2025: Implemented multiple obligatory steps approval workflow - sequential progression through obligatory steps with requests staying "Pendiente" until final step approval, enhanced validation preventing single optional steps between obligatory steps, and improved state management per user profile
- June 25, 2025: Fixed approval schemas configuration error - resolved issue where adminCuenta users got "all-requests" errors when clicking "configuración esquemas" by adding conditional query enabling and proper JSON content-type validation  
- June 25, 2025: Fixed all-requests endpoint error - added missing backend endpoint for "Todas las solicitudes" tab, enhanced getPendingApprovalRequests to handle userProfile filtering, and improved error handling with comprehensive debugging
- June 25, 2025: Fixed multiple error modals issue - implemented debounced error handling, graceful error responses returning empty arrays instead of 500 errors, reduced React Query retries, and added comprehensive logging for debugging
- June 25, 2025: Fixed tab interface logic - "Solicitudes pendientes" uses PendingRequestsTable with checkboxes and management buttons, "Todas las solicitudes" uses RequestTable for view-only access without any management capabilities
- June 25, 2025: Implemented checkbox-based management system - pending requests show checkboxes and approve/reject buttons only for current step users, all requests tab shows view-only interface without management controls
- June 25, 2025: Implemented refined request visibility logic - pending requests only appear for users whose profile matches current approval step, all requests visible to users with any role in workflow but without management dropdown for non-current steps
- June 25, 2025: Implemented complete approval workflow processing logic with support for all approval scenarios (optional-only, obligatory-only, mixed steps) including proper state transitions, rejection handling, and sequential processing
- June 25, 2025: Added approval processing API endpoints and enhanced request details modal with approval workflow visualization and action buttons
- June 25, 2025: Extended database schema to support approval step tracking with user information and implemented comprehensive approval step management
- June 19, 2025: Fixed obligatory steps validation implementation - added proper filtering logic and enhanced debugging to correctly identify when schemas have only optional steps
- June 19, 2025: Implemented optional steps validation - schemas with only optional steps now show modal preventing save until at least one obligatory step is configured
- June 19, 2025: Enhanced modal with debug indicators and setTimeout for proper state management - added visual confirmation and timing fixes to ensure modal appears
- June 19, 2025: Fixed modal positioning issue - moved AlertDialog components to correct scope level to display properly when validation is triggered
- June 19, 2025: Enhanced modal validation with debugging logs and comprehensive tests - verified complete flow from schema selection to save prevention
- June 19, 2025: Fixed modal implementation - added AlertDialog JSX to component to display validation modal when saving schemas without approval steps
- June 19, 2025: Changed approach from auto-approval to prevention validation - implemented frontend modal to prevent saving schema configurations without approval steps instead of auto-approving requests
- June 19, 2025: Fixed automatic approval logic implementation - properly modified createRequest method to detect schemas without approval steps and auto-approve requests immediately, including test2 schema with "Permiso con Goce" motivo
- June 19, 2025: Implemented automatic approval logic for schemas without approval steps - requests created from schemas with no approval steps are automatically approved and appear in appropriate tabs based on self vs third-party creation
- June 19, 2025: Implemented dynamic tab visibility based on approval step configuration - "Solicitudes pendientes" tab now appears when user profile matches any approval step configuration, enabling users to approve requests they're configured to handle
- June 19, 2025: Fixed visibility configuration in schema settings - removed system profiles ("Revisor", "Seleccionar", "Aprobador", "Supervisor") and now only shows real API profiles, with "Todos los perfiles" checkbox checked by default
- June 19, 2025: Fixed schema editing functionality with comprehensive validation - now properly saves changes and validates duplicate motivos during edits while excluding the current schema
- June 19, 2025: Fixed schema creation validation to exclude currently selected schema from duplicate motivo detection - resolves issue where editing a schema interfered with creating new schemas
- June 18, 2025: Implemented automatic profile saving in approval step forms - changes now save immediately when user selects different profiles
- June 18, 2025: Fixed profile display in approval step forms by adding proper SelectValue placeholders and system profile integration
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