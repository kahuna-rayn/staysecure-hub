import React, { useState } from 'react';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { useUserAssets } from '@/hooks/useUserAssets';
import { useInventory } from '@/hooks/useInventory';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, MonitorSmartphone } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const SoftwareManagement: React.FC = () => {
  const { profiles } = useUserProfiles();
  const { addSoftware } = useUserAssets();
  const { softwareInventory } = useInventory();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    software_inventory_id: '',
    license_type: '',
    access_level: '',
  });

  // Get active software items
  const availableSoftware = softwareInventory.filter(item => 
    item.status === 'Active'
  );

  const selectedSoftwareItem = softwareInventory.find(item => item.id === formData.software_inventory_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSoftwareItem) {
      toast({
        title: "Error",
        description: "Please select a software item to assign.",
        variant: "destructive",
      });
      return;
    }

    try {
      const softwareData = {
        user_id: formData.user_id,
        name: selectedSoftwareItem.software_name,
        license_type: formData.license_type,
        access_level: formData.access_level,
        expiry_date: null,
        last_used: null,
      };
      
      await addSoftware(softwareData);
      toast({
        title: "Software assigned",
        description: "Software license has been successfully assigned to the user.",
      });
      
      setIsDialogOpen(false);
      setFormData({
        user_id: '',
        software_inventory_id: '',
        license_type: '',
        access_level: '',
      });
    } catch (error: any) {
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
        <h3 className="text-lg font-medium">Software Licenses</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Software License to User</DialogTitle>
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
                <Label htmlFor="software">Select Software</Label>
                <Select 
                  value={formData.software_inventory_id} 
                  onValueChange={(value) => setFormData({ ...formData, software_inventory_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select software from inventory" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSoftware.length === 0 ? (
                      <SelectItem value="" disabled>No software available in inventory</SelectItem>
                    ) : (
                      availableSoftware.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.software_name} {item.software_version ? `v${item.software_version}` : ''}
                          {item.software_publisher ? ` by ${item.software_publisher}` : ''}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedSoftwareItem && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Selected Software Details:</h4>
                  <p><strong>Name:</strong> {selectedSoftwareItem.software_name}</p>
                  <p><strong>Publisher:</strong> {selectedSoftwareItem.software_publisher || 'Not specified'}</p>
                  <p><strong>Version:</strong> {selectedSoftwareItem.software_version || 'Not specified'}</p>
                  <p><strong>Department:</strong> {selectedSoftwareItem.department || 'Not specified'}</p>
                </div>
              )}

              <div>
                <Label htmlFor="license_type">License Type</Label>
                <Select value={formData.license_type} onValueChange={(value) => setFormData({ ...formData, license_type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select license type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Individual">Individual</SelectItem>
                    <SelectItem value="Corporate">Corporate</SelectItem>
                    <SelectItem value="Site License">Site License</SelectItem>
                    <SelectItem value="Subscription">Subscription</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="access_level">Access Level</Label>
                <Select value={formData.access_level} onValueChange={(value) => setFormData({ ...formData, access_level: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select access level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Basic">Basic</SelectItem>
                    <SelectItem value="User">User</SelectItem>
                    <SelectItem value="Premium">Premium</SelectItem>
                    <SelectItem value="Full Access">Full Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!formData.user_id || !formData.software_inventory_id || !formData.license_type || !formData.access_level}>
                  Assign Software
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="text-center py-8 text-muted-foreground">
        <MonitorSmartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Software assignments from inventory</p>
        <p className="text-sm">
          {availableSoftware.length} software items available for assignment
        </p>
      </div>
    </div>
  );
};

export default SoftwareManagement;
