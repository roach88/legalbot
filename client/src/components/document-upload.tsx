import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Document } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import ToastNotification from './ui/toast-notification';

interface DocumentUploadProps {
  onDocumentUpload: (document: Document) => void;
}

export default function DocumentUpload({ onDocumentUpload }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    
    // Check file size
    if (file.size > 10 * 1024 * 1024) { // 10MB
      toast({
        title: 'Error',
        description: 'File size exceeds 10MB limit',
        variant: 'destructive',
      });
      return;
    }
    
    // Check file type
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Error',
        description: 'Unsupported file format. Please upload PDF, DOCX, or TXT',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setUploading(true);
      
      // Display uploading toast
      toast({
        title: 'Uploading',
        description: 'Processing your document...',
      });
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload the file
      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload document');
      }
      
      const documentData = await response.json();
      
      // Show success message
      toast({
        title: 'Success',
        description: 'Document uploaded successfully!',
      });
      
      // Pass document data to parent component
      onDocumentUpload(documentData);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  }, [onDocumentUpload, toast]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    disabled: uploading,
    maxFiles: 1,
  });
  
  return (
    <div id="empty-state" className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="bg-primary-50 rounded-full p-6 mb-6">
        <span className="material-icons text-5xl text-primary-500">upload_file</span>
      </div>
      <h3 className="text-lg font-medium text-neutral-700 mb-2">No Document Loaded</h3>
      <p className="text-neutral-500 mb-6 max-w-md">
        Upload a legal document to begin analyzing it with AI. Supported formats include PDF, DOCX, and TXT.
      </p>
      
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed ${
          isDragActive ? 'border-primary-300 bg-neutral-50' : 'border-neutral-200'
        } rounded-lg p-8 w-full max-w-md cursor-pointer hover:bg-neutral-50 transition-colors`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center">
          <span className="material-icons text-3xl text-neutral-300 mb-2">cloud_upload</span>
          <p className="font-medium text-neutral-600">
            {uploading 
              ? 'Uploading...' 
              : <>Drag documents here or <span className="text-primary-500">browse</span></>
            }
          </p>
          <p className="text-sm text-neutral-400 mt-1">Maximum file size: 10MB</p>
        </div>
      </div>
    </div>
  );
}
