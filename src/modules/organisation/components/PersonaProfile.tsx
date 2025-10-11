import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from 'staysecure-auth';
import { useProfile } from "@/hooks/useProfile";
import { useUserAssets } from "@/hooks/useUserAssets";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import EditableProfileHeader from "./EditableProfileHeader";
import PersonaDetailsTabs from "./PersonaDetailsTabs";

// Define PersonProfile interface to replace the one from deleted mockData.ts
export interface PersonProfile {
  id: string;
  full_name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  avatar: string;
  role: string;
  department: string;
  manager: string;
  startDate: string;
  account: {
    username: string;
    employeeId: string;
    status: string;
    accessLevel: string;
    lastLogin: string;
    passwordLastChanged: string;
    twoFactorEnabled: boolean;
  };
  hardware: Array<{
    id: string;
    type: string;
    model: string;
    serialNumber: string;
    status: string;
    assignedDate: string;
    manufacturer: string;
    osEdition: string;
    osVersion: string;
  }>;
  software: Array<{
    id: string;
    name: string;
    role_account_type: string;
    expiryDate: string | null;
    lastUsed: string | null;
  }>;
  certificates: Array<{
    name: string;
    issuedBy: string;
    dateAcquired: string;
    expiryDate: string;
    credentialId: string;
    status: string;
  }>;
}

const PersonaProfile: React.FC = () => {
  const { user, signOut } = useAuth();
  const { hasAdminAccess } = useUserRole();
  const { profile, loading: profileLoading, refetch: refetchProfile } = useProfile();
  const { hardware, software, certificates, loading: assetsLoading, refetch: refetchAssets } = useUserAssets(user?.id);
  
  // Extract user email to prevent infinite re-renders
  const userEmail = user?.email;
  
  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  const [optimisticData, setOptimisticData] = useState<PersonProfile | null>(null);

  // Memoize personaData to prevent infinite re-renders - MUST be called before any early returns
  const personaData = useMemo(() => ({
    id: profile?.id || '',
    full_name: profile?.full_name || '',
    firstName: profile?.first_name || '',  // Use actual first_name from DB
    lastName: profile?.last_name || '',    // Use actual last_name from DB
    email: userEmail || '',
    phone: profile?.phone || 'Not provided',
    location: profile?.location || 'Not specified',
    avatar: profile?.avatar_url || '',
    role: profile?.role || 'Employee',
    department: profile?.department || 'General',
    manager: profile?.manager || 'Not assigned',
    startDate: profile?.start_date || profile?.created_at || '',
    account: {
      username: profile?.username || 'Not set',
      employeeId: profile?.employee_id || 'Not assigned',
      status: profile?.status || 'Active',
      accessLevel: profile?.access_level || 'User',
      lastLogin: profile?.last_login || profile?.created_at || '',
      passwordLastChanged: profile?.password_last_changed || profile?.created_at || '',
      twoFactorEnabled: profile?.two_factor_enabled || false,
    },
    hardware: (hardware || []).map(h => ({
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
    software: (software || []).map(s => {
      console.log('buildPersonaData - input software item:', s);
      const mapped = {
        id: s.id,
        name: s.name,
        role_account_type: s.role_account_type,
        expiryDate: s.expiryDate,
        lastUsed: s.lastUsed,
      };
      console.log('buildPersonaData - mapped software item:', mapped);
      return mapped;
    }),
    certificates: (certificates || []).map(c => ({
      name: c.name,
      issuedBy: c.issued_by,
      dateAcquired: c.date_acquired,
      expiryDate: c.expiry_date,
      credentialId: c.credential_id,
      status: c.status,
    })),
  }), [profile, hardware, software, certificates, userEmail]);

  const handleProfileUpdate = () => {
    // Refetch both profile and assets data to ensure everything is fresh
    refetchProfile();
    refetchAssets();
  };

  if (profileLoading || assetsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No profile found. Please update your profile information.</p>
      </div>
    );
  }

  // Handler for optimistic update
  const handleOptimisticUpdate = (field: string, value: string) => {
    setOptimisticData(prev => {
      const baseData = prev || personaData;
      const updated = { ...baseData };
      if (field in updated) {
        updated[field] = value;
      } else if (updated.account && field in updated.account) {
        updated.account = { ...updated.account, [field]: value };
      }
      return updated;
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  console.log('PersonaProfile rendering with personaData:', personaData);
  console.log('PersonaProfile personaData.software:', personaData.software);

  const displayData = optimisticData || personaData;

  return (
    <div className="space-y-6">
      {!hasAdminAccess && (
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">My Profile</h1>
        </div>
      )}
      <EditableProfileHeader profile={displayData} onProfileUpdate={refetchProfile} onOptimisticUpdate={handleOptimisticUpdate} />
      <PersonaDetailsTabs profile={displayData} userId={user?.id || ''} onUpdate={handleProfileUpdate} />
    </div>
  );
};

export default PersonaProfile;
