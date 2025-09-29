import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Building, User, Edit2, Save, X, Hash, Phone, Star, Network } from 'lucide-react';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { useUserDepartments } from '@/hooks/useUserDepartments';
import { useUserProfileRoles } from '@/hooks/useUserProfileRoles';
import { useUserPhysicalLocations } from '@/hooks/useUserPhysicalLocations';
import { toast } from '@/components/ui/use-toast';
import ProfileAvatar from '@/modules/organisation/components/profile/ProfileAvatar';
import ProfileContactInfo from '@/modules/organisation/components/profile/ProfileContactInfo';
import EditableField from '@/modules/organisation/components/profile/EditableField';

interface EditableProfileHeaderProps {
  profile: any;
  onProfileUpdate: () => void;
  isReadOnly?: boolean;
  onOptimisticUpdate?: (field: string, value: string) => void;
}

const EditableProfileHeader: React.FC<EditableProfileHeaderProps> = ({ 
  profile, 
  onProfileUpdate,
  isReadOnly = false,
  onOptimisticUpdate
}) => {
  console.log('EditableProfileHeader props:', { profile, onOptimisticUpdate });
  const { profiles, updateProfile } = useUserProfiles();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [managerValue, setManagerValue] = useState(profile.manager || '');

  const handleFieldEdit = (field: string) => {
    setEditingField(field);
  };

  const handleFieldSave = async (field: string, value: string) => {
    console.log('handleFieldSave called', field, value);
    try {
      setSaving(true);
      let updateData: any = {};
      if (field === 'full_name') {
        updateData.full_name = value;
      } else if (field === 'phone') {
        updateData.phone = value;
      } else if (field === 'location') {
        updateData.location = value;
      } else if (field === 'location_id') {
        updateData.location_id = value;
      } else if (field === 'role') {
        updateData.role = value;
      } else if (field === 'department') {
        updateData.department = value;
      } else if (field === 'manager') {
        updateData.manager = value;
      }
      
      console.log('Updating profile:', profile.id, updateData);
      
      if (!profile.id) {
        console.error('Profile ID is undefined. Profile object:', profile);
        console.log('Early return: profile.id is undefined');
        toast({
          title: "Error",
          description: "Profile ID is missing. Cannot update profile.",
          variant: "destructive",
        });
        return;
      }
      
      const result = await updateProfile(profile.id, updateData);
      console.log('Update result:', result);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      setEditingField(null);
      console.log('onOptimisticUpdate', onOptimisticUpdate);
      if (onOptimisticUpdate) {
        console.log('Calling onOptimisticUpdate', field, value);
        onOptimisticUpdate(field, value);
      }
      onProfileUpdate();
    } catch (error: any) {
      console.error('Save error:', error);
      console.log('Early return: error in save');
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFieldCancel = () => {
    setEditingField(null);
  };

  // Get manager name and filtered profiles
  const filteredProfiles = profiles.filter(user => user.id !== profile.id);
  const managerProfile = profiles.find(u => u.id === profile.manager);
  const managerName = managerProfile ? (managerProfile.full_name || managerProfile.username) : 'Not assigned';

  // Get departments and roles
  const { userDepartments } = useUserDepartments(profile.id);
  const { primaryRole } = useUserProfileRoles(profile.id);
  const { data: physicalLocations, isLoading: locationsLoading } = useUserPhysicalLocations(profile.id);
  
  // Get primary department
  const primaryDepartment = userDepartments?.find(dept => dept.is_primary);

  const handleManagerChange = async (userId: string) => {
    setManagerValue(userId);
    await handleFieldSave('manager', userId);
  };

  // Handle location selection with both name and ID
  const handleLocationSelect = async (locationName: string, selectedOption?: { value: string; label: string; id?: string }) => {
    if (selectedOption?.id) {
      // Update both location name and location_id
      await handleFieldSave('location', locationName);
      await handleFieldSave('location_id', selectedOption.id);
    } else {
      await handleFieldSave('location', locationName);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Avatar section */}
          <div className="flex justify-center lg:justify-start">
            <ProfileAvatar 
              avatarUrl={profile.avatar}
              firstName={profile.firstName}
              lastName={profile.lastName}
            />
          </div>
          
          {/* 3-column layout for profile info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 flex-1">
            {/* Column 1 - Personal info */}
            <div className="space-y-2">
              <div className="text-center sm:text-left">
                <EditableField
                  value={`${profile.firstName} ${profile.lastName}`}
                  fieldKey="firstName"
                  onSave={handleFieldSave}
                  isEditing={editingField === 'firstName'}
                  onEdit={handleFieldEdit}
                  onCancel={handleFieldCancel}
                  saving={saving}
                  className="flex-1"
                  inputClassName="text-2xl font-bold h-10"
                />
              </div>
              
              {profile.account?.username && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{profile.account.username}</span>
                </div>
              )}
              
              {profile.account?.employeeId && (
                <div className="flex items-center gap-2 text-sm">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{profile.account.employeeId}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <EditableField
                  value={profile.phone || 'Not provided'}
                  fieldKey="phone"
                  placeholder="Phone number"
                  onSave={handleFieldSave}
                  isEditing={editingField === 'phone'}
                  onEdit={handleFieldEdit}
                  onCancel={handleFieldCancel}
                  saving={saving}
                  inputClassName="h-6 text-sm"
                />
              </div>
            </div>

            {/* Column 2 - Work info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Network className="h-4 w-4 text-muted-foreground" />
                {editingField === 'manager' ? (
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
                ) : (
                  <EditableField
                    value={managerName}
                    fieldKey="manager"
                    onSave={handleFieldSave}
                    isEditing={editingField === 'manager'}
                    onEdit={handleFieldEdit}
                    onCancel={handleFieldCancel}
                    saving={saving}
                    inputClassName="text-sm h-6"
                  />
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <EditableField
                  value={profile.location || 'Not specified'}
                  fieldKey="location"
                  placeholder="Select location"
                  onSave={handleFieldSave}
                  onSelectChange={handleLocationSelect}
                  isEditing={editingField === 'location'}
                  onEdit={handleFieldEdit}
                  onCancel={handleFieldCancel}
                  saving={saving}
                  type="select"
                  asyncOptions={physicalLocations}
                  isLoading={locationsLoading}
                  inputClassName="h-6 text-sm w-48"
                  locationId={profile.locationId}
                />
              </div>
              
              {/* Primary Department and Role */}
              <div className="flex items-center gap-4 w-full">
                <div className="flex items-center gap-2">
                  <Star className="h-3 w-3 fill-current text-yellow-500" />
                </div>
                <div className="flex items-center gap-2">
                  {primaryDepartment && (
                    <Badge variant="default">
                      {primaryDepartment.department_name}
                    </Badge>
                  )}
                  {primaryRole && (
                    <Badge variant="default">
                      {primaryRole.role_name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Column 3 - Status info */}
            <div className="space-y-2">
              <ProfileContactInfo
                startDate={profile.startDate}
                status={profile.account?.status}
                accessLevel={profile.account?.accessLevel}
                lastLogin={profile.account?.lastLogin}
                passwordLastChanged={profile.account?.passwordLastChanged}
                twoFactorEnabled={profile.account?.twoFactorEnabled}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EditableProfileHeader;
