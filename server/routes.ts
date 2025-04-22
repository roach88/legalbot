import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  messageRequestSchema, 
  insertDocumentSchema,
  insertConversationSchema,
  insertMessageSchema
} from "@shared/schema";
import multer from "multer";
import { extractTextFromPdf } from "./services/pdf";
import { analyzeDocumentWithAI } from "./services/openai";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Setup multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max size
  },
  fileFilter: (req, file, cb) => {
    // Accept only pdf, docx, and txt files
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype === 'text/plain'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Please upload PDF, DOCX, or TXT files only.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  
  // Handle document upload
  app.post('/api/documents', upload.single('file'), async (req: Request, res: Response) => {
    try {
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: 'No file provided' });
      }
      
      // Extract text content from file
      let textContent = '';
      let metadata = {};
      
      if (file.mimetype === 'application/pdf') {
        const result = await extractTextFromPdf(file.buffer);
        textContent = result.text;
        metadata = { 
          pageCount: result.pageCount,
          info: result.info
        };
      } else if (file.mimetype === 'text/plain') {
        textContent = file.buffer.toString('utf-8');
      } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // For DOCX, we'd need another library but for now let's return an error
        return res.status(400).json({ message: 'DOCX support is not implemented yet' });
      }
      
      // Create document record
      const document = await storage.createDocument({
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        content: textContent,
        metadata
      });
      
      return res.status(201).json({
        id: document.id,
        fileName: document.fileName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        uploadedAt: document.uploadedAt
      });
      
    } catch (error) {
      console.error('Error uploading document:', error);
      return res.status(500).json({ message: 'Failed to process document upload', error: error.message });
    }
  });
  
  // Get document by ID
  app.get('/api/documents/:id', async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      
      if (isNaN(documentId)) {
        return res.status(400).json({ message: 'Invalid document ID' });
      }
      
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      return res.status(200).json({
        id: document.id,
        fileName: document.fileName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        content: document.content,
        metadata: document.metadata,
        uploadedAt: document.uploadedAt
      });
      
    } catch (error) {
      console.error('Error retrieving document:', error);
      return res.status(500).json({ message: 'Failed to retrieve document', error: error.message });
    }
  });
  
  // Get all documents
  app.get('/api/documents', async (req: Request, res: Response) => {
    try {
      const documents = await storage.getAllDocuments();
      
      return res.status(200).json(documents.map(doc => ({
        id: doc.id,
        fileName: doc.fileName,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        uploadedAt: doc.uploadedAt
      })));
      
    } catch (error) {
      console.error('Error retrieving documents:', error);
      return res.status(500).json({ message: 'Failed to retrieve documents', error: error.message });
    }
  });
  
  // Process message and get AI response
  app.post('/api/messages', async (req: Request, res: Response) => {
    try {
      // Validate request
      const validatedData = messageRequestSchema.parse(req.body);
      
      // Get document
      const document = await storage.getDocument(validatedData.documentId);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      // Get or create conversation
      let conversationId = validatedData.conversationId;
      let conversation;
      
      if (!conversationId) {
        // Create new conversation
        conversation = await storage.createConversation({
          documentId: document.id
        });
        conversationId = conversation.id;
      } else {
        // Verify conversation exists
        conversation = await storage.getConversation(conversationId);
        if (!conversation) {
          return res.status(404).json({ message: 'Conversation not found' });
        }
        
        // Verify conversation belongs to the document
        if (conversation.documentId !== document.id) {
          return res.status(400).json({ 
            message: 'Conversation does not belong to the specified document' 
          });
        }
      }
      
      // Save user message
      const userMessage = await storage.createMessage({
        conversationId,
        content: validatedData.content,
        isUserMessage: true,
        references: null
      });
      
      // Generate AI response using OpenAI
      const aiResponse = await analyzeDocumentWithAI({
        documentText: document.content,
        query: validatedData.content
      });
      
      // Save AI message with references
      const aiMessage = await storage.createMessage({
        conversationId,
        content: aiResponse.answer,
        isUserMessage: false,
        references: aiResponse.references
      });
      
      // Return conversation with messages
      const fullConversation = await storage.getConversationWithMessages(conversationId);
      
      return res.status(200).json(fullConversation);
      
    } catch (error) {
      console.error('Error processing message:', error);
      
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          message: 'Invalid request data', 
          errors: validationError.details 
        });
      }
      
      return res.status(500).json({ 
        message: 'Failed to process message', 
        error: error.message 
      });
    }
  });
  
  // Get conversation by ID
  app.get('/api/conversations/:id', async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: 'Invalid conversation ID' });
      }
      
      const conversation = await storage.getConversationWithMessages(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      
      return res.status(200).json(conversation);
      
    } catch (error) {
      console.error('Error retrieving conversation:', error);
      return res.status(500).json({ 
        message: 'Failed to retrieve conversation', 
        error: error.message 
      });
    }
  });
  
  // Get conversations by document ID
  app.get('/api/documents/:id/conversations', async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      
      if (isNaN(documentId)) {
        return res.status(400).json({ message: 'Invalid document ID' });
      }
      
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      const conversations = await storage.getConversationsByDocumentId(documentId);
      
      return res.status(200).json(conversations);
      
    } catch (error) {
      console.error('Error retrieving conversations:', error);
      return res.status(500).json({ 
        message: 'Failed to retrieve conversations', 
        error: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
