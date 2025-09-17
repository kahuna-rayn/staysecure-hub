
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Monitor, Package, Users, MapPin } from 'lucide-react';
import HardwareInventory from './HardwareInventory';
import SoftwareInventory from './SoftwareInventory';
import AccountInventory from './AccountInventory';
import PhysicalLocationAccess from './PhysicalLocationAccess';

const InventoryManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Inventory Management</h2>
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="hardware" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="hardware" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Hardware
              </TabsTrigger>
              <TabsTrigger value="software" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Software
              </TabsTrigger>
              <TabsTrigger value="accounts" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Accounts
              </TabsTrigger>
              <TabsTrigger value="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Physical Location
              </TabsTrigger>
            </TabsList>

            <TabsContent value="hardware" className="space-y-4">
              <HardwareInventory />
            </TabsContent>

            <TabsContent value="software" className="space-y-4">
              <SoftwareInventory />
            </TabsContent>

            <TabsContent value="accounts" className="space-y-4">
              <AccountInventory />
            </TabsContent>

            <TabsContent value="location" className="space-y-4">
              <PhysicalLocationAccess />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryManagement;
