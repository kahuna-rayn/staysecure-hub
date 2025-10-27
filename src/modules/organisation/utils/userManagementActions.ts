import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import type { UserProfile } from '@/hooks/useUserProfiles';

// Define NewUser type locally since it's not exported from useUserManagement
interface NewUser {
  full_name: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  email: string;
  phone?: string;
  location?: string;
  location_id?: string;
  status?: string;
  access_level?: string;
  bio?: string;
  employee_id?: string;
  role?: string;
  department?: string;
}

export const handleSaveUser = async (
  editingUser: any, // Use any to work around type conflicts
  updateProfile: (id: string, updates: Partial<UserProfile>) => Promise<void>,
  onSuccess: () => void
) => {
  try {
    await updateProfile(editingUser.id, editingUser);
    toast({
      title: "Success",
      description: "User updated successfully",
    });
    onSuccess();
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message,
      variant: "destructive",
    });
  }
};

export const handleCreateUser = async (
  newUser: NewUser,
  updateProfile: (id: string, updates: Partial<UserProfile>) => Promise<void>,
  onSuccess: () => void
) => {
  try {
    // Create user via Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: newUser
    });

    if (error) {
      throw new Error(error.message || 'Failed to create user');
    }

    // Check if the function returned an error (since Edge Functions return 200 even for errors)
    if (data?.error) {
      console.error('Edge Function returned error:', data.error);
      console.error('Full Edge Function response:', data);
      throw new Error(data.error);
    }

    if (!data || !data.user) {
      throw new Error('No user data returned from create-user function');
    }

    const { user } = data;

    // Update profile with additional data (except status - let Edge Function handle it)
    if (user?.id) {
      await updateProfile(user.id, {
        full_name: newUser.full_name,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        username: newUser.email, // Store email as username
        phone: newUser.phone,
        location: newUser.location,
        location_id: newUser.location_id,
        // Don't update status - Edge Function sets it to 'Pending' for activation
        bio: newUser.bio,
        employee_id: newUser.employee_id,
      });

            // Assign physical location access if location is selected
      if (newUser.location_id) {
        try {
          const locationData = {
            user_id: user.id,
            location_id: newUser.location_id,
            full_name: newUser.full_name,
            access_purpose: 'General Access',
            status: 'Active',
            date_access_created: new Date().toISOString()
          };

          const { data: locationDataResult, error: locationError } = await supabase
            .from('physical_location_access')
            .insert(locationData)
            .select();

          if (locationError) {
            console.error('❌ Error assigning physical location access:', locationError);
          }
        } catch (locationError) {
          console.error('❌ Exception assigning physical location access:', locationError);
        }
      }
    }

    toast({
      title: "Success",
      description: "User created successfully",
    });
    
    onSuccess();
  } catch (error: any) {
    console.error('Error creating user:', error);
    toast({
      title: "Error",
      description: error.message || "Failed to create user",
      variant: "destructive",
    });
  }
};

export const handleDeleteUser = async (userId: string, userName: string, reason?: string): Promise<{ success: boolean; deletedUser?: any; error?: string }> => {
  try {
    // Call the delete-user Edge Function
    const { data, error } = await supabase.functions.invoke('delete-user', {
      body: {
        userId,
        reason: reason || undefined
      }
    });

    if (error) {
      console.error('Error calling delete function:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
      return { success: false, error: "Failed to delete user" };
    }

    if (!data.success) {
      console.error('Delete function returned error:', data.error);
      toast({
        title: "Error",
        description: data.error || "Failed to delete user",
        variant: "destructive",
      });
      return { success: false, error: data.error || "Failed to delete user" };
    }

    return { success: true, deletedUser: data.deletedUser };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    toast({
      title: "Error",
      description: "Failed to delete user",
      variant: "destructive",
    });
    return { success: false, error: "Failed to delete user" };
  }
};