import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Star } from 'lucide-react';
import { toast } from 'sonner';

interface Profile {
  id: string;
  full_name: string;
}

interface Department {
  id: string;
  name: string;
}

interface Role {
  role_id: string;
  name: string;
}

interface BreachTeamMember {
  id: string;
  user_id: string;
  role_id?: string;
  department_id?: string;
  is_primary: boolean;
  profile?: { full_name: string };
  role?: { name: string };
  department?: { name: string };
}

interface MultiMemberSelectCellProps {
  breachTeamId: string;
  onUpdate: () => void;
}

export function MultiMemberSelectCell({ breachTeamId, onUpdate }: MultiMemberSelectCellProps) {
  const [members, setMembers] = useState<BreachTeamMember[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  
  // Form state for adding new member
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  
  // DBIM Team department ID (hardcoded as per requirements)
  const DBIM_TEAM_DEPT_ID = '963abe4e-0345-41d1-bbc1-b42585c70211';

  useEffect(() => {
    fetchData();
  }, [breachTeamId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch current members without joins (since no FK relationship exists)
      const { data: membersData, error: membersError } = await supabase
        .from('breach_team_members')
        .select('*')
        .eq('breach_team_id', breachTeamId);

      if (membersError) throw membersError;

      // Get profiles for the members and enrich the data
      let enrichedMembers = [];
      if (membersData && membersData.length > 0) {
        const userIds = membersData.map(m => m.user_id);
        const { data: memberProfiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        enrichedMembers = membersData.map(member => ({
          ...member,
          profile: memberProfiles?.find(p => p.id === member.user_id)
        }));
      }
      
      setMembers(enrichedMembers);

      // Fetch all profiles for selection
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('status', 'Active')
        .order('full_name');

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      // Fetch roles only for DBIM Team department
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('role_id, name')
        .eq('department_id', DBIM_TEAM_DEPT_ID)
        .eq('is_active', true)
        .order('name');

      if (rolesError) throw rolesError;
      setRoles(rolesData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };


  const handleAddMember = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }

    try {
      // Get the breach team role name to determine the appropriate role
      const { data: breachTeamData } = await supabase
        .from('breach_management_team')
        .select('team_role')
        .eq('id', breachTeamId)
        .single();

      // Role mapping for breach team positions to actual role IDs in the database
      const roleMapping: Record<string, string> = {
        'Team Chair': '3f409f16-3815-4ca1-bf8f-2db210ccb386',
        'Deputy Team Chair': 'f8d336e5-744e-4dbe-aa9d-5e52bacf89e1',
        'Data Protection Officer': '895b3c68-536a-45fd-9e3a-004ec11d27d9',
        'Legal': '0f47494f-57dc-4562-84aa-cfe814cc0de7',
        'IT': '3dcf13ce-915d-4a1d-8771-edb96884e3c9',
        'HR': '30498b80-ed26-46cd-90e9-40bccae64585',
        'Communications': 'fde5adb1-6935-41fa-9b6a-e1092fd6ad97',
        'Incident Manager ': '01814e4a-9894-49d5-919e-b9f4ca177656', // Note: has trailing space
        'Insurance Rep': 'a5a3268f-e362-4411-8c1e-fbf4416e992f'
      };

      const assignedRoleId = roleMapping[breachTeamData?.team_role] || null;

      const { error } = await supabase
        .from('breach_team_members')
        .insert({
          breach_team_id: breachTeamId,
          user_id: selectedUserId,
          role_id: assignedRoleId,
          department_id: DBIM_TEAM_DEPT_ID, // Always DBIM Team
          is_primary: false,
          assigned_by: (await supabase.auth.getUser()).data.user?.id,
          is_system: true // Mark as system-managed
        });

      if (error) throw error;

      toast.success('DBIM Team member added successfully');
      setSelectedUserId('');
      setOpen(false);
      fetchData();
      onUpdate();
    } catch (error: any) {
      console.error('Error adding member:', error);
      toast.error(error.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('breach_team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Member removed successfully');
      fetchData();
      onUpdate();
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast.error(error.message || 'Failed to remove member');
    }
  };

  const handleSetPrimary = async (memberId: string) => {
    try {
      // First, unset all primary flags for this breach team
      await supabase
        .from('breach_team_members')
        .update({ is_primary: false })
        .eq('breach_team_id', breachTeamId);

      // Then set the selected member as primary
      const { error } = await supabase
        .from('breach_team_members')
        .update({ is_primary: true })
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Primary member updated');
      fetchData();
      onUpdate();
    } catch (error: any) {
      console.error('Error setting primary member:', error);
      toast.error(error.message || 'Failed to set primary member');
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {members.map((member) => (
          <Badge
            key={member.id}
            variant={member.is_primary ? "default" : "secondary"}
            className="relative group pr-6"
          >
            {member.is_primary && <Star className="w-3 h-3 mr-1" />}
            {member.profile?.full_name || 'Unknown User'}
            <button
              onClick={() => handleRemoveMember(member.id)}
              className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <Plus className="w-3 h-3 mr-1" />
            Add Member
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add DBIM Team Member</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">User *</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {profiles
                    .filter(profile => !members.some(member => member.user_id === profile.id))
                    .map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.full_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                This user will be automatically assigned to the <strong>DBIM Team</strong> department 
                with the appropriate role for this breach management position.
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleAddMember} className="flex-1">
                Add Member
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {members.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {members.length} member{members.length !== 1 ? 's' : ''} assigned
          {members.some(m => m.is_primary) && ' (1 primary)'}
        </div>
      )}
    </div>
  );
}