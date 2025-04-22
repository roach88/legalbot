import { useState } from "react";
import Header from "@/components/header";
import DocumentPanel from "@/components/document-panel";
import ChatPanel from "@/components/chat-panel";
import { Document, MessageWithReferences } from "@shared/schema";

export default function Home() {
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageWithReferences[]>([]);

  const handleDocumentUpload = (document: Document) => {
    setCurrentDocument(document);
    setCurrentConversationId(null);
    setMessages([]);
  };

  const handleConversationUpdate = (conversationId: number, updatedMessages: MessageWithReferences[]) => {
    setCurrentConversationId(conversationId);
    setMessages(updatedMessages);
  };

  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto h-full px-4 py-4">
          <div className="main-container flex h-full gap-4 md:flex-row flex-col">
            <DocumentPanel 
              document={currentDocument} 
              onDocumentUpload={handleDocumentUpload} 
            />
            
            <ChatPanel 
              document={currentDocument}
              conversationId={currentConversationId}
              messages={messages}
              onConversationUpdate={handleConversationUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
