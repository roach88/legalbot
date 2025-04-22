import React, { useState, useRef, useEffect } from "react";
import { Document, MessageWithReferences } from "@shared/schema";
import ChatMessage from "./chat-message";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";

interface ChatPanelProps {
  document: Document | null;
  conversationId: number | null;
  messages: MessageWithReferences[];
  onConversationUpdate: (conversationId: number, messages: MessageWithReferences[]) => void;
}

export default function ChatPanel({ 
  document, 
  conversationId, 
  messages,
  onConversationUpdate 
}: ChatPanelProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Resize textarea as user types
  const resizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!document) {
        throw new Error("No document selected");
      }

      const response = await apiRequest("POST", "/api/messages", {
        content,
        documentId: document.id,
        conversationId: conversationId || undefined
      });

      return response.json();
    },
    onSuccess: (data) => {
      // Update conversation state
      onConversationUpdate(data.id, data.messages);
      setMessage("");
      setIsSubmitting(false);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to send message: ${error.message}`,
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  });

  const handleSendMessage = async () => {
    if (!message.trim() || isSubmitting || !document) return;
    
    setIsSubmitting(true);
    sendMessageMutation.mutate(message.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-panel w-full md:w-1/2 flex flex-col rounded-[var(--radius-card)] bg-card shadow-card overflow-hidden h-[calc(100vh-160px)] md:h-auto transition-all duration-300 hover:shadow-hover">
      <div className="flex items-center justify-between border-b border-border px-md py-sm">
        <h2 className="font-semibold text-h3 text-foreground">AI Assistant</h2>
        <div className="flex items-center space-x-sm">
          <button className="text-muted-foreground hover:text-secondary transition-colors duration-300">
            <span className="material-icons text-xl">history</span>
          </button>
          <button className="text-muted-foreground hover:text-secondary transition-colors duration-300">
            <span className="material-icons text-xl">more_vert</span>
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-md bg-background" id="chat-history">
        {!document ? (
          <div id="chat-empty-state" className="flex flex-col items-center justify-center h-full p-md text-center">
            <div className="bg-primary/10 rounded-full p-md mb-md">
              <span className="material-icons text-4xl text-primary">chat</span>
            </div>
            <h3 className="text-h3 font-medium text-foreground mb-sm">No Active Conversation</h3>
            <p className="text-body text-muted-foreground max-w-md">Upload a document to start asking questions about it. The AI will analyze the content and provide relevant answers.</p>
          </div>
        ) : (
          <div id="chat-messages">
            {messages.length === 0 && (
              <div className="chat-message message-ai">
                <p className="mb-1">Hello! I'm your legal document assistant. I've analyzed your {document.fileName}. How can I help you with this document?</p>
              </div>
            )}
            
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            
            {isSubmitting && (
              <div className="chat-message message-ai">
                <div className="flex space-x-2 items-center">
                  <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      <div className="border-t border-border p-sm">
        {!document ? (
          <div id="chat-input-disabled" className="flex items-center justify-center p-sm bg-background text-muted-foreground rounded-[var(--radius)]">
            <span className="material-icons mr-sm">info</span>
            <p className="text-body">Upload a document to start a conversation</p>
          </div>
        ) : (
          <div id="chat-input-active">
            <div className="flex items-end space-x-sm">
              <div className="flex-1 border border-border rounded-[var(--radius)] bg-card hover:border-secondary focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary transition-all duration-300">
                <textarea
                  ref={textareaRef}
                  id="message-input"
                  placeholder="Ask a question about your document..."
                  className="w-full p-sm resize-none h-12 max-h-32 focus:outline-none rounded-[var(--radius)] text-body"
                  rows={1}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    resizeTextarea();
                  }}
                  onKeyDown={handleKeyPress}
                  disabled={isSubmitting}
                ></textarea>
                <div className="px-sm pb-xs flex items-center justify-between text-caption text-muted-foreground">
                  <div>Press Enter to send, Shift+Enter for a new line</div>
                </div>
              </div>
              <button 
                className={`text-white rounded-full p-3 flex-shrink-0 transition-all duration-300 shadow-sm hover:shadow-hover ${
                  isSubmitting 
                    ? "bg-muted" 
                    : "bg-secondary hover:bg-accent hover:scale-[1.02]"
                }`}
                onClick={handleSendMessage}
                disabled={isSubmitting || !message.trim()}
              >
                <span className="material-icons">send</span>
              </button>
            </div>
            
            <div className="flex items-center justify-start mt-xs text-caption text-muted-foreground">
              <span className="material-icons text-xs mr-1">info</span>
              <span>AI responses are generated based on your document content</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
