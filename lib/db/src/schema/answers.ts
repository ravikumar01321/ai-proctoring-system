import { pgTable, serial, timestamp, integer, text, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const answersTable = pgTable("answers", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").notNull(),
  questionId: integer("question_id").notNull(),
  answer: text("answer"),
  isCorrect: boolean("is_correct"),
  score: integer("score").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAnswerSchema = createInsertSchema(answersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
export type Answer = typeof answersTable.$inferSelect;
