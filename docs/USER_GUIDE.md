# User Guide

## Overview

This guide provides comprehensive instructions for using the MicroTech platform, including getting started, navigating the interface, and utilizing key features.

## Getting Started

### 1. Account Setup
1. **Registration**: Create your account using your company email
2. **Verification**: Verify your email address
3. **Profile Setup**: Complete your profile information
4. **Permissions**: Request access to required workspaces

### 2. First Login
1. **Login**: Use your credentials to log in
2. **Dashboard**: Explore the Home dashboard
3. **Navigation**: Familiarize yourself with the navigation
4. **Settings**: Configure your preferences

### 3. Initial Configuration
- **Profile**: Update your profile information
- **Preferences**: Set your application preferences
- **Notifications**: Configure notification settings
- **Workspaces**: Join relevant workspaces

## Navigation

### 1. Main Navigation
- **Home**: Dashboard with recent activities and quick actions
- **Proposal**: 3-column workspace for proposal management
- **Recruiting**: Parallel workspace for recruiting activities
- **Settings**: User preferences and account settings

### 2. Sidebar Navigation
- **Recent Workspaces**: Quick access to recent workspaces
- **Favorites**: Bookmarked workspaces and documents
- **Teams**: Access to team workspaces
- **Templates**: Available document templates

### 3. Breadcrumb Navigation
- **Current Location**: Shows your current location in the application
- **Quick Navigation**: Click on breadcrumb items to navigate
- **Context**: Provides context for your current location

## Home Dashboard

### 1. Overview
The Home dashboard provides a centralized view of your activities and quick access to key features.

### 2. Key Sections
- **Recent Activities**: List of recent document uploads and edits
- **Quick Actions**: Shortcuts to common tasks
- **Status Widgets**: System status and connectivity information
- **Notifications**: Important alerts and updates

### 3. Quick Actions
- **Upload Document**: Upload a new proposal or document
- **Start New Draft**: Create a new proposal draft
- **Open Workspace**: Access your workspaces
- **View Reports**: Access generated reports

## Proposal Workspace

### 1. 3-Column Layout
The Proposal workspace features a 3-column layout optimized for proposal management:

#### Left Column - Checklist Panel
- **Auto-Populated**: Checklist items automatically generated from uploaded documents
- **Manual Items**: Add custom checklist items
- **Status Tracking**: Track completion status of each item
- **Progress Indicator**: Visual progress indicator for overall completion

#### Center Column - Draft Editor
- **Rich Text Editing**: Full-featured rich text editor with formatting options
- **Live Editing**: Real-time editing with auto-save
- **Collaboration**: Multiple users can edit simultaneously
- **Version Control**: Track changes and maintain document history
- **Add-to-Draft Control**: AI-generated text appears in the Draft Intelligence panel and is only inserted into the editor after selecting **Add to draft**.
- **Checklist Intelligence**: Use “Draft from checklist” to compose structured content mapped to deliverables without auto-inserting it.

#### Right Column - Change Log
- **Activity Tracking**: Record of all changes and edits
- **User Attribution**: Shows who made each change
- **Timestamps**: Precise timing of all modifications
- **Change Details**: Detailed information about each change

### 2. AI Chat Integration
- **Context-Aware**: AI understands your current workspace and document
- **Live Suggestions**: Real-time suggestions for improvements
- **Explicit Draft Updates**: Select an AI response, then press the **Add to draft** button beneath the chat input to insert content into the editor.
- **Change Tracking**: All AI edits are recorded in the change log
- **Resizable Panel**: Drag the top-center handle horizontally or vertically to resize the assistant panel while keeping workspace columns visible.

### 3. Document Management
- **Upload**: Drag and drop or click to upload documents
- **Supported Formats**: PDF, DOCX, TXT files
- **Processing**: Automatic document analysis and checklist generation
- **Export**: Export drafts to PDF or other formats
- **Archive Saves**: Use **Save Draft** to persist the current document into the archive. File names must be unique per project when the feature flag is enabled.
- **Open Archived Runs**: The archive drawer lists saved drafts—select one to reload its content into the editor along with deliverables and change history.

## Recruiting Workspace

### 1. Similar Layout
The Recruiting workspace follows a similar 3-column layout tailored for recruiting activities.

### 2. Key Features
- **Job Description Analysis**: Upload and analyze job descriptions
- **Resume Processing**: Upload and process candidate resumes
- **Skills Matching**: Match candidate skills to job requirements
- **Report Generation**: Generate comprehensive candidate reports

### 3. Workflow
1. **Upload JD**: Upload job description document
2. **Extract Requirements**: AI extracts key requirements and skills
3. **Upload Resume**: Upload candidate resume
4. **Analysis**: AI analyzes resume against job requirements
5. **Report**: Generate detailed analysis report

## AI Chat Features

### 1. Context Awareness
- **Workspace Context**: AI understands your current workspace
- **Document Context**: AI has access to your current document
- **History Context**: AI remembers previous conversations

### 2. Capabilities
- **Content Generation**: Generate new content based on prompts
- **Content Editing**: Edit existing content with specific instructions
- **Formatting**: Apply formatting and structure to content
- **Compliance**: Ensure content meets compliance requirements

