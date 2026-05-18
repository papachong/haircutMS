'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, CheckCircle2, XCircle, Search } from 'lucide-react';
import { getOrders, type Order } from '../../../../lib/api/orders';

type OrderStatus = 'PENDING' | 'SETTLED' | 'CANCELLED' | 'REFUNDED';

const statusConfig: Record<OrderStatus, { label: string; icon: typeof CheckCircle2; color: string }> = {
  PENDING: { label: '待结算', icon: Clock, color: 'text-yellow-500' },
  SETTLED: { label: '已结算', icon: CheckCircle2, color: 'text-green-500' },
  CANCELLED: { label: '已撤销', icon: XCircle, color: 'text-red-500' },
  REFUNDED: { label: '已退款', icon: XCircle, color: 'text-red-500' },
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'ALL'>('ALL');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await getOrders();
      setOrders(data.items);
    } catch (error) {
      console.error('加载订单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      !searchTerm ||
      order.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.member.cardNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();

    const time = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `今天 ${time}`;
    if (isYesterday) return `昨天 ${time}`;
    return `${date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })} ${time}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b p-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 hover:bg-accent rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">订单记录</h1>
      </div>

      {/* Search and Filter */}
      <div className="p-4 space-y-3 border-b bg-muted/30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索订单号/会员/卡号"
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedStatus('ALL')}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
              selectedStatus === 'ALL'
                ? 'bg-primary text-primary-foreground'
                : 'bg-accent'
            }`}
          >
            全部
          </button>
          {Object.entries(statusConfig).map(([status, config]) => (
            <button
              key={status}
              type="button"
              onClick={() => setSelectedStatus(status as OrderStatus)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap flex items-center gap-1 ${
                selectedStatus === status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-accent'
              }`}
            >
              <config.icon className="w-3 h-3" />
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="p-4">
        {filteredOrders.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            {searchTerm || selectedStatus !== 'ALL' ? '没有找到匹配的订单' : '暂无订单记录'}
          </div>
        )}

        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const StatusIcon = statusConfig[order.status as OrderStatus].icon;
            return (
              <button
                key={order.id}
                type="button"
                onClick={() => router.push(`/m/orders/${order.id}`)}
                className="w-full bg-card border rounded-lg p-4 text-left"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-medium">{order.orderNo}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {order.member.name} · {order.member.cardNo}
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${statusConfig[order.status as OrderStatus].color}`}>
                    <StatusIcon className="w-4 h-4" />
                    {statusConfig[order.status as OrderStatus].label}
                  </div>
                </div>

                <div className="space-y-1 text-sm mb-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-muted-foreground">
                      <span>{item.serviceName} x{item.quantity}</span>
                      <span>¥{(item.finalPrice / 100).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</span>
                  <span className="font-bold">¥{(order.paidAmount / 100).toFixed(2)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}