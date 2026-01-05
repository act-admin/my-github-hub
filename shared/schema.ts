import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const queries = pgTable("queries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  intent: text("intent"),
  status: text("status").notNull().default("pending"),
  results: jsonb("results"),
  createdAt: timestamp("created_at").defaultNow(),
  processingTime: integer("processing_time"),
});

export const agents = pgTable("agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull().default("idle"),
  lastActivity: timestamp("last_activity").defaultNow(),
  config: jsonb("config"),
});

export const financialAccounts = pgTable("financial_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountNumber: text("account_number").notNull().unique(),
  accountName: text("account_name").notNull(),
  accountType: text("account_type").notNull(), // checking, savings, credit, investment
  balance: integer("balance").notNull().default(0), // in cents
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull().default("active"), // active, inactive, closed
  description: text("description"),
});

export const systemLogs = pgTable("system_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  level: text("level").notNull(),
  message: text("message").notNull(),
  source: text("source").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: jsonb("metadata"),
});

export const apiConnections = pgTable("api_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  status: text("status").notNull().default("online"),
  lastCheck: timestamp("last_check").defaultNow(),
  responseTime: integer("response_time"),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull(),
  amount: integer("amount").notNull(), // in cents, positive for credit, negative for debit
  description: text("description").notNull(),
  category: text("category").notNull(), // income, expense, transfer, investment
  subcategory: text("subcategory"), // groceries, utilities, salary, etc.
  transactionDate: timestamp("transaction_date").notNull(),
  status: text("status").notNull().default("completed"), // pending, completed, failed
  referenceNumber: text("reference_number"),
  tags: jsonb("tags").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const budgets = pgTable("budgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(), // expense, income, savings
  budgetAmount: integer("budget_amount").notNull(), // in cents
  actualAmount: integer("actual_amount").default(0), // in cents
  period: text("period").notNull().default("monthly"), // weekly, monthly, quarterly, yearly
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").notNull().default("active"), // active, inactive, completed
  createdAt: timestamp("created_at").defaultNow(),
});

export const financialReports = pgTable("financial_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  reportType: text("report_type").notNull(), // income_statement, balance_sheet, cash_flow, budget_analysis
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  data: jsonb("data"), // report calculation results
  status: text("status").notNull().default("generated"), // generating, generated, error
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertQuerySchema = createInsertSchema(queries).pick({
  content: true,
  intent: true,
});

export const insertAgentSchema = createInsertSchema(agents).pick({
  name: true,
  type: true,
  config: true,
});

export const insertFinancialAccountSchema = createInsertSchema(financialAccounts).pick({
  accountNumber: true,
  accountName: true,
  accountType: true,
  balance: true,
  currency: true,
  status: true,
  description: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  accountId: true,
  amount: true,
  description: true,
  category: true,
  subcategory: true,
  transactionDate: true,
  status: true,
  referenceNumber: true,
  tags: true,
});

export const insertBudgetSchema = createInsertSchema(budgets).pick({
  name: true,
  category: true,
  budgetAmount: true,
  actualAmount: true,
  period: true,
  startDate: true,
  endDate: true,
  status: true,
});

export const insertFinancialReportSchema = createInsertSchema(financialReports).pick({
  name: true,
  reportType: true,
  periodStart: true,
  periodEnd: true,
  data: true,
  status: true,
});

export const insertSystemLogSchema = createInsertSchema(systemLogs).pick({
  level: true,
  message: true,
  source: true,
  metadata: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertQuery = z.infer<typeof insertQuerySchema>;
export type Query = typeof queries.$inferSelect;

export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agents.$inferSelect;

export type InsertFinancialAccount = z.infer<typeof insertFinancialAccountSchema>;
export type FinancialAccount = typeof financialAccounts.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgets.$inferSelect;

export type InsertFinancialReport = z.infer<typeof insertFinancialReportSchema>;
export type FinancialReport = typeof financialReports.$inferSelect;

export type InsertSystemLog = z.infer<typeof insertSystemLogSchema>;
export type SystemLog = typeof systemLogs.$inferSelect;

export type ApiConnection = typeof apiConnections.$inferSelect;

// WebSocket message types
export const chatSessions = pgTable("chat_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messages: jsonb("messages").$type<Array<{role: 'user' | 'assistant', content: string, timestamp: string}>>(),
  lastActivity: timestamp("last_activity").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChatSessionSchema = createInsertSchema(chatSessions);
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;

export const websocketMessageSchema = z.object({
  type: z.enum(["agent_status", "query_update", "system_log", "connection_status"]),
  data: z.any(),
});

export type WebSocketMessage = z.infer<typeof websocketMessageSchema>;
