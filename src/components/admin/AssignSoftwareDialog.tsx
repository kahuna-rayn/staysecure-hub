
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useInventory } from '@/hooks/useInventory';
import { useUserAssets } from '@/hooks/useUserAssets';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AssignSoftwareDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess?: () => void;
}

const AssignSoftwareDialog: React.FC<AssignSoftwareDialogProps> = ({
  isOpen,
  onOpenChange,
  userId,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedSoftwareId, setSelectedSoftwareId] = useState('');
  const [roleAccountType, setRoleAccountType] = useState('');
  
  const { softwareInventory } = useInventory();
  const { addSoftware } = useUserAssets();

  // Get active software items
  const availableSoftware = softwareInventory.filter(item => 
    item.status === 'Active'
  );

  const selectedSoftwareItem = softwareInventory.find(item => item.id === selectedSoftwareId);

  // Query to get user profile by user ID with better error handling
  const { data: userProfile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['user-profile-by-id', userId],
    queryFn: async () => {
      console.log('Querying profile for userId:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .eq('id', userId)
        .single();
      
      console.log('Profile query result:', { data, error });
      
      if (error) {
        console.error('Error fetching user profile:', error);
        throw error;
      }
      return data;
    },
    enabled: !!userId && isOpen,
  });

  console.log('AssignSoftwareDialog - userId:', userId);
  console.log('AssignSoftwareDialog - userProfile:', userProfile);
  console.log('AssignSoftwareDialog - profileLoading:', profileLoading);
  console.log('AssignSoftwareDialog - profileError:', profileError);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submission - selectedSoftwareId:', selectedSoftwareId);
    console.log('Form submission - roleAccountType:', roleAccountType);
    console.log('Form submission - selectedSoftwareItem:', selectedSoftwareItem);
    console.log('Form submission - userProfile:', userProfile);
    console.log('Form submission - userId from props:', userId);
    
    if (!selectedSoftwareId || !roleAccountType) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedSoftwareItem) {
      toast({
        title: "Error",
        description: "Selected software item not found.",
        variant: "destructive",
      });
      return;
    }

    if (!userProfile?.id) {
      toast({
        title: "Error",
        description: `User profile not found or missing ID. UserId: ${userId}, Profile: ${JSON.stringify(userProfile)}`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const softwareData = {
        user_id: userProfile.id,
        full_name: userProfile.full_name,
        username_email: userProfile.username || '',
        software: selectedSoftwareItem.software_name,
        role_account_type: roleAccountType,
        status: 'Active',
      };
      
      console.log('Submitting software data:', softwareData);
      
      await addSoftware(softwareData);
      
      toast({
        title: "Software assigned",
        description: "Software license has been successfully assigned to the user.",
      });
      
      onOpenChange(false);
      setSelectedSoftwareId('');
      setRoleAccountType('');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error assigning software:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading user profile...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (profileError) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error Loading User Profile</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p className="text-red-600">
              Failed to load user profile: {profileError.message}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              User ID: {userId}
            </p>
            <Button onClick={() => onOpenChange(false)} className="mt-4">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Assign Software License to {userProfile?.full_name || 'User'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="software">Select Software</Label>
            <Select 
              value={selectedSoftwareId} 
              onValueChange={setSelectedSoftwareId}
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
            <Label htmlFor="role_account_type">Access Level</Label>
            <Select value={roleAccountType} onValueChange={setRoleAccountType}>
              <SelectTrigger>
                <SelectValue placeholder="Select access level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="User">User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedSoftwareId || !roleAccountType}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign Software"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignSoftwareDialog;
