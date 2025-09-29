import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, Users, BookOpen, AlertTriangle, TrendingUp } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

const AdminPanel: React.FC = () => {
  const { hasAdminAccess, loading: roleLoading } = useUserRole();

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Cybersecurity Posture</h1>
      </div>

      {/* Main Score Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader className="text-center">
            <CardTitle className="text-lg font-medium text-muted-foreground">
              Cybersecurity Score
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mb-4">
              <span className="text-6xl font-bold">817</span>
              <span className="text-2xl text-muted-foreground">/850</span>
            </div>
            <Badge variant="secondary" className="mb-2 bg-green-100 text-green-800">
              Low Risk
            </Badge>
            <p className="text-sm text-muted-foreground mb-2">
              Good security posture; minor gaps may exist
            </p>
            <p className="text-xs text-muted-foreground">
              Score Range: 300-850
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Education</span>
                <span className="text-2xl font-bold">799</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Protection</span>
                <span className="text-2xl font-bold">823</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Readiness</span>
                <span className="text-2xl font-bold">839</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Education Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Education</h2>
        
        {/* Counts */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Counts</h3>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold mb-2">1,702</div>
                <div className="text-sm text-muted-foreground">Total Staff</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold mb-2">1,650</div>
                <div className="text-sm text-muted-foreground">Cyber Learners</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold mb-2">1,600</div>
                <div className="text-sm text-muted-foreground">Data Protection Learners</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold mb-2">1,200</div>
                <div className="text-sm text-muted-foreground">English Learners</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold mb-2">502</div>
                <div className="text-sm text-muted-foreground">Mandarin Learners</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Performance */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-muted-foreground/20"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${97 * 2.51} ${100 * 2.51}`}
                      className="text-green-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">97</span>
                  </div>
                </div>
                <div className="text-sm font-medium">% Enrolled in Learn</div>
                <div className="text-xs text-muted-foreground">Click for details</div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-muted-foreground/20"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${92 * 2.51} ${100 * 2.51}`}
                      className="text-green-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">92</span>
                  </div>
                </div>
                <div className="text-sm font-medium">% Completed Learn</div>
                <div className="text-xs text-muted-foreground">Click for details</div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-muted-foreground/20"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${94 * 2.51} ${100 * 2.51}`}
                      className="text-green-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">94</span>
                  </div>
                </div>
                <div className="text-sm font-medium">% Completed PDPA e-learning</div>
                <div className="text-xs text-muted-foreground">Click for details</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold mb-2">88</div>
                <div className="text-sm font-medium">Cybersecurity Quiz Score</div>
                <div className="text-xs text-muted-foreground">Average Score</div>
                <div className="text-xs text-muted-foreground">Click for details</div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold mb-2">85</div>
                <div className="text-sm font-medium">ISP Read Completion</div>
                <div className="text-xs text-muted-foreground">Click for details</div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold mb-2">87</div>
                <div className="text-sm font-medium">DPP Read Completion</div>
                <div className="text-xs text-muted-foreground">Click for details</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Insights and Improvements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Key Cybersecurity Behaviour Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Password management scores have improved by 15% this quarter</li>
                <li>• Email security awareness is highest among administrative staff</li>
                <li>• Mobile device security practices need attention across all departments</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Top 3 Areas of Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Social engineering recognition training</li>
                <li>• Physical security awareness</li>
                <li>• Incident reporting procedures</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;