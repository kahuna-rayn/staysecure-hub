import React, { useState } from 'react';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { useInventory } from '@/hooks/useInventory';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Laptop } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const HardwareManagement: React.FC = () => {
  const { profiles } = useUserProfiles();
  const { hardwareInventory, refetch } = useInventory();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    hardware_inventory_id: '',
    assigned_date: new Date().toISOString().split('T')[0],
  });

  // Get unassigned hardware items - items without an assigned user
  const unassignedHardware = hardwareInventory.filter(item => {
    const isActive = item.status === 'Active';
    const hasNoAssignedUser = !item.asset_owner || item.asset_owner.trim() === '' || item.asset_owner === 'no-owner' || item.asset_owner === 'Unassigned';
    
    console.log('Hardware item:', item.device_name, {
      isActive,
      hasNoAssignedUser,
      asset_owner: item.asset_owner,
      status: item.status
    });
    
    return isActive && hasNoAssignedUser;
  });

  console.log('Total hardware inventory:', hardwareInventory.length);
  console.log('Unassigned hardware count:', unassignedHardware.length);
  console.log('Unassigned hardware items:', unassignedHardware);

  const selectedHardwareItem = hardwareInventory.find(item => item.id === formData.hardware_inventory_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedHardwareItem) {
      toast({
        title: "Error",
        description: "Please select a hardware item to assign.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get the selected user's information
      const selectedProfile = profiles.find(p => p.id === formData.user_id);
      
      if (!selectedProfile) {
        toast({
          title: "Error",
          description: "Selected user not found.",
          variant: "destructive",
        });
        return;
      }

      console.log('Assigning hardware to user:', selectedProfile.full_name || selectedProfile.username);
      
      // Update the hardware inventory item to assign it to the user
      const { error } = await supabase
        .from('hardware_inventory')
        .update({ 
          asset_owner: selectedProfile.full_name || selectedProfile.username || 'Assigned User'
        })
        .eq('id', formData.hardware_inventory_id);

      if (error) throw error;

      toast({
        title: "Hardware assigned",
        description: `${selectedHardwareItem.device_name} has been successfully assigned to ${selectedProfile.full_name || selectedProfile.username}`,
      });
      
      // Refresh the inventory data
      await refetch();
      
      setIsDialogOpen(false);
      setFormData({
        user_id: '',
        hardware_inventory_id: '',
        assigned_date: new Date().toISOString().split('T')[0],
      });
    } catch (error: any) {
      console.error('Hardware assignment error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Hardware Assignments</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Hardware to User</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="user">Assign to User</Label>
                <Select value={formData.user_id} onValueChange={(value) => setFormData({ ...formData, user_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || user.username || 'Unnamed User'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="hardware">Select Hardware</Label>
                <Select 
                  value={formData.hardware_inventory_id} 
                  onValueChange={(value) => setFormData({ ...formData, hardware_inventory_id: value })}
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
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!formData.user_id || !formData.hardware_inventory_id}>
                  Assign Hardware
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="text-center py-8 text-muted-foreground">
        <Laptop className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Hardware assignments managed through inventory</p>
        <p className="text-sm">
          {unassignedHardware.length} unassigned hardware items available for assignment
        </p>
      </div>
    </div>
  );
};

export default HardwareManagement;
