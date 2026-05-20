export const NotificationTypes = {
  LICENSE_EXPIRY: 'LICENSE_EXPIRY',
  PASS_CARD_EXPIRY: 'PASS_CARD_EXPIRY',
  MEMBER_BIRTHDAY: 'MEMBER_BIRTHDAY',
  ABNORMAL_ORDER: 'ABNORMAL_ORDER',
  SYSTEM_ANNOUNCEMENT: 'SYSTEM_ANNOUNCEMENT',
} as const;

export type NotificationType = (typeof NotificationTypes)[keyof typeof NotificationTypes];

export interface CreateNotificationParams {
  shopId: string;
  type: NotificationType;
  title: string;
  content: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
}
