import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Printer, Filter } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useReactToPrint } from 'react-to-print';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportData {
  departmentBreakdown: Array<{ name: string; value: number; color: string }>;
  locationBreakdown: Array<{ name: string; value: number; color: string }>;
  lessonProgress: Array<{ name: string; completed: number; total: number }>;
  trackProgress: Array<{ name: string; completed: number; total: number }>;
}

interface ReportFilters {
  location?: string;
  department?: string;
  dateRange?: string;
  reportType: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00c49f', '#ffbb28', '#ff8042'];

export const ReportViewer = () => {
  const printRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<ReportFilters>({
    reportType: 'progress'
  });

  // Fetch departments (filtered by location if selected)
  const { data: departments } = useQuery({
    queryKey: ['departments', filters.location],
    queryFn: async () => {
      if (filters.location && filters.location !== 'all') {
        // First get the location name from the selected location ID
        const { data: selectedLocation } = await supabase
          .from('locations')
          .select('name')
          .eq('id', filters.location)
          .single();
        
        if (!selectedLocation) return [];
        
        // Get users in the selected location from profiles table
        const { data: profileUsers } = await supabase
          .from('profiles')
          .select('id')
          .eq('location', selectedLocation.name);
        
        if (!profileUsers || profileUsers.length === 0) return [];
        
        const userIds = profileUsers.map(u => u.id);
        
        // Get departments for those users
        const { data: userDepts } = await supabase
          .from('user_departments')
          .select(`
            department_id,
            departments!inner(id, name)
          `)
          .eq('is_primary', true)
          .in('user_id', userIds);
        
        if (!userDepts) return [];
        
        // Extract unique departments
        const uniqueDepts = userDepts.reduce((acc: any[], item: any) => {
          const dept = item.departments;
          if (dept && !acc.some(d => d.id === dept.id)) {
            acc.push(dept);
          }
          return acc;
        }, []);
        
        return uniqueDepts.sort((a, b) => a.name.localeCompare(b.name));
      }
      
      // Return all departments if no location filter
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch locations
  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch report data
  const { data: reportData, isLoading } = useQuery({
    queryKey: ['reportData', filters],
    queryFn: async (): Promise<ReportData> => {
      console.log('=== ReportViewer: Applying filters ===', filters);
      
      // Get filtered user IDs based on location and department filters
      let filteredUserIds: string[] = [];
      
      if (filters.location && filters.location !== 'all') {
        // Get users from the selected location
        const { data: locationUsers } = await supabase
          .from('physical_location_access')
          .select('user_id')
          .eq('location_id', filters.location);
        
        if (locationUsers) {
          filteredUserIds = locationUsers.map(u => u.user_id);
        }
      }
      
      if (filters.department && filters.department !== 'all') {
        // Get users from the selected department
        const { data: departmentUsers } = await supabase
          .from('user_departments')
          .select('user_id')
          .eq('department_id', filters.department);
        
        if (departmentUsers) {
          const deptUserIds = departmentUsers.map(u => u.user_id);
          
          // If we already have location filter, intersect the results
          if (filteredUserIds.length > 0) {
            filteredUserIds = filteredUserIds.filter(id => deptUserIds.includes(id));
          } else {
            filteredUserIds = deptUserIds;
          }
        }
      }
      
      console.log('=== Filtered user IDs ===', filteredUserIds);

      // Fetch department breakdown with real user counts
      let departmentQuery = supabase
        .from('user_departments')
        .select(`
          department_id,
          user_id,
          departments!inner(name)
        `);
      
      if (filteredUserIds.length > 0) {
        departmentQuery = departmentQuery.in('user_id', filteredUserIds);
      }
      
      const { data: departmentData } = await departmentQuery;

      // Fetch location data with real access records
      let locationQuery = supabase
        .from('physical_location_access')
        .select(`
          location_id,
          user_id,
          locations!inner(name)
        `);
      
      if (filteredUserIds.length > 0) {
        locationQuery = locationQuery.in('user_id', filteredUserIds);
      }
      
      const { data: locationData } = await locationQuery;

      // Fetch lesson progress with completion data
      let lessonQuery = supabase
        .from('user_answer_responses')
        .select(`
          lesson_id,
          user_id,
          total_score,
          lessons!inner(title)
        `);
      
      if (filteredUserIds.length > 0) {
        lessonQuery = lessonQuery.in('user_id', filteredUserIds);
      }
      
      const { data: lessonData } = await lessonQuery;

      // Fetch all lesson assignments to calculate total enrolled
      const { data: allLessonsData } = await supabase
        .from('lessons')
        .select('id, title')
        .eq('status', 'published');

      // Fetch learning track progress
      let trackQuery = supabase
        .from('learning_track_assignments')
        .select(`
          learning_track_id,
          status,
          user_id,
          learning_tracks!inner(title)
        `);
      
      if (filteredUserIds.length > 0) {
        trackQuery = trackQuery.in('user_id', filteredUserIds);
      }
      
      const { data: trackData } = await trackQuery;

      console.log('=== Query results ===', {
        departmentData: departmentData?.length,
        locationData: locationData?.length,
        lessonData: lessonData?.length,
        trackData: trackData?.length
      });

      // Process data for charts
      const departmentBreakdown = processDepartmentData(departmentData || []);
      const locationBreakdown = processLocationData(locationData || []);
      const lessonProgress = processLessonData(lessonData || [], allLessonsData || []);
      const trackProgress = processTrackData(trackData || []);

      return {
        departmentBreakdown,
        locationBreakdown,
        lessonProgress,
        trackProgress,
      };
    },
  });

  const processDepartmentData = (data: any[]) => {
    const counts = data.reduce((acc, item) => {
      const deptName = item.departments?.name || 'Unknown';
      acc[deptName] = (acc[deptName] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).map(([name, value], index) => ({
      name,
      value: value as number,
      color: COLORS[index % COLORS.length],
    }));
  };

  const processLocationData = (data: any[]) => {
    const counts = data.reduce((acc, item) => {
      const locName = item.locations?.name || 'Unknown';
      acc[locName] = (acc[locName] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).map(([name, value], index) => ({
      name,
      value: value as number,
      color: COLORS[index % COLORS.length],
    }));
  };

  const processLessonData = (data: any[], allLessons: any[]) => {
    // Get user counts by lesson from responses
    const responseStats = data.reduce((acc, item) => {
      const lessonTitle = item.lessons?.title || 'Unknown';
      if (!acc[lessonTitle]) {
        acc[lessonTitle] = { users: new Set(), totalScore: 0, count: 0 };
      }
      acc[lessonTitle].users.add(item.user_id);
      acc[lessonTitle].totalScore += item.total_score || 0;
      acc[lessonTitle].count += 1;
      return acc;
    }, {});

    // Get all published lessons to show complete picture
    return allLessons.map(lesson => {
      const stats = responseStats[lesson.title] || { users: new Set(), totalScore: 0, count: 0 };
      return {
        name: lesson.title,
        completed: stats.users.size,
        total: Math.max(stats.users.size, 1), // At least show 1 to avoid empty charts
      };
    });
  };

  const processTrackData = (data: any[]) => {
    const trackStats = data.reduce((acc, item) => {
      const trackTitle = item.learning_tracks?.title || 'Unknown';
      if (!acc[trackTitle]) {
        acc[trackTitle] = { completed: 0, total: 0 };
      }
      acc[trackTitle].total++;
      if (item.status === 'completed') {
        acc[trackTitle].completed++;
      }
      return acc;
    }, {});

    return Object.entries(trackStats).map(([name, stats]) => ({
      name,
      completed: (stats as any).completed,
      total: (stats as any).total,
    }));
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const exportToCSV = () => {
    if (!reportData) return;

    const csvData = [
      ['Report Type', 'Department Breakdown'],
      ['Department', 'Count'],
      ...reportData.departmentBreakdown.map(item => [item.name, item.value.toString()]),
      [],
      ['Location Breakdown'],
      ['Location', 'Count'],
      ...reportData.locationBreakdown.map(item => [item.name, item.value.toString()]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `report_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportToExcel = () => {
    if (!reportData) return;

    const wb = XLSX.utils.book_new();
    
    // Department sheet
    const deptData = [
      ['Department', 'Count'],
      ...reportData.departmentBreakdown.map(item => [item.name, item.value]),
    ];
    const deptWs = XLSX.utils.aoa_to_sheet(deptData);
    XLSX.utils.book_append_sheet(wb, deptWs, 'Departments');

    // Location sheet
    const locData = [
      ['Location', 'Count'],
      ...reportData.locationBreakdown.map(item => [item.name, item.value]),
    ];
    const locWs = XLSX.utils.aoa_to_sheet(locData);
    XLSX.utils.book_append_sheet(wb, locWs, 'Locations');

    XLSX.writeFile(wb, `report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = async () => {
    if (!reportData) return;

    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Learning Management Report', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
    doc.text(`Report Type: ${filters.reportType}`, 20, 40);

    let currentY = 60;

    // Department breakdown
    doc.setFontSize(16);
    doc.text('Department Breakdown', 20, currentY);
    
    autoTable(doc, {
      startY: currentY + 5,
      head: [['Department', 'User Count']],
      body: reportData.departmentBreakdown.map(item => [item.name, item.value.toString()]),
      margin: { left: 20 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 20;

    // Location breakdown
    doc.setFontSize(16);
    doc.text('Location Access Breakdown', 20, currentY);
    
    autoTable(doc, {
      startY: currentY + 5,
      head: [['Location', 'Access Records']],
      body: reportData.locationBreakdown.map(item => [item.name, item.value.toString()]),
      margin: { left: 20 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 20;

    // Lesson progress
    if (reportData.lessonProgress.length > 0) {
      doc.setFontSize(16);
      doc.text('Lesson Progress', 20, currentY);
      
      autoTable(doc, {
        startY: currentY + 5,
        head: [['Lesson', 'Users Completed', 'Total Users']],
        body: reportData.lessonProgress.map(item => [
          item.name, 
          item.completed.toString(), 
          item.total.toString()
        ]),
        margin: { left: 20 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 20;
    }

    // Learning track progress
    if (reportData.trackProgress.length > 0) {
      doc.setFontSize(16);
      doc.text('Learning Track Progress', 20, currentY);
      
      autoTable(doc, {
        startY: currentY + 5,
        head: [['Track', 'Completed', 'Total Assigned']],
        body: reportData.trackProgress.map(item => [
          item.name, 
          item.completed.toString(), 
          item.total.toString()
        ]),
        margin: { left: 20 },
      });
    }

    doc.save(`learning_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (isLoading) {
    return <div className="p-6">Loading report data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              value={filters.reportType}
              onValueChange={(value) => setFilters(prev => ({ ...prev, reportType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Report Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="progress">Progress Report</SelectItem>
                <SelectItem value="completion">Completion Report</SelectItem>
                <SelectItem value="analytics">Analytics Report</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.location}
              onValueChange={(value) => setFilters(prev => ({ ...prev, location: value, department: undefined }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations?.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
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
              value={filters.dateRange}
              onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last7days">Last 7 days</SelectItem>
                <SelectItem value="last30days">Last 30 days</SelectItem>
                <SelectItem value="last90days">Last 90 days</SelectItem>
                <SelectItem value="lastYear">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Export Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
          <CardDescription>Download or print your reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button onClick={exportToExcel} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Excel
            </Button>
            <Button onClick={exportToPDF} variant="outline" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Export PDF
            </Button>
            <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
              <Printer className="w-4 h-4" />
              Print Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <div ref={printRef} className="space-y-6 print:bg-white">
        <div className="print:hidden">
          <h2 className="text-2xl font-bold">Learning Management Report</h2>
          <p className="text-muted-foreground">Generated on {new Date().toLocaleDateString()}</p>
        </div>

        {/* Pie Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Location Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData?.locationBreakdown || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#82ca9d"
                    dataKey="value"
                  >
                    {reportData?.locationBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Department Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData?.departmentBreakdown || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reportData?.departmentBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Progress Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Lesson Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData?.lessonProgress || []}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" fill="#8884d8" name="Completed" />
                  <Bar dataKey="total" fill="#82ca9d" name="Total" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Learning Track Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData?.trackProgress || []}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" fill="#ffc658" name="Completed" />
                  <Bar dataKey="total" fill="#ff7300" name="Total" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};