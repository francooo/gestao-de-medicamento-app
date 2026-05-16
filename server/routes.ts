import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "node:http";
import { db } from "./db";
import { users, profiles, medications, doseLogs } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

interface JwtPayload {
  userId: string;
  email: string;
}

interface AuthenticatedRequest extends Request {
  userId: string;
  userEmail: string;
}

function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    (req as AuthenticatedRequest).userId = payload.userId;
    (req as AuthenticatedRequest).userEmail = payload.email;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

async function verifyProfileOwnership(profileId: string, userId: string): Promise<boolean> {
  const [profile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.id, profileId), eq(profiles.userId, userId)))
    .limit(1);
  return !!profile;
}

async function verifyMedicationOwnership(medicationId: string, userId: string): Promise<boolean> {
  const [med] = await db
    .select({ id: medications.id })
    .from(medications)
    .where(and(eq(medications.id, medicationId), eq(medications.userId, userId)))
    .limit(1);
  return !!med;
}

export async function registerRoutes(app: Express): Promise<Server> {

  // --- Auth routes ---

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
        return;
      }
      if (password.length < 6) {
        res.status(400).json({ message: "Password must be at least 6 characters" });
        return;
      }

      const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email.toLowerCase())).limit(1);
      if (existing.length > 0) {
        res.status(409).json({ message: "Email already in use" });
        return;
      }

      const hashed = await bcrypt.hash(password, 12);
      const [user] = await db.insert(users).values({
        email: email.toLowerCase(),
        password: hashed,
      }).returning({ id: users.id, email: users.email });

      const token = signToken({ userId: user.id, email: user.email });
      res.status(201).json({ token, user: { id: user.id, email: user.email } });
    } catch (err) {
      console.error("Register error:", err);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
        return;
      }

      const [user] = await db
        .select({ id: users.id, email: users.email, password: users.password })
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);
      if (!user) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
      }

      const token = signToken({ userId: user.id, email: user.email });
      res.json({ token, user: { id: user.id, email: user.email } });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req: Request, res: Response) => {
    const { userId } = req as AuthenticatedRequest;
    const [user] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json({ user });
  });

  // --- Profiles routes ---

  app.get("/api/profiles", requireAuth, async (req: Request, res: Response) => {
    const { userId } = req as AuthenticatedRequest;
    const rows = await db.select().from(profiles).where(eq(profiles.userId, userId));
    res.json(rows);
  });

  app.post("/api/profiles", requireAuth, async (req: Request, res: Response) => {
    const { userId } = req as AuthenticatedRequest;
    const { name, weight, weightVerifiedAt, avatarColor } = req.body;
    if (!name) {
      res.status(400).json({ message: "Name is required" });
      return;
    }
    const [profile] = await db.insert(profiles).values({
      userId,
      name,
      weight: weight ?? 0,
      weightVerifiedAt: weightVerifiedAt ?? null,
      avatarColor: avatarColor ?? "#2beeba",
    }).returning();
    res.status(201).json(profile);
  });

  app.put("/api/profiles/:id", requireAuth, async (req: Request, res: Response) => {
    const { userId } = req as AuthenticatedRequest;
    const { id } = req.params;
    const { name, weight, weightVerifiedAt, avatarColor } = req.body;
    const [updated] = await db
      .update(profiles)
      .set({ name, weight, weightVerifiedAt, avatarColor })
      .where(and(eq(profiles.id, id), eq(profiles.userId, userId)))
      .returning();
    if (!updated) {
      res.status(404).json({ message: "Profile not found" });
      return;
    }
    res.json(updated);
  });

  app.delete("/api/profiles/:id", requireAuth, async (req: Request, res: Response) => {
    const { userId } = req as AuthenticatedRequest;
    const { id } = req.params;
    await db.delete(profiles).where(and(eq(profiles.id, id), eq(profiles.userId, userId)));
    res.json({ ok: true });
  });

  // --- Medications routes ---

  app.get("/api/medications", requireAuth, async (req: Request, res: Response) => {
    const { userId } = req as AuthenticatedRequest;
    const rows = await db.select().from(medications).where(eq(medications.userId, userId));
    res.json(rows);
  });

  app.post("/api/medications", requireAuth, async (req: Request, res: Response) => {
    const { userId } = req as AuthenticatedRequest;
    const { profileId, name, type, strength, unit, notes, intervalHours, durationDays } = req.body;
    if (!profileId || !name) {
      res.status(400).json({ message: "profileId and name are required" });
      return;
    }
    const ownsProfile = await verifyProfileOwnership(profileId, userId);
    if (!ownsProfile) {
      res.status(403).json({ message: "Profile not found or access denied" });
      return;
    }
    const [med] = await db.insert(medications).values({
      userId,
      profileId,
      name,
      type: type ?? "other",
      strength: strength ?? 0,
      unit: unit ?? "mg",
      notes: notes ?? null,
      intervalHours: intervalHours ?? 8,
      durationDays: durationDays ?? 7,
    }).returning();
    res.status(201).json(med);
  });

  app.put("/api/medications/:id", requireAuth, async (req: Request, res: Response) => {
    const { userId } = req as AuthenticatedRequest;
    const { id } = req.params;
    const { name, type, strength, unit, notes, intervalHours, durationDays } = req.body;
    const [updated] = await db
      .update(medications)
      .set({ name, type, strength, unit, notes, intervalHours, durationDays })
      .where(and(eq(medications.id, id), eq(medications.userId, userId)))
      .returning();
    if (!updated) {
      res.status(404).json({ message: "Medication not found" });
      return;
    }
    res.json(updated);
  });

  app.delete("/api/medications/:id", requireAuth, async (req: Request, res: Response) => {
    const { userId } = req as AuthenticatedRequest;
    const { id } = req.params;
    await db.delete(medications).where(and(eq(medications.id, id), eq(medications.userId, userId)));
    res.json({ ok: true });
  });

  // --- Dose logs routes ---

  app.get("/api/logs", requireAuth, async (req: Request, res: Response) => {
    const { userId } = req as AuthenticatedRequest;
    const rows = await db.select().from(doseLogs).where(eq(doseLogs.userId, userId));
    res.json(rows);
  });

  app.post("/api/logs", requireAuth, async (req: Request, res: Response) => {
    const { userId } = req as AuthenticatedRequest;
    const { profileId, medicationId, medicationName, dose, unit, timestamp, type, value, note } = req.body;
    if (!profileId || !medicationName || !timestamp) {
      res.status(400).json({ message: "profileId, medicationName and timestamp are required" });
      return;
    }
    const ownsProfile = await verifyProfileOwnership(profileId, userId);
    if (!ownsProfile) {
      res.status(403).json({ message: "Profile not found or access denied" });
      return;
    }
    if (medicationId) {
      const ownsMed = await verifyMedicationOwnership(medicationId, userId);
      if (!ownsMed) {
        res.status(403).json({ message: "Medication not found or access denied" });
        return;
      }
    }
    const [log] = await db.insert(doseLogs).values({
      userId,
      profileId,
      medicationId: medicationId ?? null,
      medicationName,
      dose: dose ?? null,
      unit: unit ?? null,
      timestamp,
      type: type ?? "dose",
      value: value ?? null,
      note: note ?? null,
    }).returning();
    res.status(201).json(log);
  });

  app.put("/api/logs/:id", requireAuth, async (req: Request, res: Response) => {
    const { userId } = req as AuthenticatedRequest;
    const { id } = req.params;
    const { medicationName, dose, unit, timestamp, type, value, note } = req.body;
    const [updated] = await db
      .update(doseLogs)
      .set({ medicationName, dose, unit, timestamp, type, value, note })
      .where(and(eq(doseLogs.id, id), eq(doseLogs.userId, userId)))
      .returning();
    if (!updated) {
      res.status(404).json({ message: "Log not found" });
      return;
    }
    res.json(updated);
  });

  app.delete("/api/logs/:id", requireAuth, async (req: Request, res: Response) => {
    const { userId } = req as AuthenticatedRequest;
    const { id } = req.params;
    await db.delete(doseLogs).where(and(eq(doseLogs.id, id), eq(doseLogs.userId, userId)));
    res.json({ ok: true });
  });

  const httpServer = createServer(app);
  return httpServer;
}
