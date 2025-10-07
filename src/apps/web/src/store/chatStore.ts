/**
 * @fileoverview Chat state management using Zustand
 */

import { create } from 'zustand';
import { ChatMessage } from '@microtech/core';

interface ChatState {
  isOpen: boolean;
  messages: ChatMessage[];
  currentContext: {
    workspaceId: string | null;
    tab: 'proposals' | 'recruiting';
  };
  isLoading: boolean;
  error: string | null;
}

interface ChatActions {
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;
  setContext: (context: { workspaceId: string | null; tab: 'proposals' | 'recruiting' }) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  sendMessage: (content: string) => Promise<void>;
}

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
  // State
  isOpen: false,
  messages: [],
  currentContext: {
    workspaceId: null,
    tab: 'proposals',
  },
  isLoading: false,
  error: null,

  // Actions
  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
  openChat: () => set({ isOpen: true }),
  closeChat: () => set({ isOpen: false }),

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),

  setMessages: (messages) => set({ messages }),
  clearMessages: () => set({ messages: [] }),

  setContext: (context) => set({ currentContext: context }),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  sendMessage: async (content: string) => {
    const { currentContext, addMessage, setLoading, setError } = get();
    
    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
      context: currentContext,
    };
    
    addMessage(userMessage);
    setLoading(true);
    setError(null);

    try {
      // Call the actual API
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          context: currentContext,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.data.content,
        timestamp: new Date(),
        context: currentContext,
      };
      
      addMessage(assistantMessage);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        context: currentContext,
      };
      
      addMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  },
}));
