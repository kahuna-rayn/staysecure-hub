
import React from "react";
import { Laptop, Calendar, Tag, Monitor, Cpu, Cog } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EditableTable } from "@/components/ui/editable-table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface HardwareItem {
  id: string;
  type: string;
  model: string;
  serialNumber: string;
  status: string;
  assignedDate: string;
  manufacturer?: string;
  osEdition?: string;
  osVersion?: string;
}

interface HardwareInventoryProps {
  profile: {
    hardware: HardwareItem[];
  };
  onUpdate?: () => void;
}

const HardwareInventory: React.FC<HardwareInventoryProps> = ({ profile, onUpdate }) => {
  const { hardware } = profile;

  const columns = [
    {
      key: 'type',
      header: 'Type',
      type: 'text' as const,
      editable: false,
      sortable: true,
      width: '120px',
    },
    {
      key: 'model',
      header: 'Model',
      type: 'text' as const,
      editable: false,
      sortable: true,
      width: '150px',
    },
    {
      key: 'serialNumber',
      header: 'Serial Number',
      type: 'text' as const,
      editable: false,
      sortable: true,
      width: '150px',
    },
    {
      key: 'status',
      header: 'Status',
      type: 'select' as const,
      options: ['Unassigned', 'Assigned', 'Offboarding', 'Retired', 'Maintenance', 'EOS Exception'],
      editable: true,
      sortable: true,
      width: '120px',
    },
    {
      key: 'assignedDate',
      header: 'Assigned Date',
      type: 'date' as const,
      editable: true,
      sortable: true,
      width: '130px',
    },
    {
      key: 'manufacturer',
      header: 'Manufacturer',
      type: 'text' as const,
      editable: true,
      sortable: true,
      width: '140px',
    },
    {
      key: 'osEdition',
      header: 'OS Edition',
      type: 'text' as const,
      editable: true,
      sortable: true,
      width: '130px',
    },
    {
      key: 'osVersion',
      header: 'OS Version',
      type: 'text' as const,
      editable: true,
      sortable: true,
      width: '130px',
    },
  ];

  const handleUpdate = async (id: string, updates: Partial<HardwareItem>) => {
    try {
      const { error } = await supabase
        .from('hardware_inventory')
        .update({
          status: updates.status,
          manufacturer: updates.manufacturer,
          os_edition: updates.osEdition,
          os_version: updates.osVersion,
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Hardware updated",
        description: "Hardware information has been successfully updated.",
      });

      // Trigger refresh to update the UI
      onUpdate?.();

      return { success: true };
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {hardware.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No hardware assigned</p>
      ) : (
        <EditableTable
          data={hardware}
          columns={columns}
          onUpdate={handleUpdate}
          allowAdd={false}
          allowDelete={false}
        />
      )}
    </div>
  );
};

export default HardwareInventory;
