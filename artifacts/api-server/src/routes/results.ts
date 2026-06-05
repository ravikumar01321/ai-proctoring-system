import { Router, type IRouter } from "express";
import { db, resultsTable, enrollmentsTable, examsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetResultParams, ListExamResultsParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

function resultToJson(r: typeof resultsTable.$inferSelect, enrollment?: typeof enrollmentsTable.$inferSelect) {
  return {
    id: r.id,
    enrollmentId: r.enrollmentId,
    totalScore: r.totalScore,
    maxScore: r.maxScore,
    percentage: r.percentage,
    grade: r.grade ?? null,
    passed: r.passed,
    violationCount: r.violationCount,
    createdAt: r.createdAt.toISOString(),
    enrollment: enrollment ? {
      id: enrollment.id,
      examId: enrollment.examId,
      userId: enrollment.userId,
      status: enrollment.status,
      startedAt: enrollment.startedAt?.toISOString() ?? null,
      submittedAt: enrollment.submittedAt?.toISOString() ?? null,
      violationCount: enrollment.violationCount,
      createdAt: enrollment.createdAt.toISOString(),
    } : undefined,
  };
}

router.get("/enrollments/:id/result", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetResultParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid enrollment ID" });
    return;
  }
  const [result] = await db.select().from(resultsTable).where(eq(resultsTable.enrollmentId, params.data.id));
  if (!result) {
    res.status(404).json({ error: "Result not found" });
    return;
  }
  const [enrollment] = await db.select().from(enrollmentsTable).where(eq(enrollmentsTable.id, result.enrollmentId));
  res.json(resultToJson(result, enrollment));
});

router.get("/exams/:id/results", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ListExamResultsParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid exam ID" });
    return;
  }
  const enrollments = await db.select().from(enrollmentsTable).where(eq(enrollmentsTable.examId, params.data.id));
  if (enrollments.length === 0) {
    res.json([]);
    return;
  }
  const enrollmentIds = enrollments.map((e) => e.id);
  const allResults = await db.select().from(resultsTable);
  const filtered = allResults.filter((r) => enrollmentIds.includes(r.enrollmentId));
  const enriched = filtered.map((r) => {
    const enrollment = enrollments.find((e) => e.id === r.enrollmentId);
    return resultToJson(r, enrollment);
  });
  res.json(enriched);
});

export default router;
