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

// Esquemas de aprobación
export const approvalSchemas = pgTable("approval_schemas", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  tipoSolicitud: varchar("tipo_solicitud", { length: 50 }).notNull(),
  visibilityPermissions: text("visibility_permissions").array(),
  approvalPermissions: text("approval_permissions").array(),
  fechaCreacion: timestamp("fecha_creacion").defaultNow().notNull(),
  fechaActualizacion: timestamp("fecha_actualizacion").defaultNow().notNull(),
});

// Pasos de aprobación
export const approvalSteps = pgTable("approval_steps", {
  id: serial("id").primaryKey(),
  schemaId: integer("schema_id").references(() => approvalSchemas.id).notNull(),
  orden: integer("orden").notNull(),
  descripcion: varchar("descripcion", { length: 255 }).notNull(),
  perfil: varchar("perfil", { length: 100 }).notNull(),
  obligatorio: varchar("obligatorio", { length: 2 }).notNull().default("Si"),
  fechaCreacion: timestamp("fecha_creacion").defaultNow().notNull(),
});

export const insertRequestSchema = createInsertSchema(requests).omit({
  id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
});

export const insertApprovalSchemaSchema = createInsertSchema(approvalSchemas).omit({
  id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
});

export const insertApprovalStepSchema = createInsertSchema(approvalSteps).omit({
  id: true,
  fechaCreacion: true,
});

export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type Request = typeof requests.$inferSelect;
export type ApprovalSchema = typeof approvalSchemas.$inferSelect;
export type InsertApprovalSchema = z.infer<typeof insertApprovalSchemaSchema>;
export type ApprovalStep = typeof approvalSteps.$inferSelect;
export type InsertApprovalStep = z.infer<typeof insertApprovalStepSchema>;
