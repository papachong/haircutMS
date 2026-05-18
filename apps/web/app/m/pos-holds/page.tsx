'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPendingOrders, deleteOrder, getOrders, type Order } from '../../../lib/api/orders';

export default function HoldsPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { items, pagination } = await getOrders({ status: 'PENDING', pageSize: 50 });
      setOrders(items);
      setTotal(pagination.total);
    } catch (error) {
      alert(`加载挂单失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResume = (order: Order) => {
    // Store order data for resume
    const heldOrderData = {
      orderId: order.id,
      orderNo: order.orderNo,
      member: order.member,
      items: order.items.map((item) => ({
        id: item.id,
        serviceName: item.serviceName,
        staffName: item.staffName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        subtotal: item.subtotal,
        discountRate: item.discountRate,
        finalPrice: item.finalPrice,
      })),
    };
    localStorage.setItem('pos_held_order', JSON.stringify(heldOrderData));
    router.push(`/m/pos?resume=${order.id}`);
  };

  const handleCancel = async (orderId: string, orderNo: string) => {
    if (!confirm(`确认取消挂单 ${orderNo.slice(-8)}?`)) {
      return;
    }

    setDeletingId(orderId);
    try {
      await deleteOrder(orderId);
      await loadOrders();
    } catch (error) {
      alert(`取消挂单失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    return date.toLocaleDateString('zh-CN');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background border-b p-4 z-10">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => router.push('/m/pos')} className="text-2xl">
            ←
          </button>
          <h1 className="text-lg font-bold">挂单列表</h1>
          <span className="ml-auto text-sm text-muted-foreground">
            {total} 单
          </span>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-muted-foreground">加载中...</div>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-muted-foreground">
            <div className="text-4xl mb-4">📋</div>
            <div>暂无挂单</div>
            <button
              type="button"
              onClick={() => router.push('/m/pos')}
              className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              开始收银
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-card border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-bold text-lg">{order.orderNo.slice(-8)}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(order.createdAt)} {formatTime(order.createdAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-primary">
                      ¥{(order.payableAmount / 100).toFixed(2)}
                    </div>
                  </div>
                </div>

                {order.member && (
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                    <span className="text-muted-foreground">会员:</span>
                    <span className="font-medium">{order.member.name}</span>
                    <span className="text-xs text-muted-foreground">({order.member.cardNo})</span>
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  {order.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.serviceName} ×{item.quantity}
                      </span>
                      <span>¥{(item.finalPrice / 100).toFixed(2)}</span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="text-sm text-muted-foreground">
                      等 {order.items.length} 个项目
                    </div>
                  )}
                  {order.remark && (
                    <div className="text-sm text-muted-foreground mt-2 italic">
                      备注: {order.remark}
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleResume(order)}
                    className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
                  >
                    恢复结算
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCancel(order.id, order.orderNo)}
                    disabled={deletingId === order.id}
                    className="px-4 py-2 bg-accent text-destructive rounded-lg font-medium disabled:opacity-50"
                  >
                    {deletingId === order.id ? '删除中...' : '取消'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}