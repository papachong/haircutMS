'use client';

import { useState, useEffect } from 'react';
import { X, Check, CreditCard, Wallet, Ticket, DollarSign, Printer, Share2 } from 'lucide-react';
import { getAvailableCoupons, settleOrder, getOrderById, type CouponInstance, type PaymentInput, type Order } from '@/lib/api/orders';
import type { Member, PassCard } from '@/lib/api/orders';
import { getShopInfo, type ShopInfo } from '@/lib/api/shop';
import { getMemberById, type Member as MemberFull } from '@/lib/api/members';
import ReceiptLayout from './receipt/ReceiptLayout';
import ShareReceiptButton from './receipt/ShareReceiptButton';
import type { SelectedCoupon } from './coupon/coupon-selector';

export interface SettlementProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  originalAmount: number;
  discountAmount: number;
  payableAmount: number;
  member: Member | null;
  memberPassCards?: PassCard[];
  preselectedCoupon?: SelectedCoupon | null;
  onSettleSuccess: () => void;
  onSettleAndPrint?: (orderId: string) => void;
}

type PaymentMethod = 'BALANCE' | 'PASS_CARD' | 'OFFLINE' | 'COUPON';

interface PaymentState {
  balanceAmount: number;
  passCardAmount: number;
  passCardId?: string;
  offlineAmount: number;
  couponInstanceId?: string;
  couponDiscount: number;
}

