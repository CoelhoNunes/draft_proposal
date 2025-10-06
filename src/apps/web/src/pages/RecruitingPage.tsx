/**
 * @fileoverview Recruiting workspace for candidate analysis and job matching
 */

import React, { useState } from 'react';
import { 
  Upload, 
  FileText, 
  Users, 
  TrendingUp,
  Target,
  Award,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  BarChart3
} from 'lucide-react';
// Simple components
const Card = ({ children, className }: any) => <div className={`border rounded-lg bg-white ${className || ''}`}>{children}</div>;
const CardContent = ({ children, className }: any) => <div className={`p-6 ${className || ''}`}>{children}</div>;
const CardHeader = ({ children, className }: any) => <div className={`p-6 pb-0 ${className || ''}`}>{children}</div>;
const CardTitle = ({ children, className }: any) => <h3 className={`text-lg font-semibold ${className || ''}`}>{children}</h3>;
const CardDescription = ({ children, className }: any) => <p className={`text-sm text-gray-600 ${className || ''}`}>{children}</p>;
const Button = ({ children, className, onClick, variant, size, disabled, ...props }: any) => (
  <button 
    className={`px-4 py-2 rounded ${disabled ? 'opacity-50' : ''} ${className || ''}`} 
    onClick={onClick} 
    disabled={disabled}
    {...props}
  >
    {children}
  </button>
);
const Badge = ({ children, className, variant }: any) => <span className={`px-2 py-1 text-xs rounded bg-gray-100 ${className || ''}`}>{children}</span>;
const Progress = ({ value, className }: any) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className || ''}`}>
    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${value}%` }}></div>
  </div>
);
const Tabs = ({ children, value, onValueChange }: any) => <div>{children}</div>;
const TabsList = ({ children, className }: any) => <div className={`flex border-b ${className || ''}`}>{children}</div>;
const TabsTrigger = ({ children, value, className, onClick }: any) => (
  <button className={`px-4 py-2 ${className || ''}`} onClick={() => onClick?.(value)}>{children}</button>
);
const TabsContent = ({ children, value, className }: any) => <div className={className}>{children}</div>;
const Separator = ({ className }: any) => <hr className={`border-gray-200 ${className || ''}`} />;
// Simple utilities
const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ');
const formatDate = (date: Date) => date.toLocaleString();

// Mock data - replace with actual API calls
const mockAnalysis = {
  matchScore: 87,
  seniority: 'Senior',
  skillsOverlap: [
    'React', 'TypeScript', 'Node.js', 'AWS', 'Docker',
    'Kubernetes', 'PostgreSQL', 'GraphQL', 'Jest', 'CI/CD'
  ],
  skillsGaps: [
    'Python', 'Machine Learning', 'Blockchain', 'DevOps'
  ],
  recommendations: [
    'Strong technical background with modern web technologies',
    'Excellent experience with cloud platforms and containerization',
    'Good understanding of testing and CI/CD practices',
    'Consider for senior developer role with growth potential',
    'May need training in Python and ML for advanced projects'
  ],
  experience: {
    years: 8,
    currentRole: 'Senior Full Stack Developer',
    previousRoles: [
      'Full Stack Developer (3 years)',
      'Frontend Developer (2 years)',
      'Junior Developer (1 year)'
    ]
  },
  education: {
    degree: 'Bachelor of Computer Science',
    institution: 'University of Technology',
    graduationYear: 2016
  }
};

const mockJobRequirements = {
  title: 'Senior Full Stack Developer',
  company: 'TechCorp Inc.',
  location: 'Remote',
  salary: '$120k - $150k',
  requirements: [
    '5+ years of full-stack development experience',
    'Strong proficiency in React, TypeScript, and Node.js',
    'Experience with cloud platforms (AWS, Azure, or GCP)',
    'Knowledge of containerization (Docker, Kubernetes)',
    'Experience with databases (PostgreSQL, MongoDB)',
    'Understanding of CI/CD practices',
    'Bachelor\'s degree in Computer Science or related field'
  ],
  niceToHave: [
    'Python and Machine Learning experience',
    'Blockchain development knowledge',
    'DevOps and infrastructure experience',
    'Open source contributions'
  ]
};

