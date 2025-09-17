import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Shield, 
  FileText, 
  TrendingUp,
  ChevronRight,
  ArrowLeft,
  Globe,
  MapPin,
  Building,
  BookOpen,
  Clock
} from 'lucide-react';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { useUserDepartments } from '@/hooks/useUserDepartments';
import { useUserProfileRoles } from '@/hooks/useUserProfileRoles';
import { useProgressAnalytics } from '@/hooks/useProgressAnalytics';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MetricDrillDown from './MetricDrillDown';
import MetricCards from './MetricCards';
import { formatDistanceToNow } from 'date-fns';

export interface DrillDownLevel {
  level: number;
  title: string;
  data: any[];
  type: 'org' | 'location' | 'department' | 'staff';
  value?: number; // Store the calculated value from the previous level
}

interface MetricDefinition {
  id: string;
  title: string;
  icon: React.ReactNode;
  getValue: (profiles: any[]) => number | string;
  drillDownLevels: string[];
  type: 'count' | 'percentage' | 'score';
}

const EnhancedMetrics: React.FC = () => {
  console.log('=== EnhancedMetrics component rendering ===');
  
  const { profiles } = useUserProfiles();
  const { data: analytics } = useProgressAnalytics();
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [drillDownPath, setDrillDownPath] = useState<DrillDownLevel[]>([]);

  // State for user departments data
  const [allUserDepartments, setAllUserDepartments] = useState([]);
  
  // Fetch user departments directly with useEffect
  React.useEffect(() => {
    const fetchDepartments = async () => {
      console.log('=== Starting department fetch ===');
      
      try {
        // Check authentication first
        const { data: { user } } = await supabase.auth.getUser();
        console.log('Current user:', user?.id);
        
        // Fetch user departments
        const { data, error } = await supabase
          .from('user_departments')
          .select(`
            *,
            departments (
              name
            )
          `);
        
        if (error) {
          console.error('Error fetching user departments:', error);
          return;
        }
        
        console.log('Successfully fetched user departments:', data);
        setAllUserDepartments(data || []);
      } catch (err) {
        console.error('Exception fetching departments:', err);
      }
    };
    
    fetchDepartments();
  }, []);

  console.log('=== allUserDepartments state ===', allUserDepartments);

  const { data: allUserRoles = [] } = useQuery({
    queryKey: ['all-user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profile_roles')
        .select(`
          *,
          roles (
            name
          )
        `)
        .eq('is_primary', true); // Only get primary roles
      
      if (error) throw error;
      return data || [];
    },
  });

  // Create maps for departments and roles by user
  const userDepartmentMap = new Map();
  const userRoleMap = new Map();
  
  allUserDepartments.forEach(ud => {
    userDepartmentMap.set(ud.user_id, ud.departments?.name || 'Unknown Department');
  });
  
  allUserRoles.forEach(ur => {
    userRoleMap.set(ur.user_id, ur.roles?.name || 'Unknown Role');
  });

  // Enhance profiles with department and role data from junction tables
  const enhancedProfiles = profiles.map(profile => ({
    ...profile,
    primary_department: userDepartmentMap.get(profile.id) || 'Unknown Department',
    primary_role: userRoleMap.get(profile.id) || 'Unknown Role'
  }));

  // Calculate unique locations and departments for drill-downs
  const locations = [...new Set(enhancedProfiles.map(p => p.location).filter(Boolean))];
  const departments = [...new Set(enhancedProfiles.map(p => p.primary_department).filter(Boolean))];

  // Create user department map for the MetricDrillDown component using actual junction table data
  const userDeptMap = new Map();
  allUserDepartments.forEach(ud => {
    if (!userDeptMap.has(ud.user_id)) {
      userDeptMap.set(ud.user_id, []);
    }
    userDeptMap.get(ud.user_id).push({
      is_primary: ud.is_primary,
      department_name: ud.departments?.name || 'Unknown Department',
      ...ud
    });
  });

  const mainMetrics: MetricDefinition[] = [
    {
      id: 'total_staff',
      title: 'Total Staff in Organisation',
      icon: <Users className="h-6 w-6" />,
      getValue: (profiles) => profiles.length,
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'count'
    },
    {
      id: 'cyber_learners',
      title: 'Total Cybersecurity Learners',
      icon: <Shield className="h-6 w-6" />,
      getValue: (profiles) => profiles.filter(p => p.cyber_learner === true).length,
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'count'
    },
    {
      id: 'data_protection_learners',
      title: 'Total Data Protection Learners',
      icon: <FileText className="h-6 w-6" />,
      getValue: (profiles) => profiles.filter(p => p.dpe_learner === true).length,
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'count'
    },
    {
      id: 'cyber_quiz_score',
      title: 'Cybersecurity Quiz Score',
      icon: <TrendingUp className="h-6 w-6" />,
      getValue: (profiles) => {
        // TODO: Replace with real quiz scores from database
        return 0; // No quiz scores available yet
      },
      drillDownLevels: ['Average Score', 'Location', 'Department', 'Staff Scores'],
      type: 'score'
    },
    {
      id: 'data_protection_quiz_score',
      title: 'Data Protection Quiz Score',
      icon: <TrendingUp className="h-6 w-6" />,
      getValue: (profiles) => {
        // TODO: Replace with real quiz scores from database
        return 0; // No quiz scores available yet
      },
      drillDownLevels: ['Average Score', 'Location', 'Department', 'Staff Scores'],
      type: 'score'
    },
    {
      id: 'english_learners',
      title: 'English Learners',
      icon: <Globe className="h-6 w-6" />,
      getValue: (profiles) => profiles.filter(p => p.language === 'English' || p.language === '').length,
      drillDownLevels: ['Organization', 'Location', 'Department'],
      type: 'count'
    },
    {
      id: 'mandarin_learners',
      title: 'Mandarin Learners',
      icon: <Globe className="h-6 w-6" />,
      getValue: (profiles) => profiles.filter(p => p.language === 'Mandarin').length,
      drillDownLevels: ['Organization', 'Location', 'Department'],
      type: 'count'
    }
  ];

  const performanceMetrics: MetricDefinition[] = [
    {
      id: 'enrolled_percentage',
      title: '% Staff Enrolled in Learn',
      icon: <Users className="h-6 w-6" />,
      getValue: (profiles) => {
        const total = profiles.length;
        const enrolled = profiles.filter(p => p.cyber_learner === true).length;
        return total > 0 ? Math.round((enrolled / total) * 100) : 0;
      },
      drillDownLevels: ['Enrolled %', 'Department %', 'Staff List'],
      type: 'percentage'
    },
    {
      id: 'cyber_aware_percentage',
      title: '% Staff Cyber Security Aware',
      icon: <Shield className="h-6 w-6" />,
      getValue: (profiles) => {
        const cyberLearners = profiles.filter(p => p.cyber_learner === true).length;
        const completed = profiles.filter(p => p.learn_complete === true).length;
        return cyberLearners > 0 ? Math.round((completed / cyberLearners) * 100) : 0;
      },
      drillDownLevels: ['Completion %', 'Department %', 'Staff %'],
      type: 'percentage'
    },
    {
      id: 'data_protection_aware_percentage',
      title: '% Staff Data Protection Aware',
      icon: <FileText className="h-6 w-6" />,
      getValue: (profiles) => {
        const dpeLearners = profiles.filter(p => p.dpe_learner === true).length;
        const completed = profiles.filter(p => p.dpe_complete === true).length;
        return dpeLearners > 0 ? Math.round((completed / dpeLearners) * 100) : 0;
      },
      drillDownLevels: ['Completion %', 'Department %', 'Staff %'],
      type: 'percentage'
    },
    {
      id: 'episode_completion',
      title: 'Staff Completed Each Learn Episode',
      icon: <TrendingUp className="h-6 w-6" />,
      getValue: (profiles) => profiles.filter(p => p.learn_complete === true).length,
      drillDownLevels: ['Episode Completion', 'Department', 'Staff'],
      type: 'count'
    },
    {
      id: 'track_completion',
      title: 'Staff Completing Learn Track',
      icon: <TrendingUp className="h-6 w-6" />,
      getValue: (profiles) => {
        const enrolled = profiles.filter(p => p.cyber_learner === true).length;
        const completed = profiles.filter(p => p.learn_complete === true).length;
        return enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0;
      },
      drillDownLevels: ['Track Completion %', 'Department %', 'Staff %'],
      type: 'percentage'
    }
  ];

  const handleMetricClick = (metricId: string) => {
    console.log('Metric clicked:', metricId, 'profiles:', enhancedProfiles.length);
    setSelectedMetric(metricId);
    setDrillDownPath([{
      level: 1,
      title: 'Organization Level',
      data: enhancedProfiles,
      type: 'org'
    }]);
  };

  const handleDrillDown = (level: number, data: any[], title: string, type: 'org' | 'location' | 'department' | 'staff', value?: number) => {
    const newLevel: DrillDownLevel = { level, title, data, type, value };
    setDrillDownPath(prev => [...prev.slice(0, level - 1), newLevel]);
  };

  const handleBackToDashboard = () => {
    setSelectedMetric(null);
    setDrillDownPath([]);
  };

  const formatValue = (value: number | string, type: string) => {
    if (type === 'percentage') return `${value}%`;
    if (type === 'score') return `${value}/100`;
    return value.toString();
  };

  const getColorClass = (type: string, value: number | string) => {
    if (type === 'percentage' || type === 'score') {
      const num = typeof value === 'string' ? parseInt(value) : value;
      if (num >= 80) return 'text-green-600';
      if (num >= 60) return 'text-yellow-600';
      return 'text-red-600';
    }
    return 'text-primary';
  };

  if (selectedMetric) {
    const metric = [...mainMetrics, ...performanceMetrics].find(m => m.id === selectedMetric);
    if (!metric) return null;

    return (
      <div className="w-full space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBackToDashboard} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">{metric.title}</h1>
        </div>
        
        <MetricDrillDown
          metric={metric}
          profiles={enhancedProfiles}
          drillDownPath={drillDownPath}
          onDrillDown={handleDrillDown}
          locations={locations}
          departments={departments}
          userDeptMap={userDeptMap}
          hardwareInventory={[]}
          softwareInventory={[]}
          softwareAssignments={[]}
          physicalLocationAccess={[]}
        />
      </div>
    );
  }

  // Calculate values for MetricCards
  const totalStaff = enhancedProfiles.length;
  const cyberLearners = enhancedProfiles.filter(p => p.cyber_learner === true).length;
  const dataProtectionLearners = enhancedProfiles.filter(p => p.dpe_learner === true).length;
  const enrolledInLearnPercentage = totalStaff > 0 ? Math.round((cyberLearners / totalStaff) * 100) : 0;
  const completedLearnPercentage = cyberLearners > 0 ? Math.round((enhancedProfiles.filter(p => p.learn_complete === true).length / cyberLearners) * 100) : 0;
  const completedPDPAPercentage = dataProtectionLearners > 0 ? Math.round((enhancedProfiles.filter(p => p.dpe_complete === true).length / dataProtectionLearners) * 100) : 0;

  return (
    <div className="w-full space-y-8">
      {/* Progress Analytics Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Progress Analytics</h2>
        <p className="text-muted-foreground">Monitor learner progress and completion rates</p>
      </div>

      {/* Lesson Completion and Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lesson Completion Rates</CardTitle>
            <CardDescription>Completion rates by lesson</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.lessonCompletionRates.slice(0, 5).map((lesson, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="truncate max-w-48 flex-1 mr-4">{lesson.title}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div 
                        className="bg-learning-accent h-2 rounded-full" 
                        style={{ width: `${lesson.completionRate}%` }}
                      ></div>
                    </div>
                    <span className="w-10 text-right">{lesson.completionRate}%</span>
                  </div>
                </div>
              ))}
              {(!analytics?.lessonCompletionRates || analytics.lessonCompletionRates.length === 0) && (
                <p className="text-sm text-muted-foreground">No completion data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest learner activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.action === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                  }`}></div>
                  <div className="flex-1 text-sm">
                    <p className="font-medium">
                      {activity.userFullName} {activity.action} "{activity.lessonTitle}"
                    </p>
                    <p className="text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
              {(!analytics?.recentActivity || analytics.recentActivity.length === 0) && (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics with Drill-down */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Detailed Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mainMetrics.map((metric) => {
            const value = metric.getValue(enhancedProfiles);
            return (
              <Card key={metric.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleMetricClick(metric.id)}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                  {metric.icon}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`text-2xl font-bold ${getColorClass(metric.type, value)}`}>
                        {formatValue(value, metric.type)}
                      </div>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {metric.drillDownLevels.length} levels
                      </Badge>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6">Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {performanceMetrics.map((metric) => {
            const value = metric.getValue(enhancedProfiles);
            return (
              <Card key={metric.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleMetricClick(metric.id)}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                  {metric.icon}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`text-2xl font-bold ${getColorClass(metric.type, value)}`}>
                        {formatValue(value, metric.type)}
                      </div>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {metric.drillDownLevels.length} levels
                      </Badge>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EnhancedMetrics;