import * as schema from "@shared/schema";
import { eq, and, desc, sql, inArray, or } from "drizzle-orm";
import { db } from "./db";
import type {
  User,
  InsertUser,
  UpsertUser,
  Company,
  InsertCompany,
  EmailService,
  InsertEmailService,
  Template,
  InsertTemplate,
  Contact,
  InsertContact,
  ContactGroup,
  InsertContactGroup,
  Campaign,
  InsertCampaign,
  CampaignRecipient,
  InsertCampaignRecipient,
  EmailEvent,
  InsertEmailEvent,
  CollectedData,
  InsertCollectedData,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByReplitId(replitUserId: string): Promise<User | undefined>;
  getUsersByCompany(companyId: string): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Campaign Recipients (tracking)
  getCampaignRecipientByTrackingId(trackingId: string): Promise<CampaignRecipient | undefined>;
  updateCampaignRecipientStatus(id: string, status: "pending" | "sent" | "opened" | "clicked" | "submitted_data", timestamp?: Date): Promise<CampaignRecipient | undefined>;
  
  // Companies
  getCompany(id: string): Promise<Company | undefined>;
  getAllCompanies(): Promise<Company[]>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company | undefined>;
  deleteCompany(id: string): Promise<void>;
  
  // Email Services
  getEmailService(id: string): Promise<EmailService | undefined>;
  getEmailServicesByCompany(companyId: string | null): Promise<EmailService[]>;
  createEmailService(service: InsertEmailService): Promise<EmailService>;
  updateEmailService(id: string, service: Partial<InsertEmailService>): Promise<EmailService | undefined>;
  deleteEmailService(id: string): Promise<void>;
  
  // Templates
  getTemplate(id: string): Promise<Template | undefined>;
  getTemplatesByCompany(companyId: string | null, includeGlobal?: boolean): Promise<Template[]>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  updateTemplate(id: string, template: Partial<InsertTemplate>): Promise<Template | undefined>;
  deleteTemplate(id: string): Promise<void>;
  
  // Contact Groups
  getContactGroup(id: string): Promise<ContactGroup | undefined>;
  getContactGroupsByCompany(companyId: string): Promise<ContactGroup[]>;
  createContactGroup(group: InsertContactGroup): Promise<ContactGroup>;
  updateContactGroup(id: string, group: Partial<InsertContactGroup>): Promise<ContactGroup | undefined>;
  deleteContactGroup(id: string): Promise<void>;
  
  // Contacts
  getContact(id: string): Promise<Contact | undefined>;
  getContactByEmail(email: string, companyId: string): Promise<Contact | undefined>;
  getContactsByCompany(companyId: string): Promise<Contact[]>;
  getAllContacts(): Promise<Contact[]>;
  getContactsByGroup(groupId: string): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;
  createContactsBulk(contacts: InsertContact[]): Promise<Contact[]>;
  updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: string): Promise<void>;
  
  // Campaigns
  getCampaign(id: string): Promise<Campaign | undefined>;
  getCampaignsByCompany(companyId: string): Promise<Campaign[]>;
  getAllCampaigns(): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: string, campaign: Partial<InsertCampaign>): Promise<Campaign | undefined>;
  deleteCampaign(id: string): Promise<void>;
  
  // Campaign Recipients
  getCampaignRecipient(id: string): Promise<CampaignRecipient | undefined>;
  getCampaignRecipientsByCampaign(campaignId: string): Promise<CampaignRecipient[]>;
  createCampaignRecipient(recipient: InsertCampaignRecipient): Promise<CampaignRecipient>;
  createCampaignRecipientsBulk(recipients: InsertCampaignRecipient[]): Promise<CampaignRecipient[]>;
  deleteCampaignRecipient(id: string): Promise<void>;
  deleteCampaignRecipientsByCampaign(campaignId: string): Promise<void>;
  
  // Email Events
  createEmailEvent(event: InsertEmailEvent): Promise<EmailEvent>;
  getEmailEventsByCampaign(campaignId: string): Promise<EmailEvent[]>;
  deleteEmailEvent(id: string): Promise<void>;
  
  // Collected Data
  getCollectedData(id: string): Promise<CollectedData | undefined>;
  createCollectedData(data: InsertCollectedData): Promise<CollectedData>;
  getCollectedDataByCampaign(campaignId: string): Promise<CollectedData[]>;
  getCollectedDataByCompany(companyId: string): Promise<CollectedData[]>;
  updateCollectedDataStatus(id: string, status: "pending" | "verified" | "flagged", reason?: string): Promise<CollectedData | undefined>;
  deleteCollectedData(id: string): Promise<void>;
}

