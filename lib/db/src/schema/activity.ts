import { pgTable, serial, timestamp, integer, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const activityTable = pgTable("activity", {
  id: serial("id").primaryKey(),
  type: text("type", { enum: ["exam_started", "exam_submitted", "violation_detected", "student_flagged", "exam_created"] }).notNull(),
  message: text("message").notNull(),
  studentName: text("student_name"),
  examTitle: text("exam_title"),
  examId: integer("exam_id"),
  enrollmentId: integer("enrollment_id"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activityTable).omit({ id: true, timestamp: true });
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activityTable.$inferSelect;
