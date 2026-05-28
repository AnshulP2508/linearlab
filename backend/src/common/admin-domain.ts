export const AccountStatuses = ['ACTIVE', 'DISABLED', 'SUSPENDED'] as const;
export type AccountStatus = (typeof AccountStatuses)[number];

export const PocStatuses = [
  'DRAFT',
  'PENDING_REVIEW',
  'PUBLISHED',
  'REJECTED',
  'ARCHIVED',
] as const;
export type PocStatus = (typeof PocStatuses)[number];

export const FeedbackStatuses = ['VISIBLE', 'HIDDEN', 'FLAGGED'] as const;
export type FeedbackStatus = (typeof FeedbackStatuses)[number];

export const NotificationTypes = {
  POC_SUBMITTED: 'POC_SUBMITTED',
  POC_APPROVED: 'POC_APPROVED',
  POC_REJECTED: 'POC_REJECTED',
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  FEEDBACK_RECEIVED: 'FEEDBACK_RECEIVED',
  FEEDBACK_MODERATED: 'FEEDBACK_MODERATED',
  CATEGORY_UPDATED: 'CATEGORY_UPDATED',
  SETTINGS_UPDATED: 'SETTINGS_UPDATED',
  SYSTEM_ACTIVITY: 'SYSTEM_ACTIVITY',
} as const;

export type NotificationType =
  (typeof NotificationTypes)[keyof typeof NotificationTypes];
