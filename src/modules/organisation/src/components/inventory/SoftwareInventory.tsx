
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import SoftwareInventoryList from './SoftwareInventoryList';
import AddSoftwareDialog from './AddSoftwareDialog';

const SoftwareInventory: React.FC = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Software Inventory</h3>
          <p className="text-sm text-muted-foreground">Manage your organization's software assets</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <SoftwareInventoryList />
      
      <AddSoftwareDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </div>
  );
};

export default SoftwareInventory;
