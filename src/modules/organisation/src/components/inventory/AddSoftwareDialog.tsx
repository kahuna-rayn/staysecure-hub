
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useInventory } from '@/hooks/useInventory';
import { toast } from '@/components/ui/use-toast';
import type { SoftwareInventoryItem } from '@/hooks/useInventory';

interface AddSoftwareDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddSoftwareDialog: React.FC<AddSoftwareDialogProps> = ({
  isOpen,
  onOpenChange,
}) => {
  const { addSoftwareItem } = useInventory();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    software_name: '',
    software_publisher: '',
    software_version: '',
    business_purpose: '',
    end_of_support_date: '',
    license_start_date: '',
    license_term: '',
    asset_classification: '',
    status: 'Active' as const,
  });

  const resetForm = () => {
    setFormData({
      software_name: '',
      software_publisher: '',
      software_version: '',
      business_purpose: '',
      end_of_support_date: '',
      license_start_date: '',
      license_term: '',
      asset_classification: '',
      status: 'Active',
    });
  };

  const calculateEndOfSupportDate = (startDate: string, termMonths: string) => {
    if (!startDate || !termMonths) return '';
    
    const months = parseInt(termMonths);
    if (isNaN(months)) return '';
    
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);
    end.setDate(end.getDate() - 1); // Subtract 1 day
    
    return end.toISOString().split('T')[0];
  };

  // Auto-calculate end_of_support_date when license_start_date or license_term changes
  useEffect(() => {
    if (formData.license_start_date && formData.license_term) {
      const calculatedEndDate = calculateEndOfSupportDate(formData.license_start_date, formData.license_term);
      setFormData(prev => ({
        ...prev,
        end_of_support_date: calculatedEndDate
      }));
    }
  }, [formData.license_start_date, formData.license_term]);

  const handleSave = async () => {
    if (!formData.software_name) {
      toast({
        title: "Error",
        description: "Please enter a software name.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.end_of_support_date) {
      toast({
        title: "Error",
        description: "Please enter an end of support date.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.license_start_date) {
      toast({
        title: "Error",
        description: "Please enter a license start date.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.license_term) {
      toast({
        title: "Error",
        description: "Please enter a license term.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      await addSoftwareItem(formData);
      
      toast({
        title: "Software added",
        description: "Software item has been successfully added.",
      });
      
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Software Item</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="software_name">Software Name *</Label>
            <Input
              id="software_name"
              value={formData.software_name}
              onChange={(e) => setFormData({ ...formData, software_name: e.target.value })}
              placeholder="Enter software name"
            />
          </div>
          
          <div>
            <Label htmlFor="software_publisher">Publisher</Label>
            <Input
              id="software_publisher"
              value={formData.software_publisher}
              onChange={(e) => setFormData({ ...formData, software_publisher: e.target.value })}
              placeholder="Enter publisher name"
            />
          </div>
          
          <div>
            <Label htmlFor="software_version">Version</Label>
            <Input
              id="software_version"
              value={formData.software_version}
              onChange={(e) => setFormData({ ...formData, software_version: e.target.value })}
              placeholder="Enter version"
            />
          </div>
          <div>
            <Label htmlFor="license_term">License Term *</Label>
                          <Input
                id="license_term"
                value={formData.license_term}
                onChange={(e) => setFormData({ ...formData, license_term: e.target.value })}
                placeholder="e.g., 12 for 1 year, 24 for 2 years"
                required
              />
          </div>

          <div>
            <Label htmlFor="license_start_date">License Start Date *</Label>
            <Input
              id="license_start_date"
              type="date"
              value={formData.license_start_date}
              onChange={(e) => setFormData({ ...formData, license_start_date: e.target.value })}
              required
            />
          </div>

                      <div>
              <Label htmlFor="end_of_support_date">End of Support Date</Label>
              <Input
                id="end_of_support_date"
                type="date"
                value={formData.end_of_support_date}
                onChange={(e) => setFormData({ ...formData, end_of_support_date: e.target.value })}
                required
                readOnly
                className="bg-gray-50"
              />
            </div>
          
          <div>
            <Label htmlFor="business_purpose">Business Purpose</Label>
            <Input
              id="business_purpose"
              value={formData.business_purpose}
              onChange={(e) => setFormData({ ...formData, business_purpose: e.target.value })}
              placeholder="Enter business purpose"
            />
          </div>
          
          <div>
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData({ ...formData, status: value as any })}
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
              value={formData.asset_classification}
              onChange={(e) => setFormData({ ...formData, asset_classification: e.target.value })}
              placeholder="Enter asset classification"
            />
          </div>
          
          <div className="col-span-2 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Software'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddSoftwareDialog;
