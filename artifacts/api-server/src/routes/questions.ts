import { Router, type IRouter } from "express";
import { db, questionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListQuestionsParams,
  CreateQuestionParams,
  CreateQuestionBody,
  UpdateQuestionParams,
  UpdateQuestionBody,
  DeleteQuestionParams,
} from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/requireAuth";

const router: IRouter = Router();

function questionToJson(q: typeof questionsTable.$inferSelect) {
  return {
    id: q.id,
    examId: q.examId,
    type: q.type,
    content: q.content,
    options: q.options ?? null,
    correctAnswer: q.correctAnswer ?? null,
    points: q.points,
    order: q.order,
  };
}

router.get("/exams/:id/questions", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ListQuestionsParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid exam ID" });
    return;
  }
  const questions = await db
    .select()
    .from(questionsTable)
    .where(eq(questionsTable.examId, params.data.id))
    .orderBy(questionsTable.order);
  res.json(questions.map(questionToJson));
});

router.post("/exams/:id/questions", requireAuth, requireRole("admin", "proctor"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = CreateQuestionParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid exam ID" });
    return;
  }
  const body = CreateQuestionBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const count = await db.select().from(questionsTable).where(eq(questionsTable.examId, params.data.id));
  const [question] = await db.insert(questionsTable).values({
    examId: params.data.id,
    type: body.data.type,
    content: body.data.content,
    options: body.data.options ?? null,
    correctAnswer: body.data.correctAnswer ?? null,
    points: body.data.points,
    order: body.data.order ?? count.length,
  }).returning();
  res.status(201).json(questionToJson(question));
});

router.patch("/questions/:id", requireAuth, requireRole("admin", "proctor"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateQuestionParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid question ID" });
    return;
  }
  const body = UpdateQuestionBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [question] = await db.update(questionsTable).set(body.data).where(eq(questionsTable.id, params.data.id)).returning();
  if (!question) {
    res.status(404).json({ error: "Question not found" });
    return;
  }
  res.json(questionToJson(question));
});

router.delete("/questions/:id", requireAuth, requireRole("admin", "proctor"), async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteQuestionParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid question ID" });
    return;
  }
  const [question] = await db.delete(questionsTable).where(eq(questionsTable.id, params.data.id)).returning();
  if (!question) {
    res.status(404).json({ error: "Question not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
