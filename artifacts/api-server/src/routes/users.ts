import { Router, type IRouter } from "express";
import { db, usersTable, enrollmentsTable, resultsTable, violationsTable } from "@workspace/db";
import { eq, ilike, or, and } from "drizzle-orm";
import {
  ListUsersQueryParams,
  GetUserParams,
  UpdateUserParams,
  UpdateUserBody,
  DeleteUserParams,
} from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/requireAuth";

const router: IRouter = Router();

function userToJson(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl ?? null,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  };
}

router.get("/users", requireAuth, requireRole("admin", "proctor"), async (req, res): Promise<void> => {
  const params = ListUsersQueryParams.safeParse(req.query);
  let query = db.select().from(usersTable);
  const conditions = [];
  if (params.success && params.data.role) {
    conditions.push(eq(usersTable.role, params.data.role as "student" | "proctor" | "admin"));
  }
  if (params.success && params.data.search) {
    const s = `%${params.data.search}%`;
    conditions.push(or(ilike(usersTable.name, s), ilike(usersTable.email, s))!);
  }
  const users = conditions.length > 0
    ? await db.select().from(usersTable).where(conditions.length === 1 ? conditions[0] : conditions[0])
    : await query;
  res.json(users.map(userToJson));
});

router.get("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetUserParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(userToJson(user));
});

router.patch("/users/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateUserParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }
  const body = UpdateUserBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [user] = await db.update(usersTable).set(body.data).where(eq(usersTable.id, params.data.id)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(userToJson(user));
});

router.get("/users/:id/stats", requireAuth, requireRole("admin", "proctor"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const userId = parseInt(rawId, 10);
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid user ID" }); return; }

  const enrollments = await db.select().from(enrollmentsTable).where(eq(enrollmentsTable.userId, userId));
  const enrollmentIds = enrollments.map(e => e.id);

  let allResults: (typeof resultsTable.$inferSelect)[] = [];
  let totalViolations = 0;

  if (enrollmentIds.length > 0) {
    const { inArray } = await import("drizzle-orm");
    allResults = await db.select().from(resultsTable).where(inArray(resultsTable.enrollmentId, enrollmentIds));
    const vRows = await db.select().from(violationsTable).where(inArray(violationsTable.enrollmentId, enrollmentIds));
    totalViolations = vRows.length;
  }

  const completedExams = allResults.length;
  const averageScore = completedExams > 0 ? allResults.reduce((s, r) => s + r.percentage, 0) / completedExams : 0;
  const passed = allResults.filter(r => r.passed).length;
  const passRate = completedExams > 0 ? (passed / completedExams) * 100 : 0;

  const recentScores = allResults.slice(-10).map(r => {
    const enrollment = enrollments.find(e => e.id === r.enrollmentId);
    return {
      examTitle: `Exam #${enrollment?.examId ?? r.enrollmentId}`,
      score: r.percentage,
      passed: r.passed,
      date: r.createdAt.toISOString(),
    };
  });

  res.json({ totalExams: enrollments.length, completedExams, averageScore, totalViolations, passRate, recentScores });
});

router.delete("/users/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteUserParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }
  const [user] = await db.delete(usersTable).where(eq(usersTable.id, params.data.id)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
