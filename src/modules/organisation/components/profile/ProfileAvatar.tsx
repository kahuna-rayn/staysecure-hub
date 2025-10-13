
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface ProfileAvatarProps {
  avatarUrl?: string;
  firstName: string;
  lastName: string;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ avatarUrl, firstName, lastName }) => {
  const initials = firstName && lastName
    ? (firstName.charAt(0) + lastName.charAt(0))
    : firstName?.slice(0, 2) || 'U';

  const handleAvatarUpload = () => {
    toast({
      title: "Avatar Upload",
      description: "Avatar upload functionality will be implemented with Supabase Storage.",
    });
  };

  return (
    <div className="relative">
      <Avatar className="h-24 w-24 border-2 border-primary">
        <AvatarImage src={avatarUrl} alt={`${firstName} ${lastName}`} />
        <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
      </Avatar>
      <Button
        size="sm"
        variant="outline"
        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
        onClick={handleAvatarUpload}
      >
        <Upload className="h-3 w-3" />
      </Button>
    </div>
  );
};

export default ProfileAvatar;
