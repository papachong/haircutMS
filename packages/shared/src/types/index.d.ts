export interface ApiResponse<T = unknown> {
    code: number;
    data: T;
    message: string;
}
export interface PaginatedResponse<T> {
    items: T[];
    pagination: {
        total: number;
        page: number;
        pageSize: number;
        hasMore: boolean;
    };
}
export interface JwtPayload {
    staffId: string;
    shopId: string;
    role: StaffRole;
    type: 'shop';
}
export interface PlatformJwtPayload {
    adminId: string;
    role: PlatformAdminRole;
    type: 'platform';
}
export declare enum StaffRole {
    OWNER = "OWNER",
    MANAGER = "MANAGER",
    RECEPTIONIST = "RECEPTIONIST",
    STYLIST = "STYLIST",
    TECHNICIAN = "TECHNICIAN"
}
export declare enum PlatformAdminRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    ADMIN = "ADMIN",
    OPERATOR = "OPERATOR"
}
export declare enum OrderStatus {
    PENDING = "PENDING",
    SETTLED = "SETTLED",
    CANCELLED = "CANCELLED",
    REFUNDED = "REFUNDED"
}
export declare enum PaymentMethod {
    BALANCE = "BALANCE",
    PASS_CARD = "PASS_CARD",
    OFFLINE = "OFFLINE",
    COUPON = "COUPON"
}
export declare enum LicensePlan {
    FREE = "FREE",
    PRO = "PRO",
    ENTERPRISE = "ENTERPRISE"
}
export declare enum Gender {
    MALE = "MALE",
    FEMALE = "FEMALE",
    OTHER = "OTHER"
}
export declare enum RechargePlanType {
    DIRECT = "DIRECT",
    GIFT = "GIFT",
    PERCENTAGE = "PERCENTAGE",
    TIMED = "TIMED"
}
export declare enum CouponType {
    FIXED = "FIXED",
    PERCENT = "PERCENT"
}
export declare enum CouponStatus {
    AVAILABLE = "AVAILABLE",
    USED = "USED",
    EXPIRED = "EXPIRED"
}
export declare enum ShopStatus {
    ACTIVE = "ACTIVE",
    SUSPENDED = "SUSPENDED",
    ARCHIVED = "ARCHIVED"
}
//# sourceMappingURL=index.d.ts.map