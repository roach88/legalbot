import { 
  users, type User, type InsertUser,
  documents, type Document, type InsertDocument,
  conversations, type Conversation, type InsertConversation,
  messages, type Message, type InsertMessage,
  type ConversationWithMessages, type MessageWithReferences
} from "@shared/schema";

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
    const message: Message = {
      ...insertMessage,
      id,
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

export const storage = new MemStorage();
