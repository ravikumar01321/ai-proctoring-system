import { Router, type IRouter } from "express";
import { db, examsTable, enrollmentsTable, usersTable, violationsTable, resultsTable, activityTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/dashboard/stats", requireAuth, requireRole("admin", "proctor"), async (_req, res): Promise<void> => {
  const [examsResult] = await db.select({ count: sql<number>`count(*)::int` }).from(examsTable);
  const [activeExamsResult] = await db.select({ count: sql<number>`count(*)::int` }).from(examsTable).where(eq(examsTable.status, "active"));
  const [studentsResult] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(eq(usersTable.role, "student"));
  const [proctorsResult] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(eq(usersTable.role, "proctor"));
  const [ongoingResult] = await db.select({ count: sql<number>`count(*)::int` }).from(enrollmentsTable).where(eq(enrollmentsTable.status, "active"));
  const [flaggedResult] = await db.select({ count: sql<number>`count(*)::int` }).from(enrollmentsTable).where(eq(enrollmentsTable.status, "flagged"));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [completedTodayResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(enrollmentsTable)
    .where(sql`${enrollmentsTable.submittedAt} >= ${today.toISOString()}`);
  const allResults = await db.select().from(resultsTable);
  const avgPassRate = allResults.length > 0
    ? (allResults.filter((r) => r.passed).length / allResults.length) * 100
    : 0;
  res.json({
    totalExams: examsResult.count,
    activeExams: activeExamsResult.count,
    totalStudents: studentsResult.count,
    totalProctors: proctorsResult.count,
    ongoingSessions: ongoingResult.count,
    flaggedSessions: flaggedResult.count,
    completedToday: completedTodayResult.count,
    averagePassRate: Math.round(avgPassRate * 100) / 100,
  });
});

router.get("/dashboard/recent-activity", requireAuth, requireRole("admin", "proctor"), async (_req, res): Promise<void> => {
  const activities = await db
    .select()
    .from(activityTable)
    .orderBy(sql`${activityTable.timestamp} DESC`)
    .limit(20);
  res.json(activities.map((a) => ({
    id: a.id,
    type: a.type,
    message: a.message,
    studentName: a.studentName ?? null,
    examTitle: a.examTitle ?? null,
    timestamp: a.timestamp.toISOString(),
  })));
});

router.get("/dashboard/violation-summary", requireAuth, requireRole("admin", "proctor"), async (_req, res): Promise<void> => {
  const violations = await db.select().from(violationsTable);
  const total = violations.length;
  const grouped: Record<string, number> = {};
  for (const v of violations) {
    grouped[v.type] = (grouped[v.type] ?? 0) + 1;
  }
  const summary = Object.entries(grouped).map(([type, count]) => ({
    type,
    count,
    percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
  }));
  res.json(summary);
});

export default router;
