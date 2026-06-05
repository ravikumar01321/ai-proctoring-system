import { Router, type IRouter } from "express";
import { db, violationsTable, enrollmentsTable, examsTable, usersTable, activityTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { ListViolationsParams, ReportViolationParams, ReportViolationBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

function violationToJson(v: typeof violationsTable.$inferSelect) {
  return {
    id: v.id,
    enrollmentId: v.enrollmentId,
    type: v.type,
    severity: v.severity,
    details: v.details ?? null,
    timestamp: v.timestamp.toISOString(),
  };
}

router.get("/enrollments/:id/violations", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ListViolationsParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid enrollment ID" });
    return;
  }
  const violations = await db.select().from(violationsTable).where(eq(violationsTable.enrollmentId, params.data.id));
  res.json(violations.map(violationToJson));
});

router.post("/enrollments/:id/violations", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ReportViolationParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid enrollment ID" });
    return;
  }
  const body = ReportViolationBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const enrollmentId = params.data.id;
  const [violation] = await db.insert(violationsTable).values({
    enrollmentId,
    type: body.data.type,
    severity: body.data.severity,
    details: body.data.details ?? null,
  }).returning();
  const [enrollment] = await db.select().from(enrollmentsTable).where(eq(enrollmentsTable.id, enrollmentId));
  if (enrollment) {
    const newCount = enrollment.violationCount + 1;
    const [exam] = await db.select().from(examsTable).where(eq(examsTable.id, enrollment.examId));
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, enrollment.userId));
    const newStatus = exam && newCount >= exam.maxViolations ? "flagged" : enrollment.status;
    await db.update(enrollmentsTable).set({ violationCount: newCount, status: newStatus }).where(eq(enrollmentsTable.id, enrollmentId));
    if (newStatus === "flagged" && enrollment.status !== "flagged") {
      await db.insert(activityTable).values({
        type: "student_flagged",
        message: `${user?.name ?? "Student"} was flagged for excessive violations in "${exam?.title ?? "exam"}"`,
        studentName: user?.name ?? null,
        examTitle: exam?.title ?? null,
        examId: exam?.id ?? null,
        enrollmentId,
      });
    } else {
      await db.insert(activityTable).values({
        type: "violation_detected",
        message: `${body.data.type.replace(/_/g, " ")} detected for ${user?.name ?? "student"} in "${exam?.title ?? "exam"}"`,
        studentName: user?.name ?? null,
        examTitle: exam?.title ?? null,
        examId: exam?.id ?? null,
        enrollmentId,
      });
    }
  }
  res.status(201).json(violationToJson(violation));
});

export default router;
