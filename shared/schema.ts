import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, pgEnum, uuid, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enums
export const userRoleEnum = pgEnum("user_role", ["superadmin", "admin", "manager"]);
export const campaignStatusEnum = pgEnum("campaign_status", ["draft", "scheduled", "sending", "sent", "paused", "cancelled"]);
export const emailServiceProviderEnum = pgEnum("email_service_provider", ["sendgrid", "mailgun", "aws-ses", "resend", "smtp"]);
export const emailEventTypeEnum = pgEnum("email_event_type", ["sent", "delivered", "opened", "clicked", "bounced", "complained", "unsubscribed"]);
export const collectedDataTypeEnum = pgEnum("collected_data_type", ["credentials", "form-data", "survey-response"]);
export const collectedDataStatusEnum = pgEnum("collected_data_status", ["pending", "verified", "flagged"]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  replitUserId: text("replit_user_id").unique(),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  role: userRoleEnum("role").notNull().default("manager"),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  companyIdIdx: index("users_company_id_idx").on(table.companyId),
}));

// Companies table
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  domain: text("domain"),
  contactEmail: text("contact_email"),
  monthlyEmailLimit: integer("monthly_email_limit").notNull().default(10000),
  dailyEmailLimit: integer("daily_email_limit").notNull().default(1000),
  emailsSentThisMonth: integer("emails_sent_this_month").notNull().default(0),
  emailsSentToday: integer("emails_sent_today").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Email Services table
export const emailServices = pgTable("email_services", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  provider: emailServiceProviderEnum("provider").notNull(),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
  apiKey: text("api_key").notNull(),
  apiSecret: text("api_secret"),
  fromEmail: text("from_email"),
  fromName: text("from_name"),
  isActive: boolean("is_active").notNull().default(true),
  isPlatformDefault: boolean("is_platform_default").notNull().default(false),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  companyIdIdx: index("email_services_company_id_idx").on(table.companyId),
}));

// Templates table
export const templates = pgTable("templates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  variables: jsonb("variables").$type<string[]>().default([]),
  isGlobal: boolean("is_global").notNull().default(false),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
  usageCount: integer("usage_count").notNull().default(0),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  companyIdIdx: index("templates_company_id_idx").on(table.companyId),
  isGlobalIdx: index("templates_is_global_idx").on(table.isGlobal),
}));

// Contact Groups table
export const contactGroups = pgTable("contact_groups", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  tags: jsonb("tags").$type<string[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  companyIdIdx: index("contact_groups_company_id_idx").on(table.companyId),
}));

// Contacts table
export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  groupId: uuid("group_id").references(() => contactGroups.id, { onDelete: "set null" }),
  customFields: jsonb("custom_fields").$type<Record<string, string>>().default({}),
  isSubscribed: boolean("is_subscribed").notNull().default(true),
  unsubscribedAt: timestamp("unsubscribed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  companyIdIdx: index("contacts_company_id_idx").on(table.companyId),
  groupIdIdx: index("contacts_group_id_idx").on(table.groupId),
  uniqueCompanyEmail: uniqueIndex("unique_company_email_idx").on(table.companyId, table.email),
}));

// Campaigns table
export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  status: campaignStatusEnum("status").notNull().default("draft"),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  templateId: uuid("template_id").references(() => templates.id, { onDelete: "set null" }),
  emailServiceId: uuid("email_service_id").references(() => emailServices.id, { onDelete: "set null" }),
  fromEmail: text("from_email").notNull(),
  fromName: text("from_name"),
  replyTo: text("reply_to"),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  totalRecipients: integer("total_recipients").notNull().default(0),
  sentCount: integer("sent_count").notNull().default(0),
  deliveredCount: integer("delivered_count").notNull().default(0),
  openedCount: integer("opened_count").notNull().default(0),
  clickedCount: integer("clicked_count").notNull().default(0),
  bouncedCount: integer("bounced_count").notNull().default(0),
  unsubscribedCount: integer("unsubscribed_count").notNull().default(0),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  companyIdIdx: index("campaigns_company_id_idx").on(table.companyId),
  statusIdx: index("campaigns_status_idx").on(table.status),
}));

