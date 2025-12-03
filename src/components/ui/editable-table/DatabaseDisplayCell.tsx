import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DatabaseDisplayCellProps {
  table: string;
  value: string | null;
  valueField: string;
  displayField: string;
}

export function DatabaseDisplayCell({ table, value, valueField, displayField }: DatabaseDisplayCellProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['db-display', table, value],
    queryFn: async () => {
      if (!value) return null;
      const { data, error } = await (supabase as any)
        .from(table)
        .select(`${valueField}, ${displayField}`)
        .eq(valueField, value)
        .maybeSingle();
      if (error) throw error;
      return data as Record<string, any> | null;
    },
  });

  if (!value) return <span className="text-sm text-muted-foreground">—</span>;
  if (isLoading) return <span className="text-sm text-muted-foreground">Loading...</span>;

  return <span className="text-sm">{data?.[displayField] || value}</span>;
}