export class PostgresStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return user;
  }

  async getUserByReplitId(replitUserId: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.replitUserId, replitUserId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(schema.users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, insertUser: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(schema.users)
      .set({ ...insertUser, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(schema.users).where(eq(schema.users.id, id));
  }

  async getUsersByCompany(companyId: string): Promise<User[]> {
    return await db.select().from(schema.users)
      .where(eq(schema.users.companyId, companyId))
      .orderBy(desc(schema.users.createdAt));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(schema.users).orderBy(desc(schema.users.createdAt));
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (userData.email) {
      const existingUserByEmail = await db.select()
        .from(schema.users)
        .where(eq(schema.users.email, userData.email))
        .limit(1);
      
      if (existingUserByEmail.length > 0) {
        const existing = existingUserByEmail[0];
        const [updated] = await db.update(schema.users)
          .set({
            replitUserId: userData.replitUserId ?? existing.replitUserId,
            firstName: userData.firstName ?? existing.firstName,
            lastName: userData.lastName ?? existing.lastName,
            profileImageUrl: userData.profileImageUrl ?? existing.profileImageUrl,
            updatedAt: new Date(),
          })
          .where(eq(schema.users.id, existing.id))
          .returning();
        return updated;
      }
    }
    
    if (userData.replitUserId) {
      const existingUserByReplitId = await db.select()
        .from(schema.users)
        .where(eq(schema.users.replitUserId, userData.replitUserId))
        .limit(1);
      
      if (existingUserByReplitId.length > 0) {
        const existing = existingUserByReplitId[0];
        const [updated] = await db.update(schema.users)
          .set({
            email: userData.email ?? existing.email,
            firstName: userData.firstName ?? existing.firstName,
            lastName: userData.lastName ?? existing.lastName,
            profileImageUrl: userData.profileImageUrl ?? existing.profileImageUrl,
            updatedAt: new Date(),
          })
          .where(eq(schema.users.id, existing.id))
          .returning();
        return updated;
      }
    }
    
    const [user] = await db
      .insert(schema.users)
      .values({
        replitUserId: userData.replitUserId,
        email: userData.email ?? undefined,
        firstName: userData.firstName ?? undefined,
        lastName: userData.lastName ?? undefined,
        profileImageUrl: userData.profileImageUrl ?? undefined,
      })
      .returning();
    return user;
  }

  // Companies
  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db.select().from(schema.companies).where(eq(schema.companies.id, id));
    return company;
  }

  async getAllCompanies(): Promise<Company[]> {
    return await db.select().from(schema.companies).orderBy(desc(schema.companies.createdAt));
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const [company] = await db.insert(schema.companies).values(insertCompany).returning();
    return company;
  }

  async updateCompany(id: string, insertCompany: Partial<InsertCompany>): Promise<Company | undefined> {
    const [company] = await db.update(schema.companies)
      .set({ ...insertCompany, updatedAt: new Date() })
      .where(eq(schema.companies.id, id))
      .returning();
    return company;
  }

  async deleteCompany(id: string): Promise<void> {
    await db.delete(schema.companies).where(eq(schema.companies.id, id));
  }

  // Email Services
  async getEmailService(id: string): Promise<EmailService | undefined> {
    const [service] = await db.select().from(schema.emailServices).where(eq(schema.emailServices.id, id));
    return service;
  }

  async getEmailServicesByCompany(companyId: string | null): Promise<EmailService[]> {
    if (companyId === null) {
      return await db.select().from(schema.emailServices)
        .where(eq(schema.emailServices.isPlatformDefault, true))
        .orderBy(desc(schema.emailServices.createdAt));
    }
    return await db.select().from(schema.emailServices)
      .where(eq(schema.emailServices.companyId, companyId))
      .orderBy(desc(schema.emailServices.createdAt));
  }

  async createEmailService(insertService: InsertEmailService): Promise<EmailService> {
    const [service] = await db.insert(schema.emailServices).values(insertService).returning();
    return service;
  }

  async updateEmailService(id: string, insertService: Partial<InsertEmailService>): Promise<EmailService | undefined> {
    const [service] = await db.update(schema.emailServices)
      .set({ ...insertService, updatedAt: new Date() })
      .where(eq(schema.emailServices.id, id))
      .returning();
    return service;
  }

  async deleteEmailService(id: string): Promise<void> {
    await db.delete(schema.emailServices).where(eq(schema.emailServices.id, id));
  }

  // Templates
  async getTemplate(id: string): Promise<Template | undefined> {
    const [template] = await db.select().from(schema.templates).where(eq(schema.templates.id, id));
    return template;
  }

  async getTemplatesByCompany(companyId: string | null, includeGlobal = true): Promise<Template[]> {
    if (!companyId) {
      return await db.select().from(schema.templates)
        .where(eq(schema.templates.isGlobal, true))
        .orderBy(desc(schema.templates.createdAt));
    }
    
    if (includeGlobal) {
      return await db.select().from(schema.templates)
        .where(
          or(
            eq(schema.templates.companyId, companyId),
            eq(schema.templates.isGlobal, true)
          )
        )
        .orderBy(desc(schema.templates.createdAt));
    }
    
    return await db.select().from(schema.templates)
      .where(eq(schema.templates.companyId, companyId))
      .orderBy(desc(schema.templates.createdAt));
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const [template] = await db.insert(schema.templates).values(insertTemplate as any).returning();
    return template;
  }

  async updateTemplate(id: string, insertTemplate: Partial<InsertTemplate>): Promise<Template | undefined> {
    const [template] = await db.update(schema.templates)
      .set({ ...insertTemplate, updatedAt: new Date() } as any)
      .where(eq(schema.templates.id, id))
      .returning();
    return template;
  }

  async deleteTemplate(id: string): Promise<void> {
    await db.delete(schema.templates).where(eq(schema.templates.id, id));
  }

  // Contact Groups
  async getContactGroup(id: string): Promise<ContactGroup | undefined> {
    const [group] = await db.select().from(schema.contactGroups).where(eq(schema.contactGroups.id, id));
    return group;
  }

  async getContactGroupsByCompany(companyId: string): Promise<ContactGroup[]> {
    return await db.select().from(schema.contactGroups)
      .where(eq(schema.contactGroups.companyId, companyId))
      .orderBy(desc(schema.contactGroups.createdAt));
  }

  async createContactGroup(insertGroup: InsertContactGroup): Promise<ContactGroup> {
    const [group] = await db.insert(schema.contactGroups).values(insertGroup as any).returning();
    return group;
  }

  async updateContactGroup(id: string, insertGroup: Partial<InsertContactGroup>): Promise<ContactGroup | undefined> {
    const [group] = await db.update(schema.contactGroups)
      .set({ ...insertGroup, updatedAt: new Date() } as any)
      .where(eq(schema.contactGroups.id, id))
      .returning();
    return group;
  }

  async deleteContactGroup(id: string): Promise<void> {
    await db.delete(schema.contactGroups).where(eq(schema.contactGroups.id, id));
  }

  // Contacts
  async getContact(id: string): Promise<Contact | undefined> {
    const [contact] = await db.select().from(schema.contacts).where(eq(schema.contacts.id, id));
    return contact;
  }

  async getContactByEmail(email: string, companyId: string): Promise<Contact | undefined> {
    const [contact] = await db.select().from(schema.contacts)
      .where(and(
        eq(schema.contacts.email, email),
        eq(schema.contacts.companyId, companyId)
      ));
    return contact;
  }

  async getContactsByCompany(companyId: string): Promise<Contact[]> {
    return await db.select().from(schema.contacts)
      .where(eq(schema.contacts.companyId, companyId))
      .orderBy(desc(schema.contacts.createdAt));
  }

  async getAllContacts(): Promise<Contact[]> {
    return await db.select().from(schema.contacts)
      .orderBy(desc(schema.contacts.createdAt));
  }

  async getContactsByGroup(groupId: string): Promise<Contact[]> {
    return await db.select().from(schema.contacts)
      .where(eq(schema.contacts.groupId, groupId))
      .orderBy(desc(schema.contacts.createdAt));
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const [contact] = await db.insert(schema.contacts).values(insertContact).returning();
    return contact;
  }

  async createContactsBulk(insertContacts: InsertContact[]): Promise<Contact[]> {
    if (insertContacts.length === 0) return [];
    return await db.insert(schema.contacts)
      .values(insertContacts)
      .onConflictDoNothing()
      .returning();
  }

  async updateContact(id: string, insertContact: Partial<InsertContact>): Promise<Contact | undefined> {
    const [contact] = await db.update(schema.contacts)
      .set({ ...insertContact, updatedAt: new Date() })
      .where(eq(schema.contacts.id, id))
      .returning();
    return contact;
  }

  async deleteContact(id: string): Promise<void> {
    await db.delete(schema.contacts).where(eq(schema.contacts.id, id));
  }

  // Campaigns
  async getCampaign(id: string): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(schema.campaigns).where(eq(schema.campaigns.id, id));
    return campaign;
  }

  async getCampaignsByCompany(companyId: string): Promise<Campaign[]> {
    return await db.select().from(schema.campaigns)
      .where(eq(schema.campaigns.companyId, companyId))
      .orderBy(desc(schema.campaigns.createdAt));
  }

  async getAllCampaigns(): Promise<Campaign[]> {
    return await db.select().from(schema.campaigns)
      .orderBy(desc(schema.campaigns.createdAt));
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const [campaign] = await db.insert(schema.campaigns).values(insertCampaign).returning();
    return campaign;
  }

  async updateCampaign(id: string, insertCampaign: Partial<InsertCampaign>): Promise<Campaign | undefined> {
    const [campaign] = await db.update(schema.campaigns)
      .set({ ...insertCampaign, updatedAt: new Date() })
      .where(eq(schema.campaigns.id, id))
      .returning();
    return campaign;
  }

  async deleteCampaign(id: string): Promise<void> {
    await db.delete(schema.campaigns).where(eq(schema.campaigns.id, id));
  }

  // Campaign Recipients
  async getCampaignRecipient(id: string): Promise<CampaignRecipient | undefined> {
    const [recipient] = await db.select().from(schema.campaignRecipients)
      .where(eq(schema.campaignRecipients.id, id));
    return recipient;
  }

  async getCampaignRecipientsByCampaign(campaignId: string): Promise<CampaignRecipient[]> {
    return await db.select().from(schema.campaignRecipients)
      .where(eq(schema.campaignRecipients.campaignId, campaignId))
      .orderBy(desc(schema.campaignRecipients.createdAt));
  }

  async createCampaignRecipient(insertRecipient: InsertCampaignRecipient): Promise<CampaignRecipient> {
    const [recipient] = await db.insert(schema.campaignRecipients).values(insertRecipient).returning();
    return recipient;
  }

  async createCampaignRecipientsBulk(insertRecipients: InsertCampaignRecipient[]): Promise<CampaignRecipient[]> {
    if (insertRecipients.length === 0) return [];
    return await db.insert(schema.campaignRecipients)
      .values(insertRecipients)
      .onConflictDoNothing()
      .returning();
  }

  async deleteCampaignRecipient(id: string): Promise<void> {
    await db.delete(schema.campaignRecipients).where(eq(schema.campaignRecipients.id, id));
  }

  async deleteCampaignRecipientsByCampaign(campaignId: string): Promise<void> {
    await db.delete(schema.campaignRecipients).where(eq(schema.campaignRecipients.campaignId, campaignId));
  }

  async getCampaignRecipientByTrackingId(trackingId: string): Promise<CampaignRecipient | undefined> {
    const [recipient] = await db.select().from(schema.campaignRecipients)
      .where(eq(schema.campaignRecipients.trackingId, trackingId));
    return recipient;
  }

  async updateCampaignRecipientStatus(
    id: string, 
    status: "pending" | "sent" | "opened" | "clicked" | "submitted_data",
    timestamp?: Date
  ): Promise<CampaignRecipient | undefined> {
    const now = timestamp || new Date();
    const updateData: any = { status };
    
    switch(status) {
      case "sent":
        updateData.sentAt = now;
        break;
      case "opened":
        updateData.openedAt = now;
        break;
      case "clicked":
        updateData.clickedAt = now;
        break;
      case "submitted_data":
        updateData.submittedDataAt = now;
        break;
    }
    
    const [recipient] = await db.update(schema.campaignRecipients)
      .set(updateData)
      .where(eq(schema.campaignRecipients.id, id))
      .returning();
    return recipient;
  }

  // Email Events
  async createEmailEvent(insertEvent: InsertEmailEvent): Promise<EmailEvent> {
    const [event] = await db.insert(schema.emailEvents).values(insertEvent).returning();
    return event;
  }

  async getEmailEventsByCampaign(campaignId: string): Promise<EmailEvent[]> {
    return await db.select().from(schema.emailEvents)
      .where(eq(schema.emailEvents.campaignId, campaignId))
      .orderBy(desc(schema.emailEvents.createdAt));
  }

  async deleteEmailEvent(id: string): Promise<void> {
    await db.delete(schema.emailEvents).where(eq(schema.emailEvents.id, id));
  }

  // Collected Data
  async getCollectedData(id: string): Promise<CollectedData | undefined> {
    const [data] = await db.select().from(schema.collectedData).where(eq(schema.collectedData.id, id));
    return data;
  }

  async createCollectedData(insertData: InsertCollectedData): Promise<CollectedData> {
    const [data] = await db.insert(schema.collectedData).values(insertData).returning();
    return data;
  }

  async getCollectedDataByCampaign(campaignId: string): Promise<CollectedData[]> {
    return await db.select().from(schema.collectedData)
      .where(eq(schema.collectedData.campaignId, campaignId))
      .orderBy(desc(schema.collectedData.createdAt));
  }

  async getCollectedDataByCompany(companyId: string): Promise<CollectedData[]> {
    const campaigns = await this.getCampaignsByCompany(companyId);
    const campaignIds = campaigns.map(c => c.id);
    
    if (campaignIds.length === 0) return [];
    
    return await db.select().from(schema.collectedData)
      .where(inArray(schema.collectedData.campaignId, campaignIds))
      .orderBy(desc(schema.collectedData.createdAt));
  }

  async updateCollectedDataStatus(
    id: string,
    status: "pending" | "verified" | "flagged",
    reason?: string
  ): Promise<CollectedData | undefined> {
    const updateData: any = { status };
    
    if (status === "pending") {
      updateData.verifiedAt = null;
      updateData.flaggedAt = null;
      updateData.flagReason = null;
    } else if (status === "verified") {
      updateData.verifiedAt = new Date();
      updateData.flaggedAt = null;
      updateData.flagReason = null;
    } else if (status === "flagged") {
      updateData.flaggedAt = new Date();
      updateData.verifiedAt = null;
      updateData.flagReason = reason || null;
    }
    
    const [data] = await db.update(schema.collectedData)
      .set(updateData)
      .where(eq(schema.collectedData.id, id))
      .returning();
    return data;
  }

  async deleteCollectedData(id: string): Promise<void> {
    await db.delete(schema.collectedData).where(eq(schema.collectedData.id, id));
  }
}

export const storage = new PostgresStorage();
