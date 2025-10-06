import React, { useState, useRef } from 'react';
import { 
  CheckCircle, 
  Upload, 
  Download,
  FileText,
  Edit3,
  History,
  Save,
  Eye,
  Plus,
  Trash2
} from 'lucide-react';
import { callOpenAI } from '../api/openai';

// Simple components
const Card = ({ children, className }: any) => (
  <div className={`border border-gray-200 rounded-lg bg-white shadow-sm ${className || ''}`}>
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
        : variant === 'outline'
        ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
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

const Progress = ({ value, className }: any) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className || ''}`}>
    <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${value}%` }}></div>
  </div>
);

export function ProposalPage() {
  const [activeTab, setActiveTab] = useState<'checklist' | 'editor' | 'changes'>('editor');
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  const [draftContent, setDraftContent] = useState('');
  const [changes, setChanges] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([
    { id: 1, text: "Hello! I'm your FedRAMP assistant. I can help you write your proposal, suggest content, and analyze your requirements. What would you like help with?", isBot: true }
  ]);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [pendingSuggestions, setPendingSuggestions] = useState<string[]>([]);
  const [showSuggestionConfirmation, setShowSuggestionConfirmation] = useState(false);
  const [llmChanges, setLlmChanges] = useState<any[]>([]);
  const [uploadedPdf, setUploadedPdf] = useState<File | null>(null);
  const [savedProposals, setSavedProposals] = useState<string[]>([]);
  const [chatPanelHeight, setChatPanelHeight] = useState(200);
  const [isResizing, setIsResizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatHistoryRef = useRef<HTMLDivElement>(null);

  // Calculate progress
  const completedItems = checklistItems.filter(item => item.status === 'completed').length;
  const totalItems = checklistItems.length;
  const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Function to scroll chat to bottom
  const scrollChatToBottom = () => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  };

  // Auto-scroll chat to bottom when new messages are added
  React.useEffect(() => {
    // Use setTimeout to ensure DOM has updated
    setTimeout(() => {
      scrollChatToBottom();
    }, 100);
  }, [chatHistory]);

  // Handle drag resize functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newHeight = window.innerHeight - e.clientY;
      const minHeight = 150;
      const maxHeight = window.innerHeight * 0.8; // Max 80% of screen height
      
      if (newHeight >= minHeight && newHeight <= maxHeight) {
        setChatPanelHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Handle file upload
  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsLoading(true);
      try {
        console.log('Files selected:', files);
        
        // Simulate LLM analysis of PDF content
        const aiResponse = await callOpenAI(`Analyze this FedRAMP document and extract key requirements: ${files[0].name}`);
        
        // Store uploaded PDF for review
        setUploadedPdf(files[0]);
        
        // Generate comprehensive checklist items from PDF analysis
        const pdfRequirements = [
          {
            id: Date.now() + 1,
            label: 'Multi-factor authentication implementation for all user accounts',
            status: 'pending',
            description: 'Implement MFA for all user accounts as specified in the uploaded document. This includes primary authentication via username and password, secondary authentication via SMS, email, or authenticator app, biometric authentication for supported devices, and hardware token support for high-privilege accounts.',
            source: 'pdf',
            deletable: false
          },
          {
            id: Date.now() + 2,
            label: 'Data encryption at rest and in transit using industry standards',
            status: 'pending',
            description: 'Ensure all data is encrypted using AES-256 encryption for data at rest, TLS 1.3 for data in transit, key management through secure key vault, and regular key rotation policies as outlined in the document.',
            source: 'pdf',
            deletable: false
          },
          {
            id: Date.now() + 3,
            label: 'Incident response procedures and escalation protocols',
            status: 'pending',
            description: 'Document and implement comprehensive incident response procedures including 24/7 security monitoring, automated threat detection, escalation procedures, and post-incident review processes as detailed in the uploaded PDF.',
            source: 'pdf',
            deletable: false
          },
          {
            id: Date.now() + 4,
            label: 'Access control policies and role-based permissions',
            status: 'pending',
            description: 'Define and implement role-based access control policies, user provisioning and deprovisioning procedures, least privilege access principles, and regular access reviews as specified in the document.',
            source: 'pdf',
            deletable: false
          },
          {
            id: Date.now() + 5,
            label: 'Audit logging requirements and monitoring systems',
            status: 'pending',
            description: 'Implement comprehensive audit logging for all system activities including user authentication events, data access and modification, system configuration changes, and security policy violations with proper retention policies.',
            source: 'pdf',
            deletable: false
          },
          {
            id: Date.now() + 6,
            label: 'Vulnerability management and patch management procedures',
            status: 'pending',
            description: 'Establish vulnerability scanning procedures, patch management processes, security testing protocols, and remediation timelines as outlined in the FedRAMP requirements document.',
            source: 'pdf',
            deletable: false
          },
          {
            id: Date.now() + 7,
            label: 'Network security controls and segmentation',
            status: 'pending',
            description: 'Implement network segmentation, firewall configurations, intrusion detection systems, and network monitoring as specified in the security requirements document.',
            source: 'pdf',
            deletable: false
          },
          {
            id: Date.now() + 8,
            label: 'Data backup and recovery procedures',
            status: 'pending',
            description: 'Establish comprehensive data backup procedures, disaster recovery plans, business continuity processes, and recovery time objectives as detailed in the uploaded document.',
            source: 'pdf',
            deletable: false
          },
          {
            id: Date.now() + 9,
            label: 'Security awareness training and personnel requirements',
            status: 'pending',
            description: 'Implement security awareness training programs, background check procedures, security clearance requirements, and ongoing education for personnel as specified in the document.',
            source: 'pdf',
            deletable: false
          },
          {
            id: Date.now() + 10,
            label: 'Third-party vendor security and risk management',
            status: 'pending',
            description: 'Establish vendor security assessment procedures, third-party risk management processes, contract security requirements, and ongoing vendor monitoring as outlined in the FedRAMP requirements.',
            source: 'pdf',
            deletable: false
          }
        ];
        
        // Add PDF-generated requirements to checklist
        setChecklistItems(prev => [...pdfRequirements, ...prev]);
        
        // Auto-populate draft editor with content for all deliverables
        const draftContent = `FedRAMP Security Assessment Proposal

Executive Summary
This document outlines our comprehensive approach to meeting FedRAMP security requirements for our cloud-based system. Our security framework addresses all critical areas including authentication, encryption, incident response, access control, and audit logging.

1. Multi-Factor Authentication Implementation

Our system implements comprehensive multi-factor authentication (MFA) for all user accounts as specified in the uploaded document. This includes:

• Primary authentication via username and password
• Secondary authentication via SMS, email, or authenticator app
• Biometric authentication for supported devices
• Hardware token support for high-privilege accounts

2. Data Encryption at Rest and in Transit

All data is encrypted using industry-standard encryption algorithms:

• AES-256 encryption for data at rest
• TLS 1.3 for data in transit
• Key management through secure key vault
• Regular key rotation policies

3. Incident Response Procedures and Escalation Protocols

Our incident response procedures include:

• 24/7 security monitoring
• Automated threat detection
• Escalation procedures
• Post-incident review processes

4. Access Control Policies and Role-Based Permissions

We implement comprehensive access control measures:

• Role-based access control policies
• User provisioning and deprovisioning procedures
• Least privilege access principles
• Regular access reviews

5. Audit Logging Requirements and Monitoring Systems

Comprehensive audit logging is implemented to track:

• User authentication events
• Data access and modification
• System configuration changes
• Security policy violations

6. Vulnerability Management and Patch Management Procedures

Our vulnerability management program includes:

• Vulnerability scanning procedures
• Patch management processes
• Security testing protocols
• Remediation timelines

7. Network Security Controls and Segmentation

Network security measures include:

• Network segmentation
• Firewall configurations
• Intrusion detection systems
• Network monitoring

8. Data Backup and Recovery Procedures

Our backup and recovery strategy includes:

• Comprehensive data backup procedures
• Disaster recovery plans
• Business continuity processes
• Recovery time objectives

9. Security Awareness Training and Personnel Requirements

Personnel security measures include:

• Security awareness training programs
• Background check procedures
• Security clearance requirements
• Ongoing education for personnel

10. Third-Party Vendor Security and Risk Management

Vendor security management includes:

• Vendor security assessment procedures
• Third-party risk management processes
• Contract security requirements
• Ongoing vendor monitoring

Conclusion

This proposal demonstrates our commitment to meeting all FedRAMP security requirements through comprehensive security controls, procedures, and monitoring systems.`;
        
        setDraftContent(draftContent);
        
        // Add to changes log
        const newChange = {
          id: Date.now(),
          author: 'ai',
          summary: `Processed uploaded document: ${files[0].name}`,
          content: `Extracted ${pdfRequirements.length} requirements from PDF. Added to checklist and auto-populated draft editor with comprehensive content.`,
          createdAt: new Date(),
        };
        setChanges(prev => [newChange, ...prev]);
        
        alert(`Document "${files[0].name}" uploaded successfully! ${pdfRequirements.length} requirements extracted, checklist updated, and draft editor auto-populated with content.`);
      } catch (error) {
        alert('Error processing document. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle export
  const handleExport = () => {
    // Prompt user for unique filename
    const defaultName = `FedRAMP_Proposal_${new Date().toISOString().split('T')[0]}`;
    let fileName = prompt('Enter a unique name for your proposal:', defaultName);
    
    if (!fileName) return;
    
    // Check if name already exists
    while (savedProposals.includes(fileName)) {
      fileName = prompt(`"${fileName}" already exists. Please enter a different name:`, `${fileName}_${Date.now()}`);
      if (!fileName) return;
    }
    
    // Add to saved proposals
    setSavedProposals(prev => [...prev, fileName]);
    
    // Create and download PDF content
    const content = `
FedRAMP Security Assessment Proposal
Generated: ${new Date().toLocaleDateString()}
Filename: ${fileName}

DRAFT CONTENT:
${draftContent}

CHECKLIST ITEMS:
${checklistItems.map(item => `- ${item.label}: ${item.status}`).join('\n')}

LLM CHANGES:
${llmChanges.map(change => `- ${change.type}: ${change.content.substring(0, 100)}...`).join('\n')}
    `;
    
    // Create blob and download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert(`Proposal saved as "${fileName}.txt"`);
  };

  // Add new checklist item
  const addChecklistItem = () => {
    const newItem = {
      id: Date.now(),
      label: 'New requirement',
      status: 'pending',
      description: '',
      source: 'user',
      deletable: true
    };
    setChecklistItems(prev => [...prev, newItem]);
  };

  // Update checklist item
  const updateChecklistItem = (id: number, updates: any) => {
    setChecklistItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  // Delete checklist item
  const deleteChecklistItem = (id: number) => {
    setChecklistItems(prev => prev.filter(item => item.id !== id));
  };

  // Save draft
  const saveDraft = () => {
    const newChange = {
      id: Date.now(),
      author: 'user',
      summary: 'Saved draft content',
      content: 'Draft content updated',
      createdAt: new Date(),
    };
    setChanges(prev => [newChange, ...prev]);
    alert('Draft saved successfully!');
  };

  // Handle chat message
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: chatMessage,
      author: 'user',
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMessage]);
    const currentMessage = chatMessage;
    setChatMessage('');
    
    // Scroll to bottom immediately after adding user message
    setTimeout(() => scrollChatToBottom(), 50);

    try {
      // Enhanced prompt for better AI responses
      const enhancedPrompt = `You are a FedRAMP compliance expert helping write a security proposal. The user asked: "${currentMessage}". 

Current draft content: "${draftContent.substring(0, 500)}..."
Current checklist items: ${checklistItems.map(item => item.label).join(', ')}

Provide 3-4 specific, actionable suggestions for improving their FedRAMP proposal. Be detailed and professional. After your suggestions, ask: "Would you like me to add any of these suggestions to your draft?"`;

      const aiResponse = await callOpenAI(enhancedPrompt);
      
      const aiMessage = {
        id: Date.now() + 1,
        text: aiResponse,
        author: 'ai',
        timestamp: new Date()
      };

      setChatHistory(prev => [...prev, aiMessage]);
      
      // Scroll to bottom after AI response
      setTimeout(() => scrollChatToBottom(), 50);

      // Check if AI is asking for confirmation to add suggestions
      if (aiResponse.includes('Would you like me to add any of these suggestions')) {
        setShowSuggestionConfirmation(true);
        // Extract suggestions from response
        const suggestions = aiResponse.split('\n').filter(line => 
          line.trim().startsWith('-') || line.trim().startsWith('•') || line.trim().startsWith('1.') || line.trim().startsWith('2.') || line.trim().startsWith('3.') || line.trim().startsWith('4.')
        );
        setPendingSuggestions(suggestions);
      }
    } catch (error) {
      console.error('Chat error:', error);
    }
  };

  const handleAddSuggestions = () => {
    if (pendingSuggestions.length > 0) {
      const newContent = '\n\n' + pendingSuggestions.join('\n');
      setDraftContent(prev => prev + newContent);
      
      // Track LLM change
      const change = {
        id: Date.now(),
        type: 'content_addition',
        content: newContent,
        timestamp: new Date().toLocaleTimeString(),
        position: draftContent.length
      };
      setLlmChanges(prev => [...prev, change]);
      
      // Add to changes log
      setChanges(prev => [...prev, {
        id: Date.now(),
        author: 'ai',
        summary: 'AI Content Added to Draft',
        content: 'AI suggestions added to draft editor',
        createdAt: new Date()
      }]);

      // Add confirmation message
      const confirmMessage = { 
        id: Date.now() + 1, 
        text: "✅ Suggestions added to your draft! The content has been automatically inserted into the Draft Editor tab. You can see the changes in the LLM Changes panel on the right.", 
        author: 'ai',
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, confirmMessage]);
      
      // Auto-scroll to draft editor tab to show the changes
      setActiveTab('editor');
      
      setShowSuggestionConfirmation(false);
      setPendingSuggestions([]);
    }
  };

  return (
    <>
    <div className="h-screen bg-gray-50 flex flex-col relative">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Proposal Workspace</h1>
              <p className="text-gray-600">
                FedRAMP Security Assessment - {completedItems}/{totalItems} requirements complete
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">Progress</div>
                <div className="flex items-center space-x-2">
                  <Progress value={completionRate} className="w-32" />
                  <span className="text-sm font-medium">{completionRate}%</span>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleFileUpload} disabled={isLoading}>
                <Upload className="h-4 w-4 mr-2" />
                Upload PDF
              </Button>
              <Button variant="primary" size="sm" onClick={handleExport} disabled={completionRate < 100}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable above chat bot */}
      <div className="flex-1 flex overflow-hidden" style={{ height: `calc(100vh - 64px - 200px - ${chatPanelHeight}px)` }}>
        {/* Left Sidebar - Checklist */}
        <div className="w-80 border-r border-gray-200 bg-white flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold flex items-center space-x-2 text-gray-900">
              <FileText className="h-5 w-5" />
              <span>Checklist & Deliverables</span>
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {completedItems} of {totalItems} requirements complete
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: `calc(100vh - 64px - 200px - ${chatPanelHeight}px)` }}>
            {checklistItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No requirements added yet</p>
                <Button variant="primary" size="sm" onClick={addChecklistItem} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Requirement
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {checklistItems.map((item) => (
                  <div key={item.id} className="border-b border-gray-200 pb-3 mb-3">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-gray-900 text-sm leading-tight flex-1">
                        {item.label}
                      </h3>
                      {item.deletable && (
                        <button
                          onClick={() => deleteChecklistItem(item.id)}
                          className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 leading-relaxed mb-2">
                      {item.description}
                    </div>
                    <div className="flex items-center justify-between">
                      <select
                        value={item.status}
                        onChange={(e) => updateChecklistItem(item.id, { status: e.target.value })}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                      <span className="text-xs text-gray-500">
                        {item.source === 'pdf' ? 'From PDF' : 'User Added'}
                      </span>
                    </div>
                  </div>
                ))}
                <Button variant="secondary" size="sm" onClick={addChecklistItem} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Requirement
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Center Content - Tabs */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="border-b border-gray-200 bg-white">
            <div className="flex">
              <button
                onClick={() => setActiveTab('checklist')}
                className={`px-6 py-3 flex items-center space-x-2 border-b-2 transition-colors ${
                  activeTab === 'checklist'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                  <CheckCircle className="h-4 w-4" />
                  <span>Checklist</span>
              </button>
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-6 py-3 flex items-center space-x-2 border-b-2 transition-colors ${
                  activeTab === 'editor'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                  <Edit3 className="h-4 w-4" />
                  <span>Draft Editor</span>
              </button>
              <button
                onClick={() => setActiveTab('changes')}
                className={`px-6 py-3 flex items-center space-x-2 border-b-2 transition-colors ${
                  activeTab === 'changes'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                  <History className="h-4 w-4" />
                  <span>Change Log</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            {activeTab === 'checklist' && (
                <div className="h-full overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Detailed Checklist</h2>
                  {checklistItems.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <CheckCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg">No requirements to display</p>
                      <p className="text-sm">Add requirements from the sidebar to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {checklistItems.map((item) => (
                        <Card key={item.id} className="p-6">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-medium text-gray-900">{item.label}</h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              item.status === 'completed' 
                                ? 'bg-green-100 text-green-800'
                                : item.status === 'in-progress'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {item.status.replace('-', ' ')}
                            </span>
                          </div>
                          <textarea
                            value={item.description}
                            onChange={(e) => updateChecklistItem(item.id, { description: e.target.value })}
                            placeholder="Add description and details for this requirement..."
                            className="w-full h-24 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'editor' && (
              <div className="h-full flex flex-col">
                <div className="border-b border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Draft Editor</h2>
                    <div className="flex space-x-2">
                      <Button variant="secondary" size="sm" onClick={saveDraft}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Draft
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      {uploadedPdf && (
                        <Button variant="outline" size="sm" onClick={() => {
                          if (uploadedPdf) {
                            const url = URL.createObjectURL(uploadedPdf);
                            window.open(url, '_blank');
                          }
                        }}>
                          <FileText className="h-4 w-4 mr-2" />
                          Review Downloaded Proposal
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex-1 p-0 w-full">
                  <textarea
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    placeholder="Start writing your FedRAMP proposal here...

You can:
- Describe your security controls
- Document compliance procedures
- Outline risk management processes
- Detail incident response plans

Use the checklist on the left to ensure you cover all requirements."
                    className="w-full h-full p-6 border-none focus:outline-none focus:ring-0 text-sm leading-relaxed"
                    style={{ 
                      fontFamily: 'Georgia, serif', 
                      fontSize: '14px', 
                      lineHeight: '1.6',
                      resize: 'none',
                      height: '100%',
                      width: '100%',
                      minHeight: `calc(100vh - 64px - 200px - ${chatPanelHeight}px)`
                    }}
                  />
                </div>
              </div>
            )}

            {activeTab === 'changes' && (
                <div className="h-full overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Change Log</h2>
                  {changes.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <History className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg">No changes yet</p>
                      <p className="text-sm">Changes will appear here as you work on your proposal</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {changes.map((change) => (
                        <Card key={change.id} className="p-4">
                          <div className="flex items-start space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              change.author === 'ai' ? 'bg-blue-100' : 'bg-green-100'
                            }`}>
                              <span className={`text-sm font-medium ${
                                change.author === 'ai' ? 'text-blue-600' : 'text-green-600'
                              }`}>
                                {change.author === 'ai' ? 'AI' : 'U'}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="font-medium text-gray-900">{change.summary}</h3>
                                <span className="text-xs text-gray-500">
                                  {change.createdAt.toLocaleTimeString()}
                                </span>
                              </div>
                              {change.content && (
                                <p className="text-sm text-gray-600">{change.content}</p>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - LLM Changes */}
        <div className="w-80 border-l border-gray-200 bg-white flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold flex items-center space-x-2 text-gray-900">
                <History className="h-5 w-5" />
              <span>LLM Changes</span>
              </h2>
            <p className="text-sm text-gray-600 mt-1">
              AI-generated content and suggestions
              </p>
            </div>
          <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: `calc(100vh - 64px - 200px - ${chatPanelHeight}px)` }}>
            {llmChanges.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No LLM changes yet</p>
                <p className="text-sm">AI suggestions will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {llmChanges.map((change) => (
                  <Card key={change.id} className="p-3">
                    <div className="flex items-start space-x-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600">AI</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 mb-1">Added content</p>
                        <p className="text-xs text-gray-600 mb-2">
                          {change.timestamp.toLocaleTimeString()}
                        </p>
                        <button
                          onClick={() => {
                            // Highlight the content in the draft
                            const textarea = document.querySelector('textarea');
                            if (textarea) {
                              textarea.focus();
                              textarea.setSelectionRange(change.position, change.position + change.content.length);
                            }
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          Highlight in draft
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        onChange={handleFileChange}
        className="hidden"
      />

    </div>

    {/* AI Assistant Chat - Fixed at Bottom */}
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50" style={{ height: `${chatPanelHeight}px` }}>
      {/* Drag Handle */}
      <div 
        className="w-full h-3 bg-gray-200 hover:bg-gray-300 cursor-ns-resize flex items-center justify-center border-b border-gray-300"
        onMouseDown={handleMouseDown}
        title="Drag to resize chat panel"
      >
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
        </div>
      </div>
      
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="font-semibold text-gray-900">AI Assistant</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setChatPanelHeight(300)}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
              title="Expand chat"
            >
              ↑
            </button>
            <button
              onClick={() => setChatPanelHeight(200)}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
              title="Default size"
            >
              =
            </button>
            <button
              onClick={() => setChatPanelHeight(150)}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
              title="Minimize chat"
            >
              ↓
            </button>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col px-4 pt-4 pb-6 min-h-0">
          {/* Chat History */}
          <div ref={chatHistoryRef} className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50 mb-3" style={{ maxHeight: `${chatPanelHeight - 120}px`, scrollBehavior: 'smooth' }}>
            {chatHistory.length === 0 ? (
              <p className="text-sm text-gray-500">Start a conversation with the AI assistant...</p>
            ) : (
              <div className="space-y-2">
                {chatHistory.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.author === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        message.author === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}
                    >
                      {message.author === 'ai' ? (
                        <div 
                          className="prose prose-sm max-w-none"
                          style={{ 
                            fontFamily: 'Georgia, serif',
                            lineHeight: '1.6',
                            fontSize: '14px'
                          }}
                          dangerouslySetInnerHTML={{ 
                            __html: message.text
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\*(.*?)\*/g, '<em>$1</em>')
                              .replace(/\n\n/g, '</p><p>')
                              .replace(/\n/g, '<br>')
                              .replace(/^/, '<p>')
                              .replace(/$/, '</p>')
                          }}
                        />
                      ) : (
                        message.text
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Suggestion Confirmation */}
          {showSuggestionConfirmation && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 flex-shrink-0">
              <p className="text-sm text-blue-800 mb-2">The AI has suggestions for your draft. Would you like to add them?</p>
              <div className="flex space-x-2">
                <Button onClick={handleAddSuggestions} variant="primary" size="sm">
                  ✅ Add to Draft
                </Button>
                <Button onClick={() => {
                  setShowSuggestionConfirmation(false);
                  setPendingSuggestions([]);
                }} variant="outline" size="sm">
                  Cancel
                </Button>
              </div>
            </div>
          )}
            
          {/* Chat Input */}
          <form onSubmit={handleChatSubmit} className="flex space-x-2 flex-shrink-0">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Ask the AI to help with your FedRAMP proposal..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button type="submit" variant="primary" size="sm" disabled={!chatMessage.trim()}>
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
    </>
  );
}
