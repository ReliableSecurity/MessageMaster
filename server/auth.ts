import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  const isProduction = process.env.NODE_ENV === "production";
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  app.get("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const sessionUserId = (req.session as any).userId;
  if (sessionUserId) {
    try {
      const dbUser = await storage.getUser(sessionUserId);
      if (dbUser && dbUser.isActive) {
        (req as any).dbUser = dbUser;
        (req as any).user = { localAuth: true, userId: sessionUserId };
        return next();
      }
    } catch (error) {
      console.error("Error checking local session:", error);
    }
  }
  
  return res.status(401).json({ message: "Unauthorized" });
};

export function requireRole(...allowedRoles: string[]): RequestHandler {
  return async (req, res, next) => {
    const dbUser = (req as any).dbUser;
    
    if (!dbUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (!allowedRoles.includes(dbUser.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient permissions" });
    }
    
    next();
  };
}

export function requireViewerCampaignAccess(): RequestHandler {
  return async (req, res, next) => {
    const dbUser = (req as any).dbUser;
    
    if (!dbUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (dbUser.role !== "viewer") {
      return next();
    }
    
    const campaignId = req.params.id || req.params.campaignId;
    if (!campaignId) {
      return res.status(400).json({ message: "Campaign ID required" });
    }
    
    const viewerAccess = await storage.getViewerCampaignAccess(dbUser.id);
    const allowedCampaignIds = viewerAccess.map(a => a.campaignId);
    
    if (!allowedCampaignIds.includes(campaignId)) {
      return res.status(403).json({ message: "Forbidden: no access to this campaign" });
    }
    
    next();
  };
}

export function isReadOnlyForViewer(): RequestHandler {
  return async (req, res, next) => {
    const dbUser = (req as any).dbUser;
    
    if (!dbUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (dbUser.role === "viewer") {
      return res.status(403).json({ message: "Forbidden: viewers have read-only access" });
    }
    
    next();
  };
}
