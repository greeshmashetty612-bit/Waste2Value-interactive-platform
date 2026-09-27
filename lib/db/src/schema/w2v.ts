import { jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const w2vRecordsTable = pgTable("w2v_records", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  status: text("status").notNull().default("active"),
  organizationName: text("organization_name"),
  authorityType: text("authority_type"),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertW2vRecordSchema = createInsertSchema(w2vRecordsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertW2vRecord = z.infer<typeof insertW2vRecordSchema>;
export type W2vRecord = typeof w2vRecordsTable.$inferSelect;