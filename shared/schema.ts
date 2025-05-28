import { pgTable, text, serial, integer, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  tipo: varchar("tipo", { length: 50 }).notNull(),
  fechaSolicitada: varchar("fecha_solicitada", { length: 100 }).notNull(),
  fechaFin: varchar("fecha_fin", { length: 100 }),
  asunto: text("asunto").notNull(),
  descripcion: text("descripcion"),
  estado: varchar("estado", { length: 20 }).notNull().default("Pendiente"),
  solicitadoPor: varchar("solicitado_por", { length: 100 }).notNull(),
  prioridad: varchar("prioridad", { length: 20 }).default("normal"),
  archivosAdjuntos: text("archivos_adjuntos").array(),
  fechaCreacion: timestamp("fecha_creacion").defaultNow().notNull(),
  fechaActualizacion: timestamp("fecha_actualizacion").defaultNow().notNull(),
});

export const insertRequestSchema = createInsertSchema(requests).omit({
  id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
});

export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type Request = typeof requests.$inferSelect;
