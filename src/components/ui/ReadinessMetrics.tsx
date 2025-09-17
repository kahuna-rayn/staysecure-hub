import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mail,
  Shield, 
  FileText, 
  TrendingUp,
  ChevronRight,
  ArrowLeft,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ReadinessDrillDown from './ReadinessDrillDown';
import type { DrillDownLevel } from './EnhancedMetrics';

interface MetricDefinition {
  id: string;
  title: string;
  icon: React.ReactNode;
  getValue: (profiles: any[], phishingData?: any[], documentData?: any[]) => number | string;
  drillDownLevels: string[];
  type: 'count' | 'percentage' | 'score' | 'binary';
}

const ReadinessMetrics: React.FC = () => {
  const { profiles } = useUserProfiles();
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [drillDownPath, setDrillDownPath] = useState<DrillDownLevel[]>([]);
  const [allUserDepartments, setAllUserDepartments] = useState([]);

  // Fetch user departments directly
  React.useEffect(() => {
    const fetchDepartments = async () => {
      try {
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
        
        setAllUserDepartments(data || []);
      } catch (err) {
        console.error('Exception fetching departments:', err);
      }
    };
    
    fetchDepartments();
  }, []);

  // Fetch phishing data
  const { data: phishingData = [] } = useQuery({
    queryKey: ['phishing-scores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_phishing_scores')
        .select('*');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch document assignments data
  const { data: documentAssignments = [] } = useQuery({
    queryKey: ['document-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_assignments')
        .select(`
          *,
          documents (
            title,
            category
          )
        `);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch documents data
  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch checklist data for DBIMT identification
  const { data: hibChecklist = [] } = useQuery({
    queryKey: ['hib-checklist'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hib_checklist')
        .select('*')
        .eq('hib_clause', 67);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Create department map
  const userDepartmentMap = new Map();
  allUserDepartments.forEach(ud => {
    userDepartmentMap.set(ud.user_id, ud.departments?.name || 'Unknown Department');
  });

  // Enhance profiles with department data
  const enhancedProfiles = profiles.map(profile => ({
    ...profile,
    primary_department: userDepartmentMap.get(profile.id) || profile.department || 'Unknown Department',
  }));

  // Calculate unique locations and departments for drill-downs
  const locations = [...new Set(enhancedProfiles.map(p => p.location).filter(Boolean))];
  const departments = [...new Set(enhancedProfiles.map(p => p.primary_department).filter(Boolean))];

  // Create user department map for drill-down
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

  const readinessMetrics: MetricDefinition[] = [
    // Phishing Metrics
    {
      id: 'phishing_emails_sent',
      title: 'Phishing Emails Sent',
      icon: <Mail className="h-6 w-6" />,
      getValue: (profiles, phishingData) => {
        return phishingData?.filter(p => p.resource === 'sent').length || 0;
      },
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'count'
    },
    {
      id: 'staff_phished',
      title: 'Staff Phished',
      icon: <Mail className="h-6 w-6" />,
      getValue: (profiles, phishingData) => {
        const uniquePhishedUsers = new Set(
          phishingData?.filter(p => p.resource === 'click_link').map(p => p.user_id) || []
        );
        return uniquePhishedUsers.size;
      },
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'count'
    },
    {
      id: 'incident_response_team',
      title: 'Data Breach Incident Management Team Identified',
      icon: <Shield className="h-6 w-6" />,
      getValue: (profiles, phishingData, documentData) => {
        // Check HIB Checklist Clause 67 implementation status
        const hibImplemented = hibChecklist.some(item => 
          item.implementation_status === 'Implemented' || 
          item.implementation_status === 'Complete'
        );
        return hibImplemented ? 'Identified' : 'Not Identified';
      },
      drillDownLevels: ['Status'],
      type: 'binary'
    },
    // Document Reading Requirements
    {
      id: 'staff_required_irp',
      title: 'Staff Required to Read Incident Response Plan',
      icon: <FileText className="h-6 w-6" />,
      getValue: (profiles, phishingData, documentData) => {
        const irpDoc = documents.find(d => 
          d.title?.toLowerCase().includes('incident response') ||
          d.category?.toLowerCase().includes('incident')
        );
        if (!irpDoc) return 0;
        
        return documentAssignments.filter(a => a.document_id === irpDoc.document_id).length;
      },
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'count'
    },
    {
      id: 'staff_required_isp',
      title: 'Staff Required to Read Information Security Policy',
      icon: <FileText className="h-6 w-6" />,
      getValue: (profiles, phishingData, documentData) => {
        const ispDoc = documents.find(d => 
          d.title?.toLowerCase().includes('information security') ||
          d.title?.toLowerCase().includes('security policy')
        );
        if (!ispDoc) return 0;
        
        return documentAssignments.filter(a => a.document_id === ispDoc.document_id).length;
      },
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'count'
    },
    {
      id: 'staff_required_dpp',
      title: 'Staff Required to Read Data Protection Policy',
      icon: <FileText className="h-6 w-6" />,
      getValue: (profiles, phishingData, documentData) => {
        const dppDoc = documents.find(d => 
          d.title?.toLowerCase().includes('data protection') ||
          d.title?.toLowerCase().includes('privacy policy')
        );
        if (!dppDoc) return 0;
        
        return documentAssignments.filter(a => a.document_id === dppDoc.document_id).length;
      },
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'count'
    },
    {
      id: 'staff_required_chh',
      title: 'Staff Required to Read Cyber Hygiene Handbook - All Staff',
      icon: <FileText className="h-6 w-6" />,
      getValue: (profiles, phishingData, documentData) => {
        const chhDoc = documents.find(d => 
          d.title === 'Cyber Hygiene Handbook - All Staff'
        );
        if (!chhDoc) return 0;
        
        return documentAssignments.filter(a => a.document_id === chhDoc.document_id).length;
      },
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'count'
    },
    // Document Reading Completion
    {
      id: 'staff_read_irp',
      title: 'Staff Read Incident Response Plan',
      icon: <CheckCircle className="h-6 w-6" />,
      getValue: (profiles, phishingData, documentData) => {
        const irpDoc = documents.find(d => 
          d.title?.toLowerCase().includes('incident response') ||
          d.category?.toLowerCase().includes('incident')
        );
        if (!irpDoc) return 0;
        
        return documentAssignments.filter(a => 
          a.document_id === irpDoc.document_id && a.status === 'Completed'
        ).length;
      },
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'count'
    },
    {
      id: 'staff_read_isp',
      title: 'Staff Read Information Security Policy',
      icon: <CheckCircle className="h-6 w-6" />,
      getValue: (profiles, phishingData, documentData) => {
        const ispDoc = documents.find(d => 
          d.title?.toLowerCase().includes('information security') ||
          d.title?.toLowerCase().includes('security policy')
        );
        if (!ispDoc) return 0;
        
        return documentAssignments.filter(a => 
          a.document_id === ispDoc.document_id && a.status === 'Completed'
        ).length;
      },
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'count'
    },
    {
      id: 'staff_read_dpp',
      title: 'Staff Read Data Protection Policy',
      icon: <CheckCircle className="h-6 w-6" />,
      getValue: (profiles, phishingData, documentData) => {
        const dppDoc = documents.find(d => 
          d.title?.toLowerCase().includes('data protection') ||
          d.title?.toLowerCase().includes('privacy policy')
        );
        if (!dppDoc) return 0;
        
        return documentAssignments.filter(a => 
          a.document_id === dppDoc.document_id && a.status === 'Completed'
        ).length;
      },
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'count'
    },
    {
      id: 'staff_read_chh',
      title: 'Staff Read Cyber Hygiene Handbook - All Staff',
      icon: <CheckCircle className="h-6 w-6" />,
      getValue: (profiles, phishingData, documentData) => {
        const chhDoc = documents.find(d => 
          d.title === 'Cyber Hygiene Handbook - All Staff'
        );
        if (!chhDoc) return 0;
        
        return documentAssignments.filter(a => 
          a.document_id === chhDoc.document_id && a.status === 'Completed'
        ).length;
      },
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'count'
    }
  ];

  const performanceMetrics: MetricDefinition[] = [
    {
      id: 'staff_failed_phishing',
      title: 'Staff Failed Phishing Simulation',
      icon: <TrendingUp className="h-6 w-6" />,
      getValue: (profiles, phishingData) => {
        const totalSent = phishingData?.filter(p => p.resource === 'sent').length || 0;
        const totalClicked = phishingData?.filter(p => p.resource === 'click_link').length || 0;
        return totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0;
      },
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'percentage'
    },
    {
      id: 'irp_read_completion',
      title: 'Incident Response Plan Read',
      icon: <FileText className="h-6 w-6" />,
      getValue: (profiles, phishingData, documentData) => {
        const irpDoc = documents.find(d => 
          d.title?.toLowerCase().includes('incident response') ||
          d.category?.toLowerCase().includes('incident')
        );
        if (!irpDoc) return 0;
        
        const totalAssigned = documentAssignments.filter(a => a.document_id === irpDoc.document_id).length;
        const totalCompleted = documentAssignments.filter(a => 
          a.document_id === irpDoc.document_id && a.status === 'Completed'
        ).length;
        
        return totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;
      },
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'percentage'
    },
    {
      id: 'isp_read_completion',
      title: 'Information Security Policy Read',
      icon: <Shield className="h-6 w-6" />,
      getValue: (profiles, phishingData, documentData) => {
        const ispDoc = documents.find(d => 
          d.title?.toLowerCase().includes('information security') ||
          d.title?.toLowerCase().includes('security policy')
        );
        if (!ispDoc) return 0;
        
        const totalAssigned = documentAssignments.filter(a => a.document_id === ispDoc.document_id).length;
        const totalCompleted = documentAssignments.filter(a => 
          a.document_id === ispDoc.document_id && a.status === 'Completed'
        ).length;
        
        return totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;
      },
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'percentage'
    },
    {
      id: 'dpp_read_completion',
      title: 'Data Protection Policy Read',
      icon: <FileText className="h-6 w-6" />,
      getValue: (profiles, phishingData, documentData) => {
        const dppDoc = documents.find(d => 
          d.title?.toLowerCase().includes('data protection') ||
          d.title?.toLowerCase().includes('privacy policy')
        );
        if (!dppDoc) return 0;
        
        const totalAssigned = documentAssignments.filter(a => a.document_id === dppDoc.document_id).length;
        const totalCompleted = documentAssignments.filter(a => 
          a.document_id === dppDoc.document_id && a.status === 'Completed'
        ).length;
        
        return totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;
      },
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'percentage'
    },
    {
      id: 'chh_read_completion',
      title: 'Cyber Hygiene Handbook Read - All Staff',
      icon: <FileText className="h-6 w-6" />,
      getValue: (profiles, phishingData, documentData) => {
        const chhDoc = documents.find(d => 
          d.title === 'Cyber Hygiene Handbook - All Staff'
        );
        if (!chhDoc) return 0;
        
        const totalAssigned = documentAssignments.filter(a => a.document_id === chhDoc.document_id).length;
        const totalCompleted = documentAssignments.filter(a => 
          a.document_id === chhDoc.document_id && a.status === 'Completed'
        ).length;
        
        return totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;
      },
      drillDownLevels: ['Organization', 'Location', 'Department', 'Staff List'],
      type: 'percentage'
    }
  ];

  const handleMetricClick = (metricId: string) => {
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
    if (type === 'binary') {
      return value === 'Identified' ? 'Green' : 'Red';
    }
    if (type === 'percentage') return `${value}%`;
    if (type === 'score') return `${value}/100`;
    return value.toString();
  };

  const getColorClass = (type: string, value: number | string) => {
    if (type === 'binary') {
      return value === 'Identified' ? 'text-green-600' : 'text-red-600';
    }
    if (type === 'percentage' || type === 'score') {
      const num = typeof value === 'string' ? parseInt(value) : value;
      if (num >= 80) return 'text-green-600';
      if (num >= 60) return 'text-yellow-600';
      return 'text-red-600';
    }
    return 'text-primary';
  };

  const getBinaryIcon = (value: string) => {
    return value === 'Identified' ? 
      <CheckCircle className="h-6 w-6 text-green-600" /> : 
      <AlertTriangle className="h-6 w-6 text-red-600" />;
  };

  // Group metrics for custom layout
  const incidentResponseTeamMetric = readinessMetrics.find(m => m.id === 'incident_response_team');
  const phishingEmailsSentMetric = readinessMetrics.find(m => m.id === 'phishing_emails_sent');
  const staffPhishedMetric = readinessMetrics.find(m => m.id === 'staff_phished');

  const requiredToReadMetrics = [
    readinessMetrics.find(m => m.id === 'staff_required_irp'),
    readinessMetrics.find(m => m.id === 'staff_required_isp'),
    readinessMetrics.find(m => m.id === 'staff_required_dpp'),
    readinessMetrics.find(m => m.id === 'staff_required_chh'),
  ].filter(Boolean);

  const readMetrics = [
    readinessMetrics.find(m => m.id === 'staff_read_irp'),
    readinessMetrics.find(m => m.id === 'staff_read_isp'),
    readinessMetrics.find(m => m.id === 'staff_read_dpp'),
    readinessMetrics.find(m => m.id === 'staff_read_chh'),
  ].filter(Boolean);

  if (selectedMetric) {
    const metric = [...readinessMetrics, ...performanceMetrics].find(m => m.id === selectedMetric);
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
        
        <ReadinessDrillDown
          metric={metric}
          profiles={enhancedProfiles}
          drillDownPath={drillDownPath}
          onDrillDown={handleDrillDown}
          phishingData={phishingData}
          documentAssignments={documentAssignments}
          documents={documents}
          locations={locations}
          departments={departments}
        />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Readiness Metrics</h2>
        {/* First row: DBIMT, Phishing Emails Sent, Staff Phished */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 mb-6">
          {[incidentResponseTeamMetric, phishingEmailsSentMetric, staffPhishedMetric].filter(Boolean).map((metric) => {
            const value = metric.getValue(enhancedProfiles, phishingData, documentAssignments);
            return (
              <Card key={metric.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleMetricClick(metric.id)}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                  {metric.type === 'binary' ? getBinaryIcon(value as string) : metric.icon}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`text-2xl font-bold ${getColorClass(metric.type, value)}`}>{formatValue(value, metric.type)}</div>
                      <Badge variant="secondary" className="text-xs mt-1">{metric.drillDownLevels.length} levels</Badge>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        {/* Second row: Staff Required to Read ... */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {requiredToReadMetrics.map((metric) => {
            const value = metric.getValue(enhancedProfiles, phishingData, documentAssignments);
            return (
              <Card key={metric.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleMetricClick(metric.id)}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                  {metric.icon}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`text-2xl font-bold ${getColorClass(metric.type, value)}`}>{formatValue(value, metric.type)}</div>
                      <Badge variant="secondary" className="text-xs mt-1">{metric.drillDownLevels.length} levels</Badge>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        {/* Third row: Staff Read ... */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {readMetrics.map((metric) => {
            const value = metric.getValue(enhancedProfiles, phishingData, documentAssignments);
            return (
              <Card key={metric.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleMetricClick(metric.id)}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                  {metric.icon}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`text-2xl font-bold ${getColorClass(metric.type, value)}`}>{formatValue(value, metric.type)}</div>
                      <Badge variant="secondary" className="text-xs mt-1">{metric.drillDownLevels.length} levels</Badge>
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
            const value = metric.getValue(enhancedProfiles, phishingData, documentAssignments);
            return (
              <Card key={metric.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleMetricClick(metric.id)}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                  {metric.icon}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`text-2xl font-bold ${getColorClass(metric.type, value)}`}>{formatValue(value, metric.type)}</div>
                      <Badge variant="secondary" className="text-xs mt-1">{metric.drillDownLevels.length} levels</Badge>
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

export default ReadinessMetrics;