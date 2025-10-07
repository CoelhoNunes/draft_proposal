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
import { callOpenAI, analyzePdf } from '../api/openai';

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
  const [draftContent, setDraftContent] = useState(`FedRAMP Security Assessment Proposal

Executive Summary

Our proposal is founded on a comprehensive, cost-effective, and secure cloud solution that aligns with NASA's objectives and FedRAMP requirements. We aim to deliver an innovative solution leveraging our rich experience and expertise in cloud computing, cybersecurity, and federal regulations. The core value proposition is to provide a resilient, scalable, and secure cloud environment that enhances NASA's operational efficiency, ensures data protection, and promotes cost savings.

This proposal addresses all critical FedRAMP security requirements through a multi-layered approach that includes:

• Comprehensive security controls implementation
• Continuous monitoring and compliance verification
• Robust incident response and contingency planning
• Staff training and awareness programs
• Regular audit and assessment procedures

Our approach ensures full compliance with FedRAMP Moderate Impact Level requirements while providing the flexibility and scalability needed for NASA's evolving mission requirements.

Security Controls Implementation

Access Control (AC)
Our system implements comprehensive access controls including:
- Multi-factor authentication for all users
- Role-based access control (RBAC) with principle of least privilege
- Regular access reviews and recertification
- Session management with automatic timeouts
- Privileged access management (PAM) for administrative accounts

Audit and Accountability (AU)
We maintain detailed audit logs for all system activities including:
- User authentication and authorization events
- Data access and modification activities
- System configuration changes
- Security-relevant events
- Log integrity protection and secure storage

Security Assessment and Authorization (CA)
Our continuous authorization approach includes:
- Regular vulnerability assessments
- Penetration testing by certified professionals
- Security control effectiveness evaluations
- Risk assessments and mitigation planning
- Continuous monitoring and reporting

Configuration Management (CM)
We maintain strict configuration management through:
- Baseline security configurations
- Change control procedures
- Configuration monitoring and compliance verification
- Automated configuration management tools
- Regular configuration reviews and updates

Contingency Planning (CP)
Our comprehensive contingency planning includes:
- Business continuity plans
- Disaster recovery procedures
- Data backup and recovery systems
- Emergency response procedures
- Regular testing and validation of contingency measures

Identification and Authentication (IA)
We implement robust identity and access management:
- Unique user identification
- Strong authentication mechanisms
- Identity proofing and verification
- Session management controls
- Authentication failure handling

Incident Response (IR)
Our incident response capabilities include:
- 24/7 security operations center (SOC)
- Incident detection and analysis
- Response procedures and escalation
- Post-incident review and improvement
- Coordination with relevant authorities

Maintenance (MA)
We maintain system security through:
- Controlled maintenance procedures
- Maintenance personnel screening
- Remote maintenance security
- Maintenance tools management
- Maintenance documentation

Media Protection (MP)
We protect information media through:
- Media access controls
- Media marking and labeling
- Media storage and transportation
- Media sanitization procedures
- Media disposal practices

Physical and Environmental Protection (PE)
We ensure physical security through:
- Physical access controls
- Environmental protection measures
- Personnel access controls
- Monitoring and logging
- Emergency procedures

Planning (PL)
Our security planning includes:
- Security planning documentation
- System security plans
- Rules of behavior
- Information system security awareness training
- Privacy impact assessments

Personnel Security (PS)
We maintain personnel security through:
- Personnel screening procedures
- Position risk designations
- Personnel termination procedures
- Personnel transfer procedures
- Access agreements

Risk Assessment (RA)
Our risk management approach includes:
- Risk assessments
- Vulnerability scanning
- Risk mitigation planning
- Continuous monitoring
- Risk reporting and communication

System and Services Acquisition (SA)
We ensure secure acquisition through:
- Security requirements definition
- Supplier security assessments
- Development process security
- Acquisition documentation
- Supply chain security

System and Communications Protection (SC)
We protect system communications through:
- Network security controls
- Boundary protection
- Cryptographic protection
- Secure communications
- Denial of service protection

System and Information Integrity (SI)
We maintain system integrity through:
- Information input validation
- Error handling and logging
- System monitoring
- Information output filtering
- Spam protection

Continuous Monitoring

Our continuous monitoring program provides real-time visibility into system security through:
- Automated security monitoring tools
- Regular vulnerability scanning
- Configuration compliance checking
- Performance monitoring
- Security metrics and reporting

Training and Awareness

We provide comprehensive security training including:
- Initial security awareness training for all personnel
- Role-specific security training
- Regular security updates and briefings
- Incident response training
- Compliance training programs

Implementation Timeline

Phase 1 (Months 1-3): Initial setup and basic controls
Phase 2 (Months 4-6): Advanced security controls implementation
Phase 3 (Months 7-9): Testing and validation
Phase 4 (Months 10-12): Full deployment and continuous monitoring

Conclusion

This proposal demonstrates our commitment to providing a secure, compliant, and effective cloud solution that meets all FedRAMP requirements while supporting NASA's mission objectives. Our comprehensive approach ensures both immediate compliance and long-term security posture maintenance.`);
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
  const [pdfProcessed, setPdfProcessed] = useState<string | null>(null);
  const [savedProposals, setSavedProposals] = useState<string[]>([]);
  const [chatPanelHeight, setChatPanelHeight] = useState(200);
  const [isResizing, setIsResizing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [currentRunName, setCurrentRunName] = useState<string>('');
  const [showRunNameModal, setShowRunNameModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [archivedRuns, setArchivedRuns] = useState<any[]>([]);
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
      const file = files[0];
      
      // Clear previous LLM suggestions for new run
      setLlmChanges([]);
      
      // Show run name modal
      setPendingFile(file);
      setShowRunNameModal(true);
    }
  };

  const handleRunNameSubmit = async () => {
    if (!pendingFile || !currentRunName.trim()) return;
    
    setIsLoading(true);
    try {
      console.log('Processing file:', pendingFile.name, 'for run:', currentRunName);

      // Ask LLM to analyze PDF contextually (backend must fetch pages/content server-side)
      const result = await analyzePdf(pendingFile);

      // Store uploaded PDF for review
      setUploadedPdf(pendingFile);
        
        // Use checklist items from API response if available
        if (result.checklistItems) {
          setChecklistItems(result.checklistItems);
        } else {
          // Parse LLM response into checklist items using labeled sections
          const lines = result.content.split('\n').map(l => l.trim());
          const startChecklist = lines.findIndex(l => /^Checklist:?$/i.test(l));
          const startDeliverables = lines.findIndex(l => /^Deliverables:?$/i.test(l));
          const checklistSlice = startChecklist !== -1 ? lines.slice(startChecklist + 1, startDeliverables !== -1 ? startDeliverables : undefined) : [];
          const requirementLines = checklistSlice.filter(l => l).map(l => l.replace(/^\d+\.?\s*/, ''));
          const pdfRequirements = requirementLines.slice(0, 50).map((label, idx) => ({
            id: Date.now() + idx + 1,
            title: label.replace(/^\d+\.?\s*/, '').replace(/\*\*/g, '').replace(/\*/g, ''),
            summary: `Summary for ${label}`,
            status: 'pending',
            description: '',
          source: 'pdf',
          deletable: false,
        }));
        setChecklistItems(prev => [...pdfRequirements, ...prev]);
        }
        
        // Update draft content with the full AI response
        setDraftContent(result.content);
        
        // Add to changes log
        const newChange = {
          id: Date.now(),
          author: 'ai',
          summary: `Processed uploaded document: ${pendingFile.name}`,
          content: `Extracted requirements from PDF. Added to checklist and auto-populated draft editor with comprehensive content.`,
          createdAt: new Date(),
        };
        setChanges(prev => [newChange, ...prev]);
        
        setPdfProcessed(pendingFile.name);
        setToast({ message: `Processed ${pendingFile.name} for run "${currentRunName}". Draft and checklist updated.`, type: 'success' });
        setTimeout(() => setToast(null), 5000);
        
        // Close modal and reset
        setShowRunNameModal(false);
        setPendingFile(null);
        setCurrentRunName('');
      } catch (error: any) {
        console.error('PDF upload failed:', error?.message || error);
        setToast({ message: 'Error processing PDF', type: 'error' });
        setTimeout(() => setToast(null), 5000);
      } finally {
        setIsLoading(false);
      }
  };

  // Handle export
  const handleExport = async () => {
    try {
      setIsLoading(true);
      
      // Create a workspace-like structure for the backend
      const exportData = {
        name: `FedRAMP_Proposal_${new Date().toISOString().split('T')[0]}`,
        draftContent,
        checklistItems,
        llmChanges
      };
      
      // Try to export via backend API
      const candidates = [
        `${window.location.protocol}//${window.location.hostname}:3000`,
        `${window.location.origin}`,
        `http://localhost:3000`,
        `http://127.0.0.1:3000`,
      ];
      
      let exportSuccess = false;
      for (const baseUrl of candidates) {
        try {
          // First, create a "run" via upload endpoint
          const formData = new FormData();
          formData.append('name', exportData.name);
          
          // Create a dummy file with our content
          const contentBlob = new Blob([draftContent], { type: 'text/plain' });
          formData.append('file', contentBlob, 'draft.txt');
          
          const uploadResponse = await fetch(`${baseUrl}/upload`, {
            method: 'POST',
            body: formData
          });
          
          if (uploadResponse.ok) {
            const uploadHtml = await uploadResponse.text();
            // Extract run ID from response
            const runIdMatch = uploadHtml.match(/run\/(\d+)/);
            if (runIdMatch) {
              const runId = runIdMatch[1];
              
              // Now try to export as PDF
              const exportResponse = await fetch(`${baseUrl}/run/${runId}/export`, {
                method: 'POST'
              });
              
              if (exportResponse.ok) {
                const exportHtml = await exportResponse.text();
                // Extract download link from response
                const downloadMatch = exportHtml.match(/href='([^']*\.pdf)'/);
                if (downloadMatch) {
                  const downloadPath = downloadMatch[1];
                  // Trigger download
                  window.open(`${baseUrl}${downloadPath}`, '_blank');
                  setToast({ message: 'PDF exported successfully!', type: 'success' });
                  setTimeout(() => setToast(null), 5000);
                  exportSuccess = true;
                  break;
                }
              }
            }
          }
        } catch (error) {
          console.log(`Failed to export via ${baseUrl}:`, error);
          continue;
        }
      }
      
      if (!exportSuccess) {
        // Fallback to text export
        const defaultName = `FedRAMP_Proposal_${new Date().toISOString().split('T')[0]}`;
        let fileName = prompt('PDF export unavailable. Enter a name for text export:', defaultName);
        
        if (!fileName) return;
        
        // Check if name already exists
        while (savedProposals.includes(fileName)) {
          fileName = prompt(`"${fileName}" already exists. Please enter a different name:`, `${fileName}_${Date.now()}`);
          if (!fileName) return;
        }
        
        // Add to saved proposals
        setSavedProposals(prev => [...prev, fileName]);
        
        // Create and download text content
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
        
        setToast({ message: `Text export saved as ${fileName}.txt (PDF export unavailable)`, type: 'success' });
        setTimeout(() => setToast(null), 5000);
      }
      
    } catch (error) {
      console.error('Export failed:', error);
      setToast({ message: 'Export failed. Please try again.', type: 'error' });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setIsLoading(false);
    }
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
      // Check if user wants to add content to draft
      const userRequestedEdit = /\b(add|insert|apply|update|modify|put this in|add to draft|add something about|include|write about)\b/i.test(currentMessage);

      // Call the backend chat API
      const response = await fetch('http://localhost:3000/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: currentMessage,
          context: {
            workspaceId: 'default-workspace',
            tab: 'proposals'
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Chat API failed');
      }

      const result = await response.json();
      const aiResponse = result.data.content;
      
      const aiMessage = {
        id: Date.now() + 1,
        text: aiResponse,
        author: 'ai',
        timestamp: new Date()
      };

      setChatHistory(prev => [...prev, aiMessage]);
      
      // Scroll to bottom after AI response
      setTimeout(() => scrollChatToBottom(), 50);

      // If user requested to add content, show suggestion confirmation
      if (userRequestedEdit) {
        // Extract content from AI response that should be added to draft
        const lines = aiResponse.split('\n').filter(line => line.trim());
        const contentToAdd = lines.join('\n').trim();
        
        if (contentToAdd) {
          setPendingSuggestions([contentToAdd]);
          setShowSuggestionConfirmation(true);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      // Add error message to chat
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm sorry, I encountered an error. Please try again or check your connection.",
        author: 'ai',
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, errorMessage]);
      setTimeout(() => scrollChatToBottom(), 50);
    }
  };

  const handleAddSuggestions = () => {
    if (pendingSuggestions.length > 0) {
      // Get current draft content length for positioning
      const currentLength = draftContent.length;
      
      // Clean and prepare content to add
      const contentToAdd = pendingSuggestions.join('\n\n').trim();
      const fullContent = currentLength > 0 ? '\n\n' + contentToAdd : contentToAdd;

      // Add to draft content
      setDraftContent(prev => prev + fullContent);

      // Add to LLM changes with position
      const changeId = Date.now();
      const llmChange: any = {
        id: changeId,
        type: 'llm_added_suggestion',
        content: contentToAdd,
        timestamp: new Date(),
        position: currentLength
      };
      setLlmChanges(prev => [...prev, llmChange]);

      // Add to changes log
      setChanges(prev => [...prev, {
        id: Date.now(),
        author: 'ai',
        summary: 'AI Content Added to Draft',
        content: `Added ${contentToAdd.length} characters to draft editor`,
        createdAt: new Date()
      }]);

      // Show confirmation in chat
      const confirmMessage = { 
        id: Date.now() + 1, 
        text: '✅ Content has been added to your draft! You can find it in the LLM Changes panel on the right.', 
        author: 'ai',
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, confirmMessage]);
      
      // Hide the confirmation panel
      setShowSuggestionConfirmation(false);
      setPendingSuggestions([]);
      
      // Scroll to bottom to show confirmation
      setTimeout(() => scrollChatToBottom(), 50);
    }
  };

  return (
    <>
    <div className="h-screen bg-gray-50 flex flex-col relative">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[60] px-6 py-4 rounded-lg border-2 shadow-xl font-semibold ${
            toast.type === 'success'
              ? 'bg-green-600 text-white border-green-700'
              : 'bg-red-600 text-white border-red-700'
          }`}
          role="status"
          aria-live="polite"
        >
          {toast.message}
        </div>
      )}
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
              <Button variant="primary" size="sm" onClick={handleExport} disabled={isLoading || completionRate < 100}>
                <Download className="h-4 w-4 mr-2" />
                {isLoading ? 'Exporting...' : 'Export PDF'}
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
                        {item.title || item.label}
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
                      {item.summary || item.description}
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
                      <Button variant="outline" size="sm" onClick={() => setShowRunNameModal(true)}>
                        <History className="h-4 w-4 mr-2" />
                        Archive
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
                        <p className="text-sm text-gray-900 mb-1">LLM-added suggestion</p>
                        <p className="text-xs text-gray-600 mb-2">
                          {(change.timestamp instanceof Date ? change.timestamp : new Date(change.timestamp)).toLocaleTimeString()}
                        </p>
                        <button
                          onClick={() => {
                            // Highlight the content in the draft
                            const textarea = document.querySelector('textarea');
                            if (textarea && change.position !== undefined && change.content) {
                              textarea.focus();
                              const startPos = change.position;
                              const endPos = startPos + change.content.length;
                              
                              // Ensure the positions are within bounds
                              const maxPos = textarea.value.length;
                              const safeStartPos = Math.min(startPos, maxPos);
                              const safeEndPos = Math.min(endPos, maxPos);
                              
                              if (safeStartPos < safeEndPos) {
                                textarea.setSelectionRange(safeStartPos, safeEndPos);
                                textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
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

    {/* Run Name Modal */}
    {showRunNameModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96">
          <h3 className="text-lg font-semibold mb-4">Name Your Run</h3>
          <p className="text-sm text-gray-600 mb-4">
            Give this PDF processing run a name to organize your work.
          </p>
          <input
            type="text"
            value={currentRunName}
            onChange={(e) => setCurrentRunName(e.target.value)}
            placeholder="e.g., FedRAMP Initial Assessment"
            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
            autoFocus
          />
          <div className="flex justify-end space-x-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowRunNameModal(false);
                setPendingFile(null);
                setCurrentRunName('');
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleRunNameSubmit}
              disabled={!currentRunName.trim() || isLoading}
            >
              {isLoading ? 'Processing...' : 'Start Run'}
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
