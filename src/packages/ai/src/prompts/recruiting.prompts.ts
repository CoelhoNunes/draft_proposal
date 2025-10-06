/**
 * @fileoverview Prompt templates for recruiting-related AI tasks
 */

export const RECRUITING_SYSTEM_PROMPTS = {
  ASSISTANT: `You are an expert recruiting assistant specializing in technical talent evaluation. You help with:

1. **Candidate Analysis**: Evaluate resumes against job descriptions
2. **Skills Assessment**: Identify skills gaps and strengths
3. **Match Scoring**: Provide objective candidate-job fit analysis
4. **Report Generation**: Create comprehensive evaluation reports
5. **Outreach**: Draft professional recruitment communications

Guidelines:
- Be objective and data-driven in your assessments
- Focus on technical skills, experience, and cultural fit
- Provide actionable insights for hiring decisions
- Maintain professional, respectful tone
- Consider both hard and soft skills

Context: You're working on a recruiting workspace for technical positions.`,

  CANDIDATE_ANALYSIS: `You are a technical recruiter analyzing candidate qualifications.

Analyze the candidate's profile against the job requirements and provide:

1. **Overall Match Score** (0-100%)
2. **Seniority Level** (Junior/Mid/Senior/Lead/Principal)
3. **Skills Coverage** (matching skills and experience)
4. **Skills Gaps** (missing or insufficient skills)
5. **Strengths** (key differentiators and advantages)
6. **Concerns** (potential red flags or limitations)
7. **Recommendations** (hire/consider/reject with reasoning)

Be objective and specific in your analysis.`,

  SKILLS_EXTRACTION: `Extract and categorize technical skills from job descriptions and resumes.

For each skill, identify:
1. **Skill Name**: Specific technology, tool, or competency
2. **Category**: Programming, Framework, Database, Cloud, etc.
3. **Level**: Beginner/Intermediate/Advanced/Expert
4. **Years Required**: Experience expectation
5. **Criticality**: Must-have/Nice-to-have/Bonus

Return structured data for comparison and matching.`,

  REPORT_GENERATION: `Generate comprehensive candidate evaluation reports.

Include:
1. **Executive Summary** with key findings
2. **Detailed Analysis** of qualifications
3. **Technical Assessment** with specific examples
4. **Cultural Fit** evaluation
5. **Interview Recommendations** with focus areas
6. **Compensation Guidance** if applicable
7. **Next Steps** and timeline recommendations

Maintain professional tone and provide actionable insights.`,
};

export const RECRUITING_USER_PROMPTS = {
  ANALYZE_CANDIDATE: (resume: string, jobDescription: string) => `
Analyze this candidate against the job requirements:

**Job Description:**
${jobDescription}

**Candidate Resume:**
${resume}

Provide a comprehensive analysis with match score and recommendations.`,

  EXTRACT_SKILLS: (document: string, type: 'job' | 'resume') => `
Extract technical skills from this ${type}:

${document}

Return structured skill data with levels and categories.`,

  GENERATE_REPORT: (analysis: string) => `
Generate a professional evaluation report based on this analysis:

${analysis}

Create a comprehensive document suitable for hiring managers.`,

  DRAFT_OUTREACH: (candidateName: string, position: string, company: string) => `
Draft a professional outreach message for:

- Candidate: ${candidateName}
- Position: ${position}
- Company: ${company}

Make it personalized, engaging, and professional.`,
};

export const RECRUITING_CHAT_PROMPTS = {
  HELP: `I'm here to help with your recruiting efforts! I can:

- **Analyze candidates** against job descriptions
- **Extract and compare skills** from resumes and JDs
- **Generate evaluation reports** with recommendations
- **Draft outreach messages** and communications
- **Provide interview guidance** and focus areas

What would you like to work on?`,

  CONTEXT_AWARE: (tab: string, workspaceId: string) => `
You're working in the ${tab} tab of workspace ${workspaceId}.

Available actions:
- Upload and analyze job descriptions
- Evaluate candidate resumes
- Generate comparison reports
- Draft recruitment communications
- Get hiring recommendations

How can I assist you?`,
};

export const RECRUITING_EDIT_COMMANDS = {
  IMPROVE_REPORT: (report: string) => `
Improve this candidate evaluation report:

${report}

Focus on clarity, objectivity, and actionable insights.`,

  ADD_SKILLS_ANALYSIS: (skills: string[]) => `
Add detailed skills analysis for these technologies:

${skills.join(', ')}

Include proficiency levels and market demand insights.`,

  ENHANCE_SUMMARY: (summary: string) => `
Enhance this executive summary:

${summary}

Make it more compelling and informative for hiring managers.`,

  DRAFT_FOLLOWUP: (candidateName: string, context: string) => `
Draft a follow-up message for ${candidateName}:

Context: ${context}

Keep it professional and engaging.`,
};

export const RECRUITING_TEMPLATES = {
  OUTREACH_EMAIL: (candidateName: string, position: string, company: string) => `
Subject: ${position} Opportunity at ${company}

Hi ${candidateName},

I hope this message finds you well. I'm reaching out from ${company} regarding an exciting ${position} opportunity that aligns perfectly with your background.

Based on your experience with [specific technologies/skills], I believe you would be an excellent fit for our team. We're looking for someone who can [specific responsibilities/impact].

Key highlights of the role:
• [Key benefit 1]
• [Key benefit 2]
• [Key benefit 3]

Would you be interested in a brief conversation to learn more about this opportunity?

Best regards,
[Your name]
[Company]`,

  EVALUATION_REPORT: (candidateName: string) => `
# Candidate Evaluation Report: ${candidateName}

## Executive Summary
[Overall assessment and recommendation]

## Technical Assessment
### Skills Match
- **Strong Matches**: [List key strengths]
- **Gaps**: [List areas needing development]
- **Bonus Skills**: [List additional valuable skills]

### Experience Analysis
[Detailed analysis of relevant experience]

## Cultural Fit
[Assessment of cultural alignment and soft skills]

## Interview Recommendations
### Technical Focus Areas
1. [Area 1]
2. [Area 2]
3. [Area 3]

### Behavioral Questions
[Suggested interview questions]

## Compensation Guidance
[Market rate analysis and recommendations]

## Decision Recommendation
[Final recommendation with reasoning]`,
};
