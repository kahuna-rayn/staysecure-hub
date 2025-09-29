import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AddOrganisationCertificateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AddOrganisationCertificateDialog: React.FC<AddOrganisationCertificateDialogProps> = ({
  isOpen,
  onOpenChange,
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
    
    setLoading(true);
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const certificateData = {
        user_id: user.id,
        type: formData.type,
        name: formData.name,
        issued_by: formData.issued_by,
        date_acquired: formData.date_acquired,
        expiry_date: formData.expiry_date || null,
        credential_id: formData.credential_id || null,
        status: formData.status,
        org_cert: true, // This is an organisation certificate
      };
      
      const { error } = await supabase
        .from('certificates')
        .insert([certificateData]);
      
      if (error) throw error;
      
      toast({
        title: "Organisation certificate added",
        description: "Certificate has been successfully added to the organisation.",
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
          <DialogTitle>Add Organisation Certificate</DialogTitle>
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
              placeholder="e.g., ISO 27001, SOC 2, GDPR Compliance"
              required
            />
          </div>

          <div>
            <Label htmlFor="issued_by">Issued By *</Label>
            <Input
              id="issued_by"
              value={formData.issued_by}
              onChange={(e) => setFormData({ ...formData, issued_by: e.target.value })}
              placeholder="e.g., BSI, AICPA, TÜV SÜD"
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
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Certificate"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddOrganisationCertificateDialog;