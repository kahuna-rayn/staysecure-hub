import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileText, Calendar, Settings, Save, Filter, Printer } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, LineChart, Line } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useReactToPrint } from 'react-to-print';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CustomReportConfig {
  reportName: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  metrics: string[];
  filters: {
    location?: string;
    department?: string;
    userStatus?: string;
    lessonType?: string;
  };
  chartType: string;
  groupBy: string;
}

interface CustomReportData {
  [key: string]: Array<Record<string, unknown>>;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00c49f', '#ffbb28', '#ff8042'];

const AVAILABLE_METRICS = [
  { id: 'completion_rate', label: 'Completion Rate', description: 'Percentage of completed lessons' },
  { id: 'average_score', label: 'Average Score', description: 'Average assessment scores' },
  { id: 'time_spent', label: 'Time Spent', description: 'Total time spent on lessons' },
  { id: 'user_engagement', label: 'User Engagement', description: 'Active vs inactive users' },
  { id: 'compliance_status', label: 'Compliance Status', description: 'Compliant vs non-compliant users' },
  { id: 'certification_status', label: 'Certification Status', description: 'Certified vs expired certifications' },
  { id: 'department_distribution', label: 'Department Distribution', description: 'Users by department' },
  { id: 'location_distribution', label: 'Location Distribution', description: 'Users by location' },
];

const CHART_TYPES = [
  { id: 'bar', label: 'Bar Chart' },
  { id: 'line', label: 'Line Chart' },
  { id: 'pie', label: 'Pie Chart' },
  { id: 'table', label: 'Data Table' },
];

const GROUP_BY_OPTIONS = [
  { id: 'lesson', label: 'By Lesson' },
  { id: 'department', label: 'By Department' },
  { id: 'location', label: 'By Location' },
  { id: 'user', label: 'By User' },
  { id: 'date', label: 'By Date' },
];

export const CustomReport = () => {
  const printRef = useRef<HTMLDivElement>(null);
  const [reportConfig, setReportConfig] = useState<CustomReportConfig>({
    reportName: 'Custom Report',
    dateRange: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    },
    metrics: ['completion_rate'],
    filters: {},
    chartType: 'bar',
    groupBy: 'lesson',
  });

