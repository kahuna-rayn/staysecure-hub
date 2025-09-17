
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { HardwareInventoryItem } from '@/hooks/useInventory';
import type { UserProfile } from '@/hooks/useUserProfiles';

interface HardwareEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: HardwareInventoryItem | null;
  profiles: UserProfile[];
  onItemChange: (item: HardwareInventoryItem) => void;
  onSave: () => void;
}

const HardwareEditDialog: React.FC<HardwareEditDialogProps> = ({
  isOpen,
  onOpenChange,
  editingItem,
  profiles,
  onItemChange,
  onSave,
}) => {
  if (!editingItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Hardware Item</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="device_name">Device Name</Label>
            <Input
              id="device_name"
              value={editingItem.device_name || ''}
              onChange={(e) => onItemChange({ ...editingItem, device_name: e.target.value })}
            />
          </div>
          
          <div>
            <Label htmlFor="asset_type">Asset Type</Label>
            <Input
              id="asset_type"
              value={editingItem.asset_type}
              onChange={(e) => onItemChange({ ...editingItem, asset_type: e.target.value })}
            />
          </div>
          
          <div>
            <Label htmlFor="serial_number">Serial Number</Label>
            <Input
              id="serial_number"
              value={editingItem.serial_number}
              onChange={(e) => onItemChange({ ...editingItem, serial_number: e.target.value })}
            />
          </div>
          
          <div>
            <Label htmlFor="asset_owner">Asset Owner</Label>
            <Select 
              value={editingItem.asset_owner || 'no-owner'} 
              onValueChange={(value) => onItemChange({ ...editingItem, asset_owner: value === 'no-owner' ? null : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an owner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-owner">No Owner</SelectItem>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.full_name || profile.username || profile.id}>
                    {profile.full_name || profile.username || 'Unnamed User'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="asset_location">Location</Label>
            <Input
              id="asset_location"
              value={editingItem.asset_location || ''}
              onChange={(e) => onItemChange({ ...editingItem, asset_location: e.target.value })}
            />
          </div>
          
          <div>
            <Label htmlFor="status">Status</Label>
            <Select 
              value={editingItem.status || 'Active'} 
              onValueChange={(value) => onItemChange({ ...editingItem, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="End-of-life">End-of-life</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="col-span-2">
            <Label htmlFor="asset_classification">Asset Classification</Label>
            <Input
              id="asset_classification"
              value={editingItem.asset_classification || ''}
              onChange={(e) => onItemChange({ ...editingItem, asset_classification: e.target.value })}
            />
          </div>
          
          <div className="col-span-2 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HardwareEditDialog;
