import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  Plus,
  Upload,
  MessageSquare,
  Send,
  X
} from 'lucide-react';

// Simple components
const Card = ({ children, className, onClick }: any) => (
  <div 
    className={`border border-gray-200 rounded-lg bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${className || ''}`}
    onClick={onClick}
  >
    {children}
  </div>
);

const Button = ({ children, className, onClick, variant = 'default', size = 'default', disabled, ...props }: any) => (
  <button
    className={`px-4 py-2 rounded-md font-medium transition-colors ${
      disabled 
        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
        : variant === 'primary' 
        ? 'bg-blue-600 text-white hover:bg-blue-700' 
        : variant === 'secondary'
        ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    } ${
      size === 'sm' ? 'px-3 py-1.5 text-sm' : size === 'lg' ? 'px-6 py-3' : ''
    } ${className || ''}`}
    onClick={onClick}
    disabled={disabled}
    {...props}
  >
    {children}
  </button>
);

// Chatbot component
const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm your FedRAMP assistant. How can I help you today?", isBot: true }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    const newMessage = { id: Date.now(), text: inputValue, isBot: false };
    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    
    // Simulate bot response
    setTimeout(() => {
      const botResponse = { 
        id: Date.now() + 1, 
        text: "I understand you're asking about: " + inputValue + ". Let me help you with that!", 
        isBot: true 
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
      >
        <MessageSquare className="h-6 w-6" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 h-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">FedRAMP Assistant</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    message.isBot
                      ? 'bg-gray-100 text-gray-900'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                onClick={handleSendMessage}
                variant="primary"
                size="sm"
                disabled={!inputValue.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export function HomePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Here you would handle the file upload
      console.log('Files selected:', files);
      alert(`Selected ${files.length} file(s). Upload functionality will be implemented.`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">MicroTech Platform</h1>
              <p className="text-lg text-gray-600">FedRAMP Proposal Assistant & Recruiting Platform</p>
            </div>
            <div className="flex space-x-4">
              <Button variant="secondary" onClick={() => navigate('/recruiting')}>
                <Users className="h-5 w-5 mr-2" />
                Recruiting
              </Button>
              <Button variant="primary" onClick={() => navigate('/proposal')}>
                <Plus className="h-5 w-5 mr-2" />
                New Proposal
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card 
            className="hover:border-blue-300 hover:shadow-lg transition-all duration-300 group" 
            onClick={() => navigate('/proposal')}
          >
            <div className="flex items-center">
              <div className="p-4 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">Create Proposal</h3>
                <p className="text-gray-600">Start a new FedRAMP proposal</p>
              </div>
            </div>
          </Card>

          <Card 
            className="hover:border-green-300 hover:shadow-lg transition-all duration-300 group" 
            onClick={() => navigate('/recruiting')}
          >
            <div className="flex items-center">
              <div className="p-4 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">Recruiting</h3>
                <p className="text-gray-600">Find and compare candidates</p>
              </div>
            </div>
          </Card>

          <Card 
            className="hover:border-purple-300 hover:shadow-lg transition-all duration-300 group" 
            onClick={handleFileUpload}
          >
            <div className="flex items-center">
              <div className="p-4 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                <Upload className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">Upload Documents</h3>
                <p className="text-gray-600">Import existing proposals</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Welcome Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Your Workspace</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get started by creating a new proposal, managing your recruiting pipeline, or uploading existing documents. 
            Your FedRAMP assistant is here to help guide you through the process.
          </p>
        </div>

        {/* Getting Started Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Start Your First Proposal</h3>
              <p className="text-gray-600 mb-6">
                Create a comprehensive FedRAMP proposal with our guided workflow and templates.
              </p>
              <Button variant="primary" onClick={() => navigate('/proposal')}>
                Create Proposal
              </Button>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Find the Right Team</h3>
              <p className="text-gray-600 mb-6">
                Discover qualified candidates for your FedRAMP compliance team.
              </p>
              <Button variant="primary" onClick={() => navigate('/recruiting')}>
                Start Recruiting
              </Button>
            </div>
          </Card>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Chatbot */}
      <Chatbot />
    </div>
  );
}
