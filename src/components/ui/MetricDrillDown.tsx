import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, MapPin, Building, Users, TrendingUp } from 'lucide-react';
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

interface MetricDrillDownProps {
  metric: MetricDefinition;
  profiles: any[];
  drillDownPath: DrillDownLevel[];
  onDrillDown: (level: number, data: any[], title: string, type: 'org' | 'location' | 'department' | 'staff', value?: number) => void;
  locations: string[];
  departments: string[];
  userDeptMap: Map<string, any[]>;
  hardwareInventory: any[];
  softwareInventory: any[];
  softwareAssignments: any[];
  physicalLocationAccess: any[];
}

const MetricDrillDown: React.FC<MetricDrillDownProps> = ({
  metric,
  profiles,
  drillDownPath,
  onDrillDown,
  locations,
  departments,
  userDeptMap,
  hardwareInventory,
  softwareInventory,
  softwareAssignments,
  physicalLocationAccess
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
      case 'total_staff':
        return profiles.map(p => p.id);
      
      case 'cyber_learners':
        return profiles.filter(p => p.cyber_learner === true).map(p => p.id);
      
      case 'data_protection_learners':
        return profiles.filter(p => p.dpe_learner === true).map(p => p.id);
      
      case 'english_learners':
        return profiles.filter(p => p.language === 'English' || p.language === '').map(p => p.id);
      
      case 'mandarin_learners':
        return profiles.filter(p => p.language === 'Mandarin').map(p => p.id);
      
      case 'staff_enrolled_learn':
        return profiles.filter(p => p.cyber_learner === true).map(p => p.id);
      
      case 'cyber_aware_percentage':
        // For cyber awareness, show ALL cyber learners (both completed and not completed)
        return profiles.filter(p => p.cyber_learner === true).map(p => p.id);
      
      case 'data_protection_aware_percentage':
        return profiles.filter(p => p.dpe_learner === true).map(p => p.id);
      
      case 'episode_completion':
        return profiles.filter(p => p.learn_complete === true).map(p => p.id);
      
      case 'track_completion':
        return profiles.filter(p => p.cyber_learner === true).map(p => p.id);
      
      // Protection metrics
      case 'total_endpoints':
      case 'total_software':
      case 'total_physical_locations':
      case 'hw_onboarded_30d':
      case 'sw_onboarded_30d':
        // For these metrics, all users are relevant since they're inventory-based
        return profiles.map(p => p.id);
      
      case 'hardware_inventory_overdue':
        // This would need hardware data to determine relevance
        return profiles.map(p => p.id);
      
      default:
        return profiles.map(p => p.id);
    }
  };

  // Calculate metric value for specific users (similar to ReadinessDrillDown)
  const calculateMetricValueForUsers = (userIds: string[], profiles: any[]): number => {
    const relevantProfiles = profiles.filter(p => userIds.includes(p.id));
    
    // For count metrics, just return the count of relevant users
    if (metric.type === 'count') {
      return relevantProfiles.length;
    }
    
    if (metric.type === 'percentage') {
      // For percentage metrics, calculate based on the specific metric logic
      if (metric.id === 'staff_enrolled_learn') {
        const totalStaff = profiles.length;
        const enrolledStaff = relevantProfiles.length;
        return totalStaff > 0 ? Math.round((enrolledStaff / totalStaff) * 100) : 0;
      } else if (metric.id === 'cyber_aware_percentage') {
        const enrolledStaff = profiles.filter(p => p.cyber_learner === true).length;
        const completedStaff = relevantProfiles.length;
        return enrolledStaff > 0 ? Math.round((completedStaff / enrolledStaff) * 100) : 0;
      } else if (metric.id === 'data_protection_aware_percentage') {
        const enrolledStaff = profiles.filter(p => p.dpe_learner === true).length;
        const completedStaff = relevantProfiles.length;
        return enrolledStaff > 0 ? Math.round((completedStaff / enrolledStaff) * 100) : 0;
      } else if (metric.id === 'track_completion') {
        const enrolledStaff = profiles.filter(p => p.cyber_learner === true).length;
        const completedStaff = relevantProfiles.length;
        return enrolledStaff > 0 ? Math.round((completedStaff / enrolledStaff) * 100) : 0;
      }
    }
    
    return relevantProfiles.length;
  };

  const getFilteredProfiles = (filterType: string, filterValue: string) => {
    switch (filterType) {
      case 'location':
        return profiles.filter(p => p.location === filterValue);
      case 'department':
        return profiles.filter(p => p.primary_department === filterValue);
      default:
        return profiles;
    }
  };

  const calculateMetricValue = (profileSubset: any[]) => {
    switch (metric.id) {
      case 'total_staff':
        return profileSubset.length;
      case 'cyber_learners':
        return profileSubset.filter(p => p.cyber_learner === true).length;
      case 'data_protection_learners':
        return profileSubset.filter(p => p.dpe_learner === true).length;
      case 'cyber_quiz_score':
        const cyberScores = profileSubset.filter(p => p.cyber_learner).map(() => Math.floor(Math.random() * 40) + 60);
        return cyberScores.length > 0 ? Math.round(cyberScores.reduce((a, b) => a + b, 0) / cyberScores.length) : 0;
      case 'data_protection_quiz_score':
        const dpeScores = profileSubset.filter(p => p.dpe_learner).map(() => Math.floor(Math.random() * 40) + 60);
        return dpeScores.length > 0 ? Math.round(dpeScores.reduce((a, b) => a + b, 0) / dpeScores.length) : 0;
      case 'english_learners':
        return profileSubset.filter(p => p.language === 'English' || p.language === '').length;
      case 'mandarin_learners':
        return profileSubset.filter(p => p.language === 'Mandarin').length;
      case 'enrolled_percentage':
        const total = profileSubset.length;
        const enrolled = profileSubset.filter(p => p.cyber_learner === true).length;
        return total > 0 ? Math.round((enrolled / total) * 100) : 0;
      case 'cyber_aware_percentage':
        const cyberLearners = profileSubset.filter(p => p.cyber_learner === true).length;
        const completed = profileSubset.filter(p => p.learn_complete === true).length;
        return cyberLearners > 0 ? Math.round((completed / cyberLearners) * 100) : 0;
      case 'data_protection_aware_percentage':
        const dpeLearners = profileSubset.filter(p => p.dpe_learner === true).length;
        const dpeCompleted = profileSubset.filter(p => p.dpe_complete === true).length;
        return dpeLearners > 0 ? Math.round((dpeCompleted / dpeLearners) * 100) : 0;
      case 'episode_completion':
        return profileSubset.filter(p => p.learn_complete === true).length;
      case 'track_completion':
        const trackEnrolled = profileSubset.filter(p => p.cyber_learner === true).length;
        const trackCompleted = profileSubset.filter(p => p.learn_complete === true).length;
        return trackEnrolled > 0 ? Math.round((trackCompleted / trackEnrolled) * 100) : 0;
      default:
        return 0;
    }
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

  const getStaffStatusBadgeProps = (profile: any, metricId: string): { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string } => {
    const statusText = getStaffStatusText(profile, metricId);
    let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary';
    let className = '';

    switch (statusText) {
      // Positive/Complete statuses - Green (custom styling)
      case 'Completed':
        variant = 'default';
        className = 'bg-green-600 text-white border-green-600 hover:bg-green-700';
        break;
      
      // In Progress/Partial statuses - Blue/Secondary
      case 'Enrolled':
        variant = 'secondary';
        break;
      
      // Negative/Incomplete statuses - Red
      case 'Not Enrolled':
        variant = 'destructive';
        break;
      
      // Language categories - Neutral outline
      case 'English':
      case 'Mandarin':
        variant = 'outline';
        break;
        
      // Asset count statuses - All blue for consistency
      case 'No Devices':
      case 'No Software':
      case 'No Access':
      case 'None Recent':
        variant = 'destructive'; // Red for no assets
        break;
        
      case '1 Device':
      case '1 App':
      case '1 Location':
        variant = 'secondary'; // Blue for single asset
        className = 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700';
        break;
        
      default:
        // For asset counts ("2 Devices", "3 Apps", "2 Recent", "2 Locations", etc.) - all blue for consistency
        if (statusText.includes('Device') || statusText.includes('App') || statusText.includes('Recent') || statusText.includes('Location')) {
          variant = 'secondary'; // Blue for all asset counts
          className = 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700';
        } else if (statusText !== '' && !statusText.includes('No')) {
          // For other non-asset statuses, keep green
          variant = 'default'; 
          className = 'bg-green-600 text-white border-green-600 hover:bg-green-700';
        } else {
          variant = 'secondary';
        }
        break;
    }

    return { text: statusText, variant, className };
  };

  const getStaffStatusText = (profile: any, metricId: string): string => {

    
    // Helper function to check boolean values that might be stored as strings
    const isTruthy = (value: any): boolean => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') return value.toLowerCase() === 'true';
      return false;
    };
    
    switch (metricId) {
      // Completion-based metrics
      case 'cyber_aware_percentage':
      case 'episode_completion':
      case 'track_completion':
        // These users are already filtered to be cyber_learners
        const completedStatus = isTruthy(profile.learn_complete);
        return completedStatus ? 'Completed' : 'Enrolled';

      case 'data_protection_aware_percentage':
        // These users are already filtered to be dpe_learners
        const dpeCompletedStatus = isTruthy(profile.dpe_complete);
        return dpeCompletedStatus ? 'Completed' : 'Enrolled';

      // Enrollment/category-based metrics - but show completion status when available
      case 'total_staff':
        return isTruthy(profile.cyber_learner) ? 'Enrolled' : 'Not Enrolled';
      
      case 'cyber_learners':
      case 'staff_enrolled_learn':
        // For cyber learners, show completion status since we have that data
        return isTruthy(profile.learn_complete) ? 'Completed' : 'Enrolled';

      case 'data_protection_learners':
        // For data protection learners, show completion status since we have that data
        return isTruthy(profile.dpe_complete) ? 'Completed' : 'Enrolled';

      case 'english_learners':
        return 'English';

      case 'mandarin_learners':
        return 'Mandarin';
        
      // Protection metrics - show asset counts
      case 'total_endpoints':
        // Count user's hardware devices (match by asset_owner field with user's name)
        const userHardware = hardwareInventory.filter(hw => 
          hw.asset_owner === profile.full_name || hw.asset_owner === profile.username
        );
        const deviceCount = userHardware.length;
        if (deviceCount === 0) return 'No Devices';
        if (deviceCount === 1) return '1 Device';
        return `${deviceCount} Devices`;
        
      case 'total_software':
        // Count user's software applications from the software assignment table
        const userSoftwareAssignments = softwareAssignments.filter(sw => sw.user_id === profile.id);
        const softwareCount = userSoftwareAssignments.length;
        if (softwareCount === 0) return 'No Software';
        if (softwareCount === 1) return '1 App';
        return `${softwareCount} Apps`;
        
      case 'total_physical_locations':
        // Count user's total accessible locations: primary + access locations
        const userAccessLocations = physicalLocationAccess.filter(access => 
          access.user_id === profile.id
        );
        
        // Count unique locations (primary + additional access)
        const accessibleLocations = new Set();
        
        // Add primary location if it exists
        if (profile.location) {
          accessibleLocations.add(profile.location);
        }
        
        // Add locations from physical_location_access
        userAccessLocations.forEach(access => {
          const locationName = access.locations?.name || access.location;
          if (locationName) {
            accessibleLocations.add(locationName);
          }
        });
        
        const locationCount = accessibleLocations.size;
        if (locationCount === 0) return 'No Access';
        if (locationCount === 1) return '1 Location';
        return `${locationCount} Locations`;
        
      case 'hw_onboarded_30d':
      case 'sw_onboarded_30d':
        // For onboarding metrics, show "Recent" or "None" based on 30-day activity
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        if (metricId === 'hw_onboarded_30d') {
          const recentHardware = hardwareInventory.filter(hw => 
            (hw.asset_owner === profile.full_name || hw.asset_owner === profile.username) && 
            hw.created_at && 
            new Date(hw.created_at) >= thirtyDaysAgo
          );
          return recentHardware.length > 0 ? `${recentHardware.length} Recent` : 'None Recent';
        } else {
          const recentSoftware = softwareAssignments.filter(sw => 
            sw.user_id === profile.id && 
            sw.created_at && 
            new Date(sw.created_at) >= thirtyDaysAgo
          );
          return recentSoftware.length > 0 ? `${recentSoftware.length} Recent` : 'None Recent';
        }
        
      default:
        return '';
    }
  };

  const renderBreadcrumb = () => (
    <div className="flex items-center gap-2 mb-6">
      {drillDownPath.map((level, index) => (
        <div key={index} className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onDrillDown(level.level, level.data, level.title, level.type)}
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
        // Filter profiles for this specific location from all profiles
        const locationProfiles = profiles.filter(p => p.location === location);
        const relevantUserIds = getRelevantUserIds();
        const locationRelevantProfiles = locationProfiles.filter(p => relevantUserIds.includes(p.id));
        
        // Calculate the correct value based on metric type
        let value;
        if (metric.type === 'percentage') {
          // For percentage metrics, calculate the percentage within this location
          if (metric.id === 'staff_enrolled_learn') {
            const totalStaffInLocation = locationProfiles.length;
            const enrolledStaffInLocation = locationRelevantProfiles.length;
            value = totalStaffInLocation > 0 ? Math.round((enrolledStaffInLocation / totalStaffInLocation) * 100) : 0;
          } else {
            // Use the existing calculation logic for other percentage metrics
            value = calculateMetricValue(locationProfiles);
          }
        } else {
          // For count metrics, just show the count
          value = locationRelevantProfiles.length;
        }
        
        // Only show locations that have relevant users
        if (locationRelevantProfiles.length === 0) return null;
        
        return (
          <Card key={location} className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => onDrillDown(currentLevel.level + 1, locationProfiles, location, 'location', value)}>
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
                  {locationRelevantProfiles.length} relevant staff
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderDepartmentDrillDown = () => {
    // Get the current filtered profiles (from location or organization level)
    let filteredProfiles = currentLevel.data;
    
    // Get relevant user IDs for the current metric
    const relevantUserIds = getRelevantUserIds();
    
    // Group ALL users in current location by their primary department
    const departmentGroups = new Map();
    const relevantDepartmentGroups = new Map();
    


    // First, group all users in the current location by department
    filteredProfiles.forEach(profile => {
      const deptName = departmentData.get(profile.id) || profile.department || 'Unknown Department';
      
      if (!departmentGroups.has(deptName)) {
        departmentGroups.set(deptName, []);
      }
      departmentGroups.get(deptName).push(profile);
    });
    
    // Then, group only relevant users by department
    const uniqueRelevantUserIds = [...new Set(relevantUserIds)];
    
    uniqueRelevantUserIds.forEach(userId => {
      const userProfile = filteredProfiles.find(p => p.id === userId);
      if (userProfile) {
        const deptName = departmentData.get(userId) || userProfile.department || 'Unknown Department';
        if (!relevantDepartmentGroups.has(deptName)) {
          relevantDepartmentGroups.set(deptName, []);
        }
        relevantDepartmentGroups.get(deptName).push(userProfile);
      }
    });
    


    // Show departments that have relevant users, including those without departments
    const availableDepartments = Array.from(relevantDepartmentGroups.keys());
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableDepartments.map(department => {
          const allProfilesInDept = departmentGroups.get(department) || [];
          const relevantProfilesInDept = relevantDepartmentGroups.get(department) || [];
          
          // Calculate percentage for this department if it's a percentage metric
          let departmentValue;
          if (metric.type === 'percentage') {
            if (metric.id === 'staff_enrolled_learn') {
              const totalStaffInDept = allProfilesInDept.length;
              const enrolledStaffInDept = relevantProfilesInDept.length;
              departmentValue = totalStaffInDept > 0 ? Math.round((enrolledStaffInDept / totalStaffInDept) * 100) : 0;
            } else {
              departmentValue = calculateMetricValue(allProfilesInDept);
            }
          } else {
            departmentValue = relevantProfilesInDept.length;
          }
          
          // Use a better display name for departments
          const displayName = department === 'Unknown Department' ? 'No Assigned Department' : department;
          
          return (
            <Card key={department} className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => onDrillDown(currentLevel.level + 1, allProfilesInDept, department, 'department', departmentValue)}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{displayName}</CardTitle>
                <Building className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className={`text-xl font-bold ${getColorClass(metric.type, departmentValue)}`}>
                    {formatValue(departmentValue, metric.type)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {relevantProfilesInDept.length} of {allProfilesInDept.length} relevant
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
    // For staff list, show all the profiles passed down from the previous level
    // These should already be filtered to relevant users
    const allProfilesInLevel = currentLevel.data;
    const relevantUserIds = getRelevantUserIds();
    const filteredProfiles = allProfilesInLevel.filter(p => relevantUserIds.includes(p.id));
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {filteredProfiles.map((profile: any) => {
            const badgeProps = getStaffStatusBadgeProps(profile, metric.id);
            return (
              <Card key={profile.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{profile.full_name || 'Unknown Name'}</div>
                        <div className="text-sm text-muted-foreground">
                          {profile.location} • {departmentData.get(profile.id) || 'No Department'} • {profile.primary_role || 'No Role'}
                        </div>
                      </div>
                    </div>
                    <Badge variant={badgeProps.variant} className={badgeProps.className}>{badgeProps.text}</Badge>
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
      const overallValue = metric.getValue(profiles);
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
      const locationValue = currentLevel.value ?? calculateMetricValue(currentLevel.data);
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
      const departmentValue = currentLevel.value ?? calculateMetricValue(currentLevel.data);
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

export default MetricDrillDown;