  const [savedReports, setSavedReports] = useState<CustomReportConfig[]>([]);
  const [showConfig, setShowConfig] = useState(true);

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
    queryKey: ['departments', reportConfig.filters.location],
    queryFn: async () => {
      if (reportConfig.filters.location && reportConfig.filters.location !== 'all') {
        // Get users at the selected location from profiles table
        const { data: locationUsers } = await supabase
          .from('profiles')
          .select('id')
          .eq('location', reportConfig.filters.location);
        
        if (locationUsers && locationUsers.length > 0) {
          const userIds = locationUsers.map(u => u.id);
          
          // Get departments for users at this location
          const { data: userDepts } = await supabase
            .from('user_departments')
            .select('department_id')
            .eq('is_primary', true)
            .in('user_id', userIds);
          
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

  const { data: customReportData, isLoading } = useQuery({
    queryKey: ['customReportData', reportConfig],
    queryFn: async (): Promise<CustomReportData> => {
      
      // Get filtered user IDs based on location and department filters
      let filteredUserIds: string[] = [];
      
      if (reportConfig.filters.location && reportConfig.filters.location !== 'all') {
        const { data: locationUsers } = await supabase
          .from('physical_location_access')
          .select('user_id')
          .eq('location_id', reportConfig.filters.location);
        
        if (locationUsers) {
          filteredUserIds = locationUsers.map(u => u.user_id);
        }
      }
      
      if (reportConfig.filters.department && reportConfig.filters.department !== 'all') {
        const { data: departmentUsers } = await supabase
          .from('user_departments')
          .select('user_id')
          .eq('department_id', reportConfig.filters.department);
        
        if (departmentUsers) {
          const deptUserIds = departmentUsers.map(u => u.user_id);
          
          if (filteredUserIds.length > 0) {
            filteredUserIds = filteredUserIds.filter(id => deptUserIds.includes(id));
          } else {
            filteredUserIds = deptUserIds;
          }
        }
      }

      const result: CustomReportData = {};

      // Generate data for each selected metric
      for (const metric of reportConfig.metrics) {
        switch (metric) {
          case 'completion_rate':
            result.completion_rate = await generateCompletionRateData(filteredUserIds);
            break;
          case 'average_score':
            result.average_score = await generateAverageScoreData(filteredUserIds);
            break;
          case 'time_spent':
            result.time_spent = await generateTimeSpentData(filteredUserIds);
            break;
          case 'user_engagement':
            result.user_engagement = await generateUserEngagementData(filteredUserIds);
            break;
          case 'compliance_status':
            result.compliance_status = await generateComplianceStatusData(filteredUserIds);
            break;
          case 'certification_status':
            result.certification_status = await generateCertificationStatusData(filteredUserIds);
            break;
          case 'department_distribution':
            result.department_distribution = await generateDepartmentDistributionData(filteredUserIds);
            break;
          case 'location_distribution':
            result.location_distribution = await generateLocationDistributionData(filteredUserIds);
            break;
        }
      }

      return result;
    },
    enabled: reportConfig.metrics.length > 0,
  });

  // Helper functions to generate different types of data
  const generateCompletionRateData = async (filteredUserIds: string[]) => {
    const { data: responses } = await supabase
      .from('user_answer_responses')
      .select(`
        lesson_id,
        user_id,
        lessons!inner(title)
      `)
      .gte('created_at', reportConfig.dateRange.startDate)
      .lte('created_at', reportConfig.dateRange.endDate)
      .in('user_id', filteredUserIds.length > 0 ? filteredUserIds : ['placeholder']);

    const lessonStats = responses?.reduce((acc, item) => {
      const lessonTitle = item.lessons?.title || 'Unknown';
      if (!acc[lessonTitle]) {
        acc[lessonTitle] = { users: new Set(), total: 0 };
      }
      acc[lessonTitle].users.add(item.user_id);
      acc[lessonTitle].total++;
      return acc;
    }, {} as Record<string, { users: Set<string>; total: number }>) || {};

    return Object.entries(lessonStats).map(([name, stats]) => ({
      name,
      completionRate: Math.round((stats.users.size / (filteredUserIds.length || 1)) * 100),
      completedUsers: stats.users.size,
      totalUsers: filteredUserIds.length || 1,
    }));
  };

  const generateAverageScoreData = async (filteredUserIds: string[]) => {
    const { data: responses } = await supabase
      .from('user_answer_responses')
      .select(`
        lesson_id,
        total_score,
        lessons!inner(title)
      `)
      .gte('created_at', reportConfig.dateRange.startDate)
      .lte('created_at', reportConfig.dateRange.endDate)
      .in('user_id', filteredUserIds.length > 0 ? filteredUserIds : ['placeholder']);

    const scoreStats = responses?.reduce((acc, item) => {
      const lessonTitle = item.lessons?.title || 'Unknown';
      if (!acc[lessonTitle]) {
        acc[lessonTitle] = { totalScore: 0, count: 0 };
      }
      acc[lessonTitle].totalScore += item.total_score || 0;
      acc[lessonTitle].count += 1;
      return acc;
    }, {} as Record<string, { totalScore: number; count: number }>) || {};

    return Object.entries(scoreStats).map(([name, stats]) => ({
      name,
      averageScore: Math.round(stats.totalScore / stats.count),
      totalResponses: stats.count,
    }));
  };

  const generateTimeSpentData = async (filteredUserIds: string[]) => {
    const { data: behavior } = await supabase
      .from('user_behavior_analytics')
      .select(`
        lesson_id,
        total_time_spent,
        lessons!inner(title)
      `)
      .gte('created_at', reportConfig.dateRange.startDate)
      .lte('created_at', reportConfig.dateRange.endDate)
      .in('user_id', filteredUserIds.length > 0 ? filteredUserIds : ['placeholder']);

    const timeStats = behavior?.reduce((acc, item) => {
      const lessonTitle = item.lessons?.title || 'Unknown';
      if (!acc[lessonTitle]) {
        acc[lessonTitle] = { totalTime: 0, sessions: 0 };
      }
      acc[lessonTitle].totalTime += item.total_time_spent || 0;
      acc[lessonTitle].sessions += 1;
      return acc;
    }, {} as Record<string, { totalTime: number; sessions: number }>) || {};

    return Object.entries(timeStats).map(([name, stats]) => ({
      name,
      averageTime: Math.round(stats.totalTime / stats.sessions),
      totalSessions: stats.sessions,
    }));
  };

  const generateUserEngagementData = async (filteredUserIds: string[]) => {
    const { data: activity } = await supabase
      .from('user_behavior_analytics')
      .select('user_id')
      .gte('created_at', reportConfig.dateRange.startDate)
      .lte('created_at', reportConfig.dateRange.endDate)
      .in('user_id', filteredUserIds.length > 0 ? filteredUserIds : ['placeholder']);

    const activeUsers = new Set(activity?.map(item => item.user_id) || []);
    const totalUsers = filteredUserIds.length || 1;

    return [{
      name: 'User Engagement',
      active: activeUsers.size,
      inactive: totalUsers - activeUsers.size,
      total: totalUsers,
    }];
  };

  const generateComplianceStatusData = async (filteredUserIds: string[]) => {
    const { data: assignments } = await supabase
      .from('learning_track_assignments')
      .select(`
        user_id,
        status,
        learning_tracks!inner(title)
      `)
      .eq('completion_required', true)
      .in('user_id', filteredUserIds.length > 0 ? filteredUserIds : ['placeholder']);

    const trackStats = assignments?.reduce((acc, item) => {
      const trackTitle = item.learning_tracks?.title || 'Unknown';
      if (!acc[trackTitle]) {
        acc[trackTitle] = { compliant: 0, nonCompliant: 0, total: 0 };
      }
      acc[trackTitle].total++;
      if (item.status === 'completed') {
        acc[trackTitle].compliant++;
      } else {
        acc[trackTitle].nonCompliant++;
      }
      return acc;
    }, {} as Record<string, { compliant: number; nonCompliant: number; total: number }>) || {};

    return Object.entries(trackStats).map(([name, stats]) => ({
      name,
      compliant: stats.compliant,
      nonCompliant: stats.nonCompliant,
      total: stats.total,
    }));
  };

  const generateCertificationStatusData = async (filteredUserIds: string[]) => {
    const { data: responses } = await supabase
      .from('user_answer_responses')
      .select(`
        lesson_id,
        total_score,
        lessons!inner(title)
      `)
      .gte('created_at', reportConfig.dateRange.startDate)
      .lte('created_at', reportConfig.dateRange.endDate)
      .in('user_id', filteredUserIds.length > 0 ? filteredUserIds : ['placeholder']);

    const certStats = responses?.reduce((acc, item) => {
      const lessonTitle = item.lessons?.title || 'Unknown';
      if (!acc[lessonTitle]) {
        acc[lessonTitle] = { certified: 0, expired: 0, pending: 0 };
      }
      
      if (item.total_score >= 80) {
        acc[lessonTitle].certified++;
      } else if (item.total_score < 60) {
        acc[lessonTitle].expired++;
      } else {
        acc[lessonTitle].pending++;
      }
      return acc;
    }, {} as Record<string, { certified: number; expired: number; pending: number }>) || {};

    return Object.entries(certStats).map(([name, stats]) => ({
      name,
      certified: stats.certified,
      expired: stats.expired,
      pending: stats.pending,
    }));
  };

  const generateDepartmentDistributionData = async (filteredUserIds: string[]) => {
    const { data: userDepts } = await supabase
      .from('user_departments')
      .select(`
        user_id,
        departments!inner(name)
      `)
      .eq('is_primary', true)
      .in('user_id', filteredUserIds.length > 0 ? filteredUserIds : ['placeholder']);

    const deptStats = userDepts?.reduce((acc, item) => {
      const deptName = item.departments?.name || 'Unknown';
      acc[deptName] = (acc[deptName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return Object.entries(deptStats).map(([name, users]) => ({
      name,
      users,
      percentage: Math.round((users / (filteredUserIds.length || 1)) * 100),
    }));
  };

  const generateLocationDistributionData = async (filteredUserIds: string[]) => {
    const { data: userLocations } = await supabase
      .from('physical_location_access')
      .select(`
        user_id,
        locations!inner(name)
      `)
      .in('user_id', filteredUserIds.length > 0 ? filteredUserIds : ['placeholder']);

    const locationStats = userLocations?.reduce((acc, item) => {
      const locationName = item.locations?.name || 'Unknown';
      acc[locationName] = (acc[locationName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return Object.entries(locationStats).map(([name, users]) => ({
      name,
      users,
      percentage: Math.round((users / (filteredUserIds.length || 1)) * 100),
    }));
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const handleExportExcel = () => {
    if (!customReportData) return;

    const workbook = XLSX.utils.book_new();
    
    Object.entries(customReportData).forEach(([metricName, data]) => {
      const sheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, sheet, metricName.replace('_', ' '));
    });
    
    XLSX.writeFile(workbook, `${reportConfig.reportName.replace(/\s+/g, '_')}.xlsx`);
  };

  const handleExportPDF = () => {
    if (!customReportData) return;

    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text(reportConfig.reportName, 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
    doc.text(`Date Range: ${reportConfig.dateRange.startDate} to ${reportConfig.dateRange.endDate}`, 20, 40);
    
    let yPosition = 50;
    
    Object.entries(customReportData).forEach(([metricName, data]) => {
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        const body = data.map(item => headers.map(header => item[header]?.toString() || ''));
        
        autoTable(doc, {
          head: [headers],
          body,
          startY: yPosition,
        });
        
        yPosition += data.length * 10 + 20;
      }
    });
    
    doc.save(`${reportConfig.reportName.replace(/\s+/g, '_')}.pdf`);
  };

  const handleSaveReport = () => {
    const newSavedReports = [...savedReports, reportConfig];
    setSavedReports(newSavedReports);
    // In a real app, you'd save this to localStorage or database
    localStorage.setItem('savedReports', JSON.stringify(newSavedReports));
  };

  const handleLoadReport = (savedConfig: CustomReportConfig) => {
    setReportConfig(savedConfig);
    setShowConfig(false);
  };

  const renderChart = (metricName: string, data: Array<Record<string, unknown>>) => {
    if (!data || data.length === 0) return <div>No data available</div>;

    const firstItem = data[0];
    const keys = Object.keys(firstItem).filter(key => key !== 'name');

    switch (reportConfig.chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              {keys.map((key, index) => (
                <Bar key={key} dataKey={key} fill={COLORS[index % COLORS.length]} name={key.replace(/_/g, ' ')} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {keys.map((key, index) => (
                <Line key={key} type="monotone" dataKey={key} stroke={COLORS[index % COLORS.length]} name={key.replace(/_/g, ' ')} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey={keys[0]}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'table':
        return (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  {Object.keys(firstItem).map(key => (
                    <th key={key} className="text-left p-2">{key.replace(/_/g, ' ')}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={index} className="border-b">
                    {Object.values(item).map((value, valueIndex) => (
                      <td key={valueIndex} className="p-2">{value?.toString()}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return <div>Unsupported chart type</div>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Generating custom report...</div>
      </div>
    );
  }

  return (
    <div ref={printRef} className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-learning-primary">Custom Reports</h2>
          <p className="text-muted-foreground">Create configurable reports with custom metrics and visualizations</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowConfig(!showConfig)} variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            {showConfig ? 'Hide Config' : 'Show Config'}
          </Button>
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

      {/* Report Configuration */}
      {showConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Report Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reportName">Report Name</Label>
                <Input
                  id="reportName"
                  value={reportConfig.reportName}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, reportName: e.target.value }))}
                  placeholder="Enter report name"
                />
              </div>
              <div className="flex gap-2">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={reportConfig.dateRange.startDate}
                    onChange={(e) => setReportConfig(prev => ({ 
                      ...prev, 
                      dateRange: { ...prev.dateRange, startDate: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={reportConfig.dateRange.endDate}
                    onChange={(e) => setReportConfig(prev => ({ 
                      ...prev, 
                      dateRange: { ...prev.dateRange, endDate: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Metrics Selection */}
            <div>
              <Label>Select Metrics</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                {AVAILABLE_METRICS.map((metric) => (
                  <div key={metric.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={metric.id}
                      checked={reportConfig.metrics.includes(metric.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setReportConfig(prev => ({
                            ...prev,
                            metrics: [...prev.metrics, metric.id]
                          }));
                        } else {
                          setReportConfig(prev => ({
                            ...prev,
                            metrics: prev.metrics.filter(m => m !== metric.id)
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={metric.id} className="text-sm">
                      {metric.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select
                value={reportConfig.filters.location}
                onValueChange={(value) => setReportConfig(prev => ({ 
                  ...prev, 
                  filters: { 
                    ...prev.filters, 
                    location: value,
                    department: 'all' // Reset department when location changes
                  }
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
                value={reportConfig.filters.department}
                onValueChange={(value) => setReportConfig(prev => ({ 
                  ...prev, 
                  filters: { ...prev.filters, department: value }
                }))}
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
                value={reportConfig.chartType}
                onValueChange={(value) => setReportConfig(prev => ({ ...prev, chartType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chart Type" />
                </SelectTrigger>
                <SelectContent>
                  {CHART_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={reportConfig.groupBy}
                onValueChange={(value) => setReportConfig(prev => ({ ...prev, groupBy: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Group By" />
                </SelectTrigger>
                <SelectContent>
                  {GROUP_BY_OPTIONS.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={handleSaveReport} variant="outline">
                <Save className="w-4 h-4 mr-2" />
                Save Report
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Reports */}
      {savedReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saved Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedReports.map((savedConfig, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => handleLoadReport(savedConfig)}
                  className="justify-start"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {savedConfig.reportName}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Reports */}
      {customReportData && Object.keys(customReportData).length > 0 && (
        <div className="space-y-6">
          {Object.entries(customReportData).map(([metricName, data]) => (
            <Card key={metricName}>
              <CardHeader>
                <CardTitle>{AVAILABLE_METRICS.find(m => m.id === metricName)?.label || metricName}</CardTitle>
                <CardDescription>
                  {AVAILABLE_METRICS.find(m => m.id === metricName)?.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderChart(metricName, data)}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
