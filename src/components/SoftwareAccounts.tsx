
import React from "react";
import { Calendar, Shield, Clock, Trash2 } from "lucide-react";
import { useSoftwareEdit } from "@/hooks/useSoftwareEdit";
import { useUserAssets } from "@/hooks/useUserAssets";
import EditableField from "./EditableField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Profile } from '@/hooks/useProfile';

interface SoftwareItem {
  id: string;
  name: string;
  role_account_type: string;
  expiryDate: string | null;
  lastUsed: string | null;
}

interface SoftwareAccountsProps {
  profile: Profile & {
    software: SoftwareItem[];
  };
}

const SoftwareAccounts: React.FC<SoftwareAccountsProps> = ({ profile }) => {
  const { software: propSoftware } = profile;
  const { software: hookSoftware, deleteSoftware } = useUserAssets(profile.id);
  
  // Use the fresh data from the hook instead of potentially stale prop data
  const software = hookSoftware || propSoftware;
  
  console.log('SoftwareAccounts - profile.software (prop):', propSoftware);
  console.log('SoftwareAccounts - useUserAssets software (hook):', hookSoftware);
  console.log('SoftwareAccounts - using software:', software);
  console.log('SoftwareAccounts - first software item:', software[0]);

  const {
    editingField,
    editValue,
    setEditValue,
    startEdit,
    cancelEdit,
    saveEdit,
  } = useSoftwareEdit(profile.id, software);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No expiry";
    return new Date(dateString).toLocaleDateString();
  };

  const getLastUsedDisplay = (lastUsed: string | null) => {
    if (!lastUsed) return "Never used";
    
    const lastUsedDate = new Date(lastUsed);
    const today = new Date();
    
    if (lastUsedDate.toDateString() === today.toDateString()) {
      return "Today";
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (lastUsedDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    
    return lastUsedDate.toLocaleDateString();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const handleSelectChange = (value: string) => {
    setEditValue(value);
    setTimeout(() => saveEdit(), 100);
  };

  const handleDeleteSoftware = async (softwareId: string, softwareName: string) => {
    console.log('handleDeleteSoftware called with:', { softwareId, softwareName });
    console.log('softwareId type:', typeof softwareId, 'value:', softwareId);
    
    try {
      await deleteSoftware(softwareId);
      toast({
        title: "Software Removed",
        description: `${softwareName} has been revoked and removed from your account.`,
      });
    } catch (error: any) {
      console.error('handleDeleteSoftware error:', error);
      toast({
        title: "Error",
        description: `Failed to remove ${softwareName}: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const renderEditableField = (item: any, itemIndex: number, field: string, displayValue: string, type: 'text' | 'select' | 'date' = 'text', options?: string[]) => {
    const isEditing = editingField?.itemIndex === itemIndex && editingField?.field === field;
    
    return (
      <EditableField
        isEditing={isEditing}
        value={editValue}
        displayValue={displayValue}
        type={type}
        options={options}
        onStartEdit={() => startEdit(itemIndex, field, item[field])}
        onValueChange={setEditValue}
        onBlur={saveEdit}
        onKeyDown={handleKeyDown}
        onSelectChange={handleSelectChange}
      />
    );
  };

  const renderRoleBadge = (item: any, itemIndex: number) => {
    const isEditing = editingField?.itemIndex === itemIndex && editingField?.field === 'role_account_type';
    
    if (isEditing) {
      return (
        <EditableField
          isEditing={isEditing}
          value={editValue}
          displayValue={item.role_account_type}
          type="select"
          options={['Admin', 'User']}
          onStartEdit={() => startEdit(itemIndex, 'role_account_type', item.role_account_type)}
          onValueChange={setEditValue}
          onBlur={saveEdit}
          onKeyDown={handleKeyDown}
          onSelectChange={handleSelectChange}
        />
      );
    }

    // Debug: Log the role value
    console.log('Role badge - item:', item, 'role_account_type:', item.role_account_type);
    console.log('Role badge - typeof role_account_type:', typeof item.role_account_type);
    console.log('Role badge - role_account_type === null:', item.role_account_type === null);
    console.log('Role badge - role_account_type === undefined:', item.role_account_type === undefined);

    // Render colored badge
    const role = item.role_account_type || 'Unknown';
    let badgeClassName = 'cursor-pointer ';
    
    if (role === 'Admin') {
      badgeClassName += 'bg-red-600 text-white hover:bg-red-700';
    } else if (role === 'User') {
      badgeClassName += 'bg-blue-600 text-white hover:bg-blue-700';
    } else {
      badgeClassName += 'bg-gray-600 text-white hover:bg-gray-700';
    }

    return (
      <Badge 
        className={badgeClassName}
        onClick={() => startEdit(itemIndex, 'role_account_type', item.role_account_type)}
      >
        {role}
      </Badge>
    );
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {software.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No software accounts assigned</p>
      ) : (
        <div className="divide-y">
          {software.map((item, index) => (
            <div key={index} className="py-4 first:pt-0 last:pb-0">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">{item.name}</h3>
                <div className="flex items-center gap-2">
                  {renderRoleBadge(item, index)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSoftware(item.id, item.name)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Role:</span>
                  {renderEditableField(
                    item, 
                    index, 
                    'role_account_type', 
                    item.role_account_type, 
                    'select', 
                    ['Admin', 'User']
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Expires:</span>
                  {renderEditableField(
                    item, 
                    index, 
                    'expiryDate', 
                    formatDate(item.expiryDate), 
                    'date'
                  )}
                </div>
                
                <div className="flex items-center gap-2 md:col-span-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Last Used:</span>
                  {renderEditableField(
                    item, 
                    index, 
                    'lastUsed', 
                    getLastUsedDisplay(item.lastUsed), 
                    'date'
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SoftwareAccounts;
