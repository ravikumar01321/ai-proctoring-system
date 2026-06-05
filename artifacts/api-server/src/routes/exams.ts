import { Router, type IRouter } from "express";
import { db, examsTable, enrollmentsTable, violationsTable, resultsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import {
  CreateExamBody,
  GetExamParams,
  UpdateExamParams,
  UpdateExamBody,
  DeleteExamParams,
  GetExamStatsParams,
} from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/requireAuth";
import { activityTable } from "@workspace/db";

const router: IRouter = Router();

function examToJson(exam: typeof examsTable.$inferSelect) {
  return {
    id: exam.id,
    title: exam.title,
    description: exam.description ?? null,
    duration: exam.duration,
    startTime: exam.startTime?.toISOString() ?? null,
    endTime: exam.endTime?.toISOString() ?? null,
    status: exam.status,
    maxViolations: exam.maxViolations,
    proctorId: exam.proctorId ?? null,
    totalQuestions: 0,
    totalPoints: 0,
    passingScore: exam.passingScore,
    createdAt: exam.createdAt.toISOString(),
  };
}

router.get("/exams", requireAuth, async (req, res): Promise<void> => {
  const exams = await db.select().from(examsTable).orderBy(examsTable.createdAt);
  res.json(exams.map(examToJson));
});

router.post("/exams", requireAuth, requireRole("admin", "proctor"), async (req, res): Promise<void> => {
  const body = CreateExamBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const userId = req.user!.userId;
  const [exam] = await db.insert(examsTable).values({
    title: body.data.title,
    description: body.data.description ?? null,
    duration: body.data.duration,
    maxViolations: body.data.maxViolations ?? 3,
    passingScore: body.data.passingScore ?? 60,
    createdBy: userId,
    proctorId: body.data.proctorId ?? null,
    ...(body.data.startTime ? { startTime: new Date(body.data.startTime) } : {}),
    ...(body.data.endTime ? { endTime: new Date(body.data.endTime) } : {}),
  }).returning();
  await db.insert(activityTable).values({
    type: "exam_created",
    message: `Exam "${exam.title}" was created`,
    examTitle: exam.title,
    examId: exam.id,
  });
  res.status(201).json(examToJson(exam));
});

router.get("/exams/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetExamParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid exam ID" });
    return;
  }
  const [exam] = await db.select().from(examsTable).where(eq(examsTable.id, params.data.id));
  if (!exam) {
    res.status(404).json({ error: "Exam not found" });
    return;
  }
  res.json(examToJson(exam));
});

router.patch("/exams/:id", requireAuth, requireRole("admin", "proctor"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateExamParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid exam ID" });
    return;
  }
  const body = UpdateExamBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  if (body.data.title !== undefined) updateData.title = body.data.title;
  if (body.data.description !== undefined) updateData.description = body.data.description;
  if (body.data.duration !== undefined) updateData.duration = body.data.duration;
  if (body.data.status !== undefined) updateData.status = body.data.status;
  if (body.data.maxViolations !== undefined) updateData.maxViolations = body.data.maxViolations;
  if (body.data.passingScore !== undefined) updateData.passingScore = body.data.passingScore;
  if (body.data.proctorId !== undefined) updateData.proctorId = body.data.proctorId;
  if (body.data.startTime !== undefined) updateData.startTime = new Date(body.data.startTime);
  if (body.data.endTime !== undefined) updateData.endTime = new Date(body.data.endTime);
  const [exam] = await db.update(examsTable).set(updateData).where(eq(examsTable.id, params.data.id)).returning();
  if (!exam) {
    res.status(404).json({ error: "Exam not found" });
    return;
  }
  res.json(examToJson(exam));
});

router.delete("/exams/:id", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteExamParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid exam ID" });
    return;
  }
  const [exam] = await db.delete(examsTable).where(eq(examsTable.id, params.data.id)).returning();
  if (!exam) {
    res.status(404).json({ error: "Exam not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/exams/:id/stats", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetExamStatsParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid exam ID" });
    return;
  }
  const examId = params.data.id;
  const enrollments = await db.select().from(enrollmentsTable).where(eq(enrollmentsTable.examId, examId));
  const completed = enrollments.filter((e) => e.status === "submitted");
  const flagged = enrollments.filter((e) => e.status === "flagged" || e.status === "disqualified");
  const allResults = await db.select().from(resultsTable).where(
    enrollments.length > 0
      ? sql`${resultsTable.enrollmentId} IN (${sql.join(enrollments.map((e) => sql`${e.id}`), sql`, `)})`
      : sql`1 = 0`
  );
  const avgScore = allResults.length > 0
    ? allResults.reduce((sum, r) => sum + r.percentage, 0) / allResults.length
    : 0;
  const passRate = allResults.length > 0
    ? (allResults.filter((r) => r.passed).length / allResults.length) * 100
    : 0;
  const allViolations = await db.select().from(violationsTable).where(
    enrollments.length > 0
      ? sql`${violationsTable.enrollmentId} IN (${sql.join(enrollments.map((e) => sql`${e.id}`), sql`, `)})`
      : sql`1 = 0`
  );
  res.json({
    examId,
    totalEnrolled: enrollments.length,
    totalCompleted: completed.length,
    totalFlagged: flagged.length,
    averageScore: Math.round(avgScore * 100) / 100,
    passRate: Math.round(passRate * 100) / 100,
    violationCount: allViolations.length,
  });
});

export default router;
