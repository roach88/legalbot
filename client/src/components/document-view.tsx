import React, { useEffect, useState } from 'react';
import { Document } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

// Define document response shape
interface DocumentResponse {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  content: string;
  metadata?: Record<string, any>;
  uploadedAt: string;
}

interface DocumentViewProps {
  document: Document;
}

export default function DocumentView({ document }: DocumentViewProps) {
  const [highlightedText, setHighlightedText] = useState<string[]>([]);
  
  // Fetch full document content
  const { data: fullDocument, isLoading } = useQuery<DocumentResponse>({
    queryKey: [`/api/documents/${document.id}`],
    enabled: !!document.id,
  });
  
  // Function to format the document content for display
  const formatDocumentContent = (content: string) => {
    if (!content) return [];
    
    // Split content by double line breaks to identify paragraphs and sections
    const sections = content.split(/\n\s*\n/).filter(section => section.trim());
    
    // Process each section to identify headers and paragraphs
    return sections.map(section => {
      const trimmedSection = section.trim();
      
      // Check if section looks like a header (short line with numbers)
      const isHeader = /^(\d+\.|\d+\.\d+\.?)\s+[A-Z\s]{2,}/.test(trimmedSection) || 
                      /^[A-Z\s]{2,}:/.test(trimmedSection);
      
      return {
        text: trimmedSection,
        isHeader,
        isHighlighted: highlightedText.some(ht => trimmedSection.includes(ht))
      };
    });
  };
  
  // Update highlighted text based on references in messages
  useEffect(() => {
    // This would be populated from chat messages with references
    // For now, we're leaving it empty as it will be populated when
    // integrating with the chat functionality
    setHighlightedText([]);
  }, []);
  
  if (isLoading) {
    return (
      <div className="p-md">
        <Skeleton className="h-8 w-3/4 mb-sm" />
        <div className="flex items-center space-x-xs mb-md">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-36" />
        </div>
        
        <div className="space-y-md">
          <Skeleton className="h-6 w-1/2 mb-sm" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
          
          <Skeleton className="h-6 w-1/2 mb-sm" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
        </div>
      </div>
    );
  }
  
  const documentContent = fullDocument?.content || document.content || '';
  const formattedContent = formatDocumentContent(documentContent);
  const metadata = fullDocument?.metadata || {} as Record<string, any>;
  
  // Format the date from ISO string
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return '';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  return (
    <div id="document-view" className="p-md">
      <div className="mb-md">
        <h2 className="text-h3 font-semibold text-foreground">{document.fileName}</h2>
        <div className="flex items-center space-x-xs text-caption text-muted-foreground">
          {metadata.pageCount && <span>{metadata.pageCount} {metadata.pageCount === 1 ? 'page' : 'pages'}</span>}
          {metadata.pageCount && <span>•</span>}
          <span>{document.fileType.split('/')[1].toUpperCase()}</span>
          <span>•</span>
          <span>Last modified: {formatDate(document.uploadedAt)}</span>
        </div>
      </div>
      
      <div className="prose prose-primary max-w-none">
        {formattedContent.map((section, index) => {
          if (section.isHeader) {
            return (
              <h3 
                key={index}
                className={section.isHighlighted ? "document-highlight font-semibold" : "font-semibold text-foreground"}
              >
                {section.text}
              </h3>
            );
          } else {
            return (
              <div 
                key={index}
                className={section.isHighlighted ? "document-highlight my-sm" : "my-sm"}
              >
                <p className="text-body text-foreground leading-body">{section.text}</p>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}
