
import React, { useState } from 'react';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { useUserAssets } from '@/hooks/useUserAssets';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Laptop, MonitorSmartphone, Award, Plus } from 'lucide-react';
import HardwareManagement from './HardwareManagement';
import SoftwareManagement from './SoftwareManagement';
import CertificateManagement from './CertificateManagement';

const AssetManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Asset Management</h2>
      </div>

      <Tabs defaultValue="hardware" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hardware" className="flex items-center gap-2">
            <Laptop className="h-4 w-4" />
            Hardware
          </TabsTrigger>
          <TabsTrigger value="software" className="flex items-center gap-2">
            <MonitorSmartphone className="h-4 w-4" />
            Software
          </TabsTrigger>
          <TabsTrigger value="certificates" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Certificates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hardware" className="space-y-4">
          <HardwareManagement />
        </TabsContent>

        <TabsContent value="software" className="space-y-4">
          <SoftwareManagement />
        </TabsContent>

        <TabsContent value="certificates" className="space-y-4">
          <CertificateManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AssetManagement;
