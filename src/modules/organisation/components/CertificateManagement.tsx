
import React, { useState } from 'react';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { useUserAssets } from '@/hooks/useUserAssets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Award } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CreateCertificateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isOrganisationCertificate?: boolean;
  onSuccess?: () => void;
}

export const CreateCertificateDialog: React.FC<CreateCertificateDialogProps> = ({
  isOpen,
  onOpenChange,
  isOrganisationCertificate = false,
  onSuccess
}) => {
  const { profiles } = useUserProfiles();
  const [formData, setFormData] = useState({
    user_id: '',
    name: '',
    issued_by: '',
    date_acquired: new Date().toISOString().split('T')[0],
    expiry_date: '',
    credential_id: '',
    status: 'Valid',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Get current user for organisation certificates
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const certificateData = {
        ...formData,
        user_id: isOrganisationCertificate ? user.id : formData.user_id, // Use current user for org certs
        date_acquired: new Date(formData.date_acquired).toISOString(),
        expiry_date: formData.expiry_date ? new Date(formData.expiry_date).toISOString() : null,
        credential_id: formData.credential_id || null,
        org_cert: isOrganisationCertificate, // Set org_cert flag
      };
      
      const { error } = await supabase
        .from('certificates')
        .insert([certificateData]);
      
      if (error) throw error;

      toast({
        title: "Certificate added",
        description: isOrganisationCertificate 
          ? "Organisation certificate has been successfully added."
          : "Certificate has been successfully added to the user's profile.",
      });
      
      onOpenChange(false);
      setFormData({
        user_id: '',
        name: '',
        issued_by: '',
        date_acquired: new Date().toISOString().split('T')[0],
        expiry_date: '',
        credential_id: '',
        status: 'Valid',
      });
      
      onSuccess?.();
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isOrganisationCertificate ? 'Add Organisation Certificate' : 'Add Certificate to User'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isOrganisationCertificate && (
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
          )}

          <div>
            <Label htmlFor="name">Certificate Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., AWS Certified Developer, PMP"
              required
            />
          </div>

          <div>
            <Label htmlFor="issued_by">Issued By</Label>
            <Input
              id="issued_by"
              value={formData.issued_by}
              onChange={(e) => setFormData({ ...formData, issued_by: e.target.value })}
              placeholder="e.g., Amazon Web Services, PMI"
              required
            />
          </div>

          <div>
            <Label htmlFor="date_acquired">Date Acquired</Label>
            <Input
              id="date_acquired"
              type="date"
              value={formData.date_acquired}
              onChange={(e) => setFormData({ ...formData, date_acquired: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="expiry_date">Expiry Date (Optional)</Label>
            <Input
              id="expiry_date"
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="credential_id">Credential ID (Optional)</Label>
            <Input
              id="credential_id"
              value={formData.credential_id}
              onChange={(e) => setFormData({ ...formData, credential_id: e.target.value })}
              placeholder="Certificate credential ID"
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
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Add Certificate
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const CertificateManagement: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">User Certificates</h3>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add Certificate
        </Button>
      </div>

      <CreateCertificateDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        isOrganisationCertificate={false}
      />

      <div className="text-center py-8 text-muted-foreground">
        <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Certificate management interface coming soon...</p>
        <p className="text-sm">Use the "Add Certificate" button to add new certificates.</p>
      </div>
    </div>
  );
};

export default CertificateManagement;
