import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const models = pgTable("models", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  path: text("path").notNull(),
  size: text("size").notNull(),
  modified: timestamp("modified").notNull(),
  status: text("status").notNull().default("ready"), // ready, cached, loading, error
  type: text("type").notNull().default("local"), // local, external
});

export const externalApis = pgTable("external_apis", {
  id: serial("id").primaryKey(),
  modelName: text("model_name").notNull(),
  endpoint: text("endpoint").notNull(),
  apiKey: text("api_key").notNull(),
  provider: text("provider"), // openai, anthropic, etc.
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  role: text("role").notNull(), // user, assistant
  modelName: text("model_name").notNull(),
  processingTime: real("processing_time"),
  tokenCount: integer("token_count"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const datasets = pgTable("datasets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  filename: text("filename").notNull(),
  size: integer("size").notNull(),
  rows: integer("rows").notNull(),
  columns: integer("columns").notNull(),
  columnNames: text("column_names").array().notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export const insertModelSchema = createInsertSchema(models).omit({
  id: true,
  modified: true,
});

export const insertExternalApiSchema = createInsertSchema(externalApis).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

export const insertDatasetSchema = createInsertSchema(datasets).omit({
  id: true,
  uploadedAt: true,
});

export type Model = typeof models.$inferSelect;
export type InsertModel = z.TypeOf<typeof insertModelSchema>;
export type ExternalApi = typeof externalApis.$inferSelect;
export type InsertExternalApi = z.TypeOf<typeof insertExternalApiSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.TypeOf<typeof insertChatMessageSchema>;
export type Dataset = typeof datasets.$inferSelect;
export type InsertDataset = z.TypeOf<typeof insertDatasetSchema>;

export interface RAGIndex {
  name: string;
  created_at: string;
  stats: {
    total_documents: number;
    total_chunks: number;
    total_size: number;
  };
  documents: string[]; // Array of document filenames in this index
}

export interface RAGDocument {
  filename: string;
  document_id: string;
  chunks: number;
  size: number;
}

export interface RAGQueryResult {
  results: Array<{
    text: string;
    score: number;
    metadata: Record<string, any>;
  }>;
  query: string;
  mode: 'vector' | 'keyword' | 'hybrid';
  total_results: number;
}

export interface RAGUploadResponse {
  success: boolean;
  processed: RAGDocument[];
  errors: Array<{
    filename: string;
    error: string;
  }>;
  total_processed: number;
  total_errors: number;
}

export interface DatasetData {
  headers: string[];
  rows: any[][];
  rowCount: number;
  columnCount: number;
}

export interface DataInsight {
  type: 'summary' | 'trend' | 'anomaly' | 'correlation' | 'prediction';
  title: string;
  description: string;
  confidence?: number;
  data?: any;
}

export interface AnalyticsResponse {
  dataset: Dataset;
  data: DatasetData;
  insights: DataInsight[];
  statistics: Record<string, any>;
}