// Campaign Recipients table (many-to-many between campaigns and contacts)
export const campaignRecipients = pgTable("campaign_recipients", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: uuid("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id").notNull().references(() => contacts.id, { onDelete: "cascade" }),
  trackingId: uuid("tracking_id").notNull().default(sql`gen_random_uuid()`).unique(),
  personalizedSubject: text("personalized_subject"),
  personalizedContent: text("personalized_content"),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  bouncedAt: timestamp("bounced_at"),
  unsubscribedAt: timestamp("unsubscribed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  uniqueCampaignContact: uniqueIndex("unique_campaign_contact_idx").on(table.campaignId, table.contactId),
  campaignIdIdx: index("campaign_recipients_campaign_id_idx").on(table.campaignId),
  contactIdIdx: index("campaign_recipients_contact_id_idx").on(table.contactId),
  trackingIdIdx: index("campaign_recipients_tracking_id_idx").on(table.trackingId),
}));

// Email Events table (tracking opens, clicks, etc.)
export const emailEvents = pgTable("email_events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: uuid("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  recipientId: uuid("recipient_id").notNull().references(() => campaignRecipients.id, { onDelete: "cascade" }),
  trackingId: uuid("tracking_id").notNull(),
  eventType: emailEventTypeEnum("event_type").notNull(),
  clickedUrl: text("clicked_url"),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  campaignIdIdx: index("email_events_campaign_id_idx").on(table.campaignId),
  recipientIdIdx: index("email_events_recipient_id_idx").on(table.recipientId),
  trackingIdIdx: index("email_events_tracking_id_idx").on(table.trackingId),
}));

// Collected Data table (for forms, credentials, etc.)
export const collectedData = pgTable("collected_data", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: uuid("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  recipientId: uuid("recipient_id").references(() => campaignRecipients.id, { onDelete: "cascade" }),
  dataType: collectedDataTypeEnum("data_type").notNull(),
  status: collectedDataStatusEnum("status").notNull().default("pending"),
  fields: jsonb("fields").$type<Record<string, string>>().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  verifiedAt: timestamp("verified_at"),
  flaggedAt: timestamp("flagged_at"),
  flagReason: text("flag_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  campaignIdIdx: index("collected_data_campaign_id_idx").on(table.campaignId),
  statusIdx: index("collected_data_status_idx").on(table.status),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  emailsSentThisMonth: true,
  emailsSentToday: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailServiceSchema = createInsertSchema(emailServices).omit({
  id: true,
  lastUsedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  usageCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContactGroupSchema = createInsertSchema(contactGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  unsubscribedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  sentCount: true,
  deliveredCount: true,
  openedCount: true,
  clickedCount: true,
  bouncedCount: true,
  unsubscribedCount: true,
  sentAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignRecipientSchema = createInsertSchema(campaignRecipients).omit({
  id: true,
  trackingId: true,
  sentAt: true,
  deliveredAt: true,
  openedAt: true,
  clickedAt: true,
  bouncedAt: true,
  unsubscribedAt: true,
  createdAt: true,
});

export const insertEmailEventSchema = createInsertSchema(emailEvents).omit({
  id: true,
  createdAt: true,
});

export const insertCollectedDataSchema = createInsertSchema(collectedData).omit({
  id: true,
  verifiedAt: true,
  flaggedAt: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// UpsertUser type for Replit Auth
export type UpsertUser = {
  replitUserId: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
};

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

export type EmailService = typeof emailServices.$inferSelect;
export type InsertEmailService = z.infer<typeof insertEmailServiceSchema>;

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;

export type ContactGroup = typeof contactGroups.$inferSelect;
export type InsertContactGroup = z.infer<typeof insertContactGroupSchema>;

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

export type CampaignRecipient = typeof campaignRecipients.$inferSelect;
export type InsertCampaignRecipient = z.infer<typeof insertCampaignRecipientSchema>;

export type EmailEvent = typeof emailEvents.$inferSelect;
export type InsertEmailEvent = z.infer<typeof insertEmailEventSchema>;

export type CollectedData = typeof collectedData.$inferSelect;
export type InsertCollectedData = z.infer<typeof insertCollectedDataSchema>;
