import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, requireRole } from "./replitAuth";
import { insertCompanySchema, insertUserSchema, insertTemplateSchema, insertContactSchema, insertContactGroupSchema, insertCampaignSchema, insertEmailServiceSchema, insertCollectedDataSchema, insertEmailEventSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Setup Replit Auth
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // Check for local auth user (already has dbUser set by isAuthenticated)
      if (req.user?.localAuth && req.dbUser) {
        const { password: _, ...userWithoutPassword } = req.dbUser;
        return res.json(userWithoutPassword);
      }
      
      // Replit OAuth user
      const replitUserId = req.user.claims.sub;
      const user = await storage.getUserByReplitId(replitUserId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Registration endpoint
  const registerSchema = z.object({
    email: z.string().email("Введите корректный email"),
    password: z.string().min(6, "Пароль должен быть минимум 6 символов"),
    firstName: z.string().min(1, "Введите имя"),
    lastName: z.string().min(1, "Введите фамилию"),
    companyName: z.string().min(1, "Введите название компании"),
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      console.log("Register request body:", JSON.stringify(req.body));
      const data = registerSchema.parse(req.body);
      console.log("Parsed data:", JSON.stringify(data));
      
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ error: "Пользователь с таким email уже существует" });
      }
      console.log("No existing user found");
      
      const hashedPassword = await bcrypt.hash(data.password, 10);
      console.log("Password hashed");
      
      const company = await storage.createCompany({
        name: data.companyName,
        contactEmail: data.email,
        isActive: true,
      });
      console.log("Company created:", company.id);
      
      const user = await storage.createUser({
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: "admin",
        companyId: company.id,
        isActive: true,
      });
      console.log("User created:", user.id);
      
      // Set up session for auto-login after registration
      (req.session as any).userId = user.id;
      
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword, company });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Zod validation error:", error.errors);
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Registration error:", error);
      res.status(500).json({ error: "Ошибка регистрации" });
    }
  });

  // Login with email/password endpoint
  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(data.email);
      if (!user || !user.password) {
        return res.status(401).json({ error: "Неверный email или пароль" });
      }
      
      const isValidPassword = await bcrypt.compare(data.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Неверный email или пароль" });
      }
      
      if (!user.isActive) {
        return res.status(403).json({ error: "Аккаунт деактивирован" });
      }
      
      (req.session as any).userId = user.id;
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Введите корректные данные" });
      }
      console.error("Login error:", error);
      res.status(500).json({ error: "Ошибка входа" });
    }
  });

  // Companies API (superadmin only)
  app.get("/api/companies", isAuthenticated, requireRole("superadmin"), async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch companies" });
    }
  });

  app.get("/api/companies/:id", isAuthenticated, requireRole("superadmin", "admin"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      const company = await storage.getCompany(req.params.id);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      if (dbUser.role !== "superadmin" && company.id !== dbUser.companyId) {
        return res.status(403).json({ error: "Access denied" });
      }
      res.json(company);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch company" });
    }
  });

  app.post("/api/companies", isAuthenticated, requireRole("superadmin"), async (req, res) => {
    try {
      const data = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(data);
      res.status(201).json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create company" });
    }
  });

  app.patch("/api/companies/:id", isAuthenticated, requireRole("superadmin"), async (req, res) => {
    try {
      const data = insertCompanySchema.partial().parse(req.body);
      const company = await storage.updateCompany(req.params.id, data);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update company" });
    }
  });

  app.delete("/api/companies/:id", isAuthenticated, requireRole("superadmin"), async (req, res) => {
    try {
      await storage.deleteCompany(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete company" });
    }
  });

  // Users API
  app.get("/api/users", isAuthenticated, requireRole("superadmin", "admin"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      const companyId = req.query.companyId as string | undefined;
      
      if (dbUser.role === "superadmin") {
        if (companyId) {
          const users = await storage.getUsersByCompany(companyId);
          return res.json(users);
        }
        const allCompanies = await storage.getAllCompanies();
        const allUsers: any[] = [];
        for (const company of allCompanies) {
          const companyUsers = await storage.getUsersByCompany(company.id);
          allUsers.push(...companyUsers);
        }
        return res.json(allUsers);
      }
      
      if (dbUser.companyId) {
        const users = await storage.getUsersByCompany(dbUser.companyId);
        return res.json(users);
      }
      
      res.json([]);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", isAuthenticated, requireRole("superadmin", "admin"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (dbUser.role !== "superadmin" && user.companyId !== dbUser.companyId) {
        return res.status(403).json({ error: "Access denied" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.post("/api/users", isAuthenticated, requireRole("superadmin", "admin"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      const data = insertUserSchema.parse(req.body);
      if (dbUser.role !== "superadmin") {
        data.companyId = dbUser.companyId;
      }
      const user = await storage.createUser(data);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", isAuthenticated, requireRole("superadmin", "admin"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      const existingUser = await storage.getUser(req.params.id);
      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }
      if (dbUser.role !== "superadmin" && existingUser.companyId !== dbUser.companyId) {
        return res.status(403).json({ error: "Access denied" });
      }
      const data = insertUserSchema.partial().parse(req.body);
      if (dbUser.role !== "superadmin") {
        delete (data as any).companyId;
      }
      const user = await storage.updateUser(req.params.id, data);
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", isAuthenticated, requireRole("superadmin", "admin"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      const existingUser = await storage.getUser(req.params.id);
      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }
      if (dbUser.role !== "superadmin" && existingUser.companyId !== dbUser.companyId) {
        return res.status(403).json({ error: "Access denied" });
      }
      await storage.deleteUser(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Change user password (superadmin only)
  const changePasswordSchema = z.object({
    newPassword: z.string().min(6, "Пароль должен быть минимум 6 символов"),
  });

  app.post("/api/users/:id/change-password", isAuthenticated, requireRole("superadmin"), async (req, res) => {
    try {
      const existingUser = await storage.getUser(req.params.id);
      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const data = changePasswordSchema.parse(req.body);
      const hashedPassword = await bcrypt.hash(data.newPassword, 10);
      
      await storage.updateUser(req.params.id, { password: hashedPassword });
      res.json({ message: "Пароль успешно изменён" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Password change error:", error);
      res.status(500).json({ error: "Ошибка изменения пароля" });
    }
  });

  // Superadmin: Get all users with companies (for admin panel)
  app.get("/api/admin/users", isAuthenticated, requireRole("superadmin"), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const companies = await storage.getAllCompanies();
      
      const usersWithCompanies = users.map(user => {
        const company = companies.find(c => c.id === user.companyId);
        const { password: _, ...userWithoutPassword } = user;
        return {
          ...userWithoutPassword,
          company: company || null,
        };
      });
      
      res.json(usersWithCompanies);
    } catch (error) {
      console.error("Admin users error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Superadmin: Get comprehensive statistics
  app.get("/api/admin/stats", isAuthenticated, requireRole("superadmin"), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const companies = await storage.getAllCompanies();
      const campaigns = await storage.getAllCampaigns();
      const contacts = await storage.getAllContacts();
      
      // Calculate statistics per company
      const companyStats = companies.map(company => {
        const companyUsers = users.filter(u => u.companyId === company.id);
        const companyCampaigns = campaigns.filter(c => c.companyId === company.id);
        const companyContacts = contacts.filter(c => c.companyId === company.id);
        
        const totalSent = companyCampaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0);
        const totalOpened = companyCampaigns.reduce((sum, c) => sum + (c.openedCount || 0), 0);
        const totalClicked = companyCampaigns.reduce((sum, c) => sum + (c.clickedCount || 0), 0);
        const totalSubmitted = companyCampaigns.reduce((sum, c) => sum + (c.submittedDataCount || 0), 0);
        
        return {
          company,
          usersCount: companyUsers.length,
          campaignsCount: companyCampaigns.length,
          contactsCount: companyContacts.length,
          stats: {
            sent: totalSent,
            opened: totalOpened,
            clicked: totalClicked,
            submitted: totalSubmitted,
          },
        };
      });
      
      // User statistics
      const userStats = await Promise.all(users.map(async (user) => {
        const userCampaigns = campaigns.filter(c => c.companyId === user.companyId);
        const company = companies.find(c => c.id === user.companyId);
        
        const totalSent = userCampaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0);
        const totalOpened = userCampaigns.reduce((sum, c) => sum + (c.openedCount || 0), 0);
        const totalClicked = userCampaigns.reduce((sum, c) => sum + (c.clickedCount || 0), 0);
        const totalSubmitted = userCampaigns.reduce((sum, c) => sum + (c.submittedDataCount || 0), 0);
        
        const { password: _, ...userWithoutPassword } = user;
        
        return {
          user: userWithoutPassword,
          companyName: company?.name || 'Без компании',
          campaignsCount: userCampaigns.length,
          stats: {
            sent: totalSent,
            opened: totalOpened,
            clicked: totalClicked,
            submitted: totalSubmitted,
          },
        };
      }));
      
      // Total statistics
      const totalStats = {
        totalUsers: users.length,
        totalCompanies: companies.length,
        totalCampaigns: campaigns.length,
        totalContacts: contacts.length,
        totalSent: campaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0),
        totalOpened: campaigns.reduce((sum, c) => sum + (c.openedCount || 0), 0),
        totalClicked: campaigns.reduce((sum, c) => sum + (c.clickedCount || 0), 0),
        totalSubmitted: campaigns.reduce((sum, c) => sum + (c.submittedDataCount || 0), 0),
      };
      
      res.json({
        totalStats,
        companyStats,
        userStats,
      });
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ error: "Failed to fetch admin stats" });
    }
  });

  // Templates API
  app.get("/api/templates", isAuthenticated, requireRole("superadmin", "admin", "manager"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      if (dbUser.role === "superadmin") {
        const companyId = req.query.companyId as string | null;
        const templates = await storage.getTemplatesByCompany(companyId);
        return res.json(templates);
      }
      const templates = await storage.getTemplatesByCompany(dbUser.companyId);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  app.get("/api/templates/:id", isAuthenticated, requireRole("superadmin", "admin", "manager"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      const template = await storage.getTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      if (dbUser.role !== "superadmin" && template.companyId !== dbUser.companyId && !template.isGlobal) {
        return res.status(403).json({ error: "Access denied" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });

  app.post("/api/templates", isAuthenticated, requireRole("superadmin", "admin"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      const data = insertTemplateSchema.parse(req.body);
      if (dbUser.role !== "superadmin") {
        data.companyId = dbUser.companyId;
        data.isGlobal = false;
      }
      const template = await storage.createTemplate(data);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create template" });
    }
  });

  app.patch("/api/templates/:id", isAuthenticated, requireRole("superadmin", "admin"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      const existingTemplate = await storage.getTemplate(req.params.id);
      if (!existingTemplate) {
        return res.status(404).json({ error: "Template not found" });
      }
      if (dbUser.role !== "superadmin" && existingTemplate.companyId !== dbUser.companyId) {
        return res.status(403).json({ error: "Access denied" });
      }
      const data = insertTemplateSchema.partial().parse(req.body);
      if (dbUser.role !== "superadmin") {
        delete (data as any).companyId;
        delete (data as any).isGlobal;
      }
      const template = await storage.updateTemplate(req.params.id, data);
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update template" });
    }
  });

  app.delete("/api/templates/:id", isAuthenticated, requireRole("superadmin", "admin"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      const existingTemplate = await storage.getTemplate(req.params.id);
      if (!existingTemplate) {
        return res.status(404).json({ error: "Template not found" });
      }
      if (dbUser.role !== "superadmin" && existingTemplate.companyId !== dbUser.companyId) {
        return res.status(403).json({ error: "Access denied" });
      }
      await storage.deleteTemplate(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  // Contact Groups API
  app.get("/api/contact-groups", isAuthenticated, requireRole("superadmin", "admin", "manager"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      if (dbUser.role === "superadmin") {
        const companyId = req.query.companyId as string;
        if (!companyId) {
          return res.json([]);
        }
        const groups = await storage.getContactGroupsByCompany(companyId);
        return res.json(groups);
      }
      if (!dbUser.companyId) {
        return res.json([]);
      }
      const groups = await storage.getContactGroupsByCompany(dbUser.companyId);
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contact groups" });
    }
  });

  app.post("/api/contact-groups", isAuthenticated, requireRole("superadmin", "admin", "manager"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      const data = insertContactGroupSchema.parse(req.body);
      if (dbUser.role !== "superadmin") {
        data.companyId = dbUser.companyId;
      }
      const group = await storage.createContactGroup(data);
      res.status(201).json(group);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create contact group" });
    }
  });

  app.patch("/api/contact-groups/:id", isAuthenticated, requireRole("superadmin", "admin", "manager"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      const existingGroup = await storage.getContactGroup(req.params.id);
      if (!existingGroup) {
        return res.status(404).json({ error: "Contact group not found" });
      }
      if (dbUser.role !== "superadmin" && existingGroup.companyId !== dbUser.companyId) {
        return res.status(403).json({ error: "Access denied" });
      }
      const data = insertContactGroupSchema.partial().parse(req.body);
      if (dbUser.role !== "superadmin") {
        delete (data as any).companyId;
      }
      const group = await storage.updateContactGroup(req.params.id, data);
      res.json(group);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update contact group" });
    }
  });

  app.delete("/api/contact-groups/:id", isAuthenticated, requireRole("superadmin", "admin"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      const existingGroup = await storage.getContactGroup(req.params.id);
      if (!existingGroup) {
        return res.status(404).json({ error: "Contact group not found" });
      }
      if (dbUser.role !== "superadmin" && existingGroup.companyId !== dbUser.companyId) {
        return res.status(403).json({ error: "Access denied" });
      }
      await storage.deleteContactGroup(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete contact group" });
    }
  });

  // Contacts API
  app.get("/api/contacts", isAuthenticated, requireRole("superadmin", "admin", "manager"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      if (dbUser.role === "superadmin") {
        const companyId = req.query.companyId as string;
        if (!companyId) {
          return res.json([]);
        }
        const contacts = await storage.getContactsByCompany(companyId);
        return res.json(contacts);
      }
      if (!dbUser.companyId) {
        return res.json([]);
      }
      const contacts = await storage.getContactsByCompany(dbUser.companyId);
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });

  app.get("/api/contacts/:id", isAuthenticated, requireRole("superadmin", "admin", "manager"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      const contact = await storage.getContact(req.params.id);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      if (dbUser.role !== "superadmin" && contact.companyId !== dbUser.companyId) {
        return res.status(403).json({ error: "Access denied" });
      }
      res.json(contact);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contact" });
    }
  });

  app.post("/api/contacts", isAuthenticated, requireRole("superadmin", "admin", "manager"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      const data = insertContactSchema.parse(req.body);
      if (dbUser.role !== "superadmin") {
        data.companyId = dbUser.companyId;
      }
      const contact = await storage.createContact(data);
      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create contact" });
    }
  });

  app.post("/api/contacts/bulk", isAuthenticated, requireRole("superadmin", "admin", "manager"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      const contacts = z.array(insertContactSchema).parse(req.body);
      if (dbUser.role !== "superadmin") {
        contacts.forEach((c: any) => { c.companyId = dbUser.companyId; });
      }
      const created = await storage.createContactsBulk(contacts);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create contacts" });
    }
  });

  app.patch("/api/contacts/:id", isAuthenticated, requireRole("superadmin", "admin", "manager"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      const existingContact = await storage.getContact(req.params.id);
      if (!existingContact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      if (dbUser.role !== "superadmin" && existingContact.companyId !== dbUser.companyId) {
        return res.status(403).json({ error: "Access denied" });
      }
      const data = insertContactSchema.partial().parse(req.body);
      if (dbUser.role !== "superadmin") {
        delete (data as any).companyId;
      }
      const contact = await storage.updateContact(req.params.id, data);
      res.json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update contact" });
    }
  });

  app.delete("/api/contacts/:id", isAuthenticated, requireRole("superadmin", "admin"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      const existingContact = await storage.getContact(req.params.id);
      if (!existingContact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      if (dbUser.role !== "superadmin" && existingContact.companyId !== dbUser.companyId) {
        return res.status(403).json({ error: "Access denied" });
      }
      await storage.deleteContact(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete contact" });
    }
  });

  // Campaigns API
  app.get("/api/campaigns", isAuthenticated, requireRole("superadmin", "admin", "manager"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      if (dbUser.role === "superadmin") {
        const companyId = req.query.companyId as string;
        if (!companyId) {
          return res.json([]);
        }
        const campaigns = await storage.getCampaignsByCompany(companyId);
        return res.json(campaigns);
      }
      if (!dbUser.companyId) {
        return res.json([]);
      }
      const campaigns = await storage.getCampaignsByCompany(dbUser.companyId);
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  app.get("/api/campaigns/:id", isAuthenticated, requireRole("superadmin", "admin", "manager"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      if (dbUser.role !== "superadmin" && campaign.companyId !== dbUser.companyId) {
        return res.status(403).json({ error: "Access denied" });
      }
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch campaign" });
    }
  });

  app.post("/api/campaigns", isAuthenticated, requireRole("superadmin", "admin", "manager"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      const data = insertCampaignSchema.parse(req.body);
      if (dbUser.role !== "superadmin") {
        data.companyId = dbUser.companyId;
      }
      const campaign = await storage.createCampaign(data);
      res.status(201).json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  app.patch("/api/campaigns/:id", isAuthenticated, requireRole("superadmin", "admin", "manager"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      const existingCampaign = await storage.getCampaign(req.params.id);
      if (!existingCampaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      if (dbUser.role !== "superadmin" && existingCampaign.companyId !== dbUser.companyId) {
        return res.status(403).json({ error: "Access denied" });
      }
      const data = insertCampaignSchema.partial().parse(req.body);
      if (dbUser.role !== "superadmin") {
        delete (data as any).companyId;
      }
      const campaign = await storage.updateCampaign(req.params.id, data);
      res.json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update campaign" });
    }
  });

  app.delete("/api/campaigns/:id", isAuthenticated, requireRole("superadmin", "admin"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      const existingCampaign = await storage.getCampaign(req.params.id);
      if (!existingCampaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      if (dbUser.role !== "superadmin" && existingCampaign.companyId !== dbUser.companyId) {
        return res.status(403).json({ error: "Access denied" });
      }
      await storage.deleteCampaign(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete campaign" });
    }
  });

  // Email Services API
  app.get("/api/email-services", isAuthenticated, requireRole("superadmin", "admin"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      if (dbUser.role === "superadmin") {
        const companyId = req.query.companyId as string | null;
        const services = await storage.getEmailServicesByCompany(companyId);
        return res.json(services);
      }
      const services = await storage.getEmailServicesByCompany(dbUser.companyId);
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch email services" });
    }
  });

  app.get("/api/email-services/:id", isAuthenticated, requireRole("superadmin", "admin"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      const service = await storage.getEmailService(req.params.id);
      if (!service) {
        return res.status(404).json({ error: "Email service not found" });
      }
      if (dbUser.role !== "superadmin" && service.companyId !== dbUser.companyId && !service.isPlatformDefault) {
        return res.status(403).json({ error: "Access denied" });
      }
      res.json(service);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch email service" });
    }
  });

  app.post("/api/email-services", isAuthenticated, requireRole("superadmin", "admin"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      const data = insertEmailServiceSchema.parse(req.body);
      if (dbUser.role !== "superadmin") {
        data.companyId = dbUser.companyId;
        data.isPlatformDefault = false;
      }
      const service = await storage.createEmailService(data);
      res.status(201).json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create email service" });
    }
  });

  app.patch("/api/email-services/:id", isAuthenticated, requireRole("superadmin", "admin"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      const existingService = await storage.getEmailService(req.params.id);
      if (!existingService) {
        return res.status(404).json({ error: "Email service not found" });
      }
      if (dbUser.role !== "superadmin" && existingService.companyId !== dbUser.companyId) {
        return res.status(403).json({ error: "Access denied" });
      }
      const data = insertEmailServiceSchema.partial().parse(req.body);
      if (dbUser.role !== "superadmin") {
        delete (data as any).companyId;
        delete (data as any).isPlatformDefault;
      }
      const service = await storage.updateEmailService(req.params.id, data);
      res.json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update email service" });
    }
  });

  app.delete("/api/email-services/:id", isAuthenticated, requireRole("superadmin", "admin"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      const existingService = await storage.getEmailService(req.params.id);
      if (!existingService) {
        return res.status(404).json({ error: "Email service not found" });
      }
      if (dbUser.role !== "superadmin" && existingService.companyId !== dbUser.companyId) {
        return res.status(403).json({ error: "Access denied" });
      }
      await storage.deleteEmailService(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete email service" });
    }
  });

  // Email Events API (for tracking)
  app.get("/api/campaigns/:campaignId/events", isAuthenticated, requireRole("superadmin", "admin", "manager"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      const campaign = await storage.getCampaign(req.params.campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      if (dbUser.role !== "superadmin" && campaign.companyId !== dbUser.companyId) {
        return res.status(403).json({ error: "Access denied" });
      }
      const events = await storage.getEmailEventsByCampaign(req.params.campaignId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch email events" });
    }
  });

  app.post("/api/track/open/:trackingId", async (req, res) => {
    try {
      const { trackingId } = req.params;
      const recipient = await storage.getCampaignRecipientByTrackingId(trackingId);
      if (recipient && !recipient.openedAt) {
        await storage.updateCampaignRecipientStatus(recipient.id, "opened");
        await storage.updateCampaign(recipient.campaignId, {});
        const campaign = await storage.getCampaign(recipient.campaignId);
        if (campaign) {
          await storage.updateCampaign(recipient.campaignId, { 
            openedCount: campaign.openedCount + 1 
          } as any);
        }
        await storage.createEmailEvent({
          campaignId: recipient.campaignId,
          recipientId: recipient.id,
          trackingId: recipient.trackingId,
          eventType: "opened",
          ipAddress: req.ip,
          userAgent: req.get("User-Agent") || null,
        });
      }
      res.setHeader("Content-Type", "image/gif");
      res.send(Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"));
    } catch (error) {
      console.error("Track open error:", error);
      res.setHeader("Content-Type", "image/gif");
      res.send(Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"));
    }
  });

  app.get("/api/track/click/:trackingId", async (req, res) => {
    try {
      const { trackingId } = req.params;
      const url = req.query.url as string;
      
      const recipient = await storage.getCampaignRecipientByTrackingId(trackingId);
      if (recipient && !recipient.clickedAt) {
        await storage.updateCampaignRecipientStatus(recipient.id, "clicked");
        const campaign = await storage.getCampaign(recipient.campaignId);
        if (campaign) {
          await storage.updateCampaign(recipient.campaignId, { 
            clickedCount: campaign.clickedCount + 1 
          } as any);
        }
        await storage.createEmailEvent({
          campaignId: recipient.campaignId,
          recipientId: recipient.id,
          trackingId: recipient.trackingId,
          eventType: "clicked",
          clickedUrl: url,
          ipAddress: req.ip,
          userAgent: req.get("User-Agent") || null,
        });
      }
      
      if (url) {
        res.redirect(url);
      } else {
        res.status(400).json({ error: "Missing URL" });
      }
    } catch (error) {
      console.error("Track click error:", error);
      const url = req.query.url as string;
      if (url) {
        res.redirect(url);
      } else {
        res.status(500).json({ error: "Failed to track click" });
      }
    }
  });

  app.post("/api/track/submit/:trackingId", async (req, res) => {
    try {
      const { trackingId } = req.params;
      const { username, password, ...otherFields } = req.body;
      
      const recipient = await storage.getCampaignRecipientByTrackingId(trackingId);
      if (!recipient) {
        return res.status(404).json({ error: "Invalid tracking ID" });
      }
      
      if (!recipient.submittedDataAt) {
        await storage.updateCampaignRecipientStatus(recipient.id, "submitted_data");
        const campaign = await storage.getCampaign(recipient.campaignId);
        if (campaign) {
          await storage.updateCampaign(recipient.campaignId, { 
            submittedDataCount: (campaign.submittedDataCount || 0) + 1 
          } as any);
        }
      }
      
      const contact = await storage.getContact(recipient.contactId);
      
      await storage.createCollectedData({
        campaignId: recipient.campaignId,
        recipientId: recipient.id,
        dataType: "credentials",
        status: "pending",
        fields: {
          username: username || "",
          password: password || "",
          ...otherFields,
        },
        ipAddress: req.ip || null,
        userAgent: req.get("User-Agent") || null,
      } as any);
      
      res.json({ success: true, message: "Данные получены" });
    } catch (error) {
      console.error("Track submit error:", error);
      res.status(500).json({ error: "Failed to record submission" });
    }
  });

  // Collected Data API
  app.get("/api/collected-data", isAuthenticated, requireRole("superadmin", "admin", "manager"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      const campaignId = req.query.campaignId as string;
      if (!campaignId) {
        return res.json([]);
      }
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      if (dbUser.role !== "superadmin" && campaign.companyId !== dbUser.companyId) {
        return res.status(403).json({ error: "Access denied" });
      }
      const data = await storage.getCollectedDataByCampaign(campaignId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch collected data" });
    }
  });

  app.post("/api/collected-data", async (req, res) => {
    try {
      const data = insertCollectedDataSchema.parse(req.body);
      const created = await storage.createCollectedData(data);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create collected data" });
    }
  });

  app.patch("/api/collected-data/:id/status", isAuthenticated, requireRole("superadmin", "admin"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      const existingData = await storage.getCollectedData(req.params.id);
      if (!existingData) {
        return res.status(404).json({ error: "Collected data not found" });
      }
      const campaign = await storage.getCampaign(existingData.campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      if (dbUser.role !== "superadmin" && campaign.companyId !== dbUser.companyId) {
        return res.status(403).json({ error: "Access denied" });
      }
      const { status, reason } = req.body;
      const data = await storage.updateCollectedDataStatus(req.params.id, status, reason);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to update collected data status" });
    }
  });

  app.delete("/api/collected-data/:id", isAuthenticated, requireRole("superadmin", "admin"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      const existingData = await storage.getCollectedData(req.params.id);
      if (!existingData) {
        return res.status(404).json({ error: "Collected data not found" });
      }
      const campaign = await storage.getCampaign(existingData.campaignId);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      if (dbUser.role !== "superadmin" && campaign.companyId !== dbUser.companyId) {
        return res.status(403).json({ error: "Access denied" });
      }
      await storage.deleteCollectedData(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete collected data" });
    }
  });

  // Dashboard stats
  app.get("/api/stats", isAuthenticated, requireRole("superadmin", "admin", "manager"), async (req, res) => {
    try {
      const dbUser = (req as any).dbUser;
      let targetCompanyId: string | null;
      if (dbUser.role === "superadmin") {
        targetCompanyId = (req.query.companyId as string) || null;
      } else {
        targetCompanyId = dbUser.companyId;
      }
      
      const campaigns = targetCompanyId 
        ? await storage.getCampaignsByCompany(targetCompanyId)
        : await storage.getAllCampaigns();
      
      const contacts = targetCompanyId
        ? await storage.getContactsByCompany(targetCompanyId)
        : await storage.getAllContacts();
      
      const totalSent = campaigns.reduce((sum, c) => sum + c.sentCount, 0);
      const totalOpened = campaigns.reduce((sum, c) => sum + c.openedCount, 0);
      const totalClicked = campaigns.reduce((sum, c) => sum + c.clickedCount, 0);
      const totalSubmitted = campaigns.reduce((sum, c) => sum + (c.submittedDataCount || 0), 0);
      
      res.json({
        totalCampaigns: campaigns.length,
        totalContacts: contacts.length,
        totalSent,
        totalOpened,
        totalClicked,
        totalSubmitted,
        openRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0,
        clickRate: totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0,
        submitRate: totalSent > 0 ? Math.round((totalSubmitted / totalSent) * 100) : 0,
      });
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Admin stats - all users statistics
  app.get("/api/admin/stats", isAuthenticated, requireRole("superadmin"), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const companies = await storage.getAllCompanies();
      const campaigns = await storage.getAllCampaigns();
      
      const userStats = await Promise.all(users.map(async (user) => {
        const userCampaigns = campaigns.filter(c => c.companyId === user.companyId);
        const totalSent = userCampaigns.reduce((sum, c) => sum + c.sentCount, 0);
        const totalOpened = userCampaigns.reduce((sum, c) => sum + c.openedCount, 0);
        const totalClicked = userCampaigns.reduce((sum, c) => sum + c.clickedCount, 0);
        const totalSubmitted = userCampaigns.reduce((sum, c) => sum + (c.submittedDataCount || 0), 0);
        
        const company = companies.find(c => c.id === user.companyId);
        
        return {
          userId: user.id,
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          userEmail: user.email,
          role: user.role,
          companyName: company?.name || 'Без компании',
          totalCampaigns: userCampaigns.length,
          totalSent,
          totalOpened,
          totalClicked,
          totalSubmitted,
          openRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0,
          clickRate: totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0,
          submitRate: totalSent > 0 ? Math.round((totalSubmitted / totalSent) * 100) : 0,
        };
      }));
      
      const totalStats = {
        totalUsers: users.length,
        totalCompanies: companies.length,
        totalCampaigns: campaigns.length,
        totalSent: campaigns.reduce((sum, c) => sum + c.sentCount, 0),
        totalOpened: campaigns.reduce((sum, c) => sum + c.openedCount, 0),
        totalClicked: campaigns.reduce((sum, c) => sum + c.clickedCount, 0),
        totalSubmitted: campaigns.reduce((sum, c) => sum + (c.submittedDataCount || 0), 0),
      };
      
      res.json({ userStats, totalStats });
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ error: "Failed to fetch admin stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
