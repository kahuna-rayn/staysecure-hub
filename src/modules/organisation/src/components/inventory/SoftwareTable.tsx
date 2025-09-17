
import React from 'react';
import { EditableTable } from '@/components/ui/editable-table';
import type { SoftwareInventoryItem } from '@/hooks/useInventory';

interface SoftwareTableProps {
  softwareInventory: SoftwareInventoryItem[];
  onUpdate: (id: string, updates: Partial<SoftwareInventoryItem>) => Promise<{ success: boolean; error?: string }>;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
  onCreate?: (data: Partial<SoftwareInventoryItem>) => Promise<{ success: boolean; error?: string }>;
}

const SoftwareTable: React.FC<SoftwareTableProps> = ({
  softwareInventory,
  onUpdate,
  onDelete,
  onCreate,
}) => {
  const columns = [
    { 
      key: 'software_name', 
      header: 'Software Name', 
      type: 'text' as const, 
      editable: true, 
      required: true,
      sortable: true,
      width: '200px'
    },
    { 
      key: 'software_publisher', 
      header: 'Publisher', 
      type: 'text' as const, 
      editable: true,
      sortable: true,
      width: '150px'
    },
    { 
      key: 'software_version', 
      header: 'Version', 
      type: 'text' as const, 
      editable: true,
      sortable: true,
      width: '120px'
    },
    { 
      key: 'department', 
      header: 'Department', 
      type: 'select' as const, 
      editable: true,
      sortable: true,
      options: ['IT', 'HR', 'Finance', 'Marketing', 'Operations', 'General'],
      width: '150px'
    },
    { 
      key: 'business_purpose', 
      header: 'Business Purpose', 
      type: 'textarea' as const, 
      editable: true,
      sortable: false,
      width: '200px'
    },
    { 
      key: 'status', 
      header: 'Status', 
      type: 'select' as const, 
      editable: true,
      sortable: true,
      options: ['Active', 'Inactive', 'Deprecated', 'End-of-life'],
      width: '120px'
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

  return (
    <EditableTable
      data={softwareInventory}
      columns={columns}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onCreate={onCreate}
      allowAdd={true}
      allowDelete={true}
    />
  );
};

export default SoftwareTable;
