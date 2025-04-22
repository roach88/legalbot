import { 
  users, type User, type InsertUser,
  documents, type Document, type InsertDocument,
  conversations, type Conversation, type InsertConversation,
  messages, type Message, type InsertMessage,
  type ConversationWithMessages, type MessageWithReferences,
  type MessageReference
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Document methods
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: number): Promise<Document | undefined>;
  getAllDocuments(): Promise<Document[]>;
  
  // Conversation methods
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: number): Promise<Conversation | undefined>;
  getConversationsByDocumentId(documentId: number): Promise<Conversation[]>;
  getConversationWithMessages(id: number): Promise<ConversationWithMessages | undefined>;
  
  // Message methods
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByConversationId(conversationId: number): Promise<Message[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private documents: Map<number, Document>;
  private conversations: Map<number, Conversation>;
  private messages: Map<number, Message>;
  
  private userId: number;
  private documentId: number;
  private conversationId: number;
  private messageId: number;

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    
    this.userId = 1;
    this.documentId = 1;
    this.conversationId = 1;
    this.messageId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Document methods
  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.documentId++;
    const document: Document = { 
      ...insertDocument, 
      id,
      metadata: insertDocument.metadata || {},
      uploadedAt: new Date()
    };
    this.documents.set(id, document);
    return document;
  }
  
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }
  
  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }
  
  // Conversation methods
  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = this.conversationId++;
    const conversation: Conversation = {
      ...insertConversation,
      id,
      createdAt: new Date()
    };
    this.conversations.set(id, conversation);
    return conversation;
  }
  
  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }
  
  async getConversationsByDocumentId(documentId: number): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).filter(
      (conversation) => conversation.documentId === documentId
    );
  }
  
  async getConversationWithMessages(id: number): Promise<ConversationWithMessages | undefined> {
    const conversation = await this.getConversation(id);
    if (!conversation) return undefined;
    
    const document = await this.getDocument(conversation.documentId);
    if (!document) return undefined;
    
    const messagesRaw = await this.getMessagesByConversationId(id);
    const messages: MessageWithReferences[] = messagesRaw.map(msg => ({
      id: msg.id,
      content: msg.content,
      isUserMessage: msg.isUserMessage,
      references: msg.references ? msg.references as any : undefined,
      createdAt: msg.createdAt.toISOString()
    }));
    
    return {
      id: conversation.id,
      document: {
        id: document.id,
        fileName: document.fileName
      },
      messages
    };
  }
  
  // Message methods
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageId++;
    const references: MessageReference = Array.isArray(insertMessage.references) 
      ? insertMessage.references as MessageReference 
      : [];
    
    const message: Message = {
      ...insertMessage,
      id,
      references,
      createdAt: new Date()
    };
    this.messages.set(id, message);
    return message;
  }
  
  async getMessagesByConversationId(conversationId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.conversationId === conversationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  // Document methods
  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db.insert(documents).values(insertDocument).returning();
    return document;
  }
  
  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }
  
  async getAllDocuments(): Promise<Document[]> {
    return await db.select().from(documents).orderBy(desc(documents.uploadedAt));
  }
  
  // Conversation methods
  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const [conversation] = await db.insert(conversations).values(insertConversation).returning();
    return conversation;
  }
  
  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  }
  
  async getConversationsByDocumentId(documentId: number): Promise<Conversation[]> {
    return await db.select()
      .from(conversations)
      .where(eq(conversations.documentId, documentId))
      .orderBy(desc(conversations.createdAt));
  }
  
  async getConversationWithMessages(id: number): Promise<ConversationWithMessages | undefined> {
    const conversation = await this.getConversation(id);
    if (!conversation) return undefined;
    
    const [document] = await db.select({
      id: documents.id,
      fileName: documents.fileName
    })
    .from(documents)
    .where(eq(documents.id, conversation.documentId));
    
    if (!document) return undefined;
    
    const messagesRaw = await this.getMessagesByConversationId(id);
    const messages: MessageWithReferences[] = messagesRaw.map(msg => ({
      id: msg.id,
      content: msg.content,
      isUserMessage: msg.isUserMessage,
      references: msg.references ? msg.references as any : undefined,
      createdAt: msg.createdAt.toISOString()
    }));
    
    return {
      id: conversation.id,
      document,
      messages
    };
  }
  
  // Message methods
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const references: MessageReference = Array.isArray(insertMessage.references) 
      ? insertMessage.references as MessageReference 
      : [];
    
    const messageData = {
      content: insertMessage.content,
      conversationId: insertMessage.conversationId,
      isUserMessage: insertMessage.isUserMessage,
      references
    };
    
    const [message] = await db.insert(messages).values(messageData).returning();
    return message;
  }
  
  async getMessagesByConversationId(conversationId: number): Promise<Message[]> {
    return await db.select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.id);
  }
}

// Use the database storage implementation
export const storage = new DatabaseStorage();
