
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { EditableTable } from '@/components/ui/editable-table';
import { Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import AssignPhysicalLocationDialog from './admin/AssignPhysicalLocationDialog';

interface PhysicalLocationTabProps {
  profile: any;
}

interface PhysicalLocationAccess {
  id: string;
  location: string; // Keep for backward compatibility during migration
  location_id?: string; // New foreign key field
  access_purpose: string;
  date_access_created: string;
  date_access_revoked: string | null;
  status: string;
  locations?: {
    id: string;
    name: string;
  };
}

const PhysicalLocationTab: React.FC<PhysicalLocationTabProps> = ({ profile }) => {
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  const { data: locationAccess = [], refetch } = useQuery({
    queryKey: ['user-physical-location-access', profile.email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('physical_location_access')
        .select(`
          id,
          access_purpose, 
          status, 
          date_access_created, 
          date_access_revoked,
          location_id,
          locations!inner(name)
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform the data to map locations.name to location for the table
      const transformedData = data?.map((item, index) => ({
        ...item,
        location: item.locations?.name || 'Unknown Location',
        // Ensure we have a unique key for React
        uniqueKey: item.id || `temp-${index}-${Date.now()}`
      })) || [];
      
      return transformedData;
    },
  });

  const columns = [
    {
      key: 'location',
      header: 'Location',
      type: 'text' as const,
      editable: false, // Not editable as requested
      required: true,
      sortable: true,
    },
    {
      key: 'access_purpose',
      header: 'Access Purpose',
      type: 'text' as const,
      editable: false, // Not editable as requested
      required: true,
      sortable: true,
    },
    {
      key: 'date_access_created',
      header: 'Date Created',
      type: 'date' as const,
      editable: false, // Not editable as requested
      required: true,
      sortable: true,
    },
    {
      key: 'date_access_revoked',
      header: 'Date Revoked',
      type: 'date' as const,
      editable: true, // Only this field is editable as requested
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      type: 'select' as const,
      options: ['Active', 'Inactive', 'Revoked'],
      editable: false, // Not editable as requested
      sortable: true,
    },
  ];

  const handleUpdate = async (id: string, updates: Partial<PhysicalLocationAccess>) => {
    try {
      const { error } = await supabase
        .from('physical_location_access')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Access updated",
        description: "Physical location access has been successfully updated",
      });

      refetch();
      return { success: true };
    } catch (error: any) {
      console.error('Error updating physical location access:', error);
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('physical_location_access')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Access removed",
        description: "Physical location access has been successfully removed",
      });

      refetch();
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Manage physical location access for {profile.firstName} {profile.lastName}
        </p>
        <Button 
          onClick={() => setIsAssignDialogOpen(true)}
          size="icon"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <EditableTable
        data={locationAccess}
        columns={columns}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        allowAdd={false}
        allowDelete={true}
      />

      <AssignPhysicalLocationDialog
        isOpen={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        prefilledUser={{
          full_name: profile.firstName + ' ' + profile.lastName,
          email: profile.email,
          department: profile.department,
          role: profile.role,
        }}
        onSuccess={() => {
          refetch();
          setIsAssignDialogOpen(false);
        }}
      />
    </div>
  );
};

export default PhysicalLocationTab;
