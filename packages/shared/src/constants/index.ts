export const CURRENCY = {
  BASE_UNIT: 100,
  SYMBOL: '¥',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

export const AUTH = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  REFRESH_TOKEN_REDIS_PREFIX: 'refresh_token:',
} as const;

export const LICENSE = {
  OFFLINE_TOLERANCE_DAYS: 3,
  EXPIRY_WARNING_DAYS: 15,
  DEFAULT_STAFF_LIMIT: 2,
  DEFAULT_MEMBERS_LIMIT: 200,
} as const;

export const BUSINESS = {
  SLEEPING_MEMBER_DAYS: 90,
  NEW_MEMBER_DAYS: 30,
  ORDER_CANCEL_SAME_DAY: true,
} as const;
