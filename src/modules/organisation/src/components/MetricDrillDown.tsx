import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ArrowLeft, Users, MapPin, Building } from 'lucide-react';
import { DrillDownLevel } from './EnhancedMetrics';

interface MetricDefinition {
  id: string;
  title: string;
  icon: React.ReactNode;
  getValue: (profiles: any[]) => number | string;
  drillDownLevels: string[];
  type: 'count' | 'percentage' | 'score';
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
}) => {
  const currentLevel = drillDownPath[drillDownPath.length - 1];
  
  const handleBreadcrumbClick = (targetIndex: number) => {
    const newPath = drillDownPath.slice(0, targetIndex + 1);
    // This would need to update the drillDownPath in parent component
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

  const renderOrganizationLevel = () => {
    const currentValue = metric.getValue(currentLevel.data);
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {metric.icon}
              {metric.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold ${getColorClass(metric.type, currentValue)}`}>
              {formatValue(currentValue, metric.type)}
            </div>
            <p className="text-muted-foreground mt-2">
              Total across {currentLevel.data.length} staff members
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" 
                onClick={() => {
                  const locationProfiles = locations.map(location => ({
                    name: location,
                    profiles: currentLevel.data.filter(p => p.location === location),
                    count: currentLevel.data.filter(p => p.location === location).length
                  })).filter(item => item.count > 0);
                  
                  onDrillDown(currentLevel.level + 1, locationProfiles, 'By Location', 'location');
                }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="h-5 w-5 text-blue-500" />
                <span className="font-medium">View by Location</span>
              </div>
              <div className="text-2xl font-bold">{locations.length}</div>
              <p className="text-sm text-muted-foreground">locations</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => {
                  const departmentProfiles = departments.map(dept => ({
                    name: dept,
                    profiles: currentLevel.data.filter(p => p.primary_department === dept),
                    count: currentLevel.data.filter(p => p.primary_department === dept).length
                  })).filter(item => item.count > 0);
                  
                  onDrillDown(currentLevel.level + 1, departmentProfiles, 'By Department', 'department');
                }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Building className="h-5 w-5 text-green-500" />
                <span className="font-medium">View by Department</span>
              </div>
              <div className="text-2xl font-bold">{departments.length}</div>
              <p className="text-sm text-muted-foreground">departments</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => {
                  onDrillDown(currentLevel.level + 1, currentLevel.data, 'Staff List', 'staff');
                }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5 text-purple-500" />
                <span className="font-medium">View Staff List</span>
              </div>
              <div className="text-2xl font-bold">{currentLevel.data.length}</div>
              <p className="text-sm text-muted-foreground">staff members</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderLocationLevel = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Breakdown by Location</h3>
        <div className="grid gap-4">
          {currentLevel.data.map((locationData: any, index: number) => {
            const locationValue = metric.getValue(locationData.profiles);
            return (
              <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => {
                      const departmentsInLocation = [...new Set(locationData.profiles.map((p: any) => p.primary_department))];
                      const departmentProfiles = departmentsInLocation.map(dept => ({
                        name: dept,
                        profiles: locationData.profiles.filter((p: any) => p.primary_department === dept),
                        count: locationData.profiles.filter((p: any) => p.primary_department === dept).length
                      }));
                      
                      onDrillDown(currentLevel.level + 1, departmentProfiles, `${locationData.name} - Departments`, 'department');
                    }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="font-medium">{locationData.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {locationData.profiles.length} staff members
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold ${getColorClass(metric.type, locationValue)}`}>
                        {formatValue(locationValue, metric.type)}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground inline" />
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

  const renderDepartmentLevel = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Breakdown by Department</h3>
        <div className="grid gap-4">
          {currentLevel.data.map((deptData: any, index: number) => {
            const deptValue = metric.getValue(deptData.profiles);
            return (
              <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => {
                      onDrillDown(currentLevel.level + 1, deptData.profiles, `${deptData.name} - Staff`, 'staff');
                    }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="font-medium">{deptData.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {deptData.profiles.length} staff members
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold ${getColorClass(metric.type, deptValue)}`}>
                        {formatValue(deptValue, metric.type)}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground inline" />
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

  const renderStaffLevel = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Staff Details</h3>
        <div className="grid gap-4">
          {currentLevel.data.map((staff: any, index: number) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-purple-500" />
                    <div>
                      <div className="font-medium">{staff.full_name || 'Unknown Name'}</div>
                      <div className="text-sm text-muted-foreground">
                        {staff.primary_department} • {staff.location || 'No location'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={staff.cyber_learner ? "default" : "secondary"}>
                      {staff.cyber_learner ? "Enrolled" : "Not Enrolled"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        {drillDownPath.map((level, index) => (
          <div key={index} className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleBreadcrumbClick(index)}>
              {level.title}
            </Button>
            {index < drillDownPath.length - 1 && <ChevronRight className="h-4 w-4" />}
          </div>
        ))}
      </div>

      {/* Content based on current level */}
      {currentLevel.type === 'org' && renderOrganizationLevel()}
      {currentLevel.type === 'location' && renderLocationLevel()}
      {currentLevel.type === 'department' && renderDepartmentLevel()}
      {currentLevel.type === 'staff' && renderStaffLevel()}
    </div>
  );
};

export default MetricDrillDown;