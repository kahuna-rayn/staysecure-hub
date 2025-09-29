import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, MapPin, Building, Users, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@staysecure/auth';

interface DrillDownLevel {
  level: number;
  title: string;
  data: any[];
  type: 'org' | 'location' | 'department' | 'staff';
  value?: number;
}

interface LearningTrackAssignmentsDrillDownProps {
  trackId: string;
  trackTitle: string;
  onBack: () => void;
}

const LearningTrackAssignmentsDrillDown: React.FC<LearningTrackAssignmentsDrillDownProps> = ({
  trackId,
  trackTitle,
  onBack
}) => {
  const [drillDownPath, setDrillDownPath] = useState<DrillDownLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [userDepartments, setUserDepartments] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const { user } = useAuth();

  // Fetch all required data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .not('status', 'eq', 'inactive');

        if (profilesError) throw profilesError;
        setProfiles(profilesData || []);

        // Fetch learning track assignments for this track
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('learning_track_assignments')
          .select('*')
          .eq('learning_track_id', trackId);

        if (assignmentsError) throw assignmentsError;
        setAssignments(assignmentsData || []);

        // Fetch user departments (primary only)
        const { data: userDeptsData, error: userDeptsError } = await supabase
          .from('user_departments')
          .select('*')
          .eq('is_primary', true);

        if (userDeptsError) throw userDeptsError;
        setUserDepartments(userDeptsData || []);

        // Fetch departments
        const { data: deptsData, error: deptsError } = await supabase
          .from('departments')
          .select('*');

        if (deptsError) throw deptsError;
        setDepartments(deptsData || []);

        // Fetch user progress for this track
        const assignedUserIds = assignmentsData?.map(a => a.user_id) || [];
        if (assignedUserIds.length > 0) {
          const { data: progressData, error: progressError } = await supabase
            .from('user_learning_track_progress')
            .select('*')
            .eq('learning_track_id', trackId)
            .in('user_id', assignedUserIds);

          if (progressError) throw progressError;
          setUserProgress(progressData || []);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [trackId]);

  // Create department lookup map
  const departmentMap = new Map();
  departments.forEach(dept => {
    departmentMap.set(dept.id, dept.name);
  });

  // Get unique locations
  const locations = [...new Set(profiles.map(p => p.location).filter(Boolean))];

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
    if (profiles.length > 0 && assignments.length > 0 && !loading) {
      const assignedUserIds = new Set(assignments.map(a => a.user_id));
      const assignedProfiles = profiles.filter(p => assignedUserIds.has(p.id));
      
      setDrillDownPath([{
        level: 0,
        title: 'Organization Level',
        data: assignedProfiles,
        type: 'org',
        value: assignedProfiles.length
      }]);
    }
  }, [profiles, assignments, loading]);

  const onDrillDown = (level: number, data: any[], title: string, type: 'org' | 'location' | 'department' | 'staff', value?: number) => {
    // Create a new path by taking the current path and adding the new level
    const newPath = [...drillDownPath];
    newPath.push({ level: level, title, data, type, value });
    setDrillDownPath(newPath);
  };

  const onBreadcrumbClick = (targetIndex: number) => {
    // Navigate back to the specified level by slicing the path
    const newPath = drillDownPath.slice(0, targetIndex + 1);
    setDrillDownPath(newPath);
  };

  const getAssignmentStatus = (userId: string): string => {
    const assignment = assignments.find(a => a.user_id === userId);
    if (!assignment) return 'Not Assigned';
    
    const progress = userProgress.find(p => p.user_id === userId);
    if (!progress) return 'Not Started';
    
    if (progress.completed_at) return 'Completed';
    if (progress.started_at) return 'In Progress';
    return 'Not Started';
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
            onClick={() => onBreadcrumbClick(index)}
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
      return renderOrganizationLevel();
    } else if (currentLevel.type === 'location') {
      return renderLocationLevel();
    } else if (currentLevel.type === 'department') {
      return renderDepartmentLevel();
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
    
    console.log('=== LOCATION LEVEL DEBUG ===');
    console.log('Current level data:', currentLevel.data);
    console.log('User departments map:', userDeptMap);
    console.log('Department map:', departmentMap);
    
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
          console.log(`User ${p.full_name} (${p.id}):`, {
            userDepts,
            primaryDept,
            departmentName: primaryDept ? departmentMap.get(primaryDept.department_id) : null
          });
          return primaryDept ? departmentMap.get(primaryDept.department_id) : null;
        })
        .filter(Boolean)
    )];

    console.log('Location departments:', locationDepartments);

    // Department breakdown
    const departmentCards = locationDepartments.map(departmentName => {
      const departmentProfiles = currentLevel.data.filter(p => {
        const userDepts = userDeptMap.get(p.id) || [];
        const matchesThisDept = userDepts.some(ud => {
          const deptName = departmentMap.get(ud.department_id);
          return deptName === departmentName;
        });
        return matchesThisDept;
      });
      
      console.log(`Department ${departmentName} profiles:`, departmentProfiles);
      
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
        {departmentCards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departmentCards}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Building className="h-8 w-8 mx-auto mb-2" />
            <p>No departments found for users in this location</p>
            <p className="text-sm mt-1">Users may not have department assignments or primary departments set</p>
          </div>
        )}
      </div>
    );
  };

  const renderDepartmentLevel = () => {
    const currentLevel = drillDownPath[drillDownPath.length - 1];
    
    // Overview card
    const overviewCard = (
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Building className="h-4 w-4" />
            {currentLevel.title} Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold text-blue-600">
            {currentLevel.value || currentLevel.data.length}
          </div>
          <p className="text-xs text-muted-foreground">Total for this department</p>
        </CardContent>
      </Card>
    );

    return (
      <div className="space-y-4">
        {overviewCard}
        <h2 className="text-lg font-semibold mb-4">Staff</h2>
        {renderStaffList()}
      </div>
    );
  };

  const renderStaffList = () => {
    const currentLevel = drillDownPath[drillDownPath.length - 1];
    const allProfilesInLevel = currentLevel.data;
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {allProfilesInLevel.map((profile: any) => {
            const status = getAssignmentStatus(profile.id);
            const badgeProps = getStatusBadgeProps(status);
            const userDepts = userDeptMap.get(profile.id) || [];
            const primaryDept = userDepts.find(ud => ud.is_primary);
            const deptName = primaryDept ? departmentMap.get(primaryDept.department_id) : 'No Department';
            
            return (
              <Card key={profile.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{profile.full_name || 'Unknown Name'}</div>
                        <div className="text-sm text-muted-foreground">
                          {profile.location} • {deptName} • {profile.primary_role || 'No Role'}
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

  // Show loading state while data is being fetched
  if (loading || drillDownPath.length === 0) {
    return (
      <div className="w-full space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 rotate-180" />
            Back to Assignments
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{trackTitle}</h1>
            <p className="text-muted-foreground">Learning track assignment breakdown</p>
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
          <h1 className="text-2xl font-bold">{trackTitle}</h1>
          <p className="text-muted-foreground">Learning track assignment breakdown</p>
        </div>
      </div>
      
      {renderBreadcrumb()}
      {renderContent()}
    </div>
  );
};

export default LearningTrackAssignmentsDrillDown; 