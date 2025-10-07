/**
 * @fileoverview Chat state management using Zustand with run-aware suggestions
 */

import { create } from 'zustand';
import { ChatMessage } from '@microtech/core';
import {
  requestSuggestions,
  type ChatEntryResponse,
  type ChatSuggestionResponse,
} from '@/api/runs';

interface WorkspaceChatMessage extends ChatMessage {
  suggestions?: ChatSuggestionResponse[];
}

interface ChatState {
  isOpen: boolean;
  messages: WorkspaceChatMessage[];
  currentContext: {
    workspaceId: string | null;
    tab: 'proposals' | 'recruiting';
  };
  currentRunId: string | null;
  isLoading: boolean;
  error: string | null;
}

interface ChatActions {
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
  addMessage: (message: WorkspaceChatMessage) => void;
  setMessages: (messages: WorkspaceChatMessage[]) => void;
  clearMessages: () => void;
  hydrateMessages: (runId: string, entries: ChatEntryResponse[]) => void;
  setContext: (context: { workspaceId: string | null; tab: 'proposals' | 'recruiting' }) => void;
  setRun: (runId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateSuggestionStatus: (
    messageId: string,
    suggestionId: string,
    status: ChatSuggestionResponse['status'],
  ) => void;
  sendMessage: (
    content: string,
    options?: { sectionId?: string | null; cursor?: number | null },
  ) => Promise<void>;
}

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
  // State
  isOpen: false,
  messages: [],
  currentContext: {
    workspaceId: null,
    tab: 'proposals',
  },
  currentRunId: null,
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

  hydrateMessages: (runId, entries) => {
    const { currentContext } = get();
    const formatted: WorkspaceChatMessage[] = entries.map((entry) => ({
      id: entry.id,
      role: entry.role,
      content: entry.content,
      timestamp: new Date(entry.createdAt),
      context: currentContext.workspaceId
        ? { workspaceId: currentContext.workspaceId, tab: currentContext.tab }
        : undefined,
      suggestions: entry.suggestions?.map((suggestion) => ({ ...suggestion })),
    }));
    set({ messages: formatted, currentRunId: runId });
  },

  setContext: (context) => set({ currentContext: context }),

  setRun: (runId) => set({ currentRunId: runId }),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  updateSuggestionStatus: (messageId, suggestionId, status) => {
    set((state) => ({
      messages: state.messages.map((message) => {
        if (message.id !== messageId || !message.suggestions) {
          return message;
        }
        return {
          ...message,
          suggestions: message.suggestions.map((suggestion) =>
            suggestion.id === suggestionId ? { ...suggestion, status } : suggestion,
          ),
        };
      }),
    }));
  },

  sendMessage: async (content, options) => {
    const { currentContext, addMessage, setLoading, setError, currentRunId } = get();

    if (!currentRunId) {
      setError('Upload a proposal PDF to start a run before using chat suggestions.');
      return;
    }

    // Add user message
    const userMessage: WorkspaceChatMessage = {
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
      const response = await requestSuggestions(currentRunId, {
        prompt: content,
        sectionId: options?.sectionId ?? null,
        cursor: options?.cursor ?? null,
      });

      const assistantMessage: WorkspaceChatMessage = {
        id: response.id,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(response.createdAt),
        context: currentContext,
        suggestions: response.suggestions?.map((suggestion) => ({ ...suggestion })) ?? [],
      };

      addMessage(assistantMessage);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');

      // Add error message
      const errorMessage: WorkspaceChatMessage = {
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
