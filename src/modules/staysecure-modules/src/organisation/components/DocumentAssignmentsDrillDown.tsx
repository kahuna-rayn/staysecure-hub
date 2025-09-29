import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, MapPin, Building, Users, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DrillDownLevel {
  level: number;
  title: string;
  data: any[];
  type: 'org' | 'location' | 'department' | 'staff';
  value?: number;
}

interface DocumentAssignmentsDrillDownProps {
  documentId: string;
  documentTitle: string;
  onBack: () => void;
}

const DocumentAssignmentsDrillDown: React.FC<DocumentAssignmentsDrillDownProps> = ({
  documentId,
  documentTitle,
  onBack
}) => {
  const [drillDownPath, setDrillDownPath] = useState<DrillDownLevel[]>([]);

  // Fetch all required data
  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: documentAssignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['document-assignments', documentId],
    queryFn: async () => {
      if (!documentId) return [];
      
      const { data, error } = await supabase
        .from('document_assignments')
        .select('*')
        .eq('document_id', documentId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!documentId,
  });

  const { data: userDepartments = [] } = useQuery({
    queryKey: ['user-departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_departments')
        .select('*')
        .eq('is_primary', true);
      
      if (error) {
        console.error('Error fetching user departments:', error);
        throw error;
      }
      return data || [];
    },
  });

  const { data: departmentsList = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*');
      
      if (error) {
        console.error('Error fetching departments:', error);
        throw error;
      }
      return data || [];
    },
  });

  // Create department lookup map
  const departmentMap = new Map();
  departmentsList.forEach(dept => {
    departmentMap.set(dept.id, dept.name);
  });

  // Get unique locations and departments  
  const locations = [...new Set(profiles.map(p => p.location).filter(Boolean))];
  const departments = [...new Set(
    userDepartments
      .map(ud => departmentMap.get(ud.department_id))
      .filter(Boolean)
  )];

  // Create user-department mapping
  const userDeptMap = new Map();
  userDepartments.forEach(ud => {
    if (!userDeptMap.has(ud.user_id)) {
      userDeptMap.set(ud.user_id, []);
    }
    userDeptMap.get(ud.user_id).push(ud);
  });

  // Initialize organization level
  useEffect(() => {
    if (profiles.length > 0 && documentAssignments.length > 0 && !assignmentsLoading) {
      const assignedUserIds = new Set(documentAssignments.map(a => a.user_id));
      const assignedProfiles = profiles.filter(p => assignedUserIds.has(p.id));
      
      setDrillDownPath([{
        level: 0,
        title: 'Organization Level',
        data: assignedProfiles,
        type: 'org',
        value: assignedProfiles.length
      }]);
    }
  }, [profiles, documentAssignments, assignmentsLoading]);

  const onDrillDown = (level: number, data: any[], title: string, type: 'org' | 'location' | 'department' | 'staff', value?: number) => {
    const newPath = drillDownPath.slice(0, level + 1);
    if (level < 3) { // Can drill down up to staff level
      newPath.push({ level: level + 1, title, data, type, value });
    }
    setDrillDownPath(newPath);
  };

  const getAssignmentStatus = (userId: string): string => {
    const assignment = documentAssignments.find(a => a.user_id === userId);
    if (!assignment) return 'Not Assigned';
    return assignment.status || 'Not Started';
  };

  const getStatusBadgeProps = (status: string) => {
    let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary';
    let className = '';

    switch (status.toLowerCase()) {
      case 'completed':
        variant = 'default';
        className = 'bg-green-600 text-white border-green-600 hover:bg-green-700';
        break;
      case 'in progress':
        variant = 'secondary';
        className = 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700';
        break;
      case 'not started':
      case 'not assigned':
        variant = 'destructive';
        break;
      default:
        variant = 'secondary';
    }

    return { variant, className };
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

  const renderContent = () => {
    const currentLevel = drillDownPath[drillDownPath.length - 1];
    const levelName = currentLevel.title;

    if (currentLevel.type === 'org') {
      const overallValue = documentAssignments.length;
      return (
        <div>
          <h2 className="text-lg font-semibold mb-2">Organization Level</h2>
          <Card className="mb-6 w-1/2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Building className="mr-2 h-5 w-5" />
                  Organization Overview
                </CardTitle>
                <div className="text-3xl font-bold text-blue-600">
                  {overallValue}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Total assigned staff</p>
            </CardHeader>
          </Card>

          <h2 className="text-lg font-semibold mb-4">Location</h2>
          {renderLocationLevel()}
        </div>
      );
    }

    if (currentLevel.type === 'location') {
      const locationValue = currentLevel.value ?? currentLevel.data.length;
      return (
        <div>
          <Card className="mb-6 w-1/2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  {currentLevel.title} Overview
                </CardTitle>
                <div className="text-3xl font-bold text-blue-600">
                  {locationValue}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Total for this location</p>
            </CardHeader>
          </Card>
          <h2 className="text-lg font-semibold mb-4">Departments</h2>
          {(() => {
            // Get departments that actually have users in this location
            const locationDepartments = [...new Set(
              currentLevel.data
                .map(p => {
                  const userDepts = userDeptMap.get(p.id) || [];
                  const primaryDept = userDepts.find(ud => ud.is_primary);
                  return primaryDept ? departmentMap.get(primaryDept.department_id) : null;
                })
                .filter(Boolean)
            )];

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {locationDepartments.map(departmentName => {
                  const departmentProfiles = currentLevel.data.filter(p => {
                    const userDepts = userDeptMap.get(p.id) || [];
                    return userDepts.some(ud => {
                      const deptName = departmentMap.get(ud.department_id);
                      return deptName === departmentName;
                    });
                  });
                  
                  if (departmentProfiles.length === 0) return null;

                  return (
                    <Card key={departmentName} className="cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => onDrillDown(currentLevel.level + 1, departmentProfiles, departmentName, 'department', departmentProfiles.length)}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{departmentName}</CardTitle>
                        <Building className="h-4 w-4" />
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="text-xl font-bold text-blue-600">
                            {departmentProfiles.length}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            assigned staff
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }).filter(Boolean)}
              </div>
            );
          })()}
        </div>
      );
    }

    if (currentLevel.type === 'department') {
      const departmentValue = currentLevel.value ?? currentLevel.data.length;
      return (
        <div>
          <Card className="mb-6 w-1/2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Building className="mr-2 h-5 w-5" />
                  {currentLevel.title} Overview
                </CardTitle>
                <div className="text-3xl font-bold text-blue-600">
                  {departmentValue}
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

  const renderOrganizationLevel = () => {
    const currentLevel = drillDownPath[drillDownPath.length - 1];
    
    // Overview card
    const overviewCard = (
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Building className="h-4 w-4" />
            Organization Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold text-blue-600">
            {currentLevel.value || currentLevel.data.length}
          </div>
          <p className="text-xs text-muted-foreground">Total assigned staff</p>
        </CardContent>
      </Card>
    );

    // Location breakdown
    const locationCards = locations.map(location => {
      const locationProfiles = currentLevel.data.filter(p => p.location === location);
      
      if (locationProfiles.length === 0) return null;
      
      return (
        <Card key={location} className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onDrillDown(currentLevel.level + 1, locationProfiles, location, 'location', locationProfiles.length)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{location || 'Unknown Location'}</CardTitle>
            <MapPin className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-xl font-bold text-blue-600">
                {locationProfiles.length}
              </div>
              <div className="text-xs text-muted-foreground">
                assigned staff
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }).filter(Boolean);

    return (
      <div className="space-y-4">
        {overviewCard}
        <h3 className="text-lg font-semibold">Locations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locationCards}
        </div>
      </div>
    );
  };

  const renderLocationLevel = () => {
    const currentLevel = drillDownPath[drillDownPath.length - 1];
    
    // Overview card
    const overviewCard = (
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {currentLevel.title} Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold text-blue-600">
            {currentLevel.value || currentLevel.data.length}
          </div>
          <p className="text-xs text-muted-foreground">Total assigned staff</p>
        </CardContent>
      </Card>
    );

    // Get departments that actually have users in this location
    const locationDepartments = [...new Set(
      currentLevel.data
        .map(p => {
          const userDepts = userDeptMap.get(p.id) || [];
          const primaryDept = userDepts.find(ud => ud.is_primary);
          return primaryDept ? departmentMap.get(primaryDept.department_id) : null;
        })
        .filter(Boolean)
    )];



    // Department breakdown
    const departmentCards = locationDepartments.map(departmentName => {
      const departmentProfiles = currentLevel.data.filter(p => {
        const userDepts = userDeptMap.get(p.id) || [];
        const matchesThisDept = userDepts.some(ud => {
          const deptName = departmentMap.get(ud.department_id);
          const matches = deptName === departmentName;
          if (matches) {
            console.log(`User ${p.full_name} matches department ${departmentName} (dept_id: ${ud.department_id})`);
          }
          return matches;
        });
        return matchesThisDept;
      });
      
      if (departmentProfiles.length === 0) return null;

      return (
        <Card key={departmentName} className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onDrillDown(currentLevel.level + 1, departmentProfiles, departmentName, 'department', departmentProfiles.length)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{departmentName}</CardTitle>
            <Building className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-xl font-bold text-blue-600">
                {departmentProfiles.length}
              </div>
              <div className="text-xs text-muted-foreground">
                assigned staff
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }).filter(Boolean);

    return (
      <div className="space-y-4">
        {overviewCard}
        <h3 className="text-lg font-semibold">Departments</h3>
        

        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departmentCards}
        </div>
      </div>
    );
  };

  const renderStaffList = () => {
    // For staff list, show all the profiles passed down from the previous level
    // These should already be filtered to relevant users
    const currentLevel = drillDownPath[drillDownPath.length - 1];
    const allProfilesInLevel = currentLevel.data;
    
    console.log('=== RENDERING STAFF LIST ===');
    console.log('Current level:', currentLevel);
    console.log('All profiles in level:', allProfilesInLevel);
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {allProfilesInLevel.map((profile: any) => {
            const status = getAssignmentStatus(profile.id);
            const badgeProps = getStatusBadgeProps(status);
            return (
              <Card key={profile.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{profile.full_name || 'Unknown Name'}</div>
                        <div className="text-sm text-muted-foreground">
                          {profile.location} • {currentLevel.title} • {profile.primary_role || 'No Role'}
                        </div>
                      </div>
                    </div>
                    <Badge variant={badgeProps.variant} className={badgeProps.className}>{status}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDepartmentLevel = () => {
    return renderStaffList();
  };

  const renderStaffLevel = () => {
    // This would be the final level - individual staff member details
    return renderDepartmentLevel(); // For now, same as department level
  };

  // Show loading state while data is being fetched
  if (assignmentsLoading || drillDownPath.length === 0) {
    return (
      <div className="w-full space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 rotate-180" />
            Back to Assignments
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{documentTitle}</h1>
            <p className="text-muted-foreground">Document assignment breakdown</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Loading assignment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4 rotate-180" />
          Back to Assignments
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{documentTitle}</h1>
          <p className="text-muted-foreground">Document assignment breakdown</p>
        </div>
      </div>
      
      {renderBreadcrumb()}
      {renderContent()}
    </div>
  );
};

export default DocumentAssignmentsDrillDown; 