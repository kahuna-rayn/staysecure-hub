// Notifications module exports
export { NotificationCenter } from './components/NotificationCenter';
export { NotificationItem } from './components/NotificationItem';
export { NotificationSettings } from './components/NotificationSettings';
export { EmailNotifications } from './components/EmailNotifications';
export { EmailNotificationsWrapper } from './components/EmailNotificationsWrapper';

// Hooks
export { createUseNotifications } from './hooks/useNotifications';
export { useNotificationSettings } from './hooks/useNotificationSettings';

// Services
export { emailService, EmailService } from './lib/emailService';

// Types
export type {
  Notification,
  NotificationFilters,
  NotificationType,
  EmailNotification,
  EmailPreferences,
  UseNotificationsReturn,
  CreateNotificationRequest,
  UpdateNotificationRequest
} from './types';
