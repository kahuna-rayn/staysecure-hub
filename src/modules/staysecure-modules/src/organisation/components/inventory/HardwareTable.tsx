
import React from 'react';
import { EditableTable } from '@/components/ui/editable-table';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import type { HardwareInventoryItem } from '@/hooks/useInventory';

interface HardwareTableProps {
  hardwareInventory: HardwareInventoryItem[];
  onEdit: (item: HardwareInventoryItem) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<HardwareInventoryItem>) => Promise<{ success: boolean; error?: string }>;
  onCreate?: (data: Partial<HardwareInventoryItem>) => Promise<{ success: boolean; error?: string }>;
}

const HardwareTable: React.FC<HardwareTableProps> = ({
  hardwareInventory,
  onUpdate,
  onDelete,
}) => {
  const handleUnassign = async (item: HardwareInventoryItem) => {
    try {
      // First, delete from hardware table if it exists
      const { error: hardwareDeleteError } = await supabase
        .from('hardware')
        .delete()
        .eq('serial_number', item.serial_number);

      if (hardwareDeleteError) {
        console.log('Hardware table entry deletion failed (may not exist):', hardwareDeleteError);
      }

      // Then update hardware_inventory table
      const { error: inventoryError } = await supabase
        .from('hardware_inventory')
        .update({ 
          asset_owner: null,
          status: 'Unassigned'
        })
        .eq('id', item.id);

      if (inventoryError) throw inventoryError;

      toast({
        title: "Hardware unassigned",
        description: `${item.device_name} has been unassigned and is now available for assignment.`,
      });

      // Trigger a refresh by calling onUpdate with empty changes
      await onUpdate(item.id, {});
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const columns = [
    { 
      key: 'device_name', 
      header: 'Device Name', 
      type: 'text' as const, 
      editable: true, 
      required: true,
      sortable: true,
      width: '200px'
    },
    { 
      key: 'asset_type', 
      header: 'Asset Type', 
      type: 'select' as const, 
      editable: true, 
      required: true,
      sortable: true,
      options: ['Laptop', 'Desktop', 'Server', 'Network Device', 'Mobile Device', 'Other'],
      width: '150px'
    },
    { 
      key: 'manufacturer', 
      header: 'Manufacturer', 
      type: 'text' as const, 
      editable: true,
      sortable: true,
      width: '150px'
    },
    { 
      key: 'model', 
      header: 'Model', 
      type: 'text' as const, 
      editable: true,
      sortable: true,
      width: '150px'
    },
    { 
      key: 'serial_number', 
      header: 'Serial Number', 
      type: 'text' as const, 
      editable: true, 
      required: true,
      sortable: true,
      width: '160px'
    },
    { 
      key: 'asset_owner', 
      header: 'Assigned To', 
      type: 'text' as const, 
      editable: true, 
      required: true,
      sortable: true,
      width: '150px'
    },
    { 
      key: 'asset_location', 
      header: 'Location', 
      type: 'text' as const, 
      editable: true,
      sortable: true,
      width: '140px'
    },
    { 
      key: 'status', 
      header: 'Status', 
      type: 'select' as const, 
      editable: true,
      sortable: true,
      options: ['Unassigned', 'Assigned', 'Offboarding', 'Retired', 'Maintenance', 'EOS Exception'],
      width: '120px'
    },
    { 
      key: 'os_edition', 
      header: 'OS Edition', 
      type: 'text' as const, 
      editable: true,
      sortable: true,
      width: '140px'
    },
    { 
      key: 'os_version', 
      header: 'OS Version', 
      type: 'text' as const, 
      editable: true,
      sortable: true,
      width: '140px'
    },
    { 
      key: 'asset_classification', 
      header: 'Classification', 
      type: 'select' as const, 
      editable: true,
      sortable: true,
      options: ['Public', 'Internal', 'Confidential', 'Restricted'],
      width: '150px'
    }
  ];

  const handleUpdate = async (id: string, updates: Partial<HardwareInventoryItem>) => {
    return await onUpdate(id, updates);
  };

  const handleDelete = async (id: string) => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      onDelete(id);
      resolve({ success: true });
    });
  };

  // Custom row renderer to add unassign button for assigned items
  const customRowActions = (item: HardwareInventoryItem) => {
    const isAssigned = item.asset_owner && 
      item.asset_owner !== 'Unassigned' && 
      item.asset_owner !== 'no-owner' && 
      item.asset_owner.trim() !== '';

    if (isAssigned) {
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleUnassign(item)}
          className="h-8 px-2 text-xs"
        >
          Unassign
        </Button>
      );
    }
    return null;
  };

  return (
    <div className="w-full space-y-4">
      <div className="w-full overflow-x-auto">
        <EditableTable
          data={hardwareInventory}
          columns={columns}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          allowAdd={false}
          allowDelete={true}
          className="min-w-full"
        />
      </div>
      
      {/* Custom actions for each row */}
      <div className="text-xs text-muted-foreground">
        <p>• Use the "+" button above to add new hardware items</p>
        <p>• Use the "Assign Hardware" button in User Management to assign unassigned items to users</p>
        <p>• Click "Unassign" next to assigned items to make them available for reassignment</p>
      </div>
    </div>
  );
};

export default HardwareTable;
