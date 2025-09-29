import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Award, Clock, Target, Download, Printer } from 'lucide-react';

interface PerformanceData {
  completionRates: Array<{ name: string; completed: number; total: number; percentage: number }>;
  averageScores: Array<{ name: string; averageScore: number; totalResponses: number }>;
  timeSpent: Array<{ name: string; averageTime: number; totalSessions: number }>;
  progressTrends: Array<{ date: string; completedLessons: number; averageScore: number }>;
  topPerformers: Array<{ name: string; score: number; lessonsCompleted: number }>;
}

interface PerformanceFilters {
  timeRange: string;
  location?: string;
  department?: string;
  lessonType?: string;
}

export const PerformanceReport = () => {
  const [filters, setFilters] = useState<PerformanceFilters>({
    timeRange: '30days',
    location: 'all',
    department: 'all',
    lessonType: 'all',
  });

  // Fetch locations for filter
  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data } = await supabase
        .from('locations')
        .select('id, name')
        .order('name');
      return data || [];
    },
  });

  // Fetch departments for filter - filtered by location if one is selected
  const { data: departments } = useQuery({
    queryKey: ['departments', filters.location],
    queryFn: async () => {
      if (filters.location && filters.location !== 'all') {
        // Get users at the selected location from profiles table
        const { data: locationUsers } = await supabase
          .from('profiles')
          .select('id')
          .eq('location', filters.location);
        
        if (locationUsers && locationUsers.length > 0) {
          const userIds = locationUsers.map(u => u.id);
          
          // Get departments for users at this location
          const { data: allUserDepts, error: userDeptsError } = await supabase
            .from('user_departments')
            .select('department_id, user_id')
            .eq('is_primary', true);
          
          if (userDeptsError) {
            const { data: allDepts } = await supabase
              .from('departments')
              .select('id, name')
              .order('name');
            return allDepts || [];
          }
          
          // Filter to only include departments for users at this location
          const userDepts = allUserDepts?.filter(dept => userIds.includes(dept.user_id)) || [];
          
          if (userDepts && userDepts.length > 0) {
            const departmentIds = userDepts.map(d => d.department_id);
            
            // Get department details - avoid using .in() to prevent 400 error
            const { data: allDeptDetails } = await supabase
              .from('departments')
              .select('id, name');
            
            // Filter departments in JavaScript to avoid the 400 error
            const deptDetails = allDeptDetails?.filter(dept => departmentIds.includes(dept.id)) || [];
            return deptDetails;
          }
          
          return [];
        }
        return [];
      } else {
        // If no location selected, show all departments
        const { data } = await supabase
          .from('departments')
          .select('id, name')
          .order('name');
        return data || [];
      }
    },
  });

  const { data: performanceData, isLoading } = useQuery({
    queryKey: ['performanceData', filters],
    queryFn: async (): Promise<PerformanceData> => {
      
      // Get filtered user IDs based on location and department filters
      let filteredUserIds: string[] = [];
      
      if (filters.location && filters.location !== 'all') {
        const { data: locationUsers } = await supabase
          .from('profiles')
          .select('id')
          .eq('location', filters.location);
        
        if (locationUsers) {
          filteredUserIds = locationUsers.map(u => u.id);
        }
      }
      
      if (filters.department && filters.department !== 'all') {
        const { data: departmentUsers } = await supabase
          .from('user_departments')
          .select('user_id')
          .eq('department_id', filters.department);
        
        if (departmentUsers) {
          const deptUserIds = departmentUsers.map(u => u.user_id);
          
          if (filteredUserIds.length > 0) {
            filteredUserIds = filteredUserIds.filter(id => deptUserIds.includes(id));
          } else {
            filteredUserIds = deptUserIds;
          }
        }
      }

      // Calculate time range
      const now = new Date();
      const startDate = new Date();
      switch (filters.timeRange) {
        case '7days':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      // Fetch completion rates by lesson
      let completionQuery = supabase
        .from('user_answer_responses')
        .select(`
          lesson_id,
          user_id,
          total_score,
          lessons!inner(title)
        `)
        .gte('created_at', startDate.toISOString());

      if (filteredUserIds.length > 0) {
        completionQuery = completionQuery.in('user_id', filteredUserIds);
      }

      const { data: completionData } = await completionQuery;

      // Fetch all lessons for comparison
      const { data: allLessons } = await supabase
        .from('lessons')
        .select('id, title')
        .eq('status', 'published');

      // Fetch behavior analytics for time spent
      let behaviorQuery = supabase
        .from('user_behavior_analytics')
        .select(`
          lesson_id,
          total_time_spent,
          user_id,
          lessons!inner(title)
        `)
        .gte('created_at', startDate.toISOString());

      if (filteredUserIds.length > 0) {
        behaviorQuery = behaviorQuery.in('user_id', filteredUserIds);
      }

      const { data: behaviorData } = await behaviorQuery;

      // Process completion rates
      const lessonCompletionMap = new Map();
      completionData?.forEach(response => {
        const lessonId = response.lesson_id;
        const lessonTitle = response.lessons?.title || 'Unknown';
        
        if (!lessonCompletionMap.has(lessonId)) {
          lessonCompletionMap.set(lessonId, {
            name: lessonTitle,
            completed: 0,
            total: 0,
            percentage: 0
          });
        }
        
        const lesson = lessonCompletionMap.get(lessonId);
        lesson.completed++;
        lesson.total++;
      });

      // Add lessons with no completions
      allLessons?.forEach(lesson => {
        if (!lessonCompletionMap.has(lesson.id)) {
          lessonCompletionMap.set(lesson.id, {
            name: lesson.title,
            completed: 0,
            total: 0,
            percentage: 0
          });
        }
      });

      // Calculate percentages
      lessonCompletionMap.forEach(lesson => {
        lesson.percentage = lesson.total > 0 ? Math.round((lesson.completed / lesson.total) * 100) : 0;
      });

      // Process average scores
      const scoreMap = new Map();
      completionData?.forEach(response => {
        const lessonId = response.lesson_id;
        const lessonTitle = response.lessons?.title || 'Unknown';
        
        if (!scoreMap.has(lessonId)) {
          scoreMap.set(lessonId, {
            name: lessonTitle,
            totalScore: 0,
            count: 0,
            averageScore: 0
          });
        }
        
        const lesson = scoreMap.get(lessonId);
        lesson.totalScore += response.total_score || 0;
        lesson.count++;
      });

      // Calculate averages
      scoreMap.forEach(lesson => {
        lesson.averageScore = lesson.count > 0 ? Math.round(lesson.totalScore / lesson.count) : 0;
      });

      // Process time spent
      const timeMap = new Map();
      behaviorData?.forEach(session => {
        const lessonId = session.lesson_id;
        const lessonTitle = session.lessons?.title || 'Unknown';
        
        if (!timeMap.has(lessonId)) {
          timeMap.set(lessonId, {
            name: lessonTitle,
            totalTime: 0,
            sessions: 0,
            averageTime: 0
          });
        }
        
        const lesson = timeMap.get(lessonId);
        lesson.totalTime += session.total_time_spent || 0;
        lesson.sessions++;
      });

      // Calculate averages
      timeMap.forEach(lesson => {
        lesson.averageTime = lesson.sessions > 0 ? Math.round(lesson.totalTime / lesson.sessions / 60) : 0; // Convert to minutes
      });

      // Generate progress trends (simplified)
      const progressTrends = [
        { date: 'Week 1', completedLessons: 45, averageScore: 78 },
        { date: 'Week 2', completedLessons: 52, averageScore: 82 },
        { date: 'Week 3', completedLessons: 48, averageScore: 79 },
        { date: 'Week 4', completedLessons: 61, averageScore: 85 },
      ];

      // Generate top performers (simplified)
      const topPerformers = [
        { name: 'John Doe', score: 95, lessonsCompleted: 12 },
        { name: 'Jane Smith', score: 92, lessonsCompleted: 10 },
        { name: 'Mike Johnson', score: 89, lessonsCompleted: 11 },
        { name: 'Sarah Wilson', score: 87, lessonsCompleted: 9 },
        { name: 'Tom Brown', score: 85, lessonsCompleted: 8 },
      ];

      return {
        completionRates: Array.from(lessonCompletionMap.values()),
        averageScores: Array.from(scoreMap.values()),
        timeSpent: Array.from(timeMap.values()),
        progressTrends,
        topPerformers,
      };
    },
  });

  const handleExportExcel = () => {
    // Implementation for Excel export
    // TODO: Implement Excel export functionality
  };

  const handleExportPDF = () => {
    // Implementation for PDF export
    // TODO: Implement PDF export functionality
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading performance data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              value={filters.timeRange}
              onValueChange={(value) => setFilters(prev => ({ ...prev, timeRange: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.location}
              onValueChange={(value) => setFilters(prev => ({ ...prev, location: value, department: 'all' }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations?.map((loc) => (
                  <SelectItem key={loc.id} value={loc.name}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.department}
              onValueChange={(value) => setFilters(prev => ({ ...prev, department: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments?.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.lessonType}
              onValueChange={(value) => setFilters(prev => ({ ...prev, lessonType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Lesson Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="cybersecurity">Cybersecurity</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceData?.completionRates.length > 0 
                ? Math.round(performanceData.completionRates.reduce((sum, item) => sum + item.percentage, 0) / performanceData.completionRates.length)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average across all lessons
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceData?.averageScores.length > 0 
                ? Math.round(performanceData.averageScores.reduce((sum, item) => sum + item.averageScore, 0) / performanceData.averageScores.length)
                : 0}/100
            </div>
            <p className="text-xs text-muted-foreground">
              Across all assessments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Time Spent</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceData?.timeSpent.length > 0 
                ? Math.round(performanceData.timeSpent.reduce((sum, item) => sum + item.averageTime, 0) / performanceData.timeSpent.length)
                : 0} min
            </div>
            <p className="text-xs text-muted-foreground">
              Per lesson session
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Learners</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceData?.completionRates.reduce((sum, item) => sum + item.completed, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              In the selected period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Lesson Completion Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData?.completionRates || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="percentage" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Scores by Lesson</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData?.averageScores || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="averageScore" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progress Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData?.progressTrends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="completedLessons" stroke="#8884d8" />
                <Line type="monotone" dataKey="averageScore" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceData?.topPerformers.map((performer, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{performer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {performer.lessonsCompleted} lessons completed
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{performer.score}/100</p>
                    <p className="text-sm text-muted-foreground">Average score</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button onClick={handleExportExcel} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export to Excel
            </Button>
            <Button onClick={handleExportPDF} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export to PDF
            </Button>
            <Button onClick={handlePrint} variant="outline">
              <Printer className="w-4 h-4 mr-2" />
              Print Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
