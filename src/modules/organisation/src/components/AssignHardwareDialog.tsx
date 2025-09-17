
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useInventory } from '@/hooks/useInventory';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AssignHardwareDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess?: () => void;
}

const AssignHardwareDialog: React.FC<AssignHardwareDialogProps> = ({
  isOpen,
  onOpenChange,
  userId,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedHardwareId, setSelectedHardwareId] = useState('');
  const { hardwareInventory, refetch } = useInventory();

  // Get unassigned hardware items
  const unassignedHardware = hardwareInventory.filter(item => {
    const isUnassigned = item.status === 'Unassigned';
    const hasNoAssignedUser = !item.asset_owner || 
      item.asset_owner.trim() === '' || 
      item.asset_owner === 'no-owner' || 
      item.asset_owner === 'Unassigned' ||
      item.asset_owner === null;
    return isUnassigned && hasNoAssignedUser;
  });

  const selectedHardwareItem = selectedHardwareId ? 
    hardwareInventory.find(item => item.id === selectedHardwareId) : 
    null;

  const { data: userProfile } = useQuery({
    queryKey: ['user-profile-by-id', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedHardwareItem || !userProfile) {
      toast({
        title: "Error",
        description: "Please select a hardware item to assign.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const userName = userProfile.full_name || userProfile.username || 'Assigned User';
      
      // Update the hardware inventory item to assign it to the user
      const { error: inventoryError } = await supabase
        .from('hardware_inventory')
        .update({ 
          asset_owner: userName,
          status: 'Assigned'
        })
        .eq('id', selectedHardwareId);

      if (inventoryError) throw inventoryError;

      // Also create/update entry in hardware table for the user
      const { error: hardwareError } = await supabase
        .from('hardware')
        .upsert({
          user_id: userId,
          type: selectedHardwareItem.asset_type,
          model: selectedHardwareItem.device_name,
          serial_number: selectedHardwareItem.serial_number,
          status: 'Active',
          assigned_date: new Date().toISOString()
        });

      if (hardwareError) throw hardwareError;

      toast({
        title: "Hardware assigned",
        description: `${selectedHardwareItem.device_name} has been successfully assigned to ${userName}`,
      });
      
      // Refresh the inventory data
      await refetch();
      
      onOpenChange(false);
      setSelectedHardwareId('');
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Hardware to User</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="hardware">Select Hardware</Label>
            <Select 
              value={selectedHardwareId} 
              onValueChange={setSelectedHardwareId}
              disabled={unassignedHardware.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={unassignedHardware.length === 0 ? "No unassigned hardware available" : "Select unassigned hardware"} />
              </SelectTrigger>
              <SelectContent>
                {unassignedHardware.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.device_name} - {item.asset_type} (S/N: {item.serial_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedHardwareItem && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium mb-2 text-blue-900">Assignment Details:</h4>
              <p className="text-sm text-blue-700"><strong>Device:</strong> {selectedHardwareItem.device_name}</p>
              <p className="text-sm text-blue-700"><strong>Type:</strong> {selectedHardwareItem.asset_type}</p>
              <p className="text-sm text-blue-700"><strong>Serial Number:</strong> {selectedHardwareItem.serial_number}</p>
              <p className="text-sm text-blue-700"><strong>Location:</strong> {selectedHardwareItem.asset_location || 'Not specified'}</p>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedHardwareId}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign Hardware"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignHardwareDialog;
