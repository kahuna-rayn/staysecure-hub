import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  GraduationCap, 
  Shield, 
  FileText, 
  ChevronRight, 
  ChevronLeft,
  Globe,
  Building,
  Users2,
  BookOpen,
  Target
} from 'lucide-react';

interface EducationData {
  totalStaff: number;
  cyberLearners: number;
  dpeLearners: number;
  englishSpeakers: number;
  mandarinSpeakers: number;
  cyberCompletions: number;
  dpeCompletions: number;
  activeLearningTracks: number;
  availableLessons: number;
  enrolledInLearn: number;
}

interface DrillDownLevel {
  type: 'organization' | 'location' | 'department' | 'staff';
  value?: string;
  name: string;
}

export const EducationMetrics = () => {
  const [data, setData] = useState<EducationData>({
    totalStaff: 0,
    cyberLearners: 0,
    dpeLearners: 0,
    englishSpeakers: 0,
    mandarinSpeakers: 0,
    cyberCompletions: 0,
    dpeCompletions: 0,
    activeLearningTracks: 0,
    availableLessons: 0,
    enrolledInLearn: 0
  });
  const [loading, setLoading] = useState(true);
  const [drillDown, setDrillDown] = useState<DrillDownLevel[]>([
    { type: 'organization', name: 'Organization Overview' }
  ]);

  useEffect(() => {
    fetchEducationData();
  }, []);

  const fetchEducationData = async () => {
    try {
      // Fetch all data in parallel
      const [profilesResult, tracksResult, lessonsResult] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('learning_tracks').select('*').eq('status', 'published'),
        supabase.from('lessons').select('*').eq('status', 'published')
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (tracksResult.error) throw tracksResult.error;
      if (lessonsResult.error) throw lessonsResult.error;

      const profiles = profilesResult.data || [];
      const tracks = tracksResult.data || [];
      const lessons = lessonsResult.data || [];

      const totalStaff = profiles.length;
      const cyberLearners = profiles.filter(p => p.cyber_learner).length;
      const dpeLearners = profiles.filter(p => p.dpe_learner).length;
      const englishSpeakers = profiles.filter(p => !p.language || p.language === '' || p.language === 'en').length;
      const mandarinSpeakers = profiles.filter(p => p.language === 'zh').length;
      const cyberCompletions = profiles.filter(p => p.learn_complete).length;
      const dpeCompletions = profiles.filter(p => p.dpe_complete).length;
      const enrolledInLearn = profiles.filter(p => p.enrolled_in_learn).length;

      setData({
        totalStaff,
        cyberLearners,
        dpeLearners,
        englishSpeakers,
        mandarinSpeakers,
        cyberCompletions,
        dpeCompletions,
        activeLearningTracks: tracks.length,
        availableLessons: lessons.length,
        enrolledInLearn
      });
    } catch (error) {
      console.error('Error fetching education data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (percentage: number) => {
    if (percentage >= 80) return <Badge variant="default" className="bg-green-100 text-green-800">Excellent</Badge>;
    if (percentage >= 60) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Good</Badge>;
    return <Badge variant="destructive" className="bg-red-100 text-red-800">Needs Attention</Badge>;
  };

  const navigateToLevel = (level: DrillDownLevel) => {
    const currentIndex = drillDown.findIndex(l => l.type === level.type && l.value === level.value);
    if (currentIndex >= 0) {
      setDrillDown(drillDown.slice(0, currentIndex + 1));
    } else {
      setDrillDown([...drillDown, level]);
    }
  };

  const goBack = () => {
    if (drillDown.length > 1) {
      setDrillDown(drillDown.slice(0, -1));
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading education metrics...</div>;
  }

  const cyberEnrollmentRate = calculatePercentage(data.cyberLearners, data.totalStaff);
  const dpeEnrollmentRate = calculatePercentage(data.dpeLearners, data.totalStaff);
  const cyberCompletionRate = calculatePercentage(data.cyberCompletions, data.cyberLearners);
  const dpeCompletionRate = calculatePercentage(data.dpeCompletions, data.dpeLearners);

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2">
        {drillDown.length > 1 && (
          <Button variant="ghost" size="sm" onClick={goBack}>
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {drillDown.map((level, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && <ChevronRight className="w-3 h-3" />}
              <span className={index === drillDown.length - 1 ? 'text-foreground font-medium' : ''}>
                {level.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Count Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-learning-primary mb-4">Count Metrics</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5 text-learning-accent" />
                <span className="text-sm font-medium text-muted-foreground">Total Staff</span>
              </div>
              <div className="text-3xl font-bold text-learning-primary mb-3">{data.totalStaff}</div>
              <Button variant="outline" size="sm" className="w-full text-learning-accent border-learning-accent hover:bg-learning-accent hover:text-white">
                Click for details
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-5 w-5 text-learning-accent" />
                <span className="text-sm font-medium text-muted-foreground">Cyber Learners</span>
              </div>
              <div className="text-3xl font-bold text-learning-primary mb-3">{data.cyberLearners}</div>
              <Button variant="outline" size="sm" className="w-full text-learning-accent border-learning-accent hover:bg-learning-accent hover:text-white">
                Click for details
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-5 w-5 text-learning-accent" />
                <span className="text-sm font-medium text-muted-foreground">Data Protection Learners</span>
              </div>
              <div className="text-3xl font-bold text-learning-primary mb-3">{data.dpeLearners}</div>
              <Button variant="outline" size="sm" className="w-full text-learning-accent border-learning-accent hover:bg-learning-accent hover:text-white">
                Click for details
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Globe className="h-5 w-5 text-learning-accent" />
                <span className="text-sm font-medium text-muted-foreground">English Learners</span>
              </div>
              <div className="text-3xl font-bold text-learning-primary mb-3">{data.englishSpeakers}</div>
              <Button variant="outline" size="sm" className="w-full text-learning-accent border-learning-accent hover:bg-learning-accent hover:text-white">
                Click for details
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Globe className="h-5 w-5 text-learning-accent" />
                <span className="text-sm font-medium text-muted-foreground">Mandarin Learners</span>
              </div>
              <div className="text-3xl font-bold text-learning-primary mb-3">{data.mandarinSpeakers}</div>
              <Button variant="outline" size="sm" className="w-full text-learning-accent border-learning-accent hover:bg-learning-accent hover:text-white">
                Click for details
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <GraduationCap className="h-5 w-5 text-learning-accent" />
                <span className="text-sm font-medium text-muted-foreground">Staff completed each learn episode</span>
              </div>
              <div className="text-3xl font-bold text-learning-primary mb-3">{data.cyberCompletions}</div>
              <Button variant="outline" size="sm" className="w-full text-learning-accent border-learning-accent hover:bg-learning-accent hover:text-white">
                Click for details
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Performance Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-learning-primary mb-4">Performance Metrics</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5 text-learning-accent" />
                <span className="text-sm font-medium text-muted-foreground">% staff enrolled in Learn</span>
              </div>
              <div className="text-3xl font-bold text-red-500 mb-3">{calculatePercentage(data.enrolledInLearn, data.totalStaff)}%</div>
              <Button variant="outline" size="sm" className="w-full text-learning-accent border-learning-accent hover:bg-learning-accent hover:text-white">
                Click for details
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-5 w-5 text-learning-accent" />
                <span className="text-sm font-medium text-muted-foreground">% staff cyber security aware</span>
              </div>
              <div className="text-3xl font-bold text-red-500 mb-3">{cyberCompletionRate}%</div>
              <Button variant="outline" size="sm" className="w-full text-learning-accent border-learning-accent hover:bg-learning-accent hover:text-white">
                Click for details
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-5 w-5 text-learning-accent" />
                <span className="text-sm font-medium text-muted-foreground">% staff data protection aware</span>
              </div>
              <div className="text-3xl font-bold text-orange-500 mb-3">{dpeCompletionRate}%</div>
              <Button variant="outline" size="sm" className="w-full text-learning-accent border-learning-accent hover:bg-learning-accent hover:text-white">
                Click for details
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Target className="h-5 w-5 text-learning-accent" />
                <span className="text-sm font-medium text-muted-foreground">Staff completing learn track</span>
              </div>
              <div className="text-3xl font-bold text-red-500 mb-3">{calculatePercentage(data.enrolledInLearn, data.totalStaff)}%</div>
              <Button variant="outline" size="sm" className="w-full text-learning-accent border-learning-accent hover:bg-learning-accent hover:text-white">
                Click for details
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cybersecurity Training Performance</CardTitle>
            <CardDescription>Enrollment and completion rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Staff Enrolled</span>
                  <span className={`text-sm font-bold ${getPerformanceColor(cyberEnrollmentRate)}`}>
                    {cyberEnrollmentRate}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-learning-accent h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${cyberEnrollmentRate}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.cyberLearners} of {data.totalStaff} staff enrolled
                </p>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Completion Rate</span>
                  <span className={`text-sm font-bold ${getPerformanceColor(cyberCompletionRate)}`}>
                    {cyberCompletionRate}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${cyberCompletionRate}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.cyberCompletions} of {data.cyberLearners} learners completed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Protection Training Performance</CardTitle>
            <CardDescription>Enrollment and completion rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Staff Enrolled</span>
                  <span className={`text-sm font-bold ${getPerformanceColor(dpeEnrollmentRate)}`}>
                    {dpeEnrollmentRate}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-learning-accent h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${dpeEnrollmentRate}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.dpeLearners} of {data.totalStaff} staff enrolled
                </p>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Completion Rate</span>
                  <span className={`text-sm font-bold ${getPerformanceColor(dpeCompletionRate)}`}>
                    {dpeCompletionRate}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${dpeCompletionRate}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.dpeCompletions} of {data.dpeLearners} learners completed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drill-down Navigation */}
      {drillDown[drillDown.length - 1].type === 'organization' && (
        <Card>
          <CardHeader>
            <CardTitle>Drill Down Analysis</CardTitle>
            <CardDescription>Click to explore detailed metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button 
                variant="outline" 
                className="h-16 flex flex-col items-center gap-2"
                onClick={() => navigateToLevel({ type: 'location', name: 'By Location' })}
              >
                <Building className="w-6 h-6" />
                <span>View by Location</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 flex flex-col items-center gap-2"
                onClick={() => navigateToLevel({ type: 'department', name: 'By Department' })}
              >
                <Users2 className="w-6 h-6" />
                <span>View by Department</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 flex flex-col items-center gap-2"
                onClick={() => navigateToLevel({ type: 'staff', name: 'Individual Staff' })}
              >
                <Users className="w-6 h-6" />
                <span>View Individual Staff</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};