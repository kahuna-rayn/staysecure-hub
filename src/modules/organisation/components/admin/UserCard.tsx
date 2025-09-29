
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit, Trash2, Phone, MapPin, IdCard, Mail, Eye, Settings } from 'lucide-react';
import EditableField from '@/modules/organisation/components/profile/EditableField';
import { toast } from '@/components/ui/use-toast';
import { DepartmentRolePairsDisplay } from '@/components/admin/DepartmentRolePairsDisplay';
import type { UserProfile } from '@/hooks/useUserProfiles';

interface UserCardProps {
  user: UserProfile;
  onEdit: (user: UserProfile) => void;
  onDelete: (userId: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const initials = user.full_name 
    ? user.full_name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2)
    : user.username?.slice(0, 2) || 'U';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-500';
      case 'Inactive': return 'bg-red-500';
      case 'OnLeave': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  // Fetch physical location access for this user
  const { data: locationAccess = [] } = useQuery({
    queryKey: ['user-location-access', user.email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('physical_location_access')
        .select('access_purpose, status')
        .eq('user_id', user.id)
        .eq('status', 'Active');
      
      if (error) throw error;
      return data;
    },
  });

  const handleFieldSave = async (fieldKey: string, value: string) => {
    setSaving(true);
    try {
      if (fieldKey === 'email') {
        toast({
          title: "Email Update Limitation",
          description: "Email addresses are managed by authentication and cannot be updated directly from this interface.",
          variant: "destructive",
        });
        return;
      }
      
      const updatedUser = { ...user, [fieldKey]: value };
      onEdit(updatedUser);
      
      toast({
        title: "Field updated",
        description: `${fieldKey} has been updated successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      setEditingField(null);
    }
  };

  const handleViewDetails = () => {
    navigate(`/admin/users/${user.id}`);
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleViewDetails}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">{user.full_name || 'No name'}</h3>
              <div className="text-sm text-muted-foreground">
                <DepartmentRolePairsDisplay userId={user.id} />
              </div>
            </div>
          </div>
          <Badge className={`${getStatusColor(user.status || 'Active')} text-white`}>
            {user.status || 'Active'}
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Mail className="h-3 w-3 text-muted-foreground" />
            <EditableField
              value={user.email || 'No email'}
              fieldKey="email"
              placeholder="Enter email"
              className="flex-1"
              inputClassName="text-sm"
              onSave={handleFieldSave}
              isEditing={editingField === 'email'}
              onEdit={setEditingField}
              onCancel={() => setEditingField(null)}
              saving={saving}
            />
          </div>
          <div className="flex items-center gap-2">
            <IdCard className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">ID: {user.employee_id || 'Not set'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">{user.phone || 'No phone'}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">{user.location || 'No location'}</span>
          </div>
          
          {/* Physical Location Access Section */}
          {locationAccess.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Physical Access:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {locationAccess.slice(0, 3).map((access, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {access.access_purpose || 'Unknown Purpose'}
                  </Badge>
                ))}
                {locationAccess.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{locationAccess.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" onClick={handleViewDetails}>
            <Eye className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate(`/admin/users/${user.id}`)}>
            <Settings className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => onEdit(user)}>
            <Edit className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDelete(user.id)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserCard;
