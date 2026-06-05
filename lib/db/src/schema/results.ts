import { pgTable, serial, timestamp, integer, text, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const resultsTable = pgTable("results", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").notNull().unique(),
  totalScore: integer("total_score").notNull().default(0),
  maxScore: integer("max_score").notNull().default(0),
  percentage: real("percentage").notNull().default(0),
  grade: text("grade"),
  passed: boolean("passed").notNull().default(false),
  violationCount: integer("violation_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertResultSchema = createInsertSchema(resultsTable).omit({ id: true, createdAt: true });
export type InsertResult = z.infer<typeof insertResultSchema>;
export type Result = typeof resultsTable.$inferSelect;
