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
    <div className="document-panel w-full md:w-1/2 flex flex-col rounded-lg bg-white shadow-md overflow-hidden h-[calc(100vh-160px)] md:h-auto">
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
        <h2 className="font-medium text-neutral-700">Document View</h2>
        <div className="flex items-center space-x-2">
          <button className="text-neutral-700 hover:text-primary-500">
            <span className="material-icons text-sm">search</span>
          </button>
          {document && (
            <button className="text-neutral-700 hover:text-primary-500">
              <span className="material-icons text-sm">download</span>
            </button>
          )}
          <button className="text-neutral-700 hover:text-primary-500">
            <span className="material-icons text-sm">more_vert</span>
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
