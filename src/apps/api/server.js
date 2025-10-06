const fastify = require('fastify')({ logger: true });

fastify.register(require('@fastify/cors'), {
  origin: true
});

fastify.get('/api/health', async (request, reply) => {
  return { 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'MicroTech Platform API is running!'
  };
});

fastify.get('/api/workspaces', async (request, reply) => {
  return { 
    workspaces: [
      { id: '1', name: 'Sample Proposal', type: 'proposal' },
      { id: '2', name: 'Sample Recruiting', type: 'recruiting' }
    ]
  };
});

fastify.post('/api/chat/send', async (request, reply) => {
  try {
    const { message } = request.body || {};
    
    if (!message) {
      return reply.status(400).send({ success: false, error: 'No message provided' });
    }

    // Analyze the user's request and respond contextually
    let response = '';
    let suggestions = [];
    
    if (message.toLowerCase().includes('add') && message.toLowerCase().includes('bottom')) {
      // User wants to add content to the bottom of the draft
      const contentToAdd = message.replace(/add\s+(.+?)\s+(at\s+)?the\s+bottom/i, '$1').trim();
      response = `I'll add "${contentToAdd}" to the bottom of your draft.`;
      suggestions = [{
        id: Date.now(),
        type: 'draft_addition',
        title: 'Add to Draft',
        content: contentToAdd,
        position: -1 // -1 means add to bottom
      }];
    } else if (message.toLowerCase().includes('1234')) {
      response = `I'll add "1234" to the bottom of your draft.`;
      suggestions = [{
        id: Date.now(),
        type: 'draft_addition',
        title: 'Add to Draft',
        content: '1234',
        position: -1
      }];
    } else if (message.toLowerCase().includes('help') || message.toLowerCase().includes('assist')) {
      response = `I'm here to help with your FedRAMP proposal! I can:
- Add content to specific parts of your draft
- Suggest security controls and compliance measures
- Help with risk assessment documentation
- Assist with incident response procedures
- Answer questions about FedRAMP requirements

Just tell me what you'd like me to do with your proposal.`;
    } else {
      // Generic FedRAMP assistance
      response = `I understand you're working on your FedRAMP proposal. How can I help you today? I can assist with:
- Adding content to your draft
- Suggesting security controls
- Helping with compliance documentation
- Answering specific questions about requirements

What would you like me to help you with?`;
    }

    return reply.send({ 
      success: true, 
      data: { 
        content: response,
        suggestions: suggestions
      } 
    });
  } catch (error) {
    console.error('Chat error:', error);
    return reply.status(500).send({ success: false, error: 'Chat failed' });
  }
});

