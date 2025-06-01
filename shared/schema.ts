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
  identificador: varchar("identificador", { length: 20 }),
  motivo: varchar("motivo", { length: 100 }),
  archivosAdjuntos: text("archivos_adjuntos").array(),
  diasSolicitados: integer("dias_solicitados"),
  diasEfectivos: integer("dias_efectivos"),
  fechaCreacion: timestamp("fecha_creacion").defaultNow().notNull(),
  fechaActualizacion: timestamp("fecha_actualizacion").defaultNow().notNull(),
});

// Tabla para manejar saldos de vacaciones de usuarios
export const userVacationBalance = pgTable("user_vacation_balance", {
  id: serial("id").primaryKey(),
  identificador: varchar("identificador", { length: 20 }).notNull().unique(),
  nombreUsuario: varchar("nombre_usuario", { length: 100 }).notNull(),
  diasDisponibles: integer("dias_disponibles").notNull().default(15),
  fechaActualizacion: timestamp("fecha_actualizacion").defaultNow().notNull(),
});

// Esquemas de aprobación
export const approvalSchemas = pgTable("approval_schemas", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  tipoSolicitud: varchar("tipo_solicitud", { length: 50 }).notNull(),
  motivo: varchar("motivo", { length: 255 }), // Específico para permisos: "Licencia Médica", "Capacitación", etc.
  visibilityPermissions: text("visibility_permissions").array(),
  approvalPermissions: text("approval_permissions").array(),
  // Configuración de tipos de permiso
  tiposPermiso: text("tipos_permiso").array().default(["Comunes", "Turno completo", "Parciales"]),
  // Configuración de características
  adjuntarDocumentos: varchar("adjuntar_documentos", { length: 5 }).default("false"),
  adjuntarDocumentosObligatorio: varchar("adjuntar_documentos_obligatorio", { length: 5 }).default("false"),
  permitirModificarDocumentos: varchar("permitir_modificar_documentos", { length: 5 }).default("false"),
  comentarioRequerido: varchar("comentario_requerido", { length: 5 }).default("false"),
  comentarioObligatorio: varchar("comentario_obligatorio", { length: 5 }).default("false"),
  comentarioOpcional: varchar("comentario_opcional", { length: 5 }).default("true"),
  enviarCorreoNotificacion: varchar("enviar_correo_notificacion", { length: 5 }).default("false"),
  solicitudCreada: varchar("solicitud_creada", { length: 5 }).default("false"),
  solicitudAprobadaRechazada: varchar("solicitud_aprobada_rechazada", { length: 5 }).default("false"),
  permitirSolicitudTerceros: varchar("permitir_solicitud_terceros", { length: 5 }).default("false"),
  // Configuración de días
  diasMinimo: integer("dias_minimo"),
  diasMaximo: integer("dias_maximo"),
  diasMultiplo: integer("dias_multiplo"),
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

export const requestHistory = pgTable("request_history", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").references(() => requests.id, { onDelete: 'cascade' }).notNull(),
  previousState: varchar("previous_state", { length: 20 }),
  newState: varchar("new_state", { length: 20 }).notNull(),
  changedBy: varchar("changed_by", { length: 100 }).notNull(),
  changeReason: text("change_reason"),
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

export const insertRequestHistorySchema = createInsertSchema(requestHistory).omit({
  id: true,
  fechaCreacion: true,
});

export const insertUserVacationBalanceSchema = createInsertSchema(userVacationBalance).omit({
  id: true,
  fechaActualizacion: true,
});

export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type Request = typeof requests.$inferSelect;
export type ApprovalSchema = typeof approvalSchemas.$inferSelect;
export type InsertApprovalSchema = z.infer<typeof insertApprovalSchemaSchema>;
export type ApprovalStep = typeof approvalSteps.$inferSelect;
export type InsertApprovalStep = z.infer<typeof insertApprovalStepSchema>;
export type RequestHistory = typeof requestHistory.$inferSelect;
export type InsertRequestHistory = z.infer<typeof insertRequestHistorySchema>;
export type UserVacationBalance = typeof userVacationBalance.$inferSelect;
export type InsertUserVacationBalance = z.infer<typeof insertUserVacationBalanceSchema>;
