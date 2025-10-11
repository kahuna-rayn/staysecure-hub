// Main exports for the organisation module
export { OrganisationPanel } from './components/OrganisationPanel';
export { OrganisationProvider, useOrganisationContext } from './context/OrganisationContext';

// Core component exports
export { OrganisationWrapper } from './components/OrganisationWrapper';
export { default as PersonaDetailsTabs } from './components/PersonaDetailsTabs';
export { default as EditableProfileHeader } from './components/EditableProfileHeader';
export { default as PersonaProfile } from './components/PersonaProfile';
export { default as UserDetailView } from './components/UserDetailView';

// Admin component exports
export { default as UserManagement } from './components/admin/UserManagement';
export { default as UserList } from './components/admin/UserList';
export { default as UserCard } from './components/admin/UserCard';
export { default as UserTable } from './components/admin/UserTable';
export { default as CreateUserDialog } from './components/admin/CreateUserDialog';
export { default as EditUserDialog } from './components/admin/EditUserDialog';
export { default as AddOrganisationCertificateDialog } from './components/admin/AddOrganisationCertificateDialog';

// Profile component exports
export { default as ProfileBasicInfo } from './components/profile/ProfileBasicInfo';
export { default as ProfileAvatar } from './components/profile/ProfileAvatar';
export { default as ProfileContactInfo } from './components/profile/ProfileContactInfo';
export { default as EditableField } from './components/profile/EditableField';
export { default as MultipleRolesField } from './components/profile/MultipleRolesField';
export { UserRoleField } from './components/profile/UserRoleField';

// Hook exports (re-exported from main hooks directory)
export { useUserManagement } from '@/hooks/useUserManagement';
export { useUserProfiles } from '@/hooks/useUserProfiles';
export { useUserRole } from '@/hooks/useUserRole';
export { useUserAssets } from '@/hooks/useUserAssets';
export { useUserDepartments } from '@/hooks/useUserDepartments';
export { useUserProfileRoles } from '@/hooks/useUserProfileRoles';
export { useViewPreference } from '@/hooks/useViewPreference';

// Type exports
export type {
  OrganisationConfig,
  ThemeConfig,
  PermissionConfig,
  UserProfile,
  NewUser,
  Role,
  Department,
  Location,
  OrgCertificate,
} from './types';

// Utility exports
export { handleSaveUser, handleCreateUser, handleDeleteUser } from './utils/userManagementActions';