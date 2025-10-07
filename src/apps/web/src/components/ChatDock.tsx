/**
 * @fileoverview Chat dock component for AI assistance
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  MessageSquare,
  Settings,
  X,
  GripHorizontal,
} from 'lucide-react';
// Simple components
const Card = ({ children, className }: any) => <div className={`border rounded-lg bg-white shadow-lg ${className || ''}`}>{children}</div>;
const CardContent = ({ children, className }: any) => <div className={`${className || ''}`}>{children}</div>;
const CardHeader = ({ children, className }: any) => <div className={`p-4 border-b ${className || ''}`}>{children}</div>;
const CardTitle = ({ children, className }: any) => <h3 className={`text-lg font-semibold ${className || ''}`}>{children}</h3>;
const Button = ({ children, className, onClick, disabled, size, ...props }: any) => (
  <button 
    className={`px-3 py-2 rounded ${disabled ? 'opacity-50' : ''} ${className || ''}`} 
    onClick={onClick} 
    disabled={disabled}
    {...props}
  >
    {children}
  </button>
);
const Input = ({ className, ...props }: any) => <input className={`px-3 py-2 border rounded ${className || ''}`} {...props} />;
const Badge = ({ children, className, variant }: any) => <span className={`px-2 py-1 text-xs rounded bg-gray-100 ${className || ''}`}>{children}</span>;
import { useChatStore } from '@/store/chatStore';
import { useDraftStore } from '@/store/draftStore';
import { featureFlags } from '@/design/featureFlags';
// Simple utilities
const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ');
const formatDate = (date: Date) => date.toLocaleTimeString();

interface ChatDockProps {
  workspaceId: string;
  tab: 'proposals' | 'recruiting';
}

export function ChatDock({ workspaceId, tab }: ChatDockProps) {
  const [message, setMessage] = useState('');
  const [dimensions, setDimensions] = useState({ width: 380, height: 460 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLButtonElement>(null);

  const {
    isOpen,
    messages,
    isLoading,
    error,
    toggleChat,
    sendMessage,
    setContext
  } = useChatStore();
  const { addToDraft } = useDraftStore();

  // Update context when workspace or tab changes
  useEffect(() => {
    setContext({ workspaceId, tab });
  }, [workspaceId, tab, setContext]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const messageToSend = message.trim();
    setMessage('');
    console.info('[chat-dock]', { event: 'chat_send', characters: messageToSend.length, tab });
    await sendMessage(messageToSend);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getContextualPrompts = () => {
    if (tab === 'proposals') {
      return [
        'Insert compliance section about XYZ',
        'Fix grammar in the current section',
        'Add a table for security controls',
        'Summarize the requirements',
      ];
    } else {
      return [
        'Analyze this candidate profile',
        'Generate a skills comparison',
        'Draft an interview summary',
        'Create a hiring recommendation',
      ];
    }
  };

  const handlePromptClick = (prompt: string) => {
    setMessage(prompt);
  };

  useEffect(() => {
    if (!featureFlags.chatResizeToggle) return;
    const handleMouseMove = (event: MouseEvent) => {
      if (!dragStartRef.current) return;
      const deltaX = event.clientX - dragStartRef.current.x;
      const deltaY = event.clientY - dragStartRef.current.y;
      const nextWidth = Math.min(
        Math.max(dragStartRef.current.width + deltaX, 300),
        520,
      );
      const nextHeight = Math.min(
        Math.max(dragStartRef.current.height + deltaY, 320),
        720,
      );
      setDimensions({ width: nextWidth, height: nextHeight });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      document.body.style.cursor = '';
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'nwse-resize';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (!isDragging) {
        document.body.style.cursor = '';
      }
    };
  }, [isDragging]);

  if (!isOpen) {
    return null;
  }

  const handleAddToDraft = () => {
    if (!selectedMessageId) {
      return;
    }
    const selectedMessage = messages.find((message) => message.id === selectedMessageId);
    if (!selectedMessage) {
      return;
    }
    addToDraft({
      text: selectedMessage.content,
      summary: 'Chat assistant suggestion',
      sourceMessageId: selectedMessage.id,
    });
    console.info('[chat-dock]', {
      event: 'add_to_draft_clicked',
      messageId: selectedMessage.id,
      characters: selectedMessage.content.length,
    });
    setSelectedMessageId(null);
  };

  const handleResizePointerDown = (event: React.MouseEvent) => {
    if (!featureFlags.chatResizeToggle) {
      return;
    }
    event.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      width: dimensions.width,
      height: dimensions.height,
    };
  };

  const handleResizeKey = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!featureFlags.chatResizeToggle) return;
    const step = 24;
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setDimensions((prev) => ({ ...prev, height: Math.max(prev.height - step, 320) }));
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setDimensions((prev) => ({ ...prev, height: Math.min(prev.height + step, 720) }));
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setDimensions((prev) => ({ ...prev, width: Math.max(prev.width - step, 300) }));
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setDimensions((prev) => ({ ...prev, width: Math.min(prev.width + step, 520) }));
    }
  };

  const isAddDisabled = !selectedMessageId;

  return (
    <div
      className="fixed bottom-4 right-4 z-50"
      style={{ width: `${dimensions.width}px`, maxWidth: '90vw' }}
    >
      <Card className="shadow-2xl border-2 relative" style={{ height: `${dimensions.height}px` }}>
        <button
          ref={resizeHandleRef}
          type="button"
          role="separator"
          aria-orientation="horizontal"
          tabIndex={0}
          onKeyDown={handleResizeKey}
          onMouseDown={handleResizePointerDown}
          className={`absolute left-1/2 -translate-x-1/2 -top-3 flex items-center justify-center rounded-full border border-gray-200 bg-white p-1 shadow focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            featureFlags.chatResizeToggle ? 'cursor-grab' : 'cursor-not-allowed'
          }`}
          aria-label="Resize assistant panel"
        >
          <GripHorizontal className="h-4 w-4 text-gray-500" />
        </button>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg">AI Assistant</CardTitle>
              <Badge variant="secondary" className="text-xs capitalize">
                {tab}
              </Badge>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleChat}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Messages */}
          <div className={cn(
            'overflow-y-auto border-b',
            'h-[60%]'
          )}>
            <div className="p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Start a conversation with the AI assistant</p>
                  <p className="text-xs mt-1">
                    I can help with {tab === 'proposals' ? 'proposal writing and compliance' : 'candidate analysis and recruiting'}
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex items-start space-x-3',
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {msg.role !== 'user' && (
                      <div className="flex-shrink-0">
                        {msg.role === 'assistant' ? (
                          <Bot className="h-6 w-6 text-blue-500" />
                        ) : (
                          <MessageSquare className="h-6 w-6 text-gray-500" />
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (msg.role !== 'assistant') return;
                        setSelectedMessageId((current) => (current === msg.id ? null : msg.id));
                      }}
                      className={cn(
                        'max-w-[80%] rounded-lg px-3 py-2 text-sm text-left transition-shadow focus:outline-none',
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : msg.role === 'assistant'
                          ? 'bg-muted'
                          : 'bg-blue-50 text-blue-800',
                        selectedMessageId === msg.id && featureFlags.chatAddToDraftGated
                          ? 'ring-2 ring-blue-400'
                          : 'hover:shadow-md'
                      )}
                      aria-pressed={selectedMessageId === msg.id}
                    >
                      <p>{msg.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {formatDate(msg.timestamp)}
                      </p>
                    </button>

                    {msg.role === 'user' && (
                      <div className="flex-shrink-0">
                        <User className="h-6 w-6 text-green-500" />
                      </div>
                    )}
                  </div>
                ))
              )}

              {isLoading && (
                <div className="flex items-start space-x-3">
                  <Bot className="h-6 w-6 text-blue-500 flex-shrink-0" />
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <div className="flex items-center space-x-2">
                      <div className="animate-pulse">Thinking...</div>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
                  <p className="font-medium">Error:</p>
                  <p>{error}</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Quick Prompts */}
          {messages.length === 0 && (
            <div className="p-4 border-b">
              <p className="text-xs text-muted-foreground mb-2">Quick prompts:</p>
              <div className="flex flex-wrap gap-2">
                {getContextualPrompts().slice(0, 2).map((prompt) => (
                  <Button
                    key={prompt}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => handlePromptClick(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 space-y-2">
            <div className="flex space-x-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Ask me about ${tab === 'proposals' ? 'proposals and compliance' : 'recruiting and candidates'}...`}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || isLoading}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {featureFlags.chatAddToDraftGated && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Select an AI response to enable Add to draft.
                </span>
                <Button
                  onClick={handleAddToDraft}
                  disabled={isAddDisabled}
                  size="sm"
                  className={cn(
                    'bg-blue-600 text-white px-3 py-1 rounded',
                    isAddDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                  )}
                >
                  Add to draft
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
