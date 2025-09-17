import React from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, User, Crown, Settings } from 'lucide-react';

export const RoleDebugPanel: React.FC = () => {
  const { 
    role, 
    isSuperAdmin, 
    isClientAdmin, 
    isModerator, 
    hasAdminAccess,
    canAccessLessons,
    canAccessLearningTracks,
    canAccessTranslation,
    canAccessAssignments,
    canAccessAnalytics,
    canAccessReports,
    canAccessOrganisation,
    canAccessNotifications,
    canAccessTemplates,
    loading, 
    getRoleDisplayName, 
    getRoleBadgeVariant 
  } = useUserRole();

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getIcon = () => {
    if (isSuperAdmin) return <Crown className="w-5 h-5" />;
    if (isClientAdmin) return <Shield className="w-5 h-5" />;
    if (isModerator) return <Settings className="w-5 h-5" />;
    return <User className="w-5 h-5" />;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          {getIcon()}
          Role Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Current Role:</span>
          <Badge variant={getRoleBadgeVariant()}>
            {getRoleDisplayName()}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Raw Role:</span>
            <code className="text-xs bg-muted px-1 rounded">{role || 'null'}</code>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span>Is Admin:</span>
            <Badge variant={hasAdminAccess ? 'default' : 'outline'} className="text-xs">
              {hasAdminAccess.toString()}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span>Is Super Admin:</span>
            <Badge variant={isSuperAdmin ? 'default' : 'outline'} className="text-xs">
              {isSuperAdmin.toString()}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span>Is Client Admin:</span>
            <Badge variant={isClientAdmin ? 'secondary' : 'outline'} className="text-xs">
              {isClientAdmin.toString()}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span>Is Moderator:</span>
            <Badge variant={isModerator ? 'outline' : 'outline'} className="text-xs">
              {isModerator.toString()}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span>Has Admin Access:</span>
            <Badge variant={hasAdminAccess ? 'default' : 'outline'} className="text-xs">
              {hasAdminAccess.toString()}
            </Badge>
          </div>
        </div>
        
        <div className="pt-2 border-t">
          <h4 className="text-sm font-medium mb-2">Access Permissions:</h4>
          <div className="text-xs space-y-1">
            <div className="grid grid-cols-2 gap-2">
              <div className={`flex items-center gap-1 ${canAccessLessons ? 'text-green-600' : 'text-red-500'}`}>
                {canAccessLessons ? '✅' : '❌'} Lessons
              </div>
              <div className={`flex items-center gap-1 ${canAccessLearningTracks ? 'text-green-600' : 'text-red-500'}`}>
                {canAccessLearningTracks ? '✅' : '❌'} Learning Tracks
              </div>
              <div className={`flex items-center gap-1 ${canAccessTranslation ? 'text-green-600' : 'text-red-500'}`}>
                {canAccessTranslation ? '✅' : '❌'} Translation
              </div>
              <div className={`flex items-center gap-1 ${canAccessAssignments ? 'text-green-600' : 'text-red-500'}`}>
                {canAccessAssignments ? '✅' : '❌'} Assignments
              </div>
              <div className={`flex items-center gap-1 ${canAccessAnalytics ? 'text-green-600' : 'text-red-500'}`}>
                {canAccessAnalytics ? '✅' : '❌'} Analytics
              </div>
              <div className={`flex items-center gap-1 ${canAccessReports ? 'text-green-600' : 'text-red-500'}`}>
                {canAccessReports ? '✅' : '❌'} Reports
              </div>
              <div className={`flex items-center gap-1 ${canAccessOrganisation ? 'text-green-600' : 'text-red-500'}`}>
                {canAccessOrganisation ? '✅' : '❌'} Organisation
              </div>
              <div className={`flex items-center gap-1 ${canAccessNotifications ? 'text-green-600' : 'text-red-500'}`}>
                {canAccessNotifications ? '✅' : '❌'} Notifications
              </div>
              <div className={`flex items-center gap-1 ${canAccessTemplates ? 'text-green-600' : 'text-red-500'}`}>
                {canAccessTemplates ? '✅' : '❌'} Templates
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};