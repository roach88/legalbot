import { useState } from 'react';
import { MessageWithReferences, ConversationWithMessages } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function useChat(documentId: number | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  
  // Query for fetching current conversation with messages
  const conversationQuery = useQuery({
    queryKey: ['/api/conversations', currentConversationId],
    enabled: !!currentConversationId,
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!documentId) {
        throw new Error('No document selected');
      }
      
      const response = await apiRequest('POST', '/api/messages', {
        content,
        documentId,
        conversationId: currentConversationId || undefined
      });
      
      return response.json();
    },
    onSuccess: (data: ConversationWithMessages) => {
      setCurrentConversationId(data.id);
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', data.id] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to send message: ${error.message}`,
        variant: 'destructive'
      });
    }
  });
  
  // Messages derived from conversation data
  const messages: MessageWithReferences[] = conversationQuery.data?.messages || [];
  
  // Send a message
  const sendMessage = async (content: string) => {
    if (!content.trim() || !documentId) return;
    
    sendMessageMutation.mutate(content.trim());
  };
  
  return {
    // State
    messages,
    conversationId: currentConversationId,
    conversation: conversationQuery.data as ConversationWithMessages | undefined,
    
    // Loading states
    isLoading: conversationQuery.isLoading,
    isSending: sendMessageMutation.isPending,
    
    // Actions
    sendMessage,
    setConversationId: setCurrentConversationId,
    
    // Errors
    error: conversationQuery.error || sendMessageMutation.error,
  };
}
