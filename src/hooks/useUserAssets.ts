import { useState, useEffect } from 'react';

export interface UserHardware {
  id: string;
  type: string;
  model: string;
  serial_number: string;
  status: string;
  assigned_date: string;
  manufacturer?: string;
  os_edition?: string;
  os_version?: string;
}

export interface UserSoftware {
  id: string;
  name: string;
  role_account_type: string;
  expiryDate: string | null;
  lastUsed: string | null;
}

export interface UserCertificate {
  id: string;
  type?: string;
  name: string;
  issued_by: string;
  date_acquired: string;
  expiry_date: string | null;
  credential_id: string | null;
  status: string;
  org_cert?: boolean;
}

export const useUserAssets = (userId?: string) => {
  const [hardware, setHardware] = useState<UserHardware[]>([]);
  const [software, setSoftware] = useState<UserSoftware[]>([]);
  const [certificates, setCertificates] = useState<UserCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserAssets = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Dynamic import to avoid type recursion
      const { supabase } = await import('@/integrations/supabase/client');
      
      let actualUserId = userId;
      
      // Get user profile to match with hardware
      const profileQuery = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', actualUserId)
        .single();
      
      const userName = profileQuery.data?.full_name || profileQuery.data?.username || '';
      
      // Query hardware_inventory for items assigned to this user
      const hardwareQuery = await supabase
        .from('hardware_inventory')
        .select('id, asset_type, device_name, serial_number, status, created_at, manufacturer, model, os_edition, os_version, asset_owner')
        .eq('asset_owner', userName)
        .neq('status', 'Unassigned')
        .order('created_at', { ascending: false });
      
      // Query account_inventory for software accounts - direct query
      let finalSoftwareData: any[] = [];
      let finalSoftwareError = null;
      
      try {
        const fallbackQuery = await (supabase as any)
          .from('account_inventory')
          .select('id, software, role_account_type, status')
          .eq('user_id', actualUserId)
          .is('date_access_revoked', null);
        
        finalSoftwareData = fallbackQuery.data || [];
        finalSoftwareError = fallbackQuery.error;
      } catch (err) {
        console.warn('Software query failed:', err);
        finalSoftwareData = [];
      }
      
      // Query certificates by user_id
      const certificatesQuery = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', actualUserId)
        .order('created_at', { ascending: false });

      if (hardwareQuery.error) throw hardwareQuery.error;
      if (finalSoftwareError) console.warn('Software query error:', finalSoftwareError);
      if (certificatesQuery.error) throw certificatesQuery.error;

      // Transform hardware data
      const transformedHardware = (hardwareQuery.data || []).map(item => ({
        id: item.id,
        type: item.asset_type,
        model: item.model || item.device_name || 'Unknown Model',
        serial_number: item.serial_number,
        status: item.status || 'Active',
        assigned_date: item.created_at,
        manufacturer: item.manufacturer,
        os_edition: item.os_edition,
        os_version: item.os_version,
      }));

      // Transform software data - ensure it's an array
      const transformedSoftware = Array.isArray(finalSoftwareData) 
        ? finalSoftwareData.map((item: any) => ({
            id: item.id,
            name: item.software || 'Unknown Software',
            role_account_type: item.role_account_type || 'User',
            expiryDate: null,
            lastUsed: null,
          }))
        : [];

      setHardware(transformedHardware);
      setSoftware(transformedSoftware);
      setCertificates(certificatesQuery.data || []);
    } catch (error: any) {
      setError(error.message);
      console.error('Error fetching user assets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAssets();
  }, [userId]);

  const refetch = async () => {
    await fetchUserAssets();
  };

  const addCertificate = async (certificateData: any) => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { error } = await supabase
        .from('certificates')
        .insert([certificateData]);
      
      if (error) throw error;
      await fetchUserAssets();
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const addSoftware = async (softwareData: any) => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      const now = new Date().toISOString();
      
      const enrichedData = {
        ...softwareData,
        created_at: now,
        date_access_created: now,
        modified_at: now
      };
      
      if (user?.id) {
        enrichedData.created_by = user.id;
        enrichedData.modified_by = user.id;
      }
      
      const { error } = await supabase
        .from('account_inventory')
        .insert([enrichedData]);
      
      if (error) throw error;
      await fetchUserAssets();
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const deleteSoftware = async (softwareId: string) => {
    try {
      if (!softwareId || softwareId === 'undefined') {
        throw new Error(`Invalid software ID provided: "${softwareId}"`);
      }
      
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData: any = {
        status: 'Revoked',
        date_access_revoked: new Date().toISOString(),
        modified_at: new Date().toISOString()
      };
      
      if (user?.id && user.id !== 'undefined') {
        updateData.modified_by = user.id;
      }
      
      const { error } = await supabase
        .from('account_inventory')
        .update(updateData)
        .eq('id', softwareId);
      
      if (error) throw error;
      await fetchUserAssets();
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  return {
    hardware,
    software,
    certificates,
    loading,
    error,
    refetch,
    addCertificate,
    addSoftware,
    deleteSoftware,
  };
};