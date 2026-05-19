'use client';

import { useState, useEffect } from 'react';
import { Ticket, X, Clock, AlertCircle } from 'lucide-react';
import { getAvailableCoupons, type CouponInstance } from '@/lib/api/orders';

export interface SelectedCoupon {
  id: string;
  templateId: string;
  templateName: string;
  templateType: 'FIXED' | 'PERCENT';
  discount: number;
  threshold: number;
  expiresAt: string;
}

interface CouponSelectorProps {
  memberId: string;
  orderAmount: number;
  selectedCoupon?: SelectedCoupon | null;
  onSelect: (coupon: SelectedCoupon | null) => void;
  compact?: boolean;
}

type CouponItem = CouponInstance & {
  canUse: boolean;
  discount: number;
  finalAmount: number;
  template: {
    id: string;
    name: string;
    type: 'FIXED' | 'PERCENT';
    threshold: number;
    discount: number;
  };
};

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

function daysUntilExpiry(expiresAt: string): number {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function CouponSelector({
  memberId,
  orderAmount,
  selectedCoupon,
  onSelect,
  compact = false,
}: CouponSelectorProps) {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (memberId && orderAmount > 0) {
      loadCoupons();
    }
  }, [memberId, orderAmount]);

  const loadCoupons = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAvailableCoupons(memberId, orderAmount);
      setCoupons(data);
    } catch {
      setError('加载优惠券失败');
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const usableCoupons = coupons.filter((c) => c.canUse);
  const unusableCoupons = coupons.filter((c) => !c.canUse);

  const handleSelect = (coupon: CouponItem) => {
    if (selectedCoupon?.id === coupon.id) {
      onSelect(null);
    } else {
      onSelect({
        id: coupon.id,
        templateId: coupon.template.id,
        templateName: coupon.template.name,
        templateType: coupon.template.type,
        discount: coupon.discount,
        threshold: coupon.template.threshold,
        expiresAt: coupon.expiresAt,
      });
    }
    setExpanded(false);
  };

  const handleRemove = () => {
    onSelect(null);
  };

  const discountLabel = (coupon: CouponItem): string => {
    if (coupon.template.type === 'FIXED') {
      return `减 ¥${formatPrice(coupon.discount)}`;
    }
    return `${coupon.template.discount / 10}折`;
  };

  // Compact mode: single line summary with expand
  if (compact) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => {
            if (selectedCoupon) {
              handleRemove();
            } else {
              setExpanded(!expanded);
            }
          }}
          className="w-full flex items-center justify-between p-3 hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium">
              {loading ? '加载中...' : '优惠券'}
            </span>
            {selectedCoupon && (
              <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                {selectedCoupon.templateName}{' '}
                {selectedCoupon.templateType === 'FIXED'
                  ? `减 ¥${formatPrice(selectedCoupon.discount)}`
                  : `${selectedCoupon.discount / 10}折`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {!selectedCoupon && usableCoupons.length > 0 && (
              <span className="text-xs text-orange-500 font-medium">
                {usableCoupons.length}张可用
              </span>
            )}
            {!selectedCoupon && !loading && (
              <span className="text-xs text-muted-foreground">
                {selectedCoupon ? '取消' : expanded ? '收起' : '选择'}
              </span>
            )}
          </div>
        </button>

        {selectedCoupon && (
          <div className="px-3 pb-3 -mt-1">
            <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg p-2.5">
              <div>
                <div className="text-sm font-medium text-orange-700">
                  {selectedCoupon.templateName}
                </div>
                <div className="text-xs text-orange-500 mt-0.5">
                  {selectedCoupon.templateType === 'FIXED'
                    ? `满 ¥${formatPrice(selectedCoupon.threshold)} 减 ¥${formatPrice(selectedCoupon.discount)}`
                    : `${selectedCoupon.templateType}`}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-orange-600">
                  -¥{formatPrice(selectedCoupon.discount)}
                </div>
              </div>
            </div>
          </div>
        )}

        {expanded && !selectedCoupon && (
          <div className="border-t">
            {error && (
              <div className="p-3 text-sm text-destructive flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            {loading && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                加载中...
              </div>
            )}
            {!loading && usableCoupons.length === 0 && unusableCoupons.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                暂无优惠券
              </div>
            )}
            <div className="max-h-60 overflow-y-auto">
              {usableCoupons.map((coupon) => {
                const days = daysUntilExpiry(coupon.expiresAt);
                const expiryUrgent = days <= 7 && days > 0;
                return (
                  <button
                    key={coupon.id}
                    type="button"
                    onClick={() => handleSelect(coupon)}
                    className="w-full p-3 flex items-start gap-3 hover:bg-accent/50 transition-colors border-b last:border-b-0 text-left"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex flex-col items-center justify-center text-white shrink-0">
                      <span className="text-xs font-bold leading-none">
                        {coupon.template.type === 'FIXED' ? '¥' : ''}
                      </span>
                      <span className="text-base font-bold leading-tight">
                        {coupon.template.type === 'FIXED'
                          ? formatPrice(coupon.discount)
                          : `${coupon.template.discount / 10}折`}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {coupon.template.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        满 ¥{formatPrice(coupon.template.threshold)} 可用
                      </div>
                      <div className={`text-xs mt-1 flex items-center gap-1 ${
                        expiryUrgent ? 'text-orange-500' : 'text-muted-foreground'
                      }`}>
                        <Clock className="w-3 h-3" />
                        {days <= 0 ? '已过期' : `${days}天后过期`}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-orange-500 shrink-0">
                      -¥{formatPrice(coupon.discount)}
                    </div>
                  </button>
                );
              })}
              {unusableCoupons.length > 0 && (
                <div className="p-2 bg-muted/30">
                  <div className="text-xs text-muted-foreground text-center mb-1">
                    不可用 ({unusableCoupons.length})
                  </div>
                  {unusableCoupons.map((coupon) => (
                    <div
                      key={coupon.id}
                      className="p-2 flex items-center gap-2 opacity-50 cursor-not-allowed"
                    >
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">
                        <Ticket className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-muted-foreground truncate">
                          {coupon.template.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          未满 ¥{formatPrice(coupon.template.threshold)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full mode: expanded coupon card selector
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ticket className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-semibold">使用优惠券</span>
          {!loading && usableCoupons.length > 0 && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
              {usableCoupons.length}张可用
            </span>
          )}
        </div>
        {selectedCoupon && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            取消使用
          </button>
        )}
      </div>

      {error && (
        <div className="text-sm text-destructive flex items-center gap-1.5 p-2 bg-destructive/10 rounded-md">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {loading && (
        <div className="text-sm text-muted-foreground text-center py-4">
          加载优惠券中...
        </div>
      )}

      {/* Selected coupon highlight */}
      {selectedCoupon && (
        <div className="relative overflow-hidden rounded-xl border-2 border-orange-300 bg-gradient-to-r from-orange-50 to-red-50">
          <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs px-3 py-1 rounded-bl-lg font-medium">
            已选
          </div>
          <div className="p-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex flex-col items-center justify-center text-white shrink-0 shadow-md">
              <span className="text-xs font-bold">省</span>
              <span className="text-xl font-bold leading-tight">
                ¥{formatPrice(selectedCoupon.discount)}
              </span>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm">
                {selectedCoupon.templateName}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {selectedCoupon.templateType === 'FIXED'
                  ? `满 ¥${formatPrice(selectedCoupon.threshold)} 减 ¥${formatPrice(selectedCoupon.discount)}`
                  : `${selectedCoupon.discount / 10}折优惠`}
              </div>
              <div className="text-xs text-orange-500 mt-1">
                有效期至 {new Date(selectedCoupon.expiresAt).toLocaleDateString('zh-CN')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Available coupons list */}
      {!selectedCoupon && !loading && coupons.length > 0 && (
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {usableCoupons.map((coupon) => {
            const days = daysUntilExpiry(coupon.expiresAt);
            const expiryUrgent = days <= 7 && days > 0;
            return (
              <button
                key={coupon.id}
                type="button"
                onClick={() => handleSelect(coupon)}
                className="w-full relative overflow-hidden rounded-xl border bg-card p-3 text-left hover:border-orange-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-14 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex flex-col items-center justify-center text-white shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                    <span className="text-[10px] font-bold leading-none">
                      {coupon.template.type === 'FIXED' ? '减' : '折'}
                    </span>
                    <span className="text-sm font-bold leading-tight">
                      {coupon.template.type === 'FIXED'
                        ? `¥${formatPrice(coupon.discount)}`
                        : `${coupon.template.discount / 10}折`}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {coupon.template.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      满 ¥{formatPrice(coupon.template.threshold)} 可用
                    </div>
                    <div className={`text-xs mt-1 flex items-center gap-1 ${
                      expiryUrgent ? 'text-orange-500' : 'text-muted-foreground'
                    }`}>
                      <Clock className="w-3 h-3" />
                      {days <= 0 ? '已过期' : `${days}天后过期`}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

          {unusableCoupons.length > 0 && (
            <>
              <div className="text-xs text-muted-foreground text-center py-1">
                以下优惠券不满足使用条件
              </div>
              {unusableCoupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="rounded-xl border border-dashed p-3 opacity-40 cursor-not-allowed"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-14 rounded-lg bg-muted flex flex-col items-center justify-center text-muted-foreground shrink-0">
                      <Ticket className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {coupon.template.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        需满 ¥{formatPrice(coupon.template.threshold)}，当前 ¥{formatPrice(orderAmount)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {!loading && !selectedCoupon && coupons.length === 0 && !error && (
        <div className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded-lg">
          暂无可用优惠券
        </div>
      )}
    </div>
  );
}
