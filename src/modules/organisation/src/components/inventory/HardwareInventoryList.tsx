import React from 'react';
import { useInventory } from '@/hooks/useInventory';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import HardwareTable from './HardwareTable';
import type { HardwareInventoryItem } from '@/hooks/useInventory';

const HardwareInventoryList: React.FC = () => {
  const { hardwareInventory, loading, refetch } = useInventory();

  const updateHardwareItem = async (id: string, updates: Partial<HardwareInventoryItem>) => {
    try {
      const { error } = await supabase
        .from('hardware_inventory')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      await refetch();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const createHardwareItem = async (data: Partial<HardwareInventoryItem>) => {
    try {
      // Ensure required fields are present
      const itemData = {
        asset_owner: data.asset_owner || "Unassigned",
        device_name: data.device_name || '',
        serial_number: data.serial_number || '',
        asset_type: data.asset_type || '',
        asset_location: data.asset_location || null,
        owner: data.owner || null,
        asset_classification: data.asset_classification || null,
        end_of_support_date: data.end_of_support_date || null,
        os_edition: data.os_edition || null,
        os_version: data.os_version || null,
        approval_status: data.approval_status || 'Not submitted',
        approval_authorized_by: data.approval_authorized_by || null,
        approvers: data.approvers || null,
        responses: data.responses || null,
        approval_created_date: data.approval_created_date || null,
        status: data.status || 'Active'
      };

      const { error } = await supabase
        .from('hardware_inventory')
        .insert(itemData);

      if (error) throw error;
      
      await refetch();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const deleteHardwareItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('hardware_inventory')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await refetch();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const handleEdit = (item: HardwareInventoryItem) => {
    // Implementation for edit functionality if needed
  };

  const handleDelete = (id: string) => {
    deleteHardwareItem(id);
  };

  if (loading) {
    return <div>Loading hardware inventory...</div>;
  }

  return (
    <div className="space-y-4">
      <HardwareTable
        hardwareInventory={hardwareInventory}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onUpdate={updateHardwareItem}
        onCreate={createHardwareItem}
      />
    </div>
  );
};

export default HardwareInventoryList;
