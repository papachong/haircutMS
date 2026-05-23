'use client';

import type { ShopInfo } from '../../lib/api/shop';
import type { Order } from '../../lib/api/orders';

interface MemberBalance {
  principal: number;
  gift: number;
}

interface MemberPassCard {
  name: string;
  remainingTimes: number;
  expiresAt?: string;
}

interface ReceiptLayoutProps {
  shop: ShopInfo;
  order: Order;
  thermalWidth?: '58mm' | '80mm' | 'full';
  memberBalance?: MemberBalance;
  memberPassCards?: MemberPassCard[];
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  BALANCE: '余额支付',
  PASS_CARD: '次卡支付',
  OFFLINE: '线下支付',
  COUPON: '优惠券',
};

function formatAmount(amount: number): string {
  return (amount / 100).toFixed(2);
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  const second = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

export default function ReceiptLayout({ shop, order, thermalWidth = '80mm', memberBalance, memberPassCards }: ReceiptLayoutProps) {
  const widthClass =
    thermalWidth === '58mm'
      ? 'receipt-thermal-58'
      : thermalWidth === '80mm'
        ? 'receipt-thermal-80'
        : '';

  return (
    <div id="receipt-container" className={`receipt-container ${widthClass} mx-auto bg-white text-black text-xs leading-relaxed`}>
      <div className="p-4 receipt-content">
        {/* Shop Header */}
        <div className="text-center mb-3">
          {shop.logo && (
            <img
              src={shop.logo}
              alt={shop.name}
              className="mx-auto mb-2 max-h-12 object-contain"
            />
          )}
          <div className="text-base font-bold">{shop.name}</div>
          {shop.address && (
            <div className="text-[10px] mt-0.5 text-gray-600">{shop.address}</div>
          )}
          {shop.phone && (
            <div className="text-[10px] text-gray-600">电话: {shop.phone}</div>
          )}
        </div>

        {/* Dashed Divider */}
        <div className="border-t border-dashed border-gray-400 my-3" />

        {/* Order Meta */}
        <div className="space-y-1 mb-3">
          <div className="flex justify-between">
            <span>单号:</span>
            <span className="font-mono">{order.orderNo}</span>
          </div>
          <div className="flex justify-between">
            <span>时间:</span>
            <span>{formatDateTime(order.createdAt)}</span>
          </div>
          {order.settledAt && (
            <div className="flex justify-between">
              <span>结算:</span>
              <span>{formatDateTime(order.settledAt)}</span>
            </div>
          )}
        </div>

        {/* Dashed Divider */}
        <div className="border-t border-dashed border-gray-400 my-3" />

        {/* Service Items Table */}
        <div className="mb-3">
          <div className="font-bold mb-2">服务项目</div>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id}>
                <div className="font-medium">{item.serviceName}</div>
                <div className="flex justify-between text-[10px] text-gray-600">
                  <span>{item.staffName}</span>
                  <span>
                    x{item.quantity} &nbsp;
                    ¥{formatAmount(item.unitPrice)}/项
                  </span>
                </div>
                <div className="text-right font-medium">
                  ¥{formatAmount(item.finalPrice)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dashed Divider */}
        <div className="border-t border-dashed border-gray-400 my-3" />

        {/* Amount Summary */}
        <div className="space-y-1 mb-3">
          <div className="flex justify-between">
            <span>原价</span>
            <span>¥{formatAmount(order.originalAmount)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>会员折扣</span>
              <span>-¥{formatAmount(order.discountAmount)}</span>
            </div>
          )}
          {order.couponAmount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>优惠券</span>
              <span>-¥{formatAmount(order.couponAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm pt-1 border-t border-gray-300">
            <span>应付</span>
            <span>¥{formatAmount(order.payableAmount)}</span>
          </div>
          {order.paidAmount > 0 && (
            <div className="flex justify-between font-bold text-green-700">
              <span>实付</span>
              <span>¥{formatAmount(order.paidAmount)}</span>
            </div>
          )}
        </div>

        {/* Payment Breakdown */}
        {order.payments.length > 0 && (
          <>
            <div className="border-t border-dashed border-gray-400 my-3" />
            <div className="space-y-1 mb-3">
              <div className="font-bold mb-1">支付方式</div>
              {order.payments.map((payment) => (
                <div key={payment.id} className="flex justify-between">
                  <span>{PAYMENT_METHOD_LABELS[payment.method] || payment.method}</span>
                  <span>¥{formatAmount(payment.amount)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Member Info */}
        {order.member && (
          <>
            <div className="border-t border-dashed border-gray-400 my-3" />
            <div className="space-y-1 mb-3">
              <div className="font-bold mb-1">会员信息</div>
              <div className="flex justify-between">
                <span>姓名</span>
                <span>{order.member.name}</span>
              </div>
              <div className="flex justify-between">
                <span>卡号</span>
                <span className="font-mono">{order.member.cardNo}</span>
              </div>
              {order.member.memberLevel && (
                <div className="flex justify-between">
                  <span>等级</span>
                  <span>{order.member.memberLevel.name}</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Member Balance */}
        {memberBalance && (
          <>
            <div className="border-t border-dashed border-gray-400 my-3" />
            <div className="space-y-1 mb-3">
              <div className="font-bold mb-1">账户余额</div>
              <div className="flex justify-between">
                <span>本金余额</span>
                <span>¥{formatAmount(memberBalance.principal)}</span>
              </div>
              <div className="flex justify-between">
                <span>赠送余额</span>
                <span>¥{formatAmount(memberBalance.gift)}</span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-gray-300">
                <span>总余额</span>
                <span>¥{formatAmount(memberBalance.principal + memberBalance.gift)}</span>
              </div>
            </div>
          </>
        )}

        {/* Member Pass Cards */}
        {memberPassCards && memberPassCards.length > 0 && (
          <>
            <div className="border-t border-dashed border-gray-400 my-3" />
            <div className="space-y-1 mb-3">
              <div className="font-bold mb-1">次卡信息</div>
              {memberPassCards.map((pc) => (
                <div key={pc.name} className="flex justify-between">
                  <span>{pc.name}</span>
                  <span>剩余 {pc.remainingTimes} 次</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Remark */}
        {order.remark && (
          <>
            <div className="border-t border-dashed border-gray-400 my-3" />
            <div className="mb-3">
              <span className="font-bold">备注: </span>
              <span>{order.remark}</span>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="border-t border-dashed border-gray-400 my-3" />
        <div className="text-center text-[10px] text-gray-500 mt-3">
          <div>谢谢惠顾，欢迎下次光临！</div>
          <div className="mt-1">
            {shop.phone && `客服电话: ${shop.phone}`}
          </div>
        </div>
      </div>
    </div>
  );
}
