'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  CreditCard,
  User,
  Scissors,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
} from 'lucide-react';
import { getOrderById, cancelOrder, type Order } from '../../../../../lib/api/orders';
import { getAuditLogs, ACTION_LABELS, type AuditLog } from '../../../../../lib/api/audit';

type OrderStatus = 'PENDING' | 'SETTLED' | 'CANCELLED' | 'REFUNDED';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  PENDING: { label: '待结算', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock },
  SETTLED: { label: '已结算', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle },
  CANCELLED: { label: '已取消', color: 'text-gray-600', bg: 'bg-gray-50', icon: XCircle },
  REFUNDED: { label: '已退款', color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle },
};

const PAYMENT_LABELS: Record<string, string> = {
  BALANCE: '余额支付',
  PASS_CARD: '次卡支付',
  OFFLINE: '线下支付',
  COUPON: '优惠券',
};

export default function MobileOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadData();
  }, [orderId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [orderData, auditData] = await Promise.all([
        getOrderById(orderId),
        getAuditLogs({ targetId: orderId, pageSize: 50 }),
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
    if (!cancelReason.trim()) return;
    setCancelling(true);
    try {
      await cancelOrder(orderId, cancelReason);
      setShowCancelDialog(false);
      setCancelReason('');
      await loadData();
    } catch (error) {
      console.error('Failed to cancel order:', error);
    } finally {
      setCancelling(false);
    }
  };

  const formatCurrency = (amount: number) => `¥${(amount / 100).toFixed(2)}`;

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 bg-background border-b p-3 flex items-center gap-2">
          <button type="button" onClick={() => router.back()} className="p-2 hover:bg-accent rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-medium">订单详情</span>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-destructive">订单不存在</div>
        </div>
      </div>
    );
  }

  const statusConf = STATUS_CONFIG[order.status as OrderStatus] || STATUS_CONFIG.PENDING;
  const StatusIcon = statusConf.icon;
  const canCancel = order.status === 'SETTLED';

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b p-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => router.back()} className="p-2 hover:bg-accent rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-medium">订单详情</span>
        </div>
        {canCancel && (
          <button
            type="button"
            onClick={() => setShowCancelDialog(true)}
            className="px-3 py-1.5 text-sm text-destructive border border-destructive rounded-md"
          >
            撤销
          </button>
        )}
      </div>

      {/* Status Banner */}
      <div className={`${statusConf.bg} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-5 h-5 ${statusConf.color}`} />
          <span className={`font-medium ${statusConf.color}`}>{statusConf.label}</span>
        </div>
        <span className="text-xs text-muted-foreground font-mono">{order.orderNo}</span>
      </div>

      {/* Member Card */}
      <div className="m-3 bg-card border rounded-lg p-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm">{order.member.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {order.member.cardNo} · {order.member.memberLevel?.name}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">{order.member.phone}</div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="m-3 bg-card border rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b bg-muted/50">
          <Scissors className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">服务项目</span>
        </div>
        <div className="divide-y">
          {order.items.map((item) => (
            <div key={item.id} className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{item.serviceName}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {item.staffName} · x{item.quantity}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-medium text-sm">{formatCurrency(item.finalPrice)}</div>
                  {item.discountRate < 1 && (
                    <div className="text-xs text-primary">{(item.discountRate * 10).toFixed(0)}折</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Summary */}
      <div className="m-3 bg-card border rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b bg-muted/50">
          <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">支付明细</span>
        </div>
        <div className="p-3 space-y-2">
          {order.payments.length > 0 ? (
            order.payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {PAYMENT_LABELS[payment.method] || payment.method}
                </span>
                <span className="font-medium">{formatCurrency(payment.amount)}</span>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground text-center py-2">暂无支付记录</div>
          )}

          <div className="border-t pt-2 mt-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">原价</span>
              <span>{formatCurrency(order.originalAmount)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">折扣</span>
                <span className="text-primary">-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-1">
              <span>应收</span>
              <span>{formatCurrency(order.payableAmount)}</span>
            </div>
            {order.paidAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>实收</span>
                <span>{formatCurrency(order.paidAmount)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Time Info */}
      <div className="m-3 bg-card border rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b bg-muted/50">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">时间信息</span>
        </div>
        <div className="p-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">创建</span>
            <span>{formatDateTime(order.createdAt)}</span>
          </div>
          {order.settledAt && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">结算</span>
              <span>{formatDateTime(order.settledAt)}</span>
            </div>
          )}
          {order.cancelledAt && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">取消</span>
              <span>{formatDateTime(order.cancelledAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Remark */}
      {order.remark && (
        <div className="m-3 bg-card border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-medium">备注</span>
          </div>
          <div className="text-sm text-muted-foreground">{order.remark}</div>
        </div>
      )}

      {/* Cancel Reason */}
      {order.status === 'REFUNDED' && order.cancelReason && (
        <div className="m-3 bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-destructive">撤销原因</div>
              <div className="text-sm text-destructive/80 mt-0.5">{order.cancelReason}</div>
            </div>
          </div>
        </div>
      )}

      {/* Operation Logs */}
      <div className="m-3 bg-card border rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b bg-muted/50">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">操作记录</span>
        </div>
        <div className="divide-y">
          {auditLogs.length > 0 ? (
            auditLogs.map((log) => (
              <div key={log.id} className="px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="font-medium">{ACTION_LABELS[log.action] || log.action}</span>
                      {log.staff && (
                        <span className="text-xs text-muted-foreground">{log.staff.name}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDateTime(log.createdAt)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-3 text-center text-sm text-muted-foreground">暂无操作记录</div>
          )}
        </div>
      </div>

      {/* Cancel Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-background rounded-t-xl sm:rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold">撤销订单</h2>
              <button
                type="button"
                onClick={() => setShowCancelDialog(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-yellow-800">
                    撤销后余额和次卡将自动恢复，此操作不可撤销。
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  撤销原因 <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="请输入撤销原因"
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-sm"
                />
              </div>

              <div className="flex gap-3 pb-2">
                <button
                  type="button"
                  onClick={() => setShowCancelDialog(false)}
                  className="flex-1 px-4 py-2.5 border rounded-md hover:bg-accent transition-colors text-sm"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={cancelling || !cancelReason.trim()}
                  className="flex-1 px-4 py-2.5 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors disabled:opacity-50 text-sm"
                >
                  {cancelling ? '处理中...' : '确认撤销'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
