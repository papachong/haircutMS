'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Calendar, Filter, ChevronDown, Eye, CheckCircle, XCircle, Clock, DollarSign, Download } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [hasMore, setHasMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);

  const statusOptions = [
    { value: 'ALL', label: '全部状态', icon: Filter },
    { value: 'PENDING', label: '待结算', icon: Clock, color: 'text-amber-500' },
    { value: 'SETTLED', label: '已结算', icon: CheckCircle, color: 'text-green-500' },
    { value: 'REFUNDED', label: '已退款', icon: XCircle, color: 'text-red-500' },
  ];

  useEffect(() => {
    loadOrders();
  }, [currentPage, pageSize, selectedStatus, dateRange]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setCurrentPage(1);
      loadOrders();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchKeyword, selectedMemberId]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(currentPage));
      params.append('pageSize', String(pageSize));

      if (searchKeyword.trim()) {
        params.append('keyword', searchKeyword.trim());
      }

      if (selectedStatus !== 'ALL') {
        params.append('status', selectedStatus);
      }

      if (selectedMemberId) {
        params.append('memberId', selectedMemberId);
      }

      if (dateRange.start) {
        params.append('startDate', dateRange.start);
      }

      if (dateRange.end) {
        params.append('endDate', dateRange.end);
      }

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/v1/orders?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.code === 0) {
        setOrders(data.data.items);
        setTotal(data.data.pagination.total);
        setHasMore(data.data.pagination.hasMore);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.error('Failed to load orders:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchKeyword(value);
  };

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
    setSelectedMemberId('');
    setDateRange({});
    setSearchKeyword('');
    setCurrentPage(1);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();

      if (searchKeyword.trim()) {
        params.append('keyword', searchKeyword.trim());
      }

      if (selectedStatus !== 'ALL') {
        params.append('status', selectedStatus);
      }

      if (selectedMemberId) {
        params.append('memberId', selectedMemberId);
      }

      if (dateRange.start) {
        params.append('startDate', dateRange.start);
      }

      if (dateRange.end) {
        params.append('endDate', dateRange.end);
      }

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/v1/orders/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('导出失败');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      a.download = `orders_${dateStr}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.error('Export failed:', errorMessage);
      alert(`导出失败: ${errorMessage}`);
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; bg: string }> = {
      PENDING: { label: '待结算', color: 'text-amber-600', bg: 'bg-amber-50' },
      SETTLED: { label: '已结算', color: 'text-green-600', bg: 'bg-green-50' },
      REFUNDED: { label: '已退款', color: 'text-red-600', bg: 'bg-red-50' },
      CANCELLED: { label: '已取消', color: 'text-gray-600', bg: 'bg-gray-50' },
    };
    return statusMap[status] || { label: status, color: 'text-gray-600', bg: 'bg-gray-50' };
  };

  const formatCurrency = (amount: number) => {
    return `¥${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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

      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => handleSearchChange(e.target.value)}
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
          <span>筛选</span>
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

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-card border rounded-lg p-4 space-y-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">订单状态</label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleStatusChange(option.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${
                      selectedStatus === option.value
                        ? 'bg-primary text-primary-foreground'
                        : 'border hover:bg-accent'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Range Filter */}
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">订单总数</div>
          <div className="text-2xl font-bold mt-1">{total}</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">今日订单</div>
          <div className="text-2xl font-bold mt-1">
            {getTodayOrderCount()}
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">待结算</div>
          <div className="text-2xl font-bold mt-1 text-amber-600">
            {orders.filter((o) => o.status === 'PENDING').length}
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">今日营收</div>
          <div className="text-2xl font-bold mt-1 text-green-600">
            {formatCurrency(getTodayRevenue())}
          </div>
        </div>
      </div>

      {/* Table - Desktop */}
      <div className="bg-card border rounded-lg overflow-hidden hidden md:block">
        <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/50 font-medium text-sm">
          <div className="col-span-2">订单信息</div>
          <div className="col-span-3">会员信息</div>
          <div className="col-span-2">金额</div>
          <div className="col-span-2">状态</div>
          <div className="col-span-2">时间</div>
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
            const statusInfo = getStatusInfo(order.status);
            return (
              <div
                key={order.id}
                className="grid grid-cols-12 gap-4 p-4 border-b hover:bg-accent/50 transition-colors items-center"
              >
                <div className="col-span-2">
                  <div className="font-medium text-sm">{order.orderNo}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {order.items.length} 项服务
                  </div>
                </div>

                <div className="col-span-3">
                  <div className="font-medium text-sm">{order.member.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {order.member.cardNo}
                  </div>
                  <div className="text-xs text-primary mt-1">
                    {order.member.memberLevel?.name}
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="text-sm">
                    应付: <span className="font-medium">{formatCurrency(order.payableAmount)}</span>
                  </div>
                  {order.status === 'SETTLED' && (
                    <div className="text-xs text-muted-foreground">
                      已付: {formatCurrency(order.paidAmount)}
                    </div>
                  )}
                </div>

                <div className="col-span-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.color} ${statusInfo.bg}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <div className="col-span-2">
                  <div className="text-sm">{formatDate(order.createdAt)}</div>
                  {order.settledAt && order.status === 'SETTLED' && (
                    <div className="text-xs text-muted-foreground mt-1">
                      结算: {formatDate(order.settledAt)}
                    </div>
                  )}
                </div>

                <div className="col-span-1">
                  <Link href={`/admin/orders/${order.id}`}>
                    <button
                      type="button"
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                      title="查看详情"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </Link>
                </div>
              </div>
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
            const statusInfo = getStatusInfo(order.status);
            return (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="bg-card border rounded-lg p-4 hover:border-primary transition-colors"
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
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Eye className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{order.member.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {order.member.cardNo}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(order.payableAmount)}</div>
                    <div className="text-xs text-muted-foreground">
                      {order.items.length} 项服务
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{order.member.memberLevel?.name}</span>
                  <Eye className="h-4 w-4" />
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

  function hasActiveFilters(): boolean {
    return selectedStatus !== 'ALL' ||
           searchKeyword.trim() !== '' ||
           !!dateRange.start ||
           !!dateRange.end ||
           !!selectedMemberId;
  }

  function getTodayOrderCount(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return orders.filter((o) => {
      const createdAt = new Date(o.createdAt);
      return createdAt >= today;
    }).length;
  }

  function getTodayRevenue(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return orders
      .filter((o) => {
        const createdAt = new Date(o.createdAt);
        return createdAt >= today && o.status === 'SETTLED';
      })
      .reduce((sum, o) => sum + o.paidAmount, 0);
  }
}

interface Order {
  id: string;
  orderNo: string;
  status: 'PENDING' | 'SETTLED' | 'CANCELLED' | 'REFUNDED';
  originalAmount: number;
  discountAmount: number;
  payableAmount: number;
  paidAmount: number;
  remark?: string;
  createdAt: string;
  settledAt?: string;
  cancelledAt?: string;
  member: {
    id: string;
    name: string;
    cardNo: string;
    memberLevel: {
      id: string;
      name: string;
      discount: number;
    } | null;
  };
  items: Array<{
    id: string;
    serviceName: string;
    staffName: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
    discountRate: number;
    finalPrice: number;
  }>;
}