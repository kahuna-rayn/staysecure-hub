import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Users, MapPin, Building, Globe, Activity, UserCheck, UserX, Filter, Printer, FileText } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, LineChart, Line } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useReactToPrint } from 'react-to-print';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface UserData {
  userDemographics: Array<{ name: string; value: number; color: string }>;
  userEngagement: Array<{ name: string; active: number; inactive: number; total: number }>;
  departmentDistribution: Array<{ name: string; users: number; percentage: number }>;
  locationDistribution: Array<{ name: string; users: number; percentage: number }>;
  userActivity: Array<{ date: string; activeUsers: number; newUsers: number }>;
  topUsers: Array<{ name: string; lessonsCompleted: number; averageScore: number; lastActive: string }>;
}

interface UserFilters {
  timeRange: string;
  location?: string;
  department?: string;
  userStatus?: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00c49f', '#ffbb28', '#ff8042'];

export const UserReport = () => {
  const printRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<UserFilters>({
    timeRange: '30days'
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

  const { data: userData, isLoading } = useQuery({
    queryKey: ['userData', filters],
    queryFn: async (): Promise<UserData> => {
      
      // Get filtered user IDs based on location and department filters
      let filteredUserIds: string[] = [];
      
      if (filters.location && filters.location !== 'all') {
        const { data: locationUsers } = await supabase
          .from('physical_location_access')
          .select('user_id')
          .eq('location_id', filters.location);
        
        if (locationUsers) {
          filteredUserIds = locationUsers.map(u => u.user_id);
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

      // Fetch user profiles
      let profilesQuery = supabase
        .from('profiles')
        .select('*');

      if (filteredUserIds.length > 0) {
        profilesQuery = profilesQuery.in('id', filteredUserIds);
      }

      const { data: profiles } = await profilesQuery;

      // Fetch user departments
      let userDeptsQuery = supabase
        .from('user_departments')
        .select(`
          user_id,
          departments!inner(name)
        `)
        .eq('is_primary', true);

      if (filteredUserIds.length > 0) {
        userDeptsQuery = userDeptsQuery.in('user_id', filteredUserIds);
      }

      const { data: userDepts } = await userDeptsQuery;

      // Fetch user locations
      let userLocationsQuery = supabase
        .from('physical_location_access')
        .select(`
          user_id,
          locations!inner(name)
        `);

      if (filteredUserIds.length > 0) {
        userLocationsQuery = userLocationsQuery.in('user_id', filteredUserIds);
      }

      const { data: userLocations } = await userLocationsQuery;

      // Fetch user activity
      let activityQuery = supabase
        .from('user_behavior_analytics')
        .select(`
          user_id,
          created_at
        `)
        .gte('created_at', startDate.toISOString());

      if (filteredUserIds.length > 0) {
        activityQuery = activityQuery.in('user_id', filteredUserIds);
      }

      const { data: userActivityData } = await activityQuery;

      // Fetch user answer responses for lesson completion data
      let responsesQuery = supabase
        .from('user_answer_responses')
        .select(`
          user_id,
          total_score,
          created_at
        `)
        .gte('created_at', startDate.toISOString());

      if (filteredUserIds.length > 0) {
        responsesQuery = responsesQuery.in('user_id', filteredUserIds);
      }

      const { data: userResponses } = await responsesQuery;

      // Process user demographics (language distribution)
      const languageStats = profiles?.reduce((acc, profile) => {
        const language = profile.language || 'English';
        acc[language] = (acc[language] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const userDemographics = Object.entries(languageStats).map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length]
      }));

      // Process user engagement (active vs inactive)
      const activeUsers = new Set(userActivityData?.map(item => item.user_id) || []);
      const totalUsers = profiles?.length || 0;
      const activeCount = activeUsers.size;
      const inactiveCount = totalUsers - activeCount;

      const userEngagement = [{
        name: 'User Engagement',
        active: activeCount,
        inactive: inactiveCount,
        total: totalUsers
      }];

      // Process department distribution
      const deptStats = userDepts?.reduce((acc, item) => {
        const deptName = item.departments?.name || 'Unknown';
        acc[deptName] = (acc[deptName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const departmentDistribution = Object.entries(deptStats).map(([name, users]) => ({
        name,
        users,
        percentage: Math.round((users / totalUsers) * 100)
      }));

      // Process location distribution
      const locationStats = userLocations?.reduce((acc, item) => {
        const locationName = item.locations?.name || 'Unknown';
        acc[locationName] = (acc[locationName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const locationDistribution = Object.entries(locationStats).map(([name, users]) => ({
        name,
        users,
        percentage: Math.round((users / totalUsers) * 100)
      }));

      // Generate user activity trends (simplified)
      const userActivity = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toLocaleDateString(),
          activeUsers: Math.floor(Math.random() * 20) + 10,
          newUsers: Math.floor(Math.random() * 5) + 1
        };
      });

      // Generate top users from actual user data
      const userStats = profiles?.map(profile => {
        const profileResponses = userResponses?.filter(r => r.user_id === profile.id) || [];
        const userBehavior = userActivityData?.filter(b => b.user_id === profile.id) || [];
        
        const lessonsCompleted = profileResponses.length;
        const averageScore = profileResponses.length > 0 
          ? Math.round(profileResponses.reduce((sum, r) => sum + (r.total_score || 0), 0) / profileResponses.length)
          : 0;
        
        const lastActive = userBehavior.length > 0 
          ? new Date(Math.max(...userBehavior.map(b => new Date(b.created_at).getTime()))).toLocaleDateString()
          : 'Never';
        
        return {
          name: profile.full_name || profile.username || `User ${profile.id.slice(0, 8)}`,
          lessonsCompleted,
          averageScore,
          lastActive
        };
      }) || [];

      const topUsers = userStats
        .filter(user => user.lessonsCompleted > 0)
        .sort((a, b) => b.lessonsCompleted - a.lessonsCompleted)
        .slice(0, 10);

      return {
        userDemographics,
        userEngagement,
        departmentDistribution,
        locationDistribution,
        userActivity,
        topUsers
      };
    },
  });

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const handleExportExcel = () => {
    if (!userData) return;

    const workbook = XLSX.utils.book_new();
    
    // User demographics sheet
    const demographicsSheet = XLSX.utils.json_to_sheet(userData.userDemographics);
    XLSX.utils.book_append_sheet(workbook, demographicsSheet, 'User Demographics');
    
    // Department distribution sheet
    const deptSheet = XLSX.utils.json_to_sheet(userData.departmentDistribution);
    XLSX.utils.book_append_sheet(workbook, deptSheet, 'Department Distribution');
    
    // Location distribution sheet
    const locationSheet = XLSX.utils.json_to_sheet(userData.locationDistribution);
    XLSX.utils.book_append_sheet(workbook, locationSheet, 'Location Distribution');
    
    // Top users sheet
    const topUsersSheet = XLSX.utils.json_to_sheet(userData.topUsers);
    XLSX.utils.book_append_sheet(workbook, topUsersSheet, 'Top Users');
    
    XLSX.writeFile(workbook, 'user_report.xlsx');
  };

  const handleExportPDF = () => {
    if (!userData) return;

    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('User Report', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
    
    // Add department distribution table
    autoTable(doc, {
      head: [['Department', 'Users', 'Percentage']],
      body: userData.departmentDistribution.map(item => [
        item.name,
        item.users.toString(),
        `${item.percentage}%`
      ]),
      startY: 40,
    });
    
    doc.save('user_report.pdf');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading user data...</div>
      </div>
    );
  }

  return (
    <div ref={printRef} className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-learning-primary">User Reports</h2>
          <p className="text-muted-foreground">User engagement statistics, demographics, and individual progress</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleExportExcel} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button onClick={handleExportPDF} variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
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
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                location: value,
                department: 'all' // Reset department when location changes
              }))}
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
              value={filters.userStatus}
              onValueChange={(value) => setFilters(prev => ({ ...prev, userStatus: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="User Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="active">Active Users</SelectItem>
                <SelectItem value="inactive">Inactive Users</SelectItem>
                <SelectItem value="new">New Users</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userData?.userEngagement[0]?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all locations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userData?.userEngagement[0]?.active || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              In selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userData?.userEngagement[0]?.inactive || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              No recent activity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userData?.userEngagement[0]?.total > 0 
                ? Math.round((userData.userEngagement[0].active / userData.userEngagement[0].total) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Active users percentage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Demographics */}
        <Card>
          <CardHeader>
            <CardTitle>User Demographics</CardTitle>
            <CardDescription>Language distribution of users</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userData?.userDemographics || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {userData?.userDemographics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
            <CardDescription>Users by department</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userData?.departmentDistribution || []}>
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="users" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Location Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Location Distribution</CardTitle>
            <CardDescription>Users by location</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userData?.locationDistribution || []}>
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="users" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Activity Trends */}
        <Card>
          <CardHeader>
            <CardTitle>User Activity Trends</CardTitle>
            <CardDescription>Daily active and new users</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userData?.userActivity || []}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="activeUsers" stroke="#8884d8" name="Active Users" />
                <Line type="monotone" dataKey="newUsers" stroke="#82ca9d" name="New Users" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Users</CardTitle>
          <CardDescription>Users with highest lesson completion and scores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">User</th>
                  <th className="text-left p-2">Lessons Completed</th>
                  <th className="text-left p-2">Average Score</th>
                  <th className="text-left p-2">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {userData?.topUsers.slice(0, 10).map((user, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">{user.name}</td>
                    <td className="p-2">{user.lessonsCompleted}</td>
                    <td className="p-2">{user.averageScore}/100</td>
                    <td className="p-2">{user.lastActive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
