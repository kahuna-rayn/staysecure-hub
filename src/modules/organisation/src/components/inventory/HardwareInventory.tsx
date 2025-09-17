
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import HardwareInventoryList from './HardwareInventoryList';
import AddHardwareDialog from './AddHardwareDialog';

const HardwareInventory: React.FC = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Hardware Inventory</h3>
          <p className="text-sm text-muted-foreground">Manage your organization's hardware assets</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <HardwareInventoryList />
      
      <AddHardwareDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </div>
  );
};

export default HardwareInventory;
