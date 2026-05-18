'use client';

import { useState, useEffect } from 'react';
import { getPassCards, type PassCard, isPassCardUsable } from '@/lib/api/pass-cards';
import { getAvailableCoupons, settleOrder, type CouponInstance } from '@/lib/api/orders';
import type { Order } from '@/lib/api/orders';

interface SettlementDialogProps {
  order: Order;
  onClose: () => void;
  onSuccess?: (order: Order) => void;
}

interface PaymentMethod {
  type: 'BALANCE' | 'PASS_CARD' | 'OFFLINE' | 'COUPON';
  label: string;
  icon: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { type: 'BALANCE', label: '余额支付', icon: '💰' },
  { type: 'PASS_CARD', label: '次卡支付', icon: '🎫' },
  { type: 'COUPON', label: '优惠券', icon: '🎟️' },
  { type: 'OFFLINE', label: '现金/扫码', icon: '💳' },
];

interface PaymentAllocation {
  method: PaymentMethod['type'];
  amount: number;
  passCardId?: string;
  couponInstanceId?: string;
  detail?: string;
}

export function SettlementDialog({ order, onClose, onSuccess }: SettlementDialogProps) {
  const [passCards, setPassCards] = useState<PassCard[]>([]);
  const [availableCoupons, setAvailableCoupons] = useState<Array<CouponInstance & {
    template: { id: string; name: string; type: 'FIXED' | 'PERCENT'; threshold: number; discount: number };
    canUse: boolean;
    discount: number;
    finalAmount: number;
  }>>([]);
  const [selectedPassCardId, setSelectedPassCardId] = useState<string | null>(null);
  const [selectedCouponInstanceId, setSelectedCouponInstanceId] = useState<string | null>(null);
  const [balanceAmount, setBalanceAmount] = useState(0);
  const [offlineAmount, setOfflineAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPaymentOptions();
  }, [order.member.id, order.payableAmount]);

  const loadPaymentOptions = async () => {
    try {
      const [passCardsResult, couponsResult] = await Promise.all([
        getPassCards({ memberId: order.member.id, availableOnly: true }),
        getAvailableCoupons(order.member.id, order.payableAmount),
      ]);
      setPassCards(passCardsResult.items.filter(isPassCardUsable));
      setAvailableCoupons(couponsResult.filter((c) => c.canUse));
    } catch {
      // Handle error silently
    }
  };

  const usablePassCards = passCards.filter((pc) => isPassCardUsable(pc));

  const hasPassCard = selectedPassCardId !== null;
  const hasCoupon = selectedCouponInstanceId !== null;
  const hasBalance = balanceAmount > 0;
  const hasOffline = offlineAmount > 0;

  // Calculate total allocated
  const totalAllocated = (hasPassCard ? 0 : 0) + (hasCoupon ? 0 : 0) + balanceAmount + offlineAmount;

  // Calculate coupon discount
  const selectedCoupon = availableCoupons.find((c) => c.id === selectedCouponInstanceId);
  const couponDiscount = selectedCoupon?.discount ?? 0;

  // Remaining amount after coupon
  const remainingAfterCoupon = order.payableAmount - couponDiscount;

  // Validate payment allocation
  const isPaymentValid = () => {
    if (hasPassCard && usablePassCards.length === 0) return false;
    if (hasCoupon && !selectedCoupon) return false;
    if (remainingAfterCoupon <= 0) return hasPassCard || hasCoupon;
    return (hasPassCard ? 0 : 0) + balanceAmount + offlineAmount === remainingAfterCoupon;
  };

  const getPaymentDescription = (method: PaymentMethod['type']): string => {
    switch (method) {
      case 'BALANCE':
        return '余额支付';
      case 'PASS_CARD':
        const pc = usablePassCards.find((c) => c.id === selectedPassCardId);
        return pc ? `${pc.name} (剩余${pc.remainingTimes}次)` : '次卡支付';
      case 'COUPON':
        const coupon = selectedCoupon;
        return coupon
          ? `${coupon.template.name} (${coupon.template.type === 'FIXED' ? '减¥' + (coupon.template.discount / 100).toFixed(2) : coupon.template.discount / 10 + '折'})`
          : '优惠券';
      case 'OFFLINE':
        return '现金/扫码';
      default:
        return method;
    }
  };

  const handleSettle = async () => {
    if (!isPaymentValid()) {
      alert('请完成支付配置');
      return;
    }

    setLoading(true);
    try {
      const payments: Array<{
        method: 'BALANCE' | 'PASS_CARD' | 'OFFLINE' | 'COUPON';
        amount: number;
        passCardId?: string;
        couponInstanceId?: string;
        detail?: string;
      }> = [];

      if (hasPassCard && selectedPassCardId) {
        payments.push({
          method: 'PASS_CARD',
          amount: 0,
          passCardId: selectedPassCardId,
          detail: getPaymentDescription('PASS_CARD'),
        });
      }

      if (hasCoupon && selectedCouponInstanceId) {
        payments.push({
          method: 'COUPON',
          amount: couponDiscount,
          couponInstanceId: selectedCouponInstanceId,
          detail: getPaymentDescription('COUPON'),
        });
      }

      if (balanceAmount > 0) {
        payments.push({
          method: 'BALANCE',
          amount: balanceAmount,
          detail: getPaymentDescription('BALANCE'),
        });
      }

      if (offlineAmount > 0) {
        payments.push({
          method: 'OFFLINE',
          amount: offlineAmount,
          detail: getPaymentDescription('OFFLINE'),
        });
      }

      const settledOrder = await settleOrder(order.id, payments);
      onSuccess?.(settledOrder);
      onClose();
    } catch (error: unknown) {
      alert(`结算失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-auto">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-lg">结算订单</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-accent/50 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs text-muted-foreground">订单号</div>
                <div className="font-medium">{order.orderNo}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">应付金额</div>
                <div className="text-2xl font-bold text-primary">
                  ¥{(order.payableAmount / 100).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {usablePassCards.length > 0 && (
            <div>
              <label className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={hasPassCard}
                  onChange={(e) => {
                    setSelectedPassCardId(e.target.checked ? usablePassCards[0].id : null);
                  }}
                  className="rounded"
                />
                <span className="font-medium">使用次卡</span>
                <span className="text-xs text-muted-foreground">（扣减1次）</span>
              </label>

              {hasPassCard && (
                <div className="border rounded-md p-3 space-y-2">
                  {usablePassCards.map((pc) => (
                    <label
                      key={pc.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-accent cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="passCard"
                        checked={selectedPassCardId === pc.id}
                        onChange={() => setSelectedPassCardId(pc.id)}
                        className="rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{pc.name}</div>
                        <div className="text-xs text-muted-foreground">
                          剩余 {pc.remainingTimes}/{pc.totalTimes} 次
                          {pc.expiresAt && ` · ${new Date(pc.expiresAt).toLocaleDateString('zh-CN')}到期`}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {availableCoupons.length > 0 && (
            <div>
              <label className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={hasCoupon}
                  onChange={(e) => {
                    setSelectedCouponInstanceId(e.target.checked ? availableCoupons[0].id : null);
                  }}
                  className="rounded"
                />
                <span className="font-medium">使用优惠券</span>
              </label>

              {hasCoupon && (
                <div className="border rounded-md p-3 space-y-2">
                  {availableCoupons.map((coupon) => (
                    <label
                      key={coupon.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-accent cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="coupon"
                        checked={selectedCouponInstanceId === coupon.id}
                        onChange={() => setSelectedCouponInstanceId(coupon.id)}
                        className="rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{coupon.template.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {coupon.template.type === 'FIXED'
                            ? `减¥${(coupon.template.discount / 100).toFixed(2)}`
                            : `${coupon.template.discount / 10}折`}
                          {coupon.template.threshold > 0 &&
                            ` · 满¥${(coupon.template.threshold / 100).toFixed(2)}可用`}
                        </div>
                      </div>
                      <div className="text-primary font-medium">
                        -¥{(coupon.discount / 100).toFixed(2)}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {!hasPassCard && (
            <div>
              <label className="block text-sm font-medium mb-2">余额支付</label>
              <input
                type="number"
                min="0"
                step="0.01"
                max={remainingAfterCoupon / 100}
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(parseFloat(e.target.value) || 0)}
                placeholder={`最大可用 ¥${(remainingAfterCoupon / 100).toFixed(2)}`}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          )}

          {!hasPassCard && (
            <div>
              <label className="block text-sm font-medium mb-2">现金/扫码支付</label>
              <input
                type="number"
                min="0"
                step="0.01"
                max={remainingAfterCoupon / 100}
                value={offlineAmount}
                onChange={(e) => setOfflineAmount(parseFloat(e.target.value) || 0)}
                placeholder={`需支付 ¥${((remainingAfterCoupon - balanceAmount * 100) / 100).toFixed(2)}`}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          )}

          <div className="pt-2 space-y-2">
            {hasPassCard && (
              <div className="flex justify-between text-sm">
                <span>次卡支付</span>
                <span className="text-primary">
                  {usablePassCards.find((c) => c.id === selectedPassCardId)?.name || '次卡'}
                </span>
              </div>
            )}
            {hasCoupon && (
              <div className="flex justify-between text-sm">
                <span>优惠券</span>
                <span className="text-destructive">-¥{(couponDiscount / 100).toFixed(2)}</span>
              </div>
            )}
            {balanceAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span>余额支付</span>
                <span>¥{balanceAmount.toFixed(2)}</span>
              </div>
            )}
            {offlineAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span>现金/扫码</span>
                <span>¥{offlineAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>实付金额</span>
              <span className="text-primary">
                ¥{(hasPassCard ? 0 : (hasCoupon ? couponDiscount : 0) + balanceAmount * 100 + offlineAmount * 100) / 100}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSettle}
            disabled={loading || !isPaymentValid()}
            className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 font-bold text-lg"
          >
            {loading ? '处理中...' : '确认结算'}
          </button>
        </div>
      </div>
    </div>
  );
}