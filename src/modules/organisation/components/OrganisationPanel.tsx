import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, Building2, MapPin, Settings, Award, User } from 'lucide-react';
import { useOrganisationContext } from '../context/OrganisationContext';
import UserManagement from './admin/UserManagement';
import { RoleManagement } from './knowledge/RoleManagement';
import { DepartmentManagement } from './knowledge/DepartmentManagement';
import { LocationManagement } from './knowledge/LocationManagement';
import OrganisationCertificates from './OrganisationCertificates';
import OrganisationProfile from './OrganisationProfile';

interface OrganisationPanelProps {
  title?: string;
  description?: string;
  showAdminBadge?: boolean;
  className?: string;
}

export const OrganisationPanel: React.FC<OrganisationPanelProps> = ({ 
  title = "Organisation",
  description = "Manage users, roles, departments, and locations",
  showAdminBadge = true,
  className = ""
}) => {
  const { isTabEnabled, onNavigate } = useOrganisationContext();
  const [activeTab, setActiveTab] = useState(() => {
    // Find the first enabled tab as default
    const defaultTabs = ['users', 'roles', 'departments', 'locations', 'certificates', 'profile'];
    return defaultTabs.find(tab => isTabEnabled(tab)) || 'users';
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onNavigate?.(value);
  };

  const tabConfig = [
    { id: 'users', label: 'User Management', icon: Users, component: UserManagement },
    { id: 'roles', label: 'Roles', icon: UserCheck, component: RoleManagement },
    { id: 'departments', label: 'Departments', icon: Building2, component: DepartmentManagement },
    { id: 'locations', label: 'Locations', icon: MapPin, component: LocationManagement },
    { id: 'certificates', label: 'Certificates', icon: Award, component: OrganisationCertificates },
    { id: 'profile', label: 'Profile', icon: User, component: OrganisationProfile },
  ];

  const enabledTabs = tabConfig.filter(tab => isTabEnabled(tab.id));

  return (
    <div className={`w-full px-4 space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        {showAdminBadge && (
          <Badge variant="secondary" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Administrator
          </Badge>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${enabledTabs.length}, 1fr)` }}>
              {enabledTabs.map(({ id, label, icon: Icon }) => (
                <TabsTrigger key={id} value={id} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            {enabledTabs.map(({ id, component: Component }) => (
              <TabsContent key={id} value={id} className="space-y-4">
                <Component />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};