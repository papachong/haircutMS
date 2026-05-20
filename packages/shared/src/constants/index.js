"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUSINESS = exports.LICENSE = exports.AUTH = exports.PAGINATION = exports.CURRENCY = void 0;
exports.CURRENCY = {
    BASE_UNIT: 100,
    SYMBOL: '¥',
};
exports.PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
};
exports.AUTH = {
    ACCESS_TOKEN_EXPIRY: '15m',
    REFRESH_TOKEN_EXPIRY: '7d',
    REFRESH_TOKEN_REDIS_PREFIX: 'refresh_token:',
};
exports.LICENSE = {
    OFFLINE_TOLERANCE_DAYS: 3,
    EXPIRY_WARNING_DAYS: 15,
    DEFAULT_STAFF_LIMIT: 2,
    DEFAULT_MEMBERS_LIMIT: 200,
};
exports.BUSINESS = {
    SLEEPING_MEMBER_DAYS: 90,
    NEW_MEMBER_DAYS: 30,
    ORDER_CANCEL_SAME_DAY: true,
};
//# sourceMappingURL=index.js.map