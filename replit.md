# MailFlow - Email Campaign Management Platform

## Overview
Multi-tenant SaaS platform for managing email campaigns. Companies can create campaigns using templates, send mass mailings, and track responses (opens, clicks, collected data).

## Recent Changes
- **2024-12-03**: Implemented Replit Auth integration with role-based access control
- **2024-12-03**: Complete Russian localization of the interface
- **2024-12-03**: Added sessions table for authentication persistence

## User Preferences
- Language: Russian (all UI text in Russian)
- Design: Inter font, Material Design principles

## Project Architecture

### Authentication
- Uses Replit Auth via OpenID Connect
- Session storage in PostgreSQL (sessions table)
- Roles: superadmin, admin, manager
- Auth routes: `/api/login`, `/api/logout`, `/api/callback`
- Protected API routes use `isAuthenticated` middleware

### Database Schema
- **users**: User accounts with replitUserId for Replit Auth
- **sessions**: Session storage for authentication
- **companies**: Multi-tenant company data
- **campaigns**: Email campaign definitions
- **templates**: Global and company-specific email templates
- **contacts**: Contact lists per company
- **contactGroups**: Contact organization
- **emailServices**: Email service provider configurations (SendGrid, Mailgun, AWS SES, Resend, SMTP)
- **emailEvents**: Tracking for opens, clicks, bounces
- **collectedData**: Form data collected from campaigns
- **campaignRecipients**: Campaign recipient tracking

### Key Files
- `server/replitAuth.ts`: Replit Auth configuration
- `server/routes.ts`: API endpoints
- `server/storage.ts`: Database operations
- `shared/schema.ts`: Drizzle ORM schema
- `client/src/hooks/useAuth.ts`: Client-side auth hook
- `client/src/App.tsx`: Main app with auth routing

### Security Notes
- API credentials stored in plaintext - needs encryption before production
- Use `isAuthenticated` middleware for protected routes
- Use `requireRole("superadmin", "admin", "manager")` middleware for role-based access
- All API routes enforce multi-tenant isolation:
  - Non-superadmins can only access data from their own company
  - Write operations (POST/PATCH/DELETE) derive companyId from authenticated user
  - Superadmins have full cross-tenant access
- Public endpoints (no auth required):
  - POST /api/track/open/:trackingId - tracking pixel
  - GET /api/track/click/:trackingId - click tracking redirect
  - POST /api/collected-data - form submissions from emails
