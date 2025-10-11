import React from "react";
import { Phone, MapPin, Star, User, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import EditableField from "./EditableField";
import { useUserDepartments } from "@/hooks/useUserDepartments";
import { useUserProfileRoles } from "@/hooks/useUserProfileRoles";
import { useUserPhysicalLocations } from "@/hooks/useUserPhysicalLocations";
import { UserRoleField } from "./UserRoleField";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProfileBasicInfoProps {
  firstName: string;
  lastName: string;
  manager: string;
  phone: string;
  location: string;
  locationId?: string;
  username?: string;
  employeeId?: string;
  editingField: string | null;
  onEdit: (field: string) => void;
  onSave: (field: string, value: string) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
  profiles: { id: string; full_name: string; username: string }[];
  currentUserId: string;
  userId: string; // Add userId for multiple roles
}

const ProfileBasicInfo: React.FC<ProfileBasicInfoProps> = ({
  firstName,
  lastName,
  manager,
  phone,
  location,
  locationId,
  username,
  employeeId,
  editingField,
  onEdit,
  onSave,
  onCancel,
  saving,
  profiles,
  currentUserId,
  userId
}) => {
  console.log('ProfileBasicInfo rendering with userId:', userId, 'currentUserId:', currentUserId);
  const { userDepartments } = useUserDepartments(userId);
  const { primaryRole } = useUserProfileRoles(userId);
  const { data: physicalLocations, isLoading: locationsLoading } = useUserPhysicalLocations(userId);
  
  // Get primary department
  const primaryDepartment = userDepartments.find(dept => dept.is_primary);
  
  const handleNameSave = async (fieldKey: string, value: string) => {
    await onSave('full_name', value);
  };
  
  const [managerValue, setManagerValue] = React.useState(manager);
  React.useEffect(() => { setManagerValue(manager); }, [manager, editingField]);
  
  const handleManagerChange = async (userId: string) => {
    setManagerValue(userId);
    await onSave('manager', userId);
  };
  
  // Handle location selection with both name and ID
  const handleLocationSelect = async (locationName: string, selectedOption?: { value: string; label: string; id?: string }) => {
    if (selectedOption?.id) {
      // Save both location name and location_id 
      await onSave('location', locationName);
      // Note: We would need to extend onSave to handle multiple fields or create a separate handler
      // For now, we'll save the location name and the parent component should handle location_id
    } else {
      await onSave('location', locationName);
    }
  };
  
  const filteredProfiles = profiles.filter(user => user.id !== currentUserId);
  const managerProfile = profiles.find(u => u.id === manager);
  const managerName = managerProfile ? (managerProfile.full_name || managerProfile.username) : 'Not assigned';

  return (
    <div className="flex-1">
      {/* Name */}
      <div className="flex items-center gap-2 mb-4">
        <EditableField
          value={`${firstName} ${lastName}`}
          fieldKey="full_name"
          onSave={handleNameSave}
          isEditing={editingField === 'full_name'}
          onEdit={onEdit}
          onCancel={onCancel}
          saving={saving}
          className="flex-1"
          inputClassName="text-2xl font-bold h-10"
        />
      </div>
      
      {/* 2-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8 lg:gap-12 w-full">
        {/* Left column - Personal info: Email, Employee ID, Phone */}
        <div className="space-y-2 w-full">
          {username && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{username}</span>
            </div>
          )}
          
          {employeeId && (
            <div className="flex items-center gap-2 text-sm">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{employeeId}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <EditableField
              value={phone || 'Not provided'}
              fieldKey="phone"
              placeholder="Phone number"
              onSave={onSave}
              isEditing={editingField === 'phone'}
              onEdit={onEdit}
              onCancel={onCancel}
              saving={saving}
              inputClassName="h-6 text-sm"
            />
          </div>
        </div>
        
        {/* Middle column - Work info: Reports to, Location, Department/Role */}
        <div className="space-y-2 w-full">
          {editingField === 'manager' ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Reports to:</span>
              <Select
                value={managerValue}
                onValueChange={handleManagerChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  {filteredProfiles.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.username || 'Unnamed User'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <EditableField
              value={managerName}
              fieldKey="manager"
              label="Reports to:"
              onSave={onSave}
              isEditing={editingField === 'manager'}
              onEdit={onEdit}
              onCancel={onCancel}
              saving={saving}
              inputClassName="text-sm h-6"
            />
          )}
          
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <EditableField
              value={location || 'Not specified'}
              fieldKey="location"
              placeholder="Select location"
              onSave={onSave}
              onSelectChange={handleLocationSelect}
              isEditing={editingField === 'location'}
              onEdit={onEdit}
              onCancel={onCancel}
              saving={saving}
              type="select"
              asyncOptions={physicalLocations}
              isLoading={locationsLoading}
              inputClassName="h-6 text-sm w-48"
              locationId={locationId}
            />
          </div>
          
          {/* System Role */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">System Role:</span>
            <UserRoleField userId={userId} />
          </div>
          
          {/* Primary Department and Role */}
          <div className="flex items-center gap-4 w-full">
            {primaryDepartment && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-current text-yellow-500" />
                <Badge variant="default">
                  {primaryDepartment.department_name}
                </Badge>
              </div>
            )}
            
            {primaryRole && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-current text-yellow-500" />
                <Badge variant="default">
                  {primaryRole.role_name}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileBasicInfo;
