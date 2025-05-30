import { pgTable, text, serial, integer, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Define custom type for metadata and references
export type DocumentMetadata = Record<string, unknown>;
export type MessageReferenceItem = {
  text: string;
  location: string;
};
export type MessageReference = MessageReferenceItem[];

// Document schema
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata").$type<DocumentMetadata>().notNull().default({}),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  fileName: true, 
  fileType: true,
  fileSize: true,
  content: true,
  metadata: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

// Conversations schema
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  documentId: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

// Messages schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  content: text("content").notNull(),
  isUserMessage: boolean("is_user_message").notNull(),
  references: jsonb("references").$type<MessageReference>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  conversationId: true,
  content: true,
  isUserMessage: true,
  references: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Define relations between tables
export const documentsRelations = relations(documents, ({ many }) => ({
  conversations: many(conversations)
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  document: one(documents, {
    fields: [conversations.documentId],
    references: [documents.id]
  }),
  messages: many(messages)
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id]
  })
}));

// Dto types for API responses
export type DocumentUploadResponse = {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
};

export type MessageWithReferences = {
  id: number;
  content: string;
  isUserMessage: boolean;
  references?: MessageReference;
  createdAt: string;
};

export type ConversationWithMessages = {
  id: number;
  document: {
    id: number;
    fileName: string;
  };
  messages: MessageWithReferences[];
};

// API request schemas for validation
export const messageRequestSchema = z.object({
  content: z.string().min(1, "Message cannot be empty"),
  documentId: z.number(),
  conversationId: z.number().optional(),
});

export type MessageRequest = z.infer<typeof messageRequestSchema>;
