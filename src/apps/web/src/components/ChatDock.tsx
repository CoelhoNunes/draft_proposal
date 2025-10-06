/**
 * @fileoverview Chat dock component for AI assistance
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Minimize2, 
  Maximize2,
  MessageSquare,
  Settings,
  X
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
// Simple utilities
const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ');
const formatDate = (date: Date) => date.toLocaleTimeString();

interface ChatDockProps {
  workspaceId: string;
  tab: 'proposals' | 'recruiting';
}

export function ChatDock({ workspaceId, tab }: ChatDockProps) {
  const [message, setMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    isOpen,
    messages,
    isLoading,
    error,
    toggleChat,
    sendMessage,
    setContext
  } = useChatStore();

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

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-[600px] z-50">
      <Card className="shadow-2xl border-2">
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
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
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
            isExpanded ? 'h-96' : 'h-64'
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
                        {msg.role === 'ai' ? (
                          <Bot className="h-6 w-6 text-blue-500" />
                        ) : (
                          <MessageSquare className="h-6 w-6 text-gray-500" />
                        )}
                      </div>
                    )}
                    
                    <div className={cn(
                      'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : msg.role === 'ai'
                        ? 'bg-muted'
                        : 'bg-blue-50 text-blue-800 text-center'
                    )}>
                      <p>{msg.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {formatDate(msg.timestamp)}
                      </p>
                    </div>

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
          <div className="p-4">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