export default function SettlementDialog({
  isOpen,
  onClose,
  orderId,
  originalAmount,
  discountAmount,
  payableAmount,
  member,
  memberPassCards = [],
  preselectedCoupon,
  onSettleSuccess,
  onSettleAndPrint,
}: SettlementProps) {
  const [loading, setLoading] = useState(false);
  const [settled, setSettled] = useState(false);
  const [settledOrder, setSettledOrder] = useState<Order | null>(null);
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [settledMember, setSettledMember] = useState<MemberFull | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<Array<CouponInstance & {
    canUse: boolean;
    discount: number;
    finalAmount: number;
    template: { id: string; name: string; type: 'FIXED' | 'PERCENT'; threshold: number; discount: number };
  }>>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [showCouponSelector, setShowCouponSelector] = useState(false);
  const [selectedCouponIndex, setSelectedCouponIndex] = useState<number | null>(null);

  const [payments, setPayments] = useState<PaymentState>({
    balanceAmount: 0,
    passCardAmount: 0,
    offlineAmount: payableAmount,
    couponDiscount: 0,
  });

  const [showPassCardSelector, setShowPassCardSelector] = useState(false);
  const [selectedPassCardIndex, setSelectedPassCardIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && member && !settled) {
      loadCoupons();
      const totalBalance = (member.giftBalance || 0) + (member.principalBalance || 0);
      const couponDiscountAmount = preselectedCoupon?.discount ?? 0;
      const adjustedPayable = payableAmount - couponDiscountAmount;

      if (preselectedCoupon) {
        const balancePayable = totalBalance > 0 ? Math.min(adjustedPayable, totalBalance) : 0;
        setPayments({
          balanceAmount: balancePayable,
          passCardAmount: 0,
          offlineAmount: Math.max(0, adjustedPayable - balancePayable),
          couponDiscount: couponDiscountAmount,
          couponInstanceId: preselectedCoupon.id,
        });
      } else if (totalBalance > 0) {
        const balancePayable = Math.min(adjustedPayable, totalBalance);
        setPayments({
          balanceAmount: balancePayable,
          passCardAmount: 0,
          offlineAmount: Math.max(0, adjustedPayable - balancePayable),
          couponDiscount: 0,
        });
      }
    }
  }, [isOpen, member, payableAmount, preselectedCoupon]);

  const loadCoupons = async () => {
    if (!member) return;
    setLoadingCoupons(true);
    try {
      const coupons = await getAvailableCoupons(member.id, payableAmount);
      setAvailableCoupons(coupons);
      if (preselectedCoupon) {
        const idx = coupons.findIndex((c) => c.id === preselectedCoupon.id);
        if (idx >= 0) {
          setSelectedCouponIndex(idx);
        }
      }
    } catch (error) {
      console.error('加载优惠券失败:', error);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const totalPaidAmount = payments.balanceAmount + payments.passCardAmount + payments.offlineAmount;
  const finalPayableAmount = payableAmount - payments.couponDiscount;
  const remainingAmount = Math.max(0, finalPayableAmount - totalPaidAmount);

  const totalBalance = (member?.giftBalance || 0) + (member?.principalBalance || 0);
  const balancePercentage = totalBalance > 0 ? (payments.balanceAmount / totalBalance) * 100 : 0;

  const handleBalanceChange = (amount: number) => {
    const newAmount = Math.max(0, Math.min(amount, totalBalance, finalPayableAmount - payments.passCardAmount));
    setPayments({
      ...payments,
      balanceAmount: newAmount,
      offlineAmount: Math.max(0, finalPayableAmount - newAmount - payments.passCardAmount),
    });
  };

  const handleOfflineChange = (amount: number) => {
    const newAmount = Math.max(0, Math.min(amount, finalPayableAmount - payments.balanceAmount - payments.passCardAmount));
    setPayments({
      ...payments,
      offlineAmount: newAmount,
    });
  };

  const handlePassCardSelect = (passCard: PassCard, index: number) => {
    setPayments({
      ...payments,
      passCardAmount: payableAmount - payments.couponDiscount,
      passCardId: passCard.id,
      balanceAmount: 0,
      offlineAmount: 0,
    });
    setSelectedPassCardIndex(index);
    setShowPassCardSelector(false);
  };

  const handleCouponSelect = (coupon: typeof availableCoupons[0], index: number) => {
    const newCouponDiscount = coupon.discount;
    const newFinalPayableAmount = payableAmount - newCouponDiscount;
    setPayments({
      ...payments,
      couponDiscount: newCouponDiscount,
      couponInstanceId: coupon.id,
      offlineAmount: Math.max(0, newFinalPayableAmount - payments.balanceAmount - payments.passCardAmount),
    });
    setSelectedCouponIndex(index);
    setShowCouponSelector(false);
  };

  const handleSettle = async () => {
    if (remainingAmount > 0) {
      alert('支付金额不足');
      return;
    }

    setLoading(true);
    try {
      const paymentInputs: PaymentInput[] = [];

      if (payments.balanceAmount > 0) {
        paymentInputs.push({
          method: 'BALANCE',
          amount: payments.balanceAmount,
        });
      }

      if (payments.passCardAmount > 0 && payments.passCardId) {
        paymentInputs.push({
          method: 'PASS_CARD',
          amount: payments.passCardAmount,
          passCardId: payments.passCardId,
        });
      }

      if (payments.offlineAmount > 0) {
        paymentInputs.push({
          method: 'OFFLINE',
          amount: payments.offlineAmount,
        });
      }

      if (payments.couponInstanceId) {
        paymentInputs.push({
          method: 'COUPON',
          amount: payments.couponDiscount,
          couponInstanceId: payments.couponInstanceId,
        });
      }

      await settleOrder(orderId, paymentInputs);

      // Fetch receipt data before marking as settled
      const [orderData, shopData] = await Promise.all([
        getOrderById(orderId),
        getShopInfo(),
      ]);
      setSettledOrder(orderData);
      setShopInfo(shopData);

      if (member?.id) {
        try {
          const memberData = await getMemberById(member.id);
          setSettledMember(memberData);
        } catch {}
      }

      setSettled(true);
      onSettleSuccess();
    } catch (error) {
      alert(`结算失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Settlement success: show receipt only
  if (settled) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
        <div className="bg-background w-full sm:max-w-md sm:rounded-lg max-h-[90vh] sm:max-h-[85vh] flex flex-col">
          <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between no-print">
            <h2 className="text-lg font-bold">结算成功</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {settledOrder && shopInfo ? (
              <ReceiptLayout
                shop={shopInfo}
                order={settledOrder}
                thermalWidth="80mm"
                memberBalance={settledMember ? {
                  principal: settledMember.principalBalance,
                  gift: settledMember.giftBalance,
                } : undefined}
                memberPassCards={settledMember?.passCards?.filter(pc => pc.isActive && pc.remainingTimes > 0).map(pc => ({
                  name: pc.name,
                  remainingTimes: pc.remainingTimes,
                }))}
              />
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <div className="border-t p-4 no-print">
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 border rounded-lg font-medium text-sm hover:bg-accent transition-colors"
              >
                完成
              </button>
              <ShareReceiptButton
                orderNo={settledOrder?.orderNo}
                shopName={shopInfo?.name}
                className="py-2.5 rounded-lg"
              />
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center justify-center gap-1.5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
              >
                <Printer className="w-4 h-4" />
                打印小票
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedCoupon = selectedCouponIndex !== null ? availableCoupons[selectedCouponIndex] : null;
  const selectedPassCard = selectedPassCardIndex !== null ? memberPassCards[selectedPassCardIndex] : null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-background w-full sm:max-w-md sm:rounded-lg max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">收银结算</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Member Info */}
        {member && (
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center gap-3">
              {member.avatar && (
                <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full" />
              )}
              <div className="flex-1">
                <div className="font-medium">{member.name}</div>
                <div className="text-sm text-muted-foreground">{member.cardNo}</div>
                <div className="text-sm text-primary">
                  {member.memberLevel.name} · {member.memberLevel.discount * 10}折
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">账户余额</div>
                <div className="font-bold text-primary">
                  ¥{((member.principalBalance + member.giftBalance) / 100).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Amount Breakdown */}
        <div className="p-4 border-b">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">原价</span>
              <span>¥{(originalAmount / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-primary">
              <span>会员折扣</span>
              <span>-¥{(discountAmount / 100).toFixed(2)}</span>
            </div>
            {payments.couponDiscount > 0 && (
              <div className="flex justify-between text-sm text-orange-500">
                <span>优惠券抵扣</span>
                <span>-¥{(payments.couponDiscount / 100).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>应付金额</span>
              <span>¥{(finalPayableAmount / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="p-4 space-y-4">
          {/* Balance Payment */}
          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-blue-500" />
                <span className="font-medium">余额支付</span>
              </div>
              <span className="text-sm text-muted-foreground">
                可用: ¥{((member?.principalBalance || 0) / 100).toFixed(2)} + ¥{((member?.giftBalance || 0) / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={totalBalance}
                step={100}
                value={payments.balanceAmount}
                onChange={(e) => handleBalanceChange(Number(e.target.value))}
                className="flex-1"
              />
              <input
                type="number"
                value={(payments.balanceAmount / 100).toFixed(2)}
                onChange={(e) => handleBalanceChange(Math.round(Number(e.target.value) * 100))}
                className="w-20 sm:w-24 px-2 py-1.5 border rounded text-right min-h-[44px]"
                step={0.01}
                min={0}
                max={totalBalance / 100}
              />
              <span className="text-sm">元</span>
            </div>
            <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${balancePercentage}%` }}
              />
            </div>
          </div>

          {/* Pass Card Payment */}
          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-500" />
                <span className="font-medium">次卡支付</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPassCardSelector(!showPassCardSelector)}
                className="text-sm text-primary"
              >
                {selectedPassCard ? '更换' : '选择次卡'}
              </button>
            </div>
            {selectedPassCard && (
              <div className="text-sm text-muted-foreground">
                {selectedPassCard.name} · 剩余 {selectedPassCard.remainingTimes} 次
              </div>
            )}
            {showPassCardSelector && (
              <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                {memberPassCards.filter(pc => pc.remainingTimes > 0 && pc.isActive).length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-2">
                    无可用次卡
                  </div>
                )}
                {memberPassCards
                  .filter(pc => pc.remainingTimes > 0 && pc.isActive)
                  .map((passCard, index) => (
                    <button
                      key={passCard.id}
                      type="button"
                      onClick={() => handlePassCardSelect(passCard, memberPassCards.indexOf(passCard))}
                      className="w-full p-2 border rounded text-left hover:bg-accent"
                    >
                      <div className="font-medium">{passCard.name}</div>
                      <div className="text-sm text-muted-foreground">
                        剩余 {passCard.remainingTimes} 次
                        {passCard.expiresAt && ` · ${new Date(passCard.expiresAt).toLocaleDateString()}`}
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Coupon */}
          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-orange-500" />
                <span className="font-medium">优惠券</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (selectedCoupon) {
                    setSelectedCouponIndex(null);
                    setPayments({ ...payments, couponDiscount: 0, couponInstanceId: undefined });
                  } else {
                    setShowCouponSelector(!showCouponSelector);
                  }
                }}
                className="text-sm text-primary"
                disabled={loadingCoupons}
              >
                {loadingCoupons ? '加载中...' : selectedCoupon ? '取消使用' : '选择优惠券'}
              </button>
            </div>
            {selectedCoupon && (
              <div className="text-sm text-orange-500">
                {selectedCoupon.template.name}
                {selectedCoupon.template.type === 'FIXED'
                  ? ` 减 ¥${(selectedCoupon.discount / 100).toFixed(2)}`
                  : ` ${selectedCoupon.template.discount / 10}折`}
              </div>
            )}
            {showCouponSelector && (
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                {availableCoupons.filter(c => c.canUse).length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-2">
                    无可用优惠券
                  </div>
                )}
                {availableCoupons
                  .filter(c => c.canUse)
                  .map((coupon, index) => (
                    <button
                      key={coupon.id}
                      type="button"
                      onClick={() => handleCouponSelect(coupon, availableCoupons.indexOf(coupon))}
                      className="w-full p-3 border rounded text-left hover:bg-accent relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs px-2 py-1 rounded-bl">
                        {coupon.template.type === 'FIXED'
                          ? `¥${(coupon.discount / 100).toFixed(2)}`
                          : `${coupon.template.discount / 10}折`}
                      </div>
                      <div className="font-medium">{coupon.template.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        门槛: ¥{(coupon.template.threshold / 100).toFixed(2)}
                        {coupon.expiresAt && ` · 有效至 ${new Date(coupon.expiresAt).toLocaleDateString()}`}
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Offline Payment */}
          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <span className="font-medium">线下支付</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={(payments.offlineAmount / 100).toFixed(2)}
                onChange={(e) => handleOfflineChange(Math.round(Number(e.target.value) * 100))}
                className="flex-1 px-2 py-1 border rounded text-right"
                step={0.01}
                min={0}
                max={finalPayableAmount / 100}
              />
              <span className="text-sm">元</span>
            </div>
          </div>
        </div>

        {/* Total Payment */}
        <div className="p-4 border-t bg-muted/30">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground">已支付</span>
            <span className="font-medium">¥{(totalPaidAmount / 100).toFixed(2)}</span>
          </div>
          {remainingAmount > 0 && (
            <div className="flex items-center justify-between mb-4 text-orange-500">
              <span>还需支付</span>
              <span className="font-bold">¥{(remainingAmount / 100).toFixed(2)}</span>
            </div>
          )}
          {remainingAmount === 0 && (
            <div className="flex items-center justify-center gap-2 text-green-500 mb-4">
              <Check className="w-5 h-5" />
              <span>支付金额已覆盖</span>
            </div>
          )}
        </div>

        {/* Confirm Button */}
        <div className="p-4 border-t">
          <button
            type="button"
            onClick={handleSettle}
            disabled={loading || remainingAmount > 0}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-bold text-lg disabled:opacity-50"
          >
            {loading ? '处理中...' : `确认结算 · ¥${(finalPayableAmount / 100).toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}