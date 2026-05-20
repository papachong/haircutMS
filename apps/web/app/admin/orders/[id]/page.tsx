'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  CreditCard,
  User,
  Scissors,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  ChevronRight,
  Printer,
} from 'lucide-react';
import { getOrderById, cancelOrder, type Order } from '../../../lib/api/orders';
import { getAuditLogs, ACTION_LABELS, type AuditLog } from '../../../lib/api/audit';

const ORDER_STATUS_CONFIG = {
  PENDING: {
    label: '待结算',
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    icon: Clock,
  },
  SETTLED: {
    label: '已结算',
    color: 'text-green-600 bg-green-50 border-green-200',
    icon: CheckCircle,
  },
  CANCELLED: {
    label: '已取消',
    color: 'text-gray-600 bg-gray-50 border-gray-200',
    icon: XCircle,
  },
  REFUNDED: {
    label: '已退款',
    color: 'text-red-600 bg-red-50 border-red-200',
    icon: AlertTriangle,
  },
} as const;

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  BALANCE: '余额支付',
  PASS_CARD: '次卡支付',
  OFFLINE: '线下支付',
  COUPON: '优惠券',
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    loadData();
  }, [orderId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [orderData, auditData] = await Promise.all([
        getOrderById(orderId),
        getAuditLogs({
          targetId: orderId,
          pageSize: 50,
        }),
      ]);
      setOrder(orderData);
      setAuditLogs(auditData.items);
    } catch (error) {
      console.error('Failed to load order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      alert('请输入取消原因');
      return;
    }

    setCancelling(true);
    try {
      await cancelOrder(orderId, cancelReason);
      setShowCancelDialog(false);
      setCancelReason('');
      await loadData();
    } catch (error) {
      console.error('Failed to cancel order:', error);
      alert('取消失败，请重试');
    } finally {
      setCancelling(false);
    }
  };

  const canCancel = order?.status === 'SETTLED';

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/admin" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">订单详情</span>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/admin" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">订单详情</span>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-destructive">订单不存在</div>
        </div>
      </div>
    );
  }

  const statusConfig = ORDER_STATUS_CONFIG[order.status as keyof typeof ORDER_STATUS_CONFIG] || ORDER_STATUS_CONFIG.PENDING;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold">订单详情</span>
        </div>
        {canCancel && (
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/orders/${orderId}/print`}
              className="flex items-center gap-1.5 px-4 py-2 border rounded-md hover:bg-accent transition-colors"
            >
              <Printer className="h-4 w-4" />
              打印小票
            </Link>
            <button
              type="button"
              onClick={() => setShowCancelDialog(true)}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
            >
              取消订单
            </button>
          </div>
        )}
      </div>

      {/* Order Basic Info */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold">{order.orderNo}</h2>
            <div className="text-sm text-muted-foreground mt-1">
              创建时间: {new Date(order.createdAt).toLocaleString('zh-CN')}
            </div>
          </div>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${statusConfig.color}`}>
            <StatusIcon className="h-4 w-4" />
            <span className="font-medium">{statusConfig.label}</span>
          </div>
        </div>

        {order.remark && (
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium">备注</div>
                <div className="text-sm text-muted-foreground mt-1">{order.remark}</div>
              </div>
            </div>
          </div>
        )}

        {order.status === 'REFUNDED' && order.cancelReason && (
          <div className="bg-destructive/10 rounded-lg p-4 mt-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-destructive">取消原因</div>
                <div className="text-sm text-destructive/80 mt-1">{order.cancelReason}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Member Info */}
      <Link
        href={`/admin/members/${order.member.id}`}
        className="bg-card border rounded-lg p-6 hover:border-primary transition-colors block"
      >
        <div className="flex items-start gap-4">
          {order.member.avatar ? (
            <img
              src={order.member.avatar}
              alt={order.member.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{order.member.name}</div>
                <div className="text-sm text-muted-foreground mt-1">{order.member.phone}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-4 mt-3 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">卡号:</span>
                <span className="font-mono">{order.member.cardNo}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">等级:</span>
                <span className="text-primary font-medium">{order.member.memberLevel.name}</span>
                <span className="text-muted-foreground">
                  ({(order.member.memberLevel.discount * 10).toFixed(0)}折)
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Order Items */}
      <div className="bg-card border rounded-lg">
        <div className="flex items-center gap-2 p-4 border-b bg-muted/50">
          <Scissors className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">订单项目</h3>
        </div>
        <div className="divide-y">
          {order.items.map((item) => (
            <div key={item.id} className="p-4">
              <div className="flex items-start gap-4">
                {item.serviceItem.image ? (
                  <img
                    src={item.serviceItem.image}
                    alt={item.serviceName}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                    <Scissors className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">{item.serviceName}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {item.staffName} · {item.staff.role === 'STYLIST' ? '发型师' : '技师'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">¥{(item.finalPrice / 100).toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">
                        ¥{(item.unitPrice / 100).toFixed(2)} × {item.quantity}
                      </div>
                    </div>
                  </div>
                  {item.discountRate < 1 && (
                    <div className="text-xs text-primary mt-1">
                      会员折扣: {(item.discountRate * 10).toFixed(0)}折
                      <span className="text-muted-foreground ml-2">
                        (原价 ¥{(item.subtotal / 100).toFixed(2)})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Summary */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">支付明细</h3>
        </div>

        <div className="space-y-3 mb-6">
          {order.payments.length > 0 ? (
            order.payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between py-2 border-b border-dashed last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {PAYMENT_METHOD_LABELS[payment.method] || payment.method}
                  </span>
                  {payment.createdAt && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(payment.createdAt).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
                <span className="font-medium">¥{(payment.amount / 100).toFixed(2)}</span>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground text-center py-4">暂无支付记录</div>
          )}
        </div>

        {/* Amount Summary */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">原价</span>
            <span>¥{(order.originalAmount / 100).toFixed(2)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">会员折扣</span>
              <span className="text-primary">-¥{(order.discountAmount / 100).toFixed(2)}</span>
            </div>
          )}
          {order.couponAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">优惠券</span>
              <span className="text-primary">-¥{(order.couponAmount / 100).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-2">
            <span>应收金额</span>
            <span>¥{(order.payableAmount / 100).toFixed(2)}</span>
          </div>
          {order.paidAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>实收金额</span>
              <span>¥{(order.paidAmount / 100).toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Time Info */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">时间信息</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">创建时间</div>
            <div className="font-medium mt-1">
              {new Date(order.createdAt).toLocaleString('zh-CN')}
            </div>
          </div>
          {order.settledAt && (
            <div>
              <div className="text-sm text-muted-foreground">结算时间</div>
              <div className="font-medium mt-1">
                {new Date(order.settledAt).toLocaleString('zh-CN')}
              </div>
            </div>
          )}
          {order.cancelledAt && (
            <div>
              <div className="text-sm text-muted-foreground">取消时间</div>
              <div className="font-medium mt-1">
                {new Date(order.cancelledAt).toLocaleString('zh-CN')}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Operation Logs */}
      <div className="bg-card border rounded-lg">
        <div className="flex items-center gap-2 p-4 border-b bg-muted/50">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">操作记录</h3>
        </div>
        <div className="divide-y">
          {auditLogs.length > 0 ? (
            auditLogs.map((log) => (
              <div key={log.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                      {log.staff && (
                        <span className="text-sm text-muted-foreground">
                          · {log.staff.name}
                        </span>
                      )}
                    </div>
                    {log.detail && typeof log.detail === 'object' && (
                      <div className="text-xs text-muted-foreground mt-1 truncate max-w-md">
                        {JSON.stringify(log.detail, null, 2)}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">
                    {new Date(log.createdAt).toLocaleString('zh-CN')}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">暂无操作记录</div>
          )}
        </div>
      </div>

      {/* Cancel Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold">取消订单</h2>
              <button
                type="button"
                onClick={() => setShowCancelDialog(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    取消订单后，会员余额和次卡将自动恢复。此操作不可撤销。
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  取消原因 <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="请输入取消原因"
                  rows={4}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCancelDialog(false)}
                  className="flex-1 px-4 py-2 border rounded-md hover:bg-accent transition-colors"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors disabled:opacity-50"
                >
                  {cancelling ? '处理中...' : '确认取消'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}