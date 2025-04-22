import React from "react";
import DocumentUpload from "./document-upload";
import DocumentView from "./document-view";
import { Document } from "@shared/schema";

interface DocumentPanelProps {
  document: Document | null;
  onDocumentUpload: (document: Document) => void;
}

export default function DocumentPanel({ document, onDocumentUpload }: DocumentPanelProps) {
  return (
    <div className="document-panel w-full md:w-1/2 flex flex-col rounded-[var(--radius-card)] bg-card shadow-card overflow-hidden h-[calc(100vh-160px)] md:h-auto transition-all duration-300 hover:shadow-hover">
      <div className="flex items-center justify-between border-b border-border px-md py-sm">
        <h2 className="font-semibold text-h3 text-foreground">Document View</h2>
        <div className="flex items-center space-x-sm">
          <button className="text-muted-foreground hover:text-secondary transition-colors duration-300">
            <span className="material-icons text-xl">search</span>
          </button>
          {document && (
            <button className="text-muted-foreground hover:text-secondary transition-colors duration-300">
              <span className="material-icons text-xl">download</span>
            </button>
          )}
          <button className="text-muted-foreground hover:text-secondary transition-colors duration-300">
            <span className="material-icons text-xl">more_vert</span>
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto" id="document-container">
        {document ? (
          <DocumentView document={document} />
        ) : (
          <DocumentUpload onDocumentUpload={onDocumentUpload} />
        )}
      </div>
    </div>
  );
}
