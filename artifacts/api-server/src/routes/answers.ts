import { Router, type IRouter } from "express";
import { db, answersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { ListAnswersParams, SubmitAnswerParams, SubmitAnswerBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

function answerToJson(a: typeof answersTable.$inferSelect) {
  return {
    id: a.id,
    enrollmentId: a.enrollmentId,
    questionId: a.questionId,
    answer: a.answer ?? null,
    isCorrect: a.isCorrect ?? null,
    score: a.score,
    createdAt: a.createdAt.toISOString(),
  };
}

router.get("/enrollments/:id/answers", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ListAnswersParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid enrollment ID" });
    return;
  }
  const answers = await db.select().from(answersTable).where(eq(answersTable.enrollmentId, params.data.id));
  res.json(answers.map(answerToJson));
});

router.post("/enrollments/:id/answers", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = SubmitAnswerParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid enrollment ID" });
    return;
  }
  const body = SubmitAnswerBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const existing = await db.select().from(answersTable).where(
    and(eq(answersTable.enrollmentId, params.data.id), eq(answersTable.questionId, body.data.questionId))
  );
  let answer;
  if (existing.length > 0) {
    [answer] = await db.update(answersTable).set({ answer: body.data.answer }).where(eq(answersTable.id, existing[0].id)).returning();
  } else {
    [answer] = await db.insert(answersTable).values({
      enrollmentId: params.data.id,
      questionId: body.data.questionId,
      answer: body.data.answer,
    }).returning();
  }
  res.json(answerToJson(answer));
});

export default router;
