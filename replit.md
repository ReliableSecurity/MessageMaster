# PhishGuard - Security Awareness Testing Platform

## Overview
Multi-tenant SaaS platform for phishing simulation and security awareness testing (similar to GoPhish). Security teams can create controlled phishing campaigns, test employee susceptibility, and track engagement through a complete funnel: sent → opened → clicked → credentials_submitted.

## Recent Changes
- **2025-12-03**: Implemented email sending engine with SMTP support
  - Created server/emailService.ts with nodemailer integration
  - POST /api/campaigns/:id/launch now actually sends emails via SMTP
  - POST /api/email-services/:id/test - tests SMTP connection
  - POST /api/email-services/:id/send-test - sends test email
  - Variable substitution in templates: {{firstName}}, {{lastName}}, {{email}}, {{url}}, {{phishingUrl}}
  - Automatic tracking pixel injection for open tracking
  - Campaign recipients created with auto-generated trackingId for link tracking
  - SMTP configuration stored as JSON in apiKey field: {host, port, secure, user, password}
- **2025-12-03**: Fixed theme switching synchronization
  - ThemeProvider context now used across header toggle and settings page
  - Theme preference stored in localStorage and applied via dark class on html element
- **2025-12-03**: Added detailed campaign results page (GoPhish-style)
  - Route: /campaigns/:id shows full campaign statistics
  - Conversion funnel: Sent → Opened → Clicked → Credentials Submitted
  - Recipients table with status badges and timestamps
  - Collected data section showing submitted credentials
  - Campaign overview with linked template, landing page, SMTP profile
  - Settings page "Просмотр" tab contains viewer management
- **2025-12-03**: Restructured navigation to avoid confusion
  - Removed "Компании" from sidebar (available in Admin Panel only)
  - Renamed: "Кампании" → "Тесты", "Пользователи и группы" → "Контакты"
  - Shortened: "Шаблоны писем" → "Шаблоны", "Фишинг-страницы" → "Лендинги", "Профили отправки" → "SMTP"
- **2025-12-03**: Added viewer accounts functionality
  - New role 'viewer' with read-only access to specific campaigns
  - Viewer management UI in Settings page (Viewers tab)
  - API endpoints: GET/POST/PATCH/DELETE /api/viewers, PATCH /api/viewers/:id/access
  - viewerCampaignAccess table for campaign-specific permissions
  - Viewers can only see: campaigns they're assigned to, campaign events, collected data, recipients
  - Middleware: requireViewerCampaignAccess(), isReadOnlyForViewer()
- **2025-12-03**: Added language switching functionality
  - LanguageContext in client/src/lib/i18n.tsx
  - Language toggle in Settings > Appearance tab
  - Supports Russian and English
  - Language preference stored in localStorage
- **2025-12-03**: Fixed all CRUD operations for superadmin and multi-tenant users
  - Fixed companyId injection before Zod validation in ALL POST endpoints:
    - POST /api/campaigns, POST /api/templates, POST /api/landing-pages
    - POST /api/email-services, POST /api/contacts, POST /api/contact-groups
  - Fixed GET /api/campaigns for superadmin (now defaults to their own company if no companyId in query)
  - Fixed GET /api/contacts and GET /api/contact-groups for superadmin (same pattern)
  - Fixed apiRequest() call signatures in templates.tsx and sending-profiles.tsx
  - Simplified SelectItem content in campaign form for better Playwright compatibility
  - Dialog now closes immediately on success, then refetches data asynchronously
- **2025-12-03**: Added campaign launch functionality
  - POST /api/campaigns/:id/launch - changes campaign status from draft to sending
  - Multi-tenant check: users can only launch campaigns in their company
  - Automatically sets launchDate and counts recipients from contact group
- **2025-12-03**: Restructured to match GoPhish architecture
  - Added Landing Pages (/landing-pages) - fake login pages for credential capture
  - Updated navigation: Dashboard, Campaigns, Users & Groups, Email Templates, Landing Pages, Sending Profiles
  - Added Landing Pages CRUD API endpoints (/api/landing-pages)
  - Updated storage interface with landing page methods
  - Campaigns now link to landing pages, contact groups, and templates
  - Removed Recipients page - campaigns now target contact groups directly
- **2025-12-03**: Added CSV import/export functionality for contacts
  - Regular users: Import contacts via CSV on /contacts page, export all contacts
  - Superadmin: Import contacts for any company via Admin panel Export/Import tab
  - Export options: Reports, collected credentials, users list
  - Shared CSV parser (client/src/lib/csv-utils.ts) with BOM handling and delimiter detection
- **2025-12-03**: Fixed upsertUser to handle email conflicts when local user logs in via Replit OAuth
- **2025-12-03**: Added Admin Panel (/admin) for superadmin with user management, company management, and global statistics
- **2025-12-03**: Added API endpoints for superadmin: /api/admin/users, /api/admin/stats, /api/users/:id/change-password
- **2025-12-03**: Updated sidebar branding to PhishGuard with shield icon
- **2025-12-03**: Rebranded to PhishGuard - landing page redesigned for phishing simulation / pentesting service
- **2025-12-03**: Created superadmin account (admin@mailflow.ru / SuperAdmin123!)
- **2025-12-03**: Fixed database connection - storage.ts now uses shared db from db.ts with proper Neon WebSocket config
- **2025-12-03**: Updated isAuthenticated middleware to support both local session and Replit OAuth
- **2025-12-03**: Auto-login after registration - users are automatically logged in after registering
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
- Roles: superadmin, admin, manager, viewer
  - viewer: read-only access to assigned campaigns only
- Auth routes: `/api/login`, `/api/logout`, `/api/callback`
- Protected API routes use `isAuthenticated` middleware

### Database Schema
- **users**: User accounts with replitUserId for Replit Auth, password hash for local auth, viewerParentId for viewer accounts
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
- **viewerCampaignAccess**: Links viewers to specific campaigns they can access

### Key Files
- `server/replitAuth.ts`: Replit Auth configuration
- `server/routes.ts`: API endpoints
- `server/storage.ts`: Database operations
- `shared/schema.ts`: Drizzle ORM schema
- `client/src/hooks/useAuth.ts`: Client-side auth hook
- `client/src/App.tsx`: Main app with auth routing
- `client/src/pages/admin.tsx`: Superadmin panel with user/company management
- `client/src/components/app-sidebar.tsx`: Main navigation with PhishGuard branding

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
