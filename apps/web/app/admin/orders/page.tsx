'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  ChevronDown,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  TrendingUp,
  ShoppingBag,
  AlertCircle,
} from 'lucide-react';
import {
  getOrders,
  getOrderStats,
  type Order,
  type OrderStats,
} from '@/lib/api/orders';
import { exportOrders } from '@/lib/api/export';

type OrderStatus = 'PENDING' | 'SETTLED' | 'CANCELLED' | 'REFUNDED';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  PENDING: { label: '待结算', color: 'text-amber-600', bg: 'bg-amber-50' },
  SETTLED: { label: '已结算', color: 'text-green-600', bg: 'bg-green-50' },
  REFUNDED: { label: '已退款', color: 'text-red-600', bg: 'bg-red-50' },
  CANCELLED: { label: '已取消', color: 'text-gray-600', bg: 'bg-gray-50' },
};

const STATUS_TABS = [
  { value: 'ALL', label: '全部' },
  { value: 'PENDING', label: '待结算' },
  { value: 'SETTLED', label: '已结算' },
  { value: 'REFUNDED', label: '已退款' },
] as const;

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);
  const [hasMore, setHasMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState<OrderStats | null>(null);

  const totalPages = Math.ceil(total / pageSize);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOrders({
        keyword: searchKeyword.trim() || undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        startDate: dateRange.start,
        endDate: dateRange.end,
        page: currentPage,
        pageSize,
      });
      setOrders(data.items);
      setTotal(data.pagination.total);
      setHasMore(data.pagination.hasMore);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  }, [searchKeyword, selectedStatus, dateRange, currentPage, pageSize]);

  const loadStats = useCallback(async () => {
    try {
      const data = await getOrderStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchKeyword]);

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedStatus('ALL');
    setDateRange({});
    setSearchKeyword('');
    setCurrentPage(1);
  };

  const hasActiveFilters = (): boolean => {
    return selectedStatus !== 'ALL' ||
      searchKeyword.trim() !== '' ||
      !!dateRange.start ||
      !!dateRange.end;
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportOrders('xlsx', dateRange.start, dateRange.end);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      alert(`导出失败: ${errorMessage}`);
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount: number) => `¥${(amount / 100).toFixed(2)}`;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">订单管理</h1>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || loading || orders.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>{exporting ? '导出中...' : '导出Excel'}</span>
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 border-b">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => handleStatusChange(tab.value)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              selectedStatus === tab.value
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + Filter row */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索订单号/会员姓名"
            className="w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent transition-colors"
        >
          <Filter className="h-4 w-4" />
          <span>日期筛选</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
        {hasActiveFilters() && (
          <button
            type="button"
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            清除筛选
          </button>
        )}
      </div>

      {/* Date Filter Panel */}
      {showFilters && (
        <div className="bg-card border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">开始日期</label>
              <input
                type="date"
                value={dateRange.start || ''}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">结束日期</label>
              <input
                type="date"
                value={dateRange.end || ''}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShoppingBag className="h-4 w-4" />
            今日订单
          </div>
          <div className="text-2xl font-bold mt-1">{stats?.todayOrderCount ?? '-'}</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            今日营业额
          </div>
          <div className="text-2xl font-bold mt-1 text-green-600">
            {stats ? formatCurrency(stats.todayRevenue) : '-'}
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            待结算
          </div>
          <div className="text-2xl font-bold mt-1 text-amber-600">{stats?.pendingCount ?? '-'}</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShoppingBag className="h-4 w-4" />
            订单总数
          </div>
          <div className="text-2xl font-bold mt-1">{total}</div>
        </div>
      </div>

      {/* Table - Desktop */}
      <div className="bg-card border rounded-lg overflow-hidden hidden md:block">
        <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/50 font-medium text-sm">
          <div className="col-span-2">订单号</div>
          <div className="col-span-2">会员</div>
          <div className="col-span-1">项目数</div>
          <div className="col-span-2">金额</div>
          <div className="col-span-1">状态</div>
          <div className="col-span-2">时间</div>
          <div className="col-span-1">操作人</div>
          <div className="col-span-1">操作</div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">加载中...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {hasActiveFilters() ? '未找到匹配的订单' : '暂无订单数据'}
          </div>
        ) : (
          orders.map((order) => {
            const statusInfo = STATUS_CONFIG[order.status as OrderStatus] || STATUS_CONFIG.PENDING;
            return (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="grid grid-cols-12 gap-4 p-4 border-b hover:bg-accent/50 transition-colors items-center"
              >
                <div className="col-span-2">
                  <div className="font-medium text-sm font-mono">{order.orderNo}</div>
                </div>

                <div className="col-span-2">
                  <div className="font-medium text-sm">{order.member.name}</div>
                  <div className="text-xs text-muted-foreground">{order.member.cardNo}</div>
                </div>

                <div className="col-span-1">
                  <span className="text-sm">{order.items.length} 项</span>
                </div>

                <div className="col-span-2">
                  <div className="text-sm">
                    <span className="font-medium">{formatCurrency(order.payableAmount)}</span>
                  </div>
                  {order.status === 'SETTLED' && (
                    <div className="text-xs text-muted-foreground">
                      实付 {formatCurrency(order.paidAmount)}
                    </div>
                  )}
                </div>

                <div className="col-span-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color} ${statusInfo.bg}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <div className="col-span-2">
                  <div className="text-sm">{formatDate(order.createdAt)}</div>
                </div>

                <div className="col-span-1">
                  <div className="text-xs text-muted-foreground">
                    {order.items[0]?.staffName || '-'}
                  </div>
                </div>

                <div className="col-span-1">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">加载中...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {hasActiveFilters() ? '未找到匹配的订单' : '暂无订单数据'}
          </div>
        ) : (
          orders.map((order) => {
            const statusInfo = STATUS_CONFIG[order.status as OrderStatus] || STATUS_CONFIG.PENDING;
            return (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="bg-card border rounded-lg p-4 hover:border-primary transition-colors block"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-medium">{order.orderNo}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDate(order.createdAt)}
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.color} ${statusInfo.bg}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{order.member.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {order.member.cardNo} · {order.member.memberLevel?.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(order.payableAmount)}</div>
                    <div className="text-xs text-muted-foreground">
                      {order.items.length} 项服务
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            上一页
          </button>
          <span className="text-sm text-muted-foreground">
            第 {currentPage} / {totalPages} 页
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
