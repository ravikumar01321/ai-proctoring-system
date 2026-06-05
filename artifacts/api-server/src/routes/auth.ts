import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RegisterBody, LoginBody, GetMeResponse, LoginResponse } from "@workspace/api-zod";
import { hashPassword, comparePassword, signToken } from "../lib/auth";
import { requireAuth } from "../middlewares/requireAuth";

function parseUpdateMe(body: unknown): { name?: string; email?: string; currentPassword?: string; newPassword?: string } | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  const result: { name?: string; email?: string; currentPassword?: string; newPassword?: string } = {};
  if (b.name !== undefined) {
    if (typeof b.name !== "string" || b.name.length < 2) return null;
    result.name = b.name;
  }
  if (b.email !== undefined) {
    if (typeof b.email !== "string" || !b.email.includes("@")) return null;
    result.email = b.email;
  }
  if (b.currentPassword !== undefined) {
    if (typeof b.currentPassword !== "string") return null;
    result.currentPassword = b.currentPassword;
  }
  if (b.newPassword !== undefined) {
    if (typeof b.newPassword !== "string" || b.newPassword.length < 6) return null;
    result.newPassword = b.newPassword;
  }
  return result;
}

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, email, password, role } = parsed.data;
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }
  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(usersTable).values({ name, email, passwordHash, role }).returning();
  const token = signToken({ userId: user.id, role: user.role, email: user.email });
  const response = LoginResponse.parse({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl ?? null,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
    },
  });
  res.status(201).json(response);
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  if (!user.isActive) {
    res.status(401).json({ error: "Account is inactive" });
    return;
  }
  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const token = signToken({ userId: user.id, role: user.role, email: user.email });
  const response = LoginResponse.parse({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl ?? null,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
    },
  });
  res.json(response);
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(GetMeResponse.parse({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl ?? null,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  }));
});

router.patch("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const body = UpdateMeBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const [current] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!current) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (body.data.name) updates.name = body.data.name;
  if (body.data.email) {
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, body.data.email));
    if (existing && existing.id !== userId) {
      res.status(400).json({ error: "Email already in use" });
      return;
    }
    updates.email = body.data.email;
  }

  if (body.data.newPassword) {
    if (!body.data.currentPassword) {
      res.status(400).json({ error: "Current password required to change password" });
      return;
    }
    const valid = await comparePassword(body.data.currentPassword, current.passwordHash);
    if (!valid) {
      res.status(400).json({ error: "Current password is incorrect" });
      return;
    }
    updates.passwordHash = await hashPassword(body.data.newPassword);
  }

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning();
  res.json(GetMeResponse.parse({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    avatarUrl: updated.avatarUrl ?? null,
    isActive: updated.isActive,
    createdAt: updated.createdAt.toISOString(),
  }));
});

router.post("/auth/logout", (_req, res): void => {
  res.json({ message: "Logged out" });
});

export default router;
