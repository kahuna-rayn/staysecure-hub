import React from "react";
import { PersonProfile } from "./PersonaProfile";
import { Mail, Phone, MapPin, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { useState } from 'react';

interface ProfileHeaderProps {
  profile: PersonProfile;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile }) => {
  const initials = `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`;
  const { profiles, updateProfile } = useUserProfiles();
  const [manager, setManager] = useState(profile.manager);

  const handleReportsToChange = async (value: string) => {
    setManager(value);
    await updateProfile(profile.id, { manager: value });
    // Optionally, trigger a profile refresh if needed
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <Avatar className="h-24 w-24 border-2 border-primary">
            <AvatarImage src={profile.avatar} alt={`${profile.firstName} ${profile.lastName}`} />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
          
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold">{profile.firstName} {profile.lastName}</h1>
            <p className="text-lg text-muted-foreground">{profile.role}</p>
            <p className="text-sm text-muted-foreground">Department: {profile.department}</p>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <span>Reports to:</span>
              <Select onValueChange={handleReportsToChange} value={manager}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((user) => (
                    <SelectItem key={user.id} value={user.full_name || user.username || 'Unnamed User'}>
                      {user.full_name || user.username || 'Unnamed User'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0 md:ml-auto space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{profile.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{profile.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{profile.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Started {new Date(profile.startDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileHeader;
