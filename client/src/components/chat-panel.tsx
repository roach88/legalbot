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
    <div className="chat-panel w-full md:w-1/2 flex flex-col rounded-lg bg-white shadow-md overflow-hidden h-[calc(100vh-160px)] md:h-auto">
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
        <h2 className="font-medium text-neutral-700">AI Assistant</h2>
        <div className="flex items-center space-x-2">
          <button className="text-neutral-700 hover:text-primary-500">
            <span className="material-icons text-sm">history</span>
          </button>
          <button className="text-neutral-700 hover:text-primary-500">
            <span className="material-icons text-sm">more_vert</span>
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 bg-neutral-50" id="chat-history">
        {!document ? (
          <div id="chat-empty-state" className="flex flex-col items-center justify-center h-full p-4 text-center">
            <div className="bg-primary-50 rounded-full p-4 mb-4">
              <span className="material-icons text-3xl text-primary-500">chat</span>
            </div>
            <h3 className="text-lg font-medium text-neutral-700 mb-2">No Active Conversation</h3>
            <p className="text-neutral-500 max-w-md">Upload a document to start asking questions about it. The AI will analyze the content and provide relevant answers.</p>
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
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      <div className="border-t border-neutral-100 p-3">
        {!document ? (
          <div id="chat-input-disabled" className="flex items-center justify-center p-3 bg-neutral-50 text-neutral-500 rounded-lg">
            <span className="material-icons mr-2">info</span>
            <p>Upload a document to start a conversation</p>
          </div>
        ) : (
          <div id="chat-input-active">
            <div className="flex items-end space-x-2">
              <div className="flex-1 border border-neutral-200 rounded-lg bg-white hover:border-primary-300 focus-within:border-primary-300 focus-within:ring-1 focus-within:ring-primary-300 transition-all">
                <textarea
                  ref={textareaRef}
                  id="message-input"
                  placeholder="Ask a question about your document..."
                  className="w-full p-3 resize-none h-12 max-h-32 focus:outline-none rounded-lg"
                  rows={1}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    resizeTextarea();
                  }}
                  onKeyDown={handleKeyPress}
                  disabled={isSubmitting}
                ></textarea>
                <div className="px-3 pb-2 flex items-center justify-between text-sm text-neutral-400">
                  <div>Press Enter to send, Shift+Enter for a new line</div>
                </div>
              </div>
              <button 
                className={`text-white rounded-full p-3 flex-shrink-0 transition-colors ${
                  isSubmitting 
                    ? "bg-neutral-400" 
                    : "bg-primary-500 hover:bg-primary-700"
                }`}
                onClick={handleSendMessage}
                disabled={isSubmitting || !message.trim()}
              >
                <span className="material-icons">send</span>
              </button>
            </div>
            
            <div className="flex items-center justify-start mt-2 text-xs text-neutral-400">
              <span className="material-icons text-xs mr-1">info</span>
              <span>AI responses are generated based on your document content</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
