import { Router, type IRouter } from "express";
import { db, enrollmentsTable, examsTable, usersTable, questionsTable, answersTable, violationsTable, resultsTable, activityTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import {
  EnrollInExamParams,
  ListExamEnrollmentsParams,
  GetEnrollmentParams,
  StartExamParams,
  SubmitExamParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

function enrollmentToJson(e: typeof enrollmentsTable.$inferSelect, exam?: typeof examsTable.$inferSelect, user?: typeof usersTable.$inferSelect) {
  return {
    id: e.id,
    examId: e.examId,
    userId: e.userId,
    status: e.status,
    startedAt: e.startedAt?.toISOString() ?? null,
    submittedAt: e.submittedAt?.toISOString() ?? null,
    violationCount: e.violationCount,
    createdAt: e.createdAt.toISOString(),
    exam: exam ? {
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
    } : undefined,
    user: user ? {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl ?? null,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
    } : undefined,
  };
}

router.post("/exams/:id/enroll", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = EnrollInExamParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid exam ID" });
    return;
  }
  const userId = req.user!.userId;
  const existing = await db.select().from(enrollmentsTable).where(
    and(eq(enrollmentsTable.examId, params.data.id), eq(enrollmentsTable.userId, userId))
  );
  if (existing.length > 0) {
    res.status(400).json({ error: "Already enrolled in this exam" });
    return;
  }
  const [enrollment] = await db.insert(enrollmentsTable).values({
    examId: params.data.id,
    userId,
    status: "enrolled",
  }).returning();
  res.status(201).json(enrollmentToJson(enrollment));
});

router.get("/exams/:id/enrollments", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ListExamEnrollmentsParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid exam ID" });
    return;
  }
  const rows = await db
    .select()
    .from(enrollmentsTable)
    .leftJoin(usersTable, eq(enrollmentsTable.userId, usersTable.id))
    .where(eq(enrollmentsTable.examId, params.data.id));
  const result = rows.map((r) => enrollmentToJson(r.enrollments, undefined, r.users ?? undefined));
  res.json(result);
});

router.get("/enrollments", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const rows = await db
    .select()
    .from(enrollmentsTable)
    .leftJoin(examsTable, eq(enrollmentsTable.examId, examsTable.id))
    .where(eq(enrollmentsTable.userId, userId));
  const result = rows.map((r) => enrollmentToJson(r.enrollments, r.exams ?? undefined));
  res.json(result);
});

router.get("/enrollments/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetEnrollmentParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid enrollment ID" });
    return;
  }
  const [row] = await db
    .select()
    .from(enrollmentsTable)
    .leftJoin(examsTable, eq(enrollmentsTable.examId, examsTable.id))
    .leftJoin(usersTable, eq(enrollmentsTable.userId, usersTable.id))
    .where(eq(enrollmentsTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Enrollment not found" });
    return;
  }
  res.json(enrollmentToJson(row.enrollments, row.exams ?? undefined, row.users ?? undefined));
});

router.post("/enrollments/:id/start", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = StartExamParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid enrollment ID" });
    return;
  }
  const [enrollment] = await db
    .update(enrollmentsTable)
    .set({ status: "active", startedAt: new Date() })
    .where(eq(enrollmentsTable.id, params.data.id))
    .returning();
  if (!enrollment) {
    res.status(404).json({ error: "Enrollment not found" });
    return;
  }
  const [exam] = await db.select().from(examsTable).where(eq(examsTable.id, enrollment.examId));
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, enrollment.userId));
  await db.insert(activityTable).values({
    type: "exam_started",
    message: `${user?.name ?? "Student"} started "${exam?.title ?? "exam"}"`,
    studentName: user?.name ?? null,
    examTitle: exam?.title ?? null,
    examId: exam?.id ?? null,
    enrollmentId: enrollment.id,
  });
  res.json(enrollmentToJson(enrollment, exam ?? undefined, user ?? undefined));
});

router.post("/enrollments/:id/submit", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = SubmitExamParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid enrollment ID" });
    return;
  }
  const enrollmentId = params.data.id;
  const [enrollment] = await db.select().from(enrollmentsTable).where(eq(enrollmentsTable.id, enrollmentId));
  if (!enrollment) {
    res.status(404).json({ error: "Enrollment not found" });
    return;
  }
  const [exam] = await db.select().from(examsTable).where(eq(examsTable.id, enrollment.examId));
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, enrollment.userId));
  const questions = await db.select().from(questionsTable).where(eq(questionsTable.examId, enrollment.examId));
  const answers = await db.select().from(answersTable).where(eq(answersTable.enrollmentId, enrollmentId));
  const violations = await db.select().from(violationsTable).where(eq(violationsTable.enrollmentId, enrollmentId));
  let totalScore = 0;
  const maxScore = questions.reduce((sum, q) => sum + q.points, 0);
  for (const answer of answers) {
    const question = questions.find((q) => q.id === answer.questionId);
    if (question && question.correctAnswer && answer.answer) {
      const correct = answer.answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
      if (correct) {
        totalScore += question.points;
        await db.update(answersTable).set({ isCorrect: true, score: question.points }).where(eq(answersTable.id, answer.id));
      } else {
        await db.update(answersTable).set({ isCorrect: false, score: 0 }).where(eq(answersTable.id, answer.id));
      }
    }
  }
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  const passed = exam ? percentage >= exam.passingScore : false;
  const grade = percentage >= 90 ? "A" : percentage >= 80 ? "B" : percentage >= 70 ? "C" : percentage >= 60 ? "D" : "F";
  const [result] = await db.insert(resultsTable).values({
    enrollmentId,
    totalScore,
    maxScore,
    percentage,
    grade,
    passed,
    violationCount: violations.length,
  }).returning();
  await db.update(enrollmentsTable).set({ status: "submitted", submittedAt: new Date() }).where(eq(enrollmentsTable.id, enrollmentId));
  await db.insert(activityTable).values({
    type: "exam_submitted",
    message: `${user?.name ?? "Student"} submitted "${exam?.title ?? "exam"}" — Score: ${Math.round(percentage)}%`,
    studentName: user?.name ?? null,
    examTitle: exam?.title ?? null,
    examId: exam?.id ?? null,
    enrollmentId,
  });
  res.json({
    id: result.id,
    enrollmentId: result.enrollmentId,
    totalScore: result.totalScore,
    maxScore: result.maxScore,
    percentage: result.percentage,
    grade: result.grade ?? null,
    passed: result.passed,
    violationCount: result.violationCount,
    createdAt: result.createdAt.toISOString(),
  });
});

export default router;