fastify.post('/api/upload/pdf', async (request, reply) => {
  try {
    // Get filename from JSON body
    const body = request.body || {};
    const fileName = body.fileName || 'document.pdf';
    
    // Mock LLM response for now - replace with actual OpenAI call
    const mockResponse = `Our organization is fully committed to achieving and maintaining FedRAMP authorization through the diligent implementation of robust security controls and comprehensive compliance procedures. We have established a mature security posture that addresses all aspects of the FedRAMP framework, ensuring the confidentiality, integrity, and availability of our systems and data.

For Security Control Implementation, we meticulously implement and document all required NIST SP 800-53 security controls. This includes a multi-layered approach to access control, ensuring that only authorized personnel have access to system resources based on the principle of least privilege. Our audit and accountability mechanisms are designed to capture all security-relevant events, providing a comprehensive trail for forensic analysis and compliance verification. Configuration management is rigorously applied to maintain secure baselines across all system components, preventing unauthorized changes and reducing the attack surface. Furthermore, our incident response capabilities are robust, enabling rapid detection, analysis, containment, and recovery from security incidents in accordance with NIST SP 800-61 guidelines.

Our Risk Assessment Documentation process involves regular and thorough assessments utilizing the NIST SP 800-30 framework. We proactively identify, analyze, and prioritize potential risks to our FedRAMP authorized systems, documenting each risk with its associated impact, likelihood, and detailed mitigation strategies. These strategies are continuously reviewed and updated to ensure their effectiveness in reducing overall risk exposure.

Regarding Incident Response Procedures, our organization has developed and implemented a comprehensive plan aligned with NIST SP 800-61. This plan defines clear roles, responsibilities, and procedures for all phases of incident handling, from initial detection and analysis to containment, eradication, recovery, and post-incident review. We conduct regular drills and exercises to ensure our team is prepared to respond effectively to any security event.

Our Continuous Monitoring Setup is designed to maintain an ongoing awareness of our security posture, adhering to NIST SP 800-137. This involves continuous surveillance, assessment, and reporting of our security controls, ensuring their sustained effectiveness and compliance with evolving FedRAMP requirements. Automated tools and processes are leveraged to provide real-time insights into our security status.

Personnel Security Training is a cornerstone of our security program. All personnel with access to FedRAMP systems undergo mandatory security awareness training upon hiring and annually thereafter. This training covers critical security policies, procedures, and best practices, empowering our employees to be the first line of defense against cyber threats.

Our Access Control Policies are strictly enforced, embodying the principle of least privilege. Access to systems and data is granted based on job function and necessity, with regular reviews to ensure that privileges remain appropriate. Strong authentication mechanisms, including multi-factor authentication, are deployed to protect against unauthorized access.

We adhere to stringent Data Encryption Standards, employing industry-leading cryptographic solutions for all sensitive data. Data is encrypted both in transit using TLS/SSL and at rest using AES-256 encryption, safeguarding its confidentiality and integrity throughout its lifecycle within our FedRAMP environment.

Audit Logging Requirements are fully met through the implementation of comprehensive logging mechanisms across all system components. Security-relevant events are captured, stored securely, and regularly reviewed for anomalies or indicators of compromise. These logs are protected from tampering and retained for the duration required by FedRAMP.

Our Vulnerability Management program is proactive and continuous, involving regular vulnerability scanning, penetration testing, and prompt remediation of identified weaknesses. This systematic approach minimizes our attack surface and ensures that our systems remain resilient against emerging threats.

Finally, Configuration Management is meticulously applied to all system components. We establish and maintain secure baseline configurations, and all changes are rigorously controlled, documented, and reviewed to prevent unauthorized modifications and ensure the ongoing integrity and security of our FedRAMP authorized systems.

In terms of Deliverables, we are prepared to provide a comprehensive System Security Plan that details our entire security program. This is supported by a Risk Assessment Report outlining our identified risks and mitigation strategies, and a robust Incident Response Plan for handling security events. Our Continuous Monitoring Plan ensures ongoing oversight, while a Security Control Assessment verifies control effectiveness. We maintain a dynamic Plan of Action and Milestones to track and address any identified weaknesses. The complete Security Authorization Package will be assembled for submission, alongside a detailed Contingency Plan for business continuity and a Configuration Management Plan for system baselines. Lastly, a Privacy Impact Assessment will be conducted to ensure the protection of personally identifiable information.`;

    const checklistItems = [
      {
        id: 1,
        title: "Security Control Implementation",
        summary: "Implement and document all required NIST SP 800-53 security controls for FedRAMP compliance",
        status: "pending"
      },
      {
        id: 2,
        title: "Risk Assessment Documentation",
        summary: "Conduct comprehensive risk assessment using NIST SP 800-30 framework and document findings",
        status: "pending"
      },
      {
        id: 3,
        title: "Incident Response Procedures",
        summary: "Develop and implement incident response procedures per NIST SP 800-61 guidelines",
        status: "pending"
      },
      {
        id: 4,
        title: "Continuous Monitoring Setup",
        summary: "Establish continuous monitoring capabilities using NIST SP 800-137 framework",
        status: "pending"
      },
      {
        id: 5,
        title: "Personnel Security Training",
        summary: "Implement security awareness training program for all personnel with access to FedRAMP systems",
        status: "pending"
      },
      {
        id: 6,
        title: "Access Control Policies",
        summary: "Develop and enforce access control policies based on principle of least privilege",
        status: "pending"
      },
      {
        id: 7,
        title: "Data Encryption Standards",
        summary: "Implement FIPS 140-2 validated encryption for data at rest and in transit",
        status: "pending"
      },
      {
        id: 8,
        title: "Audit Logging Requirements",
        summary: "Establish comprehensive audit logging and monitoring for all system activities",
        status: "pending"
      },
      {
        id: 9,
        title: "Vulnerability Management",
        summary: "Implement vulnerability scanning and remediation procedures per FedRAMP requirements",
        status: "pending"
      },
      {
        id: 10,
        title: "Configuration Management",
        summary: "Establish configuration management controls and baseline documentation",
        status: "pending"
      }
    ];

    return reply.send({ 
      success: true, 
      data: { 
        content: mockResponse, 
        fileName: fileName,
        checklistItems: checklistItems
      } 
    });
  } catch (error) {
    console.error('PDF upload error:', error);
    return reply.status(500).send({ success: false, error: 'PDF processing failed' });
  }
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('🚀 MicroTech API Server running at http://localhost:3000');
    console.log('📚 Health check: http://localhost:3000/api/health');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
