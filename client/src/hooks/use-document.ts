import { useState } from 'react';
import { Document } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function useDocument() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentDocumentId, setCurrentDocumentId] = useState<number | null>(null);
  
  // Query for fetching current document
  const documentQuery = useQuery({
    queryKey: ['/api/documents', currentDocumentId],
    enabled: !!currentDocumentId,
  });
  
  // Query for getting all documents
  const documentsQuery = useQuery({
    queryKey: ['/api/documents'],
  });
  
  // Mutation for uploading a document
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload document');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: 'Document uploaded successfully!',
      });
      
      setCurrentDocumentId(data.id);
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload document',
        variant: 'destructive',
      });
    },
  });
  
  const uploadDocument = async (file: File) => {
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
    
    uploadMutation.mutate(file);
  };
  
  return {
    // State
    currentDocumentId,
    currentDocument: documentQuery.data as Document | undefined,
    allDocuments: documentsQuery.data as Document[] | undefined,
    
    // Loading states
    isLoading: documentQuery.isLoading || uploadMutation.isPending,
    isUploading: uploadMutation.isPending,
    
    // Actions
    setCurrentDocumentId,
    uploadDocument,
    
    // Errors
    error: documentQuery.error || uploadMutation.error,
  };
}