export function RecruitingPage() {
  const [activeTab, setActiveTab] = useState<'analysis' | 'comparison' | 'report'>('analysis');
  const [selectedWorkspaceId] = useState('recruiting-1');

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMatchBadgeVariant = (score: number) => {
    if (score >= 80) return 'success' as const;
    if (score >= 60) return 'warning' as const;
    return 'destructive' as const;
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Recruiting Workspace</h1>
              <p className="text-muted-foreground">
                Candidate Analysis & Job Matching - {mockJobRequirements.title}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Match Score</div>
                <div className="flex items-center space-x-2">
                  <Progress value={mockAnalysis.matchScore} className="w-32" />
                  <span className={cn('text-sm font-medium', getMatchColor(mockAnalysis.matchScore))}>
                    {mockAnalysis.matchScore}%
                  </span>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload Resume
              </Button>
              <Button size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Job Requirements */}
        <div className="w-80 border-r bg-muted/30 flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Job Requirements</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {mockJobRequirements.title}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{mockJobRequirements.title}</CardTitle>
                <CardDescription>{mockJobRequirements.company}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Location:</span>
                    <span>{mockJobRequirements.location}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Salary:</span>
                    <span>{mockJobRequirements.salary}</span>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium text-sm mb-2">Required Skills</h4>
                  <div className="space-y-1">
                    {mockJobRequirements.requirements.map((req, index) => (
                      <div key={index} className="flex items-start space-x-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{req}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium text-sm mb-2">Nice to Have</h4>
                  <div className="space-y-1">
                    {mockJobRequirements.niceToHave.map((skill, index) => (
                      <div key={index} className="flex items-start space-x-2 text-sm">
                        <Clock className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span>{skill}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Center Content */}
        <div className="flex-1 flex flex-col">
          <div className="border-b bg-background">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="analysis" className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Analysis</span>
                </TabsTrigger>
                <TabsTrigger value="comparison" className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Comparison</span>
                </TabsTrigger>
                <TabsTrigger value="report" className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Report</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab}>
              <TabsContent value="analysis" className="h-full m-0">
                <div className="h-full overflow-y-auto p-6">
                  <div className="max-w-4xl mx-auto space-y-6">
                    {/* Match Score Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Match Analysis</span>
                          <Badge variant={getMatchBadgeVariant(mockAnalysis.matchScore)}>
                            {mockAnalysis.matchScore}% Match
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-primary mb-2">
                              {mockAnalysis.matchScore}%
                            </div>
                            <div className="text-sm text-muted-foreground">Overall Match</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-2">
                              {mockAnalysis.seniority}
                            </div>
                            <div className="text-sm text-muted-foreground">Seniority Level</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold text-green-600 mb-2">
                              {mockAnalysis.experience.years}
                            </div>
                            <div className="text-sm text-muted-foreground">Years Experience</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Skills Analysis */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span>Skills Match</span>
                          </CardTitle>
                          <CardDescription>
                            {mockAnalysis.skillsOverlap.length} matching skills
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {mockAnalysis.skillsOverlap.map((skill) => (
                              <Badge key={skill} variant="success" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <AlertCircle className="h-5 w-5 text-yellow-500" />
                            <span>Skills Gaps</span>
                          </CardTitle>
                          <CardDescription>
                            {mockAnalysis.skillsGaps.length} missing skills
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {mockAnalysis.skillsGaps.map((skill) => (
                              <Badge key={skill} variant="warning" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Recommendations */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Award className="h-5 w-5 text-purple-500" />
                          <span>Recommendations</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {mockAnalysis.recommendations.map((rec, index) => (
                            <div key={index} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                                {index + 1}
                              </div>
                              <p className="text-sm">{rec}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="comparison" className="h-full m-0">
                <div className="h-full overflow-y-auto p-6">
                  <div className="max-w-4xl mx-auto">
                    <Card>
                      <CardHeader>
                        <CardTitle>Skills Comparison Matrix</CardTitle>
                        <CardDescription>
                          Detailed comparison between candidate skills and job requirements
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {mockJobRequirements.requirements.map((req, index) => {
                            const isMatched = mockAnalysis.skillsOverlap.some(skill => 
                              req.toLowerCase().includes(skill.toLowerCase()) ||
                              skill.toLowerCase().includes(req.toLowerCase())
                            );
                            
                            return (
                              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                <span className="text-sm">{req}</span>
                                <div className="flex items-center space-x-2">
                                  {isMatched ? (
                                    <>
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                      <Badge variant="success" className="text-xs">Match</Badge>
                                    </>
                                  ) : (
                                    <>
                                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                                      <Badge variant="warning" className="text-xs">Partial</Badge>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="report" className="h-full m-0">
                <div className="h-full overflow-y-auto p-6">
                  <div className="max-w-4xl mx-auto">
                    <Card>
                      <CardHeader>
                        <CardTitle>Candidate Evaluation Report</CardTitle>
                        <CardDescription>
                          Comprehensive analysis and hiring recommendation
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <h3 className="font-semibold mb-3">Executive Summary</h3>
                          <p className="text-sm text-muted-foreground">
                            This candidate demonstrates strong technical capabilities with {mockAnalysis.experience.years} years of experience 
                            in full-stack development. With a {mockAnalysis.matchScore}% match score, they align well with our requirements 
                            and show potential for growth in the {mockJobRequirements.title} role.
                          </p>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="font-semibold mb-3">Technical Assessment</h3>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Overall Technical Match</span>
                              <Badge variant={getMatchBadgeVariant(mockAnalysis.matchScore)}>
                                {mockAnalysis.matchScore}%
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Experience Level</span>
                              <Badge variant="outline">{mockAnalysis.seniority}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Years of Experience</span>
                              <span className="text-sm font-medium">{mockAnalysis.experience.years} years</span>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="font-semibold mb-3">Final Recommendation</h3>
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-800 font-medium">
                              RECOMMENDED FOR HIRE
                            </p>
                            <p className="text-sm text-green-700 mt-1">
                              This candidate meets the core requirements and shows strong potential for the role. 
                              Consider offering the position with a focus on professional development in identified skill gaps.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
