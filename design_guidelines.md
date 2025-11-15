# Design Guidelines: Multi-Tenant Email Marketing SaaS Platform

## Design Approach

**Reference + System Hybrid:** Drawing inspiration from modern SaaS leaders (Mailchimp for email marketing patterns, Linear for clean dashboard aesthetics, Notion for data organization) combined with Material Design principles for data-heavy interfaces.

**Rationale:** This is a utility-focused, information-dense application requiring consistent patterns for dashboards, analytics, and campaign management across multiple user roles.

---

## Typography

**Font Family:** Inter (primary), JetBrains Mono (code/API keys)

**Hierarchy:**
- **Page Titles:** text-3xl font-bold (Super Admin Dashboard, Campaign Analytics)
- **Section Headers:** text-xl font-semibold (Active Campaigns, Template Library)
- **Card/Panel Titles:** text-lg font-medium
- **Body Text:** text-base font-normal
- **Metadata/Labels:** text-sm font-medium text-gray-600
- **Helper Text:** text-xs text-gray-500
- **Stats/Numbers:** text-2xl font-bold for primary metrics, text-4xl for hero stats

---

## Layout System

**Spacing Units:** Tailwind units of 2, 4, 6, 8, 12, 16, 20
- Component padding: p-6, p-8
- Section gaps: gap-6, gap-8
- Page margins: px-8, py-6
- Card spacing: space-y-4

**Grid System:**
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
- Content areas: max-w-7xl mx-auto
- Side-by-side panels: grid-cols-1 lg:grid-cols-2 gap-8

---

## Component Library

### A. Navigation & Layout

**Top Navigation Bar:**
- Fixed header with logo left, role indicator center, user menu right
- Height: h-16
- Quick actions: "New Campaign" button (primary CTA)
- Notifications bell icon with badge

**Sidebar (Multi-role):**
- Width: w-64
- Collapsible on mobile
- Super Admin: Companies, Email Services, Global Templates, Analytics
- Company Admin: Dashboard, Campaigns, Templates, Contacts, Team, Settings
- Role badge at sidebar top
- Active state: background highlight + left border accent

### B. Dashboard Components

**Stat Cards (4-column grid):**
- Each card: p-6, rounded-lg, border
- Large number (text-4xl font-bold) on top
- Label below (text-sm text-gray-600)
- Trend indicator: small arrow + percentage (text-xs)
- Icons: top-right corner, muted

**Charts/Graphs:**
- Line charts for campaign performance over time
- Bar charts for comparative metrics
- Donut charts for open/click rates
- Container: p-6, rounded-lg, border

**Data Tables:**
- Striped rows for readability
- Sortable headers (with arrow icons)
- Row actions: icon buttons on hover
- Pagination at bottom
- Bulk selection checkboxes
- Status badges (inline with text)

### C. Campaign Management

**Campaign Builder (Multi-step):**
- Progress stepper at top (Step 1: Template, Step 2: Audience, Step 3: Settings, Step 4: Review)
- Each step: full-width container, max-w-4xl
- Previous/Next buttons bottom-right
- Save Draft button bottom-left

**Template Selector:**
- Grid of template cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Each card: thumbnail preview, title, "Use Template" button
- Filter tabs: All, Ready-made, Custom
- Search bar above grid

**Visual Template Editor:**
- Two-column layout: Editor (left 60%) + Preview (right 40%)
- Editor: Monaco-like code editor for HTML
- Preview: iframe with real-time rendering
- Toolbar: Save, Variables dropdown, Test Send

### D. Forms & Inputs

**Input Fields:**
- Labels above inputs (text-sm font-medium)
- Inputs: p-3, rounded-md, border, focus:ring-2
- Helper text below (text-xs text-gray-500)
- Error states: red border + red helper text

**Email Service Configuration:**
- Card-based selection: grid of service cards with logos
- Selected service: accent border
- API key input: monospace font, copy button, show/hide toggle
- Test connection button below

**Contact Import:**
- Drag-and-drop zone (dashed border, large upload icon)
- File format instructions below
- Mapping interface: two-column (CSV column → System field)
- Preview table of first 5 rows

### E. Analytics & Reporting

**Campaign Performance Panel:**
- Top row: 4 key metrics (Sent, Opened, Clicked, Converted)
- Middle: line chart showing opens/clicks over time
- Bottom: Top Links table (Link, Clicks, Unique Clicks)

**Geographic/Device Breakdown:**
- Side-by-side cards
- Lists with percentage bars
- Country flags icons for geographic

### F. Modals & Overlays

**Confirmation Dialogs:**
- Centered modal, max-w-md
- Title, description, two-button footer
- Destructive actions: red button

**Slideout Panels (Contact/Campaign Details):**
- Right-side panel, w-96 or w-1/3
- Close button top-right
- Tabs for different data sections
- Action buttons at bottom

---

## Icons

**Library:** Heroicons (outline for navigation, solid for stats/actions)

**Key Icons:**
- Dashboard: ChartBarIcon
- Campaigns: PaperAirplaneIcon
- Templates: DocumentTextIcon
- Contacts: UsersIcon
- Analytics: ChartPieIcon
- Settings: CogIcon
- Email Services: ServerIcon
- Success: CheckCircleIcon (green)
- Warning: ExclamationTriangleIcon (amber)
- Error: XCircleIcon (red)

---

## Images

**No hero images** - This is a dashboard application focused on utility. 

**Logo placement:** Top-left of navigation bar (h-8)

**Empty states:** Use illustrations (undraw.co style) for:
- No campaigns yet
- No templates created
- No contacts imported
- Email service not configured

---

## Accessibility

- All form inputs have associated labels
- Focus states: ring-2 ring-offset-2
- Keyboard navigation fully supported
- ARIA labels for icon-only buttons
- Status indicators use both visual + text (not color-only)
- Contrast ratios meet WCAG AA

---

## Special Patterns

**Role-Based UI:**
- Different sidebars render based on user.role
- Super Admin sees global controls
- Company users see scoped data only

**Real-time Updates:**
- Campaign stats refresh every 30 seconds
- Toast notifications for background actions
- Progress bars for sending campaigns

**Multi-step Workflows:**
- Clear progress indication
- Ability to go back/edit previous steps
- Auto-save draft feature