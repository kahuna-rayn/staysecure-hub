import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from 'staysecure-auth';

export interface HardwareInventoryItem {
  id: string;
  asset_owner?: string;
  device_name?: string;
  serial_number: string;
  asset_type: string;
  asset_location?: string;
  owner?: string;
  asset_classification?: string;
  end_of_support_date?: string;
  os_edition?: string;
  os_version?: string;
  approval_status: string;
  approval_authorized_by?: string;
  approvers?: string;
  responses?: string;
  approval_created_date?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SoftwareInventoryItem {
  id: string;
  software_name: string;
  software_publisher?: string;
  software_version?: string;
  business_purpose?: string;
  department?: string;
  asset_classification?: string;
  approval_authorized_date?: string;
  end_of_support_date: string;
  license_start_date?: string;
  license_term?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AccountInventoryItem {
  id: string;
  full_name: string;
  username_email: string;
  software?: string;
  department?: string;
  role_account_type?: string;
  data_class?: string;
  approval_status: string;
  authorized_by?: string;
  date_access_created?: string;
  date_access_revoked?: string;
  created_by?: string;
  created_at: string;
  modified_by?: string;
  modified_at: string;
  date_column?: string;
  status: string;
}

export const useInventory = () => {
  const { user } = useAuth();
  const [hardwareInventory, setHardwareInventory] = useState<HardwareInventoryItem[]>([]);
  const [softwareInventory, setSoftwareInventory] = useState<SoftwareInventoryItem[]>([]);
  const [accountInventory, setAccountInventory] = useState<AccountInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchInventory();
    }
  }, [user]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      
      const [hardwareRes, softwareRes, accountRes] = await Promise.all([
        supabase.from('hardware_inventory').select('*').order('created_at', { ascending: false }),
        supabase.from('software_inventory').select('*').order('created_at', { ascending: false }),
        supabase.from('account_inventory').select('*').order('created_at', { ascending: false })
      ]);

      if (hardwareRes.error) throw hardwareRes.error;
      if (softwareRes.error) throw softwareRes.error;
      if (accountRes.error) throw accountRes.error;

      setHardwareInventory(hardwareRes.data || []);
      setSoftwareInventory(softwareRes.data || []);
      setAccountInventory(accountRes.data || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const addHardwareItem = async (item: Omit<HardwareInventoryItem, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Convert empty strings to null for optional fields
      const processedItem = {
        ...item,
        asset_owner: item.asset_owner || null,
        device_name: item.device_name || null,
        asset_location: item.asset_location || null,
        owner: item.owner || null,
        asset_classification: item.asset_classification || null,
        os_edition: item.os_edition || null,
        os_version: item.os_version || null,
        approval_authorized_by: item.approval_authorized_by || null,
        approvers: item.approvers || null,
        responses: item.responses || null,
      };

      const { error } = await supabase
        .from('hardware_inventory')
        .insert([processedItem]);

      if (error) throw error;
      await fetchInventory();
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const addSoftwareItem = async (item: Omit<SoftwareInventoryItem, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('software_inventory')
        .insert([item]);

      if (error) throw error;
      await fetchInventory();
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const addAccountItem = async (item: Omit<AccountInventoryItem, 'id' | 'created_at' | 'modified_at'>) => {
    try {
      const { error } = await supabase
        .from('account_inventory')
        .insert([item]);

      if (error) throw error;
      await fetchInventory();
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  return {
    hardwareInventory,
    softwareInventory,
    accountInventory,
    loading,
    error,
    addHardwareItem,
    addSoftwareItem,
    addAccountItem,
    refetch: fetchInventory,
  };
};
