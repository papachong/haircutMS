"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yuanToFen = yuanToFen;
exports.fenToYuan = fenToYuan;
exports.formatPrice = formatPrice;
exports.formatCurrency = formatCurrency;
function yuanToFen(yuan) {
    return Math.round(yuan * 100);
}
function fenToYuan(fen) {
    return fen / 100;
}
function formatPrice(fen) {
    return `¥${(fen / 100).toFixed(2)}`;
}
function formatCurrency(fen) {
    return `¥${(fen / 100).toFixed(2)}`;
}
//# sourceMappingURL=currency.js.map