
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { useUserAssets } from '@/hooks/useUserAssets';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import EditableProfileHeader from '@/modules/organisation/components/EditableProfileHeader';
import PersonaDetailsTabs from '@/modules/organisation/components/PersonaDetailsTabs';

const UserDetailView: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { profiles, loading: profilesLoading } = useUserProfiles();
  const { hardware, software, certificates, loading: assetsLoading } = useUserAssets(userId);

  // Build personaData from the latest userProfile
  const buildPersonaData = (profileObj: any) => ({
    id: profileObj.id,
    full_name: profileObj.full_name || '',  // Add this line
    firstName: profileObj.first_name || '',  // Use actual first_name from DB
    lastName: profileObj.last_name || '',    // Use actual last_name from DB
    email: profileObj.email || '',
    phone: profileObj.phone || 'Not provided',
    location: profileObj.location || 'Not specified',
    avatar: profileObj.avatar_url || '',
    role: profileObj.role || 'Employee',
    department: profileObj.department || 'General',
    manager: profileObj.manager || 'Not assigned',
    startDate: profileObj.start_date || profileObj.created_at,
    enrolled_in_learn: profileObj.enrolled_in_learn || false,
    account: {
      username: profileObj.username || 'Not set',
      employeeId: profileObj.employee_id || 'Not assigned',
      status: profileObj.status || 'Active',
      accessLevel: profileObj.access_level || 'User',
      lastLogin: profileObj.last_login || profileObj.created_at,
      passwordLastChanged: profileObj.password_last_changed || profileObj.created_at,
      twoFactorEnabled: profileObj.two_factor_enabled || false,
    },
    hardware: hardware.map((h: any) => ({
      id: h.id,
      type: h.type,
      model: h.model,
      serialNumber: h.serial_number,
      status: h.status,
      assignedDate: h.assigned_date,
      manufacturer: h.manufacturer || '',
      osEdition: h.os_edition || '',
      osVersion: h.os_version || '',
    })),
    software: software.map((s: any) => ({
      name: s.name,
      role_account_type: s.role_account_type,
      expiryDate: s.expiryDate,
      lastUsed: s.lastUsed,
    })),
    certificates: certificates.map((c: any) => ({
      type: c.type || 'Certificate',
      name: c.name,
      issuedBy: c.issued_by,
      dateAcquired: c.date_acquired,
      expiryDate: c.expiry_date,
      credentialId: c.credential_id,
      status: c.status,
      org_cert: c.org_cert,
    })),
  });

  // Hooks at the top
  const [personaData, setPersonaData] = React.useState<any>(null);

  React.useEffect(() => {
    const userProfile = profiles.find((p: any) => p.id === userId);
    if (userProfile) {
      setPersonaData(buildPersonaData(userProfile));
    }
  }, [profiles, userId, hardware, software, certificates]);

  // Handler for optimistic update
  const handleOptimisticUpdate = (field: string, value: string) => {
    setPersonaData((prev: any) => {
      const updated = { ...prev };
      if (field in updated) {
        updated[field] = value;
      } else if (updated.account && field in updated.account) {
        updated.account = { ...updated.account, [field]: value };
      }
      console.log('UserDetailView handleOptimisticUpdate:', field, value, updated);
      return updated;
    });
  };

  const handleProfileUpdate = () => {
    // For admin view, we might want to refresh the data but not allow editing
    console.log('Profile update requested for user:', userId);
  };

  const handleBackToUsers = () => {
    // Navigate to admin panel with organisation tab active
    navigate('/admin', { state: { activeTab: 'organisation' } });
  };

  // Loading and error UI
  if (profilesLoading || assetsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const userProfile = profiles.find((p: any) => p.id === userId);

  if (!userProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">User not found</p>
        <Button onClick={() => navigate('/admin')} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin
        </Button>
      </div>
    );
  }

  if (!personaData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button onClick={handleBackToUsers} variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
        <h1 className="text-2xl font-bold">User Profile: {userProfile.full_name || 'Unnamed User'}</h1>
      </div>
      <EditableProfileHeader 
        profile={personaData} 
        onProfileUpdate={handleProfileUpdate}
        onOptimisticUpdate={handleOptimisticUpdate}
      />
      <PersonaDetailsTabs profile={personaData} userId={userId!} />
    </div>
  );
};

export default UserDetailView;
