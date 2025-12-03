# MailFlow - Email Campaign Management Platform

## Overview
Multi-tenant SaaS platform for managing email campaigns with phishing simulation capabilities (similar to GoPhish). Companies can create campaigns using templates, send mass mailings, and track recipient engagement through a complete funnel: sent → opened → clicked → credentials_submitted.

## Recent Changes
- **2024-12-03**: Added phishing simulation tracking - recipient status flow: sent → opened → clicked → credentials_submitted
- **2024-12-03**: Added local user registration (email/password) with bcrypt hashing
- **2024-12-03**: Added auth dialog on landing page with tabs for login and registration
- **2024-12-03**: Added /api/track/submit/:trackingId endpoint for credential capture
- **2024-12-03**: Updated tracking endpoints to record recipient status and email events
- **2024-12-03**: Added superadmin statistics - /api/admin/stats shows all users' campaign statistics
- **2024-12-03**: Added submittedDataCount field to campaigns for tracking credential submissions
- **2024-12-03**: Updated Dashboard and Analytics pages to show submitted data statistics
- **2024-12-03**: Connected all frontend pages to backend API (services, templates, dashboard, responses, campaigns, contacts)
- **2024-12-03**: Implemented Replit Auth integration with role-based access control
- **2024-12-03**: Complete Russian localization of the interface

## User Preferences
- Language: Russian (all UI text in Russian)
- Design: Inter font, Material Design principles

## Project Architecture

### Authentication
- Uses Replit Auth via OpenID Connect (primary)
- Local authentication via email/password (secondary)
  - POST `/api/auth/register` - creates new user with company
  - POST `/api/auth/login` - authenticates via email/password
  - Passwords hashed with bcrypt (10 rounds)
- Session storage in PostgreSQL (sessions table)
- Roles: superadmin, admin, manager
- Auth routes: `/api/login`, `/api/logout`, `/api/callback`
- Protected API routes use `isAuthenticated` middleware

### Database Schema
- **users**: User accounts with replitUserId for Replit Auth, password hash for local auth
- **sessions**: Session storage for authentication
- **companies**: Multi-tenant company data
- **campaigns**: Email campaign definitions with tracking counts (sentCount, openedCount, clickedCount, submittedDataCount)
- **templates**: Global and company-specific email templates
- **contacts**: Contact lists per company
- **contactGroups**: Contact organization
- **emailServices**: Email service provider configurations (SendGrid, Mailgun, AWS SES, Resend, SMTP)
- **emailEvents**: Tracking for opens, clicks, bounces
- **collectedData**: Captured credentials and form data from phishing simulations
- **campaignRecipients**: Campaign recipient tracking with status (pending, sent, opened, clicked, submitted_data)

### Key Files
- `server/replitAuth.ts`: Replit Auth configuration
- `server/routes.ts`: API endpoints
- `server/storage.ts`: Database operations
- `shared/schema.ts`: Drizzle ORM schema
- `client/src/hooks/useAuth.ts`: Client-side auth hook
- `client/src/App.tsx`: Main app with auth routing

### Security Notes
- API credentials stored in plaintext - needs encryption before production
- User passwords hashed with bcrypt (10 rounds)
- Use `isAuthenticated` middleware for protected routes
- Use `requireRole("superadmin", "admin", "manager")` middleware for role-based access
- All API routes enforce multi-tenant isolation:
  - Non-superadmins can only access data from their own company
  - Write operations (POST/PATCH/DELETE) derive companyId from authenticated user
  - Superadmins have full cross-tenant access via /api/admin/stats
- Public endpoints (no auth required):
  - POST /api/track/open/:trackingId - tracking pixel (records opened status)
  - GET /api/track/click/:trackingId - click tracking redirect (records clicked status)
  - POST /api/track/submit/:trackingId - credential capture (records submitted_data status)
  - POST /api/collected-data - form submissions from emails
  - POST /api/auth/register - user registration
  - POST /api/auth/login - user authentication
