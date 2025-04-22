import React from 'react';
import { MessageWithReferences } from '@shared/schema';

interface ChatMessageProps {
  message: MessageWithReferences;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const { content, isUserMessage, references } = message;
  
  const messageClass = isUserMessage 
    ? "chat-message message-user" 
    : "chat-message message-ai";
  
  return (
    <div className={messageClass}>
      {isUserMessage ? (
        <p className="text-body">{content}</p>
      ) : (
        <>
          <p className={references && references.length > 0 ? "mb-sm text-body" : "text-body"}>{content}</p>
          
          {references && references.length > 0 && (
            <div className="mt-sm">
              {references.map((reference, index) => (
                <div key={index} className="document-highlight my-sm text-caption leading-body">
                  {reference.text}
                  {reference.location && (
                    <div className="text-caption text-muted-foreground mt-xs font-medium">
                      {reference.location}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