### 3. Usage Examples
```
# Generate new section
"Generate an executive summary for this proposal"

# Edit existing content
"Make the technical section more detailed"

# Format content
"Format this as a bulleted list"

# Check compliance
"Review this section for compliance issues"
```

## Document Management

### 1. Upload Process
1. **Select File**: Choose file from your computer
2. **Upload**: File is uploaded to secure storage
3. **Processing**: AI processes and analyzes the document
4. **Checklist**: Auto-generated checklist appears in left panel

### 2. Supported Formats
- **PDF**: Portable Document Format
- **DOCX**: Microsoft Word documents
- **TXT**: Plain text files

### 3. File Limits
- **Maximum Size**: 50MB per file
- **Maximum Files**: 10 files per workspace
- **Storage**: Files stored securely in Azure Blob Storage

## Collaboration Features

### 1. Real-Time Editing
- **Simultaneous Editing**: Multiple users can edit simultaneously
- **Change Tracking**: All changes are tracked and attributed
- **Conflict Resolution**: Automatic conflict resolution for simultaneous edits
- **Notifications**: Real-time notifications of changes

### 2. Comments and Feedback
- **Inline Comments**: Add comments to specific sections
- **Threaded Discussions**: Organize comments in threaded discussions
- **Mentions**: Mention specific users in comments
- **Notifications**: Email notifications for comments and mentions

### 3. Version Control
- **Document History**: Complete history of all document versions
- **Version Comparison**: Compare different versions side by side
- **Rollback**: Restore to previous versions if needed
- **Change Summaries**: Summary of changes between versions

## Export and Sharing

### 1. Export Options
- **PDF**: Export to PDF format
- **DOCX**: Export to Microsoft Word format
- **HTML**: Export to HTML format
- **TXT**: Export to plain text format

### 2. Sharing Options
- **Link Sharing**: Share documents via secure links
- **Email Sharing**: Send documents via email
- **Team Sharing**: Share with team members
- **Public Sharing**: Make documents publicly accessible

### 3. Security
- **Access Control**: Control who can access your documents
- **Permissions**: Set specific permissions for different users
- **Audit Trail**: Track who accessed your documents
- **Encryption**: All documents encrypted in transit and at rest

## Settings and Preferences

### 1. Profile Settings
- **Personal Information**: Update your personal information
- **Contact Details**: Manage your contact information
- **Profile Picture**: Upload and manage your profile picture
- **Preferences**: Set your application preferences

### 2. Notification Settings
- **Email Notifications**: Configure email notification preferences
- **In-App Notifications**: Manage in-app notification settings
- **Frequency**: Set notification frequency preferences
- **Types**: Choose which types of notifications to receive

### 3. Workspace Settings
- **Workspace Preferences**: Configure workspace-specific settings
- **Default Views**: Set default views for workspaces
- **Auto-Save**: Configure auto-save preferences
- **Collaboration**: Manage collaboration settings

## Troubleshooting

### 1. Common Issues
- **Login Problems**: Check credentials and network connection
- **Upload Failures**: Verify file format and size limits
- **Performance Issues**: Clear browser cache and refresh
- **Sync Problems**: Check internet connection and try again

### 2. Getting Help
- **Help Documentation**: Access comprehensive help documentation
- **Support Team**: Contact support team for assistance
- **Community Forum**: Participate in community discussions
- **Training Resources**: Access training materials and tutorials

### 3. Feedback
- **Feature Requests**: Submit feature requests and suggestions
- **Bug Reports**: Report bugs and issues
- **User Experience**: Share feedback on user experience
- **Improvement Ideas**: Suggest improvements and enhancements

## Best Practices

### 1. Document Organization
- **Naming Conventions**: Use consistent naming conventions
- **Folder Structure**: Organize documents in logical folders
- **Tags and Labels**: Use tags and labels for easy searching
- **Regular Cleanup**: Regularly clean up old and unused documents

### 2. Collaboration
- **Clear Communication**: Use clear and concise communication
- **Timely Responses**: Respond to comments and feedback promptly
- **Respectful Interaction**: Maintain respectful and professional interactions
- **Document Changes**: Document significant changes and decisions

### 3. Security
- **Strong Passwords**: Use strong and unique passwords
- **Regular Updates**: Keep your account information updated
- **Access Control**: Regularly review and update access permissions
- **Sensitive Information**: Be cautious with sensitive information

## Support and Resources

### 1. Documentation
- **User Guide**: Comprehensive user guide (this document)
- **API Documentation**: Technical API documentation
- **Video Tutorials**: Step-by-step video tutorials
- **FAQ**: Frequently asked questions and answers

### 2. Training
- **Onboarding**: Comprehensive onboarding program
- **Webinars**: Regular training webinars
- **Workshops**: Hands-on training workshops
- **Certification**: User certification program

### 3. Community
- **User Forum**: Community forum for discussions
- **Best Practices**: Share best practices and tips
- **Feature Requests**: Submit and vote on feature requests
- **User Stories**: Share success stories and use cases

## Contact Information

- **Support Email**: support@microtech.com
- **Support Phone**: +1 (555) 123-4567
- **Support Hours**: Monday - Friday, 9 AM - 6 PM EST
- **Emergency Support**: Available 24/7 for critical issues
