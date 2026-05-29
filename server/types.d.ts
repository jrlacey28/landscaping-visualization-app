import type { User as AppUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends AppUser {}
  }
}

declare module "express-session" {
  interface SessionData {
    isAdmin?: boolean;
    adminCsrfToken?: string;
    adminEmail?: string;
  }
}
