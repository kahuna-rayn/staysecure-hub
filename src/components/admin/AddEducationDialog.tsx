
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserAssets } from '@/hooks/useUserAssets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AddEducationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess?: () => void;
}

const AddEducationDialog: React.FC<AddEducationDialogProps> = ({
  isOpen,
  onOpenChange,
  userId,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Certificate',
    name: '',
    issued_by: '',
    date_acquired: '',
    expiry_date: '',
    credential_id: '',
    status: 'Valid',
  });

  const { addCertificate } = useUserAssets();

  // Fix: Look up user profile by ID, only select id since email doesn't exist
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => {
    setFormData({
      type: 'Certificate',
      name: '',
      issued_by: '',
      date_acquired: '',
      expiry_date: '',
      credential_id: '',
      status: 'Valid',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userProfile) {
      toast({
        title: "Error",
        description: "User profile not found.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const certificateData = {
        user_id: userProfile.id,
        type: formData.type,
        name: formData.name,
        issued_by: formData.issued_by,
        date_acquired: formData.date_acquired,
        expiry_date: formData.expiry_date || null,
        credential_id: formData.credential_id || null,
        status: formData.status,
      };
      
      await addCertificate(certificateData);
      
      toast({
        title: "Education record added",
        description: "Education record has been successfully added.",
      });
      
      onOpenChange(false);
      resetForm();
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
          <DialogTitle>Add Education Record</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="type">Type *</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Certificate">Certificate</SelectItem>
                <SelectItem value="Document">Document</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Cybersecurity Certificate, PDPC e-Learning, ISP, IRP"
              required
            />
          </div>

          <div>
            <Label htmlFor="issued_by">Issued By *</Label>
            <Input
              id="issued_by"
              value={formData.issued_by}
              onChange={(e) => setFormData({ ...formData, issued_by: e.target.value })}
              placeholder="e.g., RAYN, PDPC,"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date_acquired">Date Acquired *</Label>
              <Input
                id="date_acquired"
                type="date"
                value={formData.date_acquired}
                onChange={(e) => setFormData({ ...formData, date_acquired: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="expiry_date">Expiry Date</Label>
              <Input
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="credential_id">Credential ID</Label>
            <Input
              id="credential_id"
              value={formData.credential_id}
              onChange={(e) => setFormData({ ...formData, credential_id: e.target.value })}
              placeholder="Certificate or credential identifier"
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Valid">Valid</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Revoked">Revoked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.name || !formData.issued_by || !formData.date_acquired}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Education Record"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEducationDialog;
