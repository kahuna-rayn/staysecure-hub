
import React, { useState } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AddHardwareDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddHardwareDialog: React.FC<AddHardwareDialogProps> = ({
  isOpen,
  onOpenChange,
}) => {
  const { addHardwareItem, loading } = useInventory();
  const { profiles } = useUserProfiles();
  const [formData, setFormData] = useState({
    device_name: '',
    asset_type: '',
    manufacturer: '',
    model: '',
    serial_number: '',
    os_edition: '',
    os_version: '',
    asset_owner: '',
    asset_location: '',
    asset_classification: '',
    status: 'Available',
    end_of_support_date: '',
  });

  const resetForm = () => {
    setFormData({
      device_name: '',
      asset_type: '',
      manufacturer: '',
      model: '',
      serial_number: '',
      os_edition: '',
      os_version: '',
      asset_owner: '',
      asset_location: '',
      asset_classification: '',
      status: 'Available',
      end_of_support_date: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const itemData = {
        device_name: formData.device_name,
        asset_type: formData.asset_type,
        manufacturer: formData.manufacturer || null,
        model: formData.model || null,
        serial_number: formData.serial_number,
        asset_owner: formData.asset_owner || "Unassigned",
        asset_location: formData.asset_location || null,
        asset_classification: formData.asset_classification || null,
        os_edition: formData.os_edition || null,
        os_version: formData.os_version || null,
        approval_status: "Not submitted",
        status: "Active"
      };

      const { error } = await supabase
        .from('hardware_inventory')
        .insert([itemData]);

      if (error) throw error;

      toast({
        title: "Hardware added",
        description: "New hardware has been added to the inventory.",
      });

      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Hardware Item</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="device_name">Device Name *</Label>
              <Input
                id="device_name"
                value={formData.device_name}
                onChange={(e) => setFormData({ ...formData, device_name: e.target.value })}
                placeholder="e.g., John's Laptop"
                required
              />
            </div>
            <div>
              <Label htmlFor="asset_type">Asset Type *</Label>
              <Select value={formData.asset_type} onValueChange={(value) => setFormData({ ...formData, asset_type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select asset type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Laptop">Laptop</SelectItem>
                  <SelectItem value="Desktop">Desktop</SelectItem>
                  <SelectItem value="Monitor">Monitor</SelectItem>
                  <SelectItem value="Phone">Phone</SelectItem>
                  <SelectItem value="Tablet">Tablet</SelectItem>
                  <SelectItem value="Server">Server</SelectItem>
                  <SelectItem value="Printer">Printer</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                placeholder="e.g., Dell, Apple, HP"
              />
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="e.g., XPS 13, MacBook Pro"
              />
            </div>
            <div>
              <Label htmlFor="serial_number">Serial Number *</Label>
              <Input
                id="serial_number"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                placeholder="Hardware serial number"
                required
              />
            </div>
            <div>
              <Label htmlFor="os_edition">OS Edition</Label>
              <Input
                id="os_edition"
                value={formData.os_edition}
                onChange={(e) => setFormData({ ...formData, os_edition: e.target.value })}
                placeholder="e.g., Windows 11 Pro, macOS"
              />
            </div>
            <div>
              <Label htmlFor="os_version">OS Version</Label>
              <Input
                id="os_version"
                value={formData.os_version}
                onChange={(e) => setFormData({ ...formData, os_version: e.target.value })}
                placeholder="e.g., 22H2, 13.1"
              />
            </div>
            <div>
              <Label htmlFor="asset_owner">Assigned User (Optional)</Label>
              <Select value={formData.asset_owner} onValueChange={(value) => setFormData({ ...formData, asset_owner: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.full_name || profile.username || 'No name'}>
                      {profile.full_name || profile.username || 'No name'} ({profile.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="asset_location">Location</Label>
              <Input
                id="asset_location"
                value={formData.asset_location}
                onChange={(e) => setFormData({ ...formData, asset_location: e.target.value })}
                placeholder="e.g., Office, Remote, Storage"
              />
            </div>
            <div>
              <Label htmlFor="asset_classification">Classification</Label>
              <Select value={formData.asset_classification} onValueChange={(value) => setFormData({ ...formData, asset_classification: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select classification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Public">Public</SelectItem>
                  <SelectItem value="Internal">Internal</SelectItem>
                  <SelectItem value="Confidential">Confidential</SelectItem>
                  <SelectItem value="Restricted">Restricted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Assigned">Assigned</SelectItem>
                  <SelectItem value="In Use">In Use</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="end_of_support_date">End of Support Date</Label>
              <Input
                id="end_of_support_date"
                type="date"
                value={formData.end_of_support_date}
                onChange={(e) => setFormData({ ...formData, end_of_support_date: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Hardware"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddHardwareDialog;
