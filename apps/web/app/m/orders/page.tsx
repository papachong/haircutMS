'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  AlertCircle,
  Eye,
  CreditCard,
} from 'lucide-react';
import {
  getOrders,
  getOrderStats,
  type Order,
  type OrderStats,
} from '../../../../lib/api/orders';
import { usePullRefresh } from '../../../../hooks/use-pull-refresh';
import PullRefreshIndicator from '../../../../components/mobile/pull-refresh-indicator';
import SwipeableItem from '../../../../components/mobile/swipeable-item';

type OrderStatus = 'PENDING' | 'SETTLED' | 'CANCELLED' | 'REFUNDED';

const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: typeof CheckCircle2; color: string }> = {
  PENDING: { label: '待结算', icon: Clock, color: 'text-yellow-500' },
  SETTLED: { label: '已结算', icon: CheckCircle2, color: 'text-green-500' },
  CANCELLED: { label: '已撤销', icon: XCircle, color: 'text-gray-500' },
  REFUNDED: { label: '已退款', icon: XCircle, color: 'text-red-500' },
};

const STATUS_TABS = [
  { value: 'ALL', label: '全部' },
  { value: 'PENDING', label: '待结算' },
  { value: 'SETTLED', label: '已结算' },
  { value: 'REFUNDED', label: '已退款' },
] as const;

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [stats, setStats] = useState<OrderStats | null>(null);

  const loadOrders = useCallback(async (page: number, append = false) => {
    if (!append) setLoading(true);
    try {
      const data = await getOrders({
        keyword: searchTerm.trim() || undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        page,
        pageSize: 20,
      });
      if (append) {
        setOrders((prev) => [...prev, ...data.items]);
      } else {
        setOrders(data.items);
      }
      setHasMore(data.pagination.hasMore);
      setCurrentPage(page);
    } catch (error) {
      console.error('加载订单失败:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedStatus]);

  const loadStats = useCallback(async () => {
    try {
      const data = await getOrderStats();
      setStats(data);
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  }, []);

  // Pull-to-refresh
  const { containerRef, pulling, refreshing, pullDistance } = usePullRefresh(async () => {
    await Promise.all([loadOrders(1), loadStats()]);
  });

  useEffect(() => {
    loadOrders(1);
  }, [loadOrders]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleStatusChange = (status: OrderStatus | 'ALL') => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const loadMore = () => {
    if (!hasMore || loading) return;
    loadOrders(currentPage + 1, true);
  };

  const handleQuickSettle = (order: Order) => {
    // Navigate to order detail page for settlement (requires payment selection)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    router.push(`/m/orders/${order.id}`);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const time = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `今天 ${time}`;
    if (isYesterday) return `昨天 ${time}`;
    return `${date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })} ${time}`;
  };

  const formatCurrency = (amount: number) => `¥${(amount / 100).toFixed(2)}`;

  return (
    <div className="min-h-screen bg-background">
      <div
        ref={containerRef}
        className="flex flex-col h-screen overflow-auto"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Pull-to-refresh indicator */}
        <PullRefreshIndicator
          pulling={pulling}
          refreshing={refreshing}
          pullDistance={pullDistance}
        />

        {/* Header */}
        <div className="sticky top-0 bg-background border-b p-3 sm:p-4 flex items-center gap-2 sm:gap-3 z-10">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center hover:bg-accent rounded-full active:scale-95 transition-transform"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <h1 className="text-base sm:text-lg font-bold">订单记录</h1>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-2 p-3 border-b bg-muted/30">
          <div className="text-center py-2">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <ShoppingBag className="w-3 h-3" />
              今日订单
            </div>
            <div className="text-lg font-bold mt-0.5">{stats?.todayOrderCount ?? '-'}</div>
          </div>
          <div className="text-center py-2">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3" />
              今日营收
            </div>
            <div className="text-lg font-bold mt-0.5 text-green-600">
              {stats ? formatCurrency(stats.todayRevenue) : '-'}
            </div>
          </div>
          <div className="text-center py-2">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <AlertCircle className="w-3 h-3" />
              待结算
            </div>
            <div className="text-lg font-bold mt-0.5 text-amber-600">{stats?.pendingCount ?? '-'}</div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="p-3 sm:p-4 space-y-3 border-b bg-muted/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索订单号/会员/卡号"
              className="w-full pl-10 pr-4 py-3 border rounded-lg text-sm min-h-[44px]"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleStatusChange(tab.value)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors min-h-[36px] ${
                  selectedStatus === tab.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-accent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="p-3 sm:p-4 flex-1">
          {loading && orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-muted-foreground">加载中...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              {searchTerm || selectedStatus !== 'ALL' ? '没有找到匹配的订单' : '暂无订单记录'}
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const StatusIcon = STATUS_CONFIG[order.status as OrderStatus]?.icon || Clock;
                const statusConf = STATUS_CONFIG[order.status as OrderStatus] || STATUS_CONFIG.PENDING;
                const isPending = order.status === 'PENDING';

                return (
                  <SwipeableItem
                    key={order.id}
                    rightAction={
                      isPending
                        ? {
                            label: '结算',
                            color: '#22c55e',
                            icon: <CreditCard className="h-4 w-4" />,
                          }
                        : undefined
                    }
                    leftAction={{
                      label: '详情',
                      color: '#3b82f6',
                      icon: <Eye className="h-4 w-4" />,
                    }}
                    onSwipeRight={isPending ? () => handleQuickSettle(order) : undefined}
                    onSwipeLeft={() => router.push(`/m/orders/${order.id}`)}
                  >
                    <div className="p-3 sm:p-4">
                      <div className="flex items-start justify-between mb-2 sm:mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm sm:text-base truncate">{order.orderNo}</div>
                          <div className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                            {order.member.name} · {order.member.cardNo}
                          </div>
                        </div>
                        <div className={`flex items-center gap-1 text-xs sm:text-sm ${statusConf.color} shrink-0 ml-2`}>
                          <StatusIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>{statusConf.label}</span>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs sm:text-sm mb-2 sm:mb-3">
                        {order.items.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex justify-between text-muted-foreground">
                            <span className="truncate max-w-[60%]">{item.serviceName} x{item.quantity}</span>
                            <span className="shrink-0">{formatCurrency(item.finalPrice)}</span>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            还有 {order.items.length - 3} 项...
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</span>
                        <span className="font-bold text-sm sm:text-base">{formatCurrency(order.payableAmount)}</span>
                      </div>
                    </div>
                  </SwipeableItem>
                );
              })}
            </div>
          )}

          {/* Load More */}
          {hasMore && (
            <button
              type="button"
              onClick={loadMore}
              disabled={loading}
              className="w-full mt-4 py-4 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] active:bg-accent/50 rounded-xl"
            >
              {loading ? '加载中...' : '加载更多'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
