import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Building, Users, TrendingUp, Mail, FileText, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { DrillDownLevel } from './EnhancedMetrics';

interface MetricDefinition {
  id: string;
  title: string;
  icon: React.ReactNode;
  getValue: (profiles: any[], phishingData?: any[], documentData?: any[]) => number | string;
  drillDownLevels: string[];
  type: 'count' | 'percentage' | 'score' | 'binary';
}

interface ReadinessDrillDownProps {
  metric: MetricDefinition;
  profiles: any[];
  drillDownPath: DrillDownLevel[];
  onDrillDown: (level: number, data: any[], title: string, type: 'org' | 'location' | 'department' | 'staff', value?: number) => void;
  phishingData: any[];
  documentAssignments: any[];
  documents: any[];
  locations: string[];
  departments: string[];
}

const ReadinessDrillDown: React.FC<ReadinessDrillDownProps> = ({
  metric,
  profiles,
  drillDownPath,
  onDrillDown,
  phishingData,
  documentAssignments,
  documents,
  locations,
  departments
}) => {
  const currentLevel = drillDownPath[drillDownPath.length - 1];
  const canDrillDown = currentLevel.level < metric.drillDownLevels.length;

  const [departmentData, setDepartmentData] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const fetchDepartmentData = async () => {
      try {
        const { data } = await supabase
          .from('user_departments')
          .select(`
            user_id,
            is_primary,
            departments (
              name
            )
          `)
          .eq('is_primary', true);
        
        const deptMap = new Map();
        data?.forEach(item => {
          deptMap.set(item.user_id, item.departments?.name || 'Unknown Department');
        });
        setDepartmentData(deptMap);
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };
    
    fetchDepartmentData();
  }, []);

  // Get relevant user IDs based on the metric
  const getRelevantUserIds = (): string[] => {
    switch (metric.id) {
      case 'staff_phished':
        return phishingData
          .filter(p => p.resource === 'click_link')
          .map(p => p.user_id);
      
      case 'phishing_emails_sent':
        return phishingData
          .filter(p => p.resource === 'sent')
          .map(p => p.user_id);
      
      case 'staff_failed_phishing':
        return phishingData
          .filter(p => p.resource === 'click_link')
          .map(p => p.user_id);
      
      default:
        // For document-related metrics based on the actual metric IDs used
        if (metric.id.includes('_completion') || metric.id.includes('required_') || 
            metric.id.includes('staff_read_') || metric.id.includes('staff_required_')) {
          
          // Find the specific document for this metric
          let targetDocument = null;
          
          if (metric.id.includes('chh') || 
              metric.title.toLowerCase().includes('cyber hygiene handbook - all staff')) {
            const chhDoc = documents.find(d => 
              d.title === 'Cyber Hygiene Handbook - All Staff'
            );
            targetDocument = chhDoc;
          } else if (metric.id.includes('irp') || metric.title.toLowerCase().includes('incident')) {
            targetDocument = documents.find(d => 
              d.title.toLowerCase().includes('incident response') ||
              d.category?.toLowerCase().includes('incident')
            );
          } else if (metric.id.includes('isp') || metric.title.toLowerCase().includes('security')) {
            targetDocument = documents.find(d => 
              d.title.toLowerCase().includes('information security') ||
              d.title.toLowerCase().includes('security policy')
            );
          } else if (metric.id.includes('dpp') || metric.title.toLowerCase().includes('privacy')) {
            targetDocument = documents.find(d => 
              d.title.toLowerCase().includes('data protection') ||
              d.title.toLowerCase().includes('privacy policy')
            );
          }
          
          if (targetDocument) {
            // For "Staff Read" metrics, only show users who have completed reading
            // For "Staff Required to Read" metrics, show all assigned users
            const shouldFilterCompleted = metric.id.includes('staff_read_') || 
                                         metric.id.includes('_completion') ||
                                         metric.title.toLowerCase().includes('staff read');
            
            const allAssignments = documentAssignments.filter(a => a.document_id === targetDocument.document_id);
            
            const relevantAssignments = documentAssignments.filter(a => 
              a.document_id === targetDocument.document_id &&
              (shouldFilterCompleted ? a.status === 'Completed' : true)
            );
            
            return relevantAssignments.map(a => a.user_id);
          }
        }
        return [];
    }
  };

  const calculateMetricValueForUsers = (userIds: string[], profiles: any[]): number => {
    const relevantProfiles = profiles.filter(p => userIds.includes(p.id));
    
    if (metric.type === 'percentage') {
      // For percentage metrics, calculate based on the specific metric logic
      if (metric.id === 'staff_failed_phishing') {
        // For staff_failed_phishing, we need to calculate the percentage of users who clicked vs were sent
        // within the specific user group (location/department)
        const usersWithSentEmails = new Set(
          phishingData
            .filter(p => p.resource === 'sent' && userIds.includes(p.user_id))
            .map(p => p.user_id)
        );
        
        const usersWhoClicked = new Set(
          phishingData
            .filter(p => p.resource === 'click_link' && userIds.includes(p.user_id))
            .map(p => p.user_id)
        );
        
        const totalSent = usersWithSentEmails.size;
        const totalClicked = usersWhoClicked.size;
        
        return totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0;
      } else if (metric.id.includes('_completion')) {
        // Document completion rates - calculate based on the specific document for this metric
        let targetDocument = null;
        
        if (metric.id.includes('chh') || 
            metric.title.toLowerCase().includes('cyber hygiene handbook - all staff')) {
          const chhDoc = documents.find(d => 
            d.title === 'Cyber Hygiene Handbook - All Staff'
          );
          targetDocument = chhDoc;
        } else if (metric.id.includes('irp') || metric.title.toLowerCase().includes('incident')) {
          targetDocument = documents.find(d => 
            d.title.toLowerCase().includes('incident response') ||
            d.category?.toLowerCase().includes('incident')
          );
        } else if (metric.id.includes('isp') || metric.title.toLowerCase().includes('security')) {
          targetDocument = documents.find(d => 
            d.title.toLowerCase().includes('information security') ||
            d.title.toLowerCase().includes('security policy')
          );
        } else if (metric.id.includes('dpp') || metric.title.toLowerCase().includes('privacy')) {
          targetDocument = documents.find(d => 
            d.title.toLowerCase().includes('data protection') ||
            d.title.toLowerCase().includes('privacy policy')
          );
        }
        
        if (targetDocument) {
          // Get all users who should read this specific document (have an assignment)
          const allUsersWithAssignment = documentAssignments
            .filter(a => a.document_id === targetDocument.document_id)
            .map(a => a.user_id);
          
          // Filter to only include users in the current context (location/department)
          const usersInContextWithAssignment = allUsersWithAssignment.filter(id => userIds.includes(id));
          
          // Get users who have completed this specific document
          const usersWhoCompleted = documentAssignments
            .filter(a => 
              a.document_id === targetDocument.document_id && 
              a.status === 'Completed' &&
              userIds.includes(a.user_id)
            )
            .map(a => a.user_id);
          
          const totalAssigned = usersInContextWithAssignment.length;
          const totalCompleted = usersWhoCompleted.length;
          
          return totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;
        }
        
        // Fallback to old logic if document not found
        const totalAssigned = userIds.length;
        const totalCompleted = relevantProfiles.length;
        return totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;
      }
    }
    
    return relevantProfiles.length;
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

  const getBadgeVariant = (status: string): { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string } => {
    switch (status) {
      // Positive/Complete statuses - Green (custom styling)
      case 'Read':
      case 'Completed':
      case 'Not Phished':  // Successfully avoided phishing - positive outcome
        return { 
          variant: 'default', 
          className: 'bg-green-600 text-white border-green-600 hover:bg-green-700' 
        };
      
      // In Progress/Partial statuses - Blue (custom styling)
      case 'In Progress':
      case 'Viewed':
      case 'Sent':
        return { 
          variant: 'secondary', 
          className: 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' 
        };
      
      // Negative/Risk statuses - Red
      case 'Phished':
      case 'Not Started':
        return { variant: 'destructive' };
      
      // Neutral categories - Outline
      default:
        return { variant: 'outline' };
    }
  };

  const getBadgeForUser = (userId: string): string => {
    if (metric.id.includes('phishing')) {
      // For phishing metrics, show the most relevant action based on the metric context
      const userPhishingData = phishingData.filter(p => p.user_id === userId);
      
      if (metric.id === 'phishing_emails_sent') {
        // For "Phishing Emails Sent" metric, show what happened with the sent email
        const hasClickedLink = userPhishingData.some(p => p.resource === 'click_link');
        const hasViewed = userPhishingData.some(p => p.resource === 'view');
        
        if (hasClickedLink) {
          return 'Phished';
        } else if (hasViewed) {
          return 'Viewed';
        } else {
          return 'Sent';
        }
      } else if (metric.id === 'staff_phished' || metric.id === 'staff_failed_phishing') {
        // For "Staff Phished" metrics, check if they actually clicked a link
        const hasClickedLink = userPhishingData.some(p => p.resource === 'click_link');
        if (hasClickedLink) {
          return 'Phished';
        }
        
        // If they were sent an email but didn't click, show appropriate status
        const hasViewed = userPhishingData.some(p => p.resource === 'view');
        const wasSent = userPhishingData.some(p => p.resource === 'sent');
        
        if (hasViewed) {
          return 'Viewed';
        } else if (wasSent) {
          return 'Sent';
        }
        
        return 'Not Phished';
      }
          } else {
        // For document-related metrics, show document read status for the specific document
        let targetDocument = null;
              if (metric.id.includes('chh') || 
            metric.title.toLowerCase().includes('cyber hygiene handbook - all staff')) {
                  const chhDoc = documents.find(d => 
            d.title === 'Cyber Hygiene Handbook - All Staff'
          );
          targetDocument = chhDoc;
      } else if (metric.id.includes('irp') || metric.title.toLowerCase().includes('incident')) {
        targetDocument = documents.find(d => 
          d.title.toLowerCase().includes('incident response') ||
          d.category?.toLowerCase().includes('incident')
        );
      } else if (metric.id.includes('isp') || metric.title.toLowerCase().includes('security')) {
        targetDocument = documents.find(d => 
          d.title.toLowerCase().includes('information security') ||
          d.title.toLowerCase().includes('security policy')
        );
      } else if (metric.id.includes('dpp') || metric.title.toLowerCase().includes('privacy')) {
        targetDocument = documents.find(d => 
          d.title.toLowerCase().includes('data protection') ||
          d.title.toLowerCase().includes('privacy policy')
        );
      }
      
      if (targetDocument) {
                  const assignment = documentAssignments.find(a => a.user_id === userId && a.document_id === targetDocument.document_id);
          if (!assignment) {
          return 'Not Started';
        }
        
        switch (assignment.status.toLowerCase()) {
          case 'completed':
            return 'Read';
          case 'in progress':
            return 'In Progress';
          case 'not started':
          default:
            return 'Not Started';
        }
      }
      // If no document found, default to 'Not Started'
      return 'Not Started';
    }
    // Default fallback
    return 'Other';
  };

  const renderBreadcrumb = () => (
    <div className="flex items-center gap-2 mb-6">
      {drillDownPath.map((level, index) => (
        <div key={index} className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onDrillDown(level.level, level.data, level.title, level.type, level.value)}
            className="text-muted-foreground hover:text-foreground"
          >
            {level.title}
          </Button>
          {index < drillDownPath.length - 1 && <ChevronRight className="h-4 w-4" />}
        </div>
      ))}
    </div>
  );

  const renderLocationDrillDown = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {locations.map(location => {
        const locationProfiles = profiles.filter(p => p.location === location);
        const relevantUserIds = getRelevantUserIds();
        const locationRelevantProfiles = locationProfiles.filter(p => relevantUserIds.includes(p.id));
        const value = calculateMetricValueForUsers(locationProfiles.map(p => p.id), locationProfiles);
        
        // Only show locations that have phished users
        if (locationRelevantProfiles.length === 0) return null;
        
        return (
          <Card 
            key={location} 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onDrillDown(currentLevel.level + 1, locationProfiles, location, 'location', value)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{location || 'Unknown Location'}</CardTitle>
              <MapPin className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className={`text-xl font-bold ${getColorClass(metric.type, value)}`}>
                  {formatValue(value, metric.type)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {metric.id.includes('_completion') ? 
                    `${locationRelevantProfiles.length} completed` : 
                    `${locationRelevantProfiles.length} affected`
                  }
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderDepartmentDrillDown = () => {
    const relevantUserIds = getRelevantUserIds();
    
    // Get current filtered profiles based on drill-down level
    const currentProfiles = currentLevel.data;
    
    // Group ALL users in current location by their primary department
    const departmentGroups = new Map<string, string[]>();
    const relevantDepartmentGroups = new Map<string, string[]>();
    
    // First, group all users in the current location by department

    
    currentProfiles.forEach(profile => {
      const deptName = departmentData.get(profile.id) || 'Unknown Department';
      if (!departmentGroups.has(deptName)) {
        departmentGroups.set(deptName, []);
      }
      departmentGroups.get(deptName)?.push(profile.id);
    });
    
    // Then, group only relevant users by department (deduplicate first)
    const uniqueRelevantUserIds = [...new Set(relevantUserIds)];
    
    uniqueRelevantUserIds.forEach(userId => {
      const userProfile = currentProfiles.find(p => p.id === userId);
      if (userProfile) {
        const deptName = departmentData.get(userId) || 'Unknown Department';
        if (!relevantDepartmentGroups.has(deptName)) {
          relevantDepartmentGroups.set(deptName, []);
        }
        relevantDepartmentGroups.get(deptName)?.push(userId);
      }
    });
    
    // Show departments that have relevant users, including those without departments
    const availableDepartments = Array.from(relevantDepartmentGroups.keys());
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableDepartments.map(department => {
          const allUserIdsInDept = departmentGroups.get(department) || [];
          const relevantUserIdsInDept = relevantDepartmentGroups.get(department) || [];
          const departmentProfiles = currentProfiles.filter(p => allUserIdsInDept.includes(p.id));
          

          
          // Use a better display name for departments
          const displayName = department === 'Unknown Department' ? 'No Assigned Department' : department;
          
          // For department level, show the percentage of users affected within the department
          let value: number;
          if (metric.id === 'staff_failed_phishing') {
            // Calculate percentage of users in this department who were phished
            const deptUsersWithSentEmails = new Set(
              phishingData
                .filter(p => p.resource === 'sent' && allUserIdsInDept.includes(p.user_id))
                .map(p => p.user_id)
            );
            
            const deptUsersWhoClicked = new Set(
              phishingData
                .filter(p => p.resource === 'click_link' && allUserIdsInDept.includes(p.user_id))
                .map(p => p.user_id)
            );
            
            const totalSentInDept = deptUsersWithSentEmails.size;
            const totalClickedInDept = deptUsersWhoClicked.size;
            
            value = totalSentInDept > 0 ? Math.round((totalClickedInDept / totalSentInDept) * 100) : 0;
          } else if (metric.id.includes('_completion')) {
            // For document completion metrics, calculate based on the specific document for this metric
            let targetDocument = null;
            
                  if (metric.id.includes('chh') || 
          metric.title.toLowerCase().includes('cyber hygiene handbook - all staff')) {
        const chhDoc = documents.find(d => 
          d.title === 'Cyber Hygiene Handbook - All Staff'
        );
        targetDocument = chhDoc;
            } else if (metric.id.includes('irp') || metric.title.toLowerCase().includes('incident')) {
              targetDocument = documents.find(d => 
                d.title.toLowerCase().includes('incident response') ||
                d.category?.toLowerCase().includes('incident')
              );
            } else if (metric.id.includes('isp') || metric.title.toLowerCase().includes('security')) {
              targetDocument = documents.find(d => 
                d.title.toLowerCase().includes('information security') ||
                d.title.toLowerCase().includes('security policy')
              );
            } else if (metric.id.includes('dpp') || metric.title.toLowerCase().includes('privacy')) {
              targetDocument = documents.find(d => 
                d.title.toLowerCase().includes('data protection') ||
                d.title.toLowerCase().includes('privacy policy')
              );
            }
            
            if (targetDocument) {
              // Get all users in this department who should read this specific document
              const deptUsersWithAssignment = documentAssignments
                .filter(a => 
                  a.document_id === targetDocument.document_id && 
                  allUserIdsInDept.includes(a.user_id)
                )
                .map(a => a.user_id);
              
              // Get users in this department who have completed this specific document
              const deptUsersWhoCompleted = documentAssignments
                .filter(a => 
                  a.document_id === targetDocument.document_id && 
                  a.status === 'Completed' &&
                  allUserIdsInDept.includes(a.user_id)
                )
                .map(a => a.user_id);
              
              const totalAssignedInDept = deptUsersWithAssignment.length;
              const totalCompletedInDept = deptUsersWhoCompleted.length;
              
              value = totalAssignedInDept > 0 ? Math.round((totalCompletedInDept / totalAssignedInDept) * 100) : 0;
            } else {
              // Fallback to existing calculation
              value = calculateMetricValueForUsers(relevantUserIdsInDept, departmentProfiles);
            }
          } else {
            // For other metrics, use the existing calculation
            value = calculateMetricValueForUsers(relevantUserIdsInDept, departmentProfiles);
          }
          
          return (
            <Card 
              key={department} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onDrillDown(currentLevel.level + 1, departmentProfiles, department, 'department', value)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{displayName}</CardTitle>
                <Building className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className={`text-xl font-bold ${getColorClass(metric.type, value)}`}>
                    {formatValue(value, metric.type)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {metric.id.includes('_completion') ? 
                      `${relevantUserIdsInDept.length} of ${allUserIdsInDept.length} completed` : 
                      `${relevantUserIdsInDept.length} of ${allUserIdsInDept.length} affected`
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderStaffList = () => {
    // Get the relevant user IDs for this specific metric
    const relevantUserIds = getRelevantUserIds();
    
    // Filter profiles to only show users relevant to this metric
    const filteredProfiles = currentLevel.data.filter(profile => 
      relevantUserIds.includes(profile.id)
    );
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {filteredProfiles.map((profile: any) => {
            const department = departmentData.get(profile.id) || profile.department || 'Unknown Department';
            const badgeStatus = getBadgeForUser(profile.id);
            
            return (
              <Card key={profile.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{profile.full_name || 'Unknown Name'}</div>
                        <div className="text-sm text-muted-foreground">
                          {profile.location} • {department} • {profile.role || 'No Role'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={getBadgeVariant(badgeStatus).variant} className={getBadgeVariant(badgeStatus).className}>
                        {badgeStatus}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    const levelName = metric.drillDownLevels[currentLevel.level - 1];

    if (levelName?.toLowerCase().includes('organization')) {
      const overallValue = metric.getValue(profiles, phishingData, documentAssignments);
      return (
        <div>
          <h2 className="text-lg font-semibold mb-2">Organization Level</h2>
          <Card className="mb-6 w-1/2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Organization Overview
                </CardTitle>
                <div className={`text-3xl font-bold ${getColorClass(metric.type, overallValue)}`}>
                  {formatValue(overallValue, metric.type)}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Total across all locations and departments</p>
            </CardHeader>
          </Card>

          <h2 className="text-lg font-semibold mb-4">Location</h2>
          {renderLocationDrillDown()}
        </div>
      );
    }

    if (levelName?.toLowerCase().includes('location')) {
      const locationValue = currentLevel.value ?? calculateMetricValueForUsers(getRelevantUserIds(), currentLevel.data);
      return (
        <div>
          <Card className="mb-6 w-1/2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  {currentLevel.title} Overview
                </CardTitle>
                <div className={`text-3xl font-bold ${getColorClass(metric.type, locationValue)}`}>
                  {formatValue(locationValue, metric.type)}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Total for this location</p>
            </CardHeader>
          </Card>
          <h2 className="text-lg font-semibold mb-4">Departments</h2>
          {renderDepartmentDrillDown()}
        </div>
      );
    }

    if (levelName?.toLowerCase().includes('department')) {
      const departmentValue = currentLevel.value ?? calculateMetricValueForUsers(getRelevantUserIds(), currentLevel.data);
      return (
        <div>
          <Card className="mb-6 w-1/2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Building className="mr-2 h-5 w-5" />
                  {currentLevel.title} Overview
                </CardTitle>
                <div className={`text-3xl font-bold ${getColorClass(metric.type, departmentValue)}`}>
                  {formatValue(departmentValue, metric.type)}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Total for this department</p>
            </CardHeader>
          </Card>
          <h2 className="text-lg font-semibold mb-4">Staff</h2>
          {renderStaffList()}
        </div>
      );
    }
    
    return renderStaffList();
  };

  return (
    <div className="space-y-6">
      {renderBreadcrumb()}
      {renderContent()}
    </div>
  );
};

export default ReadinessDrillDown;