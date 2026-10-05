import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { requireAuth, requireRole, requireTenant, AuthRequest } from "./src/middleware/auth.ts";
import { db } from "./src/db/index.ts";
import { users, gyms, memberTrainerAssignments, workoutSessions, workoutSegments, workoutSegmentItems } from "./src/db/schema.ts";
import { eq, and } from "drizzle-orm";
import cookieParser from "cookie-parser";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // --- API ROUTES ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // User Auth & Synchronization (Upsert User to DB)
  app.post("/api/auth/sync", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid, email } = req.user!;
      const fullName = req.body.fullName || "New User";
      
      const dbUsers = await db.select().from(users).where(eq(users.uid, uid));
      if (dbUsers.length === 0) {
        // By default create as member if not specified, 
        // Super admins must be created manually or via a special setup script.
        const result = await db.insert(users).values({
          uid,
          email,
          fullName,
          role: "member", // Default to member
        }).returning();
        res.json({ user: result[0] });
      } else {
        res.json({ user: dbUsers[0] });
      }
    } catch (error: any) {
      console.error("Auth sync error:", error);
      res.status(500).json({ error: error.message || "Failed to sync auth" });
    }
  });

  // Get current user profile
  app.get("/api/users/me", requireAuth, async (req: AuthRequest, res) => {
    if (!req.dbUser) return res.status(404).json({ error: "User not found" });
    res.json(req.dbUser);
  });

  // Example: Get Gyms (Super Admin only)
  app.get("/api/admin/gyms", requireAuth, requireRole(["super_admin"]), async (req, res) => {
    try {
      const allGyms = await db.select().from(gyms);
      res.json(allGyms);
    } catch (error: any) {
      console.error("Error fetching gyms:", error);
      res.status(500).json({ error: "Failed to fetch gyms" });
    }
  });

  // Example: Get my gym members (Gym Owner)
  app.get("/api/gym/members", requireAuth, requireRole(["gym_owner"]), requireTenant, async (req: AuthRequest, res) => {
    try {
      const myMembers = await db.select().from(users).where(
        and(
          eq(users.gymId, req.dbUser!.gymId!),
          eq(users.role, 'member')
        )
      );
      res.json(myMembers);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch members" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
