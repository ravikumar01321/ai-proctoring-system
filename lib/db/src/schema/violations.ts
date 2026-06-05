import { pgTable, serial, timestamp, integer, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const violationsTable = pgTable("violations", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").notNull(),
  type: text("type", { enum: ["face_missing", "multiple_faces", "eye_deviation", "audio_detected", "tab_switch", "fullscreen_exit", "copy_paste", "phone_detected"] }).notNull(),
  severity: text("severity", { enum: ["low", "medium", "high", "critical"] }).notNull().default("low"),
  details: text("details"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

export const insertViolationSchema = createInsertSchema(violationsTable).omit({ id: true, timestamp: true });
export type InsertViolation = z.infer<typeof insertViolationSchema>;
export type Violation = typeof violationsTable.$inferSelect;
