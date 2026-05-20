"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopStatus = exports.CouponStatus = exports.CouponType = exports.RechargePlanType = exports.Gender = exports.LicensePlan = exports.PaymentMethod = exports.OrderStatus = exports.PlatformAdminRole = exports.StaffRole = void 0;
var StaffRole;
(function (StaffRole) {
    StaffRole["OWNER"] = "OWNER";
    StaffRole["MANAGER"] = "MANAGER";
    StaffRole["RECEPTIONIST"] = "RECEPTIONIST";
    StaffRole["STYLIST"] = "STYLIST";
    StaffRole["TECHNICIAN"] = "TECHNICIAN";
})(StaffRole || (exports.StaffRole = StaffRole = {}));
var PlatformAdminRole;
(function (PlatformAdminRole) {
    PlatformAdminRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    PlatformAdminRole["ADMIN"] = "ADMIN";
    PlatformAdminRole["OPERATOR"] = "OPERATOR";
})(PlatformAdminRole || (exports.PlatformAdminRole = PlatformAdminRole = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "PENDING";
    OrderStatus["SETTLED"] = "SETTLED";
    OrderStatus["CANCELLED"] = "CANCELLED";
    OrderStatus["REFUNDED"] = "REFUNDED";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["BALANCE"] = "BALANCE";
    PaymentMethod["PASS_CARD"] = "PASS_CARD";
    PaymentMethod["OFFLINE"] = "OFFLINE";
    PaymentMethod["COUPON"] = "COUPON";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var LicensePlan;
(function (LicensePlan) {
    LicensePlan["FREE"] = "FREE";
    LicensePlan["PRO"] = "PRO";
    LicensePlan["ENTERPRISE"] = "ENTERPRISE";
})(LicensePlan || (exports.LicensePlan = LicensePlan = {}));
var Gender;
(function (Gender) {
    Gender["MALE"] = "MALE";
    Gender["FEMALE"] = "FEMALE";
    Gender["OTHER"] = "OTHER";
})(Gender || (exports.Gender = Gender = {}));
var RechargePlanType;
(function (RechargePlanType) {
    RechargePlanType["DIRECT"] = "DIRECT";
    RechargePlanType["GIFT"] = "GIFT";
    RechargePlanType["PERCENTAGE"] = "PERCENTAGE";
    RechargePlanType["TIMED"] = "TIMED";
})(RechargePlanType || (exports.RechargePlanType = RechargePlanType = {}));
var CouponType;
(function (CouponType) {
    CouponType["FIXED"] = "FIXED";
    CouponType["PERCENT"] = "PERCENT";
})(CouponType || (exports.CouponType = CouponType = {}));
var CouponStatus;
(function (CouponStatus) {
    CouponStatus["AVAILABLE"] = "AVAILABLE";
    CouponStatus["USED"] = "USED";
    CouponStatus["EXPIRED"] = "EXPIRED";
})(CouponStatus || (exports.CouponStatus = CouponStatus = {}));
var ShopStatus;
(function (ShopStatus) {
    ShopStatus["ACTIVE"] = "ACTIVE";
    ShopStatus["SUSPENDED"] = "SUSPENDED";
    ShopStatus["ARCHIVED"] = "ARCHIVED";
})(ShopStatus || (exports.ShopStatus = ShopStatus = {}));
//# sourceMappingURL=index.js.map