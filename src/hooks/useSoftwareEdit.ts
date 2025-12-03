
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';

interface EditingState {
  itemIndex: number;
  field: string;
}

export const useSoftwareEdit = (profileId: string, software: any[]) => {
  const [editingField, setEditingField] = useState<EditingState | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().split('T')[0];
  };

  const startEdit = (itemIndex: number, field: string, currentValue: any) => {
    setEditingField({ itemIndex, field });
    
    if (field === 'expiryDate' || field === 'lastUsed') {
      setEditValue(formatDateForInput(currentValue));
    } else {
      setEditValue(currentValue || '');
    }
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const saveEdit = async () => {
    if (!editingField) return;
    
    const { itemIndex, field } = editingField;
    const item = software[itemIndex];
    
    try {
      console.log('Saving software field edit:', { field, value: editValue, item });

      const { supabase } = await import('@/integrations/supabase/client');
      const queryResult = await (supabase as any)
        .from('account_inventory')
        .select('*')
        .eq('user_id', profileId)
        .eq('software', item.name);
      
      const { data: existingSoftware, error: fetchError } = queryResult;

      if (fetchError) throw fetchError;

      const existingItem = existingSoftware?.[0];
      if (!existingItem) {
        toast({
          title: "Error",
          description: "Software not found in database",
          variant: "destructive",
        });
        return;
      }

      const updateData = getUpdateData(field, editValue);
      if (!updateData) return;

      const { error: updateError } = await supabase
        .from('account_inventory')
        .update(updateData)
        .eq('id', existingItem.id);

      if (updateError) throw updateError;

      toast({
        title: "Software updated",
        description: `${field} has been successfully updated`,
      });

      setTimeout(() => {
        window.location.reload();
      }, 1000);

      cancelEdit();
    } catch (error: any) {
      console.error('Error updating software field:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getUpdateData = (field: string, value: string) => {
    switch (field) {
      case 'role_account_type':
        return { role_account_type: value };
      case 'expiryDate':
        return { date_access_revoked: value || null };
      case 'lastUsed':
        return { date_access_created: value || null };
      default:
        console.error('Unknown field:', field);
        return null;
    }
  };

  return {
    editingField,
    editValue,
    setEditValue,
    startEdit,
    cancelEdit,
    saveEdit,
  };
};
