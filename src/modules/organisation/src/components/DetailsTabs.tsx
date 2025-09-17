
import React from "react";
import { PersonProfile } from "./PersonaProfile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import AccountDetails from "./AccountDetails";
import HardwareInventory from "./HardwareInventory";
import SoftwareAccounts from "./SoftwareAccounts";
import Certificates from "./Certificates";
import PhysicalLocationTab from "./PhysicalLocationTab";
import { UserRound, Laptop, MonitorSmartphone, GraduationCap, MapPin } from "lucide-react";

interface DetailsTabsProps {
  profile: PersonProfile;
}

const DetailsTabs: React.FC<DetailsTabsProps> = ({ profile }) => {
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <UserRound className="h-4 w-4" />
              <span className="hidden sm:inline">Information</span>
            </TabsTrigger>
            <TabsTrigger value="hardware" className="flex items-center gap-2">
              <Laptop className="h-4 w-4" />
              <span className="hidden sm:inline">Hardware</span>
            </TabsTrigger>
            <TabsTrigger value="software" className="flex items-center gap-2">
              <MonitorSmartphone className="h-4 w-4" />
              <span className="hidden sm:inline">Accounts</span>
            </TabsTrigger>
            <TabsTrigger value="education" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Education</span>
            </TabsTrigger>
            <TabsTrigger value="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Physical Location</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="account" className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-medium">Profile Information</h2>
            </div>
            <AccountDetails profile={{...profile, created_at: '', updated_at: ''} as any} />
          </TabsContent>
          
          <TabsContent value="hardware" className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <Laptop className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-medium">Hardware Inventory</h2>
            </div>
            <HardwareInventory profile={profile} />
          </TabsContent>
          
          <TabsContent value="software" className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <MonitorSmartphone className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-medium">Software Accounts</h2>
            </div>
            <SoftwareAccounts profile={{...profile, software: []} as any} />
          </TabsContent>
          
          <TabsContent value="education" className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-medium">Education</h2>
            </div>
            <Certificates profile={profile} />
          </TabsContent>
          
          <TabsContent value="location" className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-medium">Physical Location Access</h2>
            </div>
            <PhysicalLocationTab profile={profile} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DetailsTabs;
