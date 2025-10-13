import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PhysicalLocationOption {
  id: string;
  name: string;
  value: string; // For dropdown compatibility
  label: string; // For dropdown compatibility
}

export const useUserPhysicalLocations = (userId: string) => {
  return useQuery({
    queryKey: ['userPhysicalLocations', userId],
    queryFn: async (): Promise<PhysicalLocationOption[]> => {
      if (!userId) return [];

      // Get user's active physical location access
      const { data: accessData, error: accessError } = await supabase
        .from('physical_location_access')
        .select('location_id')
        .eq('user_id', userId)
        .eq('status', 'Active')
        .is('date_access_revoked', null);

      if (accessError) throw accessError;

      if (!accessData || accessData.length === 0) {
        return [];
      }

      // Get location names for the accessible locations
      const locationIds = accessData.map(item => item.location_id).filter(Boolean);
      
      if (locationIds.length === 0) return [];

      const { data: locations, error: locationsError } = await supabase
        .from('locations')
        .select('id, name')
        .in('id', locationIds);

      if (locationsError) throw locationsError;

      // Transform to dropdown format
      return locations?.map(location => ({
        id: location.id,
        name: location.name,
        value: location.name, // Use name as value for the dropdown
        label: location.name  // Use name as label for the dropdown
      })) || [];
    },
    enabled: !!userId,
  });
};