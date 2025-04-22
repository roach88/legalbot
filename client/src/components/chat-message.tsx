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
        <p>{content}</p>
      ) : (
        <>
          <p className={references && references.length > 0 ? "mb-2" : ""}>{content}</p>
          
          {references && references.length > 0 && (
            <div>
              {references.map((reference, index) => (
                <div key={index} className="bg-neutral-50 p-3 rounded border-l-2 border-secondary-500 text-sm italic my-2">
                  {reference.text}
                  {reference.location && (
                    <div className="text-xs text-neutral-500 mt-1 not-italic">
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
