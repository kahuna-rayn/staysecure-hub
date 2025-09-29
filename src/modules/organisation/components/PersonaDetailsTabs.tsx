
import React, { useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import HardwareInventory from "@/components/HardwareInventory";
import SoftwareAccounts from "@/components/SoftwareAccounts";
import EditableCertificates from "@/components/EditableCertificates";
import PhysicalLocationTab from "@/components/PhysicalLocationTab";
import AssignHardwareDialog from "@/components/admin/AssignHardwareDialog";
import AssignSoftwareDialog from "@/components/admin/AssignSoftwareDialog";
import AddEducationDialog from "@/components/admin/AddEducationDialog";
import { Laptop, MonitorSmartphone, GraduationCap, MapPin, Plus, BookOpen, Users, Play } from "lucide-react";
import MyDocuments from "@/components/knowledge/MyDocuments";
import { UserDepartmentsRolesManager, UserDepartmentsRolesManagerRef } from "@/components/admin/UserDepartmentsRolesManager";
import LearningTracksTab from "@/components/LearningTracksTab";

interface PersonaDetailsTabsProps {
  profile: any; // Using any for now since we're adapting the data structure
  userId: string;
  onUpdate?: () => void;
}

const PersonaDetailsTabs: React.FC<PersonaDetailsTabsProps> = ({ profile, userId, onUpdate }) => {
  const [isAssignHardwareOpen, setIsAssignHardwareOpen] = useState(false);
  const [isAssignSoftwareOpen, setIsAssignSoftwareOpen] = useState(false);
  const [isAddEducationOpen, setIsAddEducationOpen] = useState(false);
  const departmentRolesRef = useRef<UserDepartmentsRolesManagerRef>(null);

  // Detect if we're in Learn mode (root path) or Govern mode (admin path)
  const isLearnMode = import.meta.env.VITE_APP_MODE === 'LEARN';

  const handleCertificateUpdate = (certificateId: string, updates: any) => {
    console.log('Certificate update requested:', certificateId, updates);
    // This would typically update the certificate in the database
    // For now, we'll just log it
  };

  const handleDataChange = () => {
    // Trigger data refresh
    onUpdate?.();
  };

  // ... existing code ...

  // Get the appropriate grid class based on mode
  const getGridClass = () => {
    if (isLearnMode) {
      return "grid-cols-3"; // Only Departments & Roles and Certificates in Learn mode
    }
    
    if (profile?.enrolled_in_learn) {
      return "grid-cols-7"; // All tabs including Learn
    }
    
    return "grid-cols-6"; // All tabs except Learn
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <Tabs defaultValue="departments" className="w-full">
          <TabsList className={`grid w-full ${getGridClass()} mb-6`}>
            <TabsTrigger value="departments" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Departments & Roles</span>
            </TabsTrigger>
            
            {/* Only show these tabs in Govern mode */}
            {!isLearnMode && (
              <>
                <TabsTrigger value="hardware" className="flex items-center gap-2">
                  <Laptop className="h-4 w-4" />
                  <span className="hidden sm:inline">Hardware</span>
                </TabsTrigger>
                <TabsTrigger value="software" className="flex items-center gap-2">
                  <MonitorSmartphone className="h-4 w-4" />
                  <span className="hidden sm:inline">Accounts</span>
                </TabsTrigger>
                <TabsTrigger value="knowledge" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">Knowledge</span>
                </TabsTrigger>
              </>
            )}
            
            <TabsTrigger value="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="hidden sm:inline">Physical Location</span>
            </TabsTrigger>
            <TabsTrigger value="certification" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Certificates</span>
            </TabsTrigger>
            
            {/* Only show Learn tab in Govern mode */}
            {!isLearnMode && profile?.enrolled_in_learn && (
              <TabsTrigger value="learn" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                <span className="hidden sm:inline">StaySecure LEARN</span>
              </TabsTrigger>
            )}
          </TabsList>
          

          <TabsContent value="departments" className="space-y-4 animate-fade-in">
            <div className="flex justify-end">
              <Button 
                onClick={() => departmentRolesRef.current?.handleAddNewRow?.()}
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <UserDepartmentsRolesManager userId={userId} ref={departmentRolesRef} />
          </TabsContent>
          
          {/* Only show these tab contents in Govern mode */}
          {!isLearnMode && (
            <>
              <TabsContent value="hardware" className="space-y-4 animate-fade-in">
                <div className="flex justify-end">
                  <Button 
                    onClick={() => setIsAssignHardwareOpen(true)}
                    size="icon"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <HardwareInventory profile={profile} onUpdate={handleDataChange} />
              </TabsContent>
              
              <TabsContent value="software" className="space-y-4 animate-fade-in">
                <div className="flex justify-end">
                  <Button 
                    onClick={() => setIsAssignSoftwareOpen(true)}
                    size="icon"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <SoftwareAccounts profile={profile} />
              </TabsContent>

              <TabsContent value="knowledge" className="space-y-4 animate-fade-in">
                <MyDocuments userId={profile.id} />
              </TabsContent>
            </>
          )}
                        
          <TabsContent value="location" className="space-y-4 animate-fade-in">
            <PhysicalLocationTab profile={profile} />
          </TabsContent>
              
          <TabsContent value="certification" className="space-y-4 animate-fade-in">
            <div className="flex justify-end">
              <Button 
                onClick={() => setIsAddEducationOpen(true)}
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <EditableCertificates 
              profile={profile} 
              onUpdate={handleCertificateUpdate}
              onDataChange={handleDataChange}
            />
          </TabsContent>

          {/* Only show Learn tab content in Govern mode */}
          {!isLearnMode && profile?.enrolled_in_learn && (
            <TabsContent value="learn" className="space-y-4 animate-fade-in">
              <LearningTracksTab userId={profile.id} />
            </TabsContent>
          )}
        </Tabs>

        {/* Dialogs - only show in Govern mode */}
        {!isLearnMode && (
          <>
            <AssignHardwareDialog
              isOpen={isAssignHardwareOpen}
              onOpenChange={setIsAssignHardwareOpen}
              userId={profile.id}
              onSuccess={() => {
                setIsAssignHardwareOpen(false);
                handleDataChange();
              }}
            />

            <AssignSoftwareDialog
              isOpen={isAssignSoftwareOpen}
              onOpenChange={setIsAssignSoftwareOpen}
              userId={profile.id}
              onSuccess={() => {
                setIsAssignSoftwareOpen(false);
                handleDataChange();
              }}
            />
          </>
        )}

        <AddEducationDialog
          isOpen={isAddEducationOpen}
          onOpenChange={setIsAddEducationOpen}
          userId={profile.id}
          onSuccess={() => {
            setIsAddEducationOpen(false);
            handleDataChange();
          }}
        />
      </CardContent>
    </Card>
  );
};

export default PersonaDetailsTabs;