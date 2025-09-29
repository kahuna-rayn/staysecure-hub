import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { Profile } from '@/hooks/useProfile';

interface AccountDetailsProps {
  profile: Profile & {
    account?: { username?: string; employeeId?: string };
    email: string;
    phone?: string;
    department?: string;
    role?: string;
    startDate: string;
  };
}

const AccountDetails: React.FC<AccountDetailsProps> = ({ profile }) => {
  const { profiles, updateProfile } = useUserProfiles();
  const [manager, setManager] = React.useState(profile.manager);
  const managerProfile = profiles.find(u => u.id === profile.manager);
  const managerName = managerProfile ? (managerProfile.full_name || managerProfile.username) : 'Not assigned';

  const handleReportsToChange = async (value: string) => {
    setManager(value);
    await updateProfile(profile.id, { manager: value });
    // Optionally, trigger a profile refresh if needed
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Username</label>
              <p className="text-sm">{profile.account?.username || 'Not set'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Employee ID</label>
              <p className="text-sm">{profile.account?.employeeId || 'Not assigned'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-sm">{profile.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Phone</label>
              <p className="text-sm">{profile.phone}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Department</label>
              <p className="text-sm">{profile.department}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Role</label>
              <p className="text-sm">{profile.role}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Reports To</label>
              <p className="text-sm">{managerName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Start Date</label>
              <p className="text-sm">{new Date(profile.startDate).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default AccountDetails;
