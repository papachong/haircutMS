'use client';

import { useEffect, useState } from 'react';
import {
  getAuditLogs,
  AuditActions,
  ACTION_LABELS,
  type AuditLog,
  type AuditLogFilters,
} from '@/lib/api/audit';
import { getStaff, type Staff } from '@/lib/api/orders';
import { Filter, FileText, ChevronLeft, ChevronRight, Eye, User } from 'lucide-react';

interface AuditLogListResponse {
  items: (AuditLog & { staff?: { id: string; name: string; phone: string } | null })[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const DETAIL_KEY_LABELS: Record<string, string> = {
  amount: '金额',
  giftAmount: '赠送金额',
  payMethod: '支付方式',
  memberName: '会员',
  cardNo: '卡号',
  memberLevel: '等级',
  name: '姓名',
  phone: '手机',
  role: '角色',
  orderNo: '订单号',
  reason: '原因',
  fromLevel: '原等级',
  toLevel: '新等级',
  isActive: '状态',
  planName: '充值方案',
  remark: '备注',
};

function formatDetail(detail: Record<string, unknown> | null | undefined): string {
  if (!detail) return '-';
  const entries = Object.entries(detail);
  if (entries.length === 0) return '-';

  return entries
    .filter(([key]) => key !== 'memberId' && key !== 'staffId' && key !== 'planId' && key !== 'targetId')
    .map(([key, value]) => {
      const label = DETAIL_KEY_LABELS[key] || key;
      if (key === 'amount' || key === 'giftAmount' || key === 'payableAmount' || key === 'paidAmount') {
        return `${label}: ¥${Number(value) / 100}`;
      }
      if (typeof value === 'object' && value !== null) {
        return `${label}: ${JSON.stringify(value)}`;
      }
      if (key === 'isActive') {
        return `${label}: ${value ? '启用' : '停用'}`;
      }
      return `${label}: ${String(value)}`;
    })
    .join(' · ');
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<(AuditLog & { staff?: { id: string; name: string; phone: string } | null })[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<AuditLogFilters>({ pageSize: 20 });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<(AuditLog & { staff?: { id: string; name: string; phone: string } | null }) | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);

  useEffect(() => {
    loadLogs();
    loadStaff();
  }, [filters, page, pageSize]);

  async function loadStaff() {
    try {
      const staff = await getStaff();
      setStaffList(staff);
    } catch (e) {
      console.error('Failed to load staff:', e);
    }
  }

  async function loadLogs() {
    setLoading(true);
    try {
      const response = await getAuditLogs({
        ...filters,
        page,
        pageSize,
      }) as unknown as AuditLogListResponse;
      setLogs(response.items);
      setTotal(response.pagination.total);
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setLoading(false);
    }
  }

  function updateFilter(key: keyof AuditLogFilters, value: any) {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value || undefined };
      setPageSize(newFilters.pageSize || 20);
      return newFilters;
    });
    setPage(1);
  }

  function resetFilters() {
    setFilters({ pageSize });
    setPage(1);
  }

  const totalPages = Math.ceil(total / pageSize);
  const showingStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingEnd = Math.min(page * pageSize, total);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">操作日志</h1>
          <p className="text-sm text-muted-foreground mt-1">查看和管理店铺操作记录</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm hover:bg-accent transition-colors"
        >
          <Filter className="h-4 w-4" />
          {showFilters ? '隐藏筛选' : '显示筛选'}
          {Object.values(filters).filter(v => v && v !== pageSize).length > 0 && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {Object.values(filters).filter(v => v && v !== pageSize).length}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="rounded-xl border bg-card p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">操作类型</label>
              <select
                value={filters.action || ''}
                onChange={e => updateFilter('action', e.target.value || undefined)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">全部操作</option>
                {Object.entries(AuditActions).map(([k, v]) => (
                  <option key={k} value={v}>{ACTION_LABELS[v]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">操作人</label>
              <select
                value={filters.staffId || ''}
                onChange={e => updateFilter('staffId', e.target.value || undefined)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">全部人员</option>
                {staffList.map(staff => (
                  <option key={staff.id} value={staff.id}>{staff.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">开始日期</label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={e => updateFilter('startDate', e.target.value || undefined)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">结束日期</label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={e => updateFilter('endDate', e.target.value || undefined)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="w-full rounded-lg border border-dashed px-3 py-2 text-sm hover:bg-accent transition-colors"
              >
                重置筛选
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            加载中...
          </div>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
          <FileText className="h-12 w-12 mb-3 opacity-20" />
          <p>暂无日志记录</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b bg-secondary/50">
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">时间</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      操作人
                    </span>
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      操作类型
                    </span>
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">目标</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">详情</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">IP地址</th>
                  <th className="px-6 py-3 text-right font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(log.createdAt)}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {log.staff ? log.staff.name : '系统'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {log.targetType || '-'}
                      {log.targetId && <span className="text-xs ml-1 opacity-60">#{log.targetId.slice(-6)}</span>}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs max-w-xs truncate">
                      {formatDetail(log.detail as Record<string, unknown> | null | undefined)}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                      {log.ip || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-accent transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        详情
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

          {/* Mobile Cards */}
          <div className="lg:hidden rounded-xl border bg-card divide-y">
            {logs.map(log => (
              <div key={log.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">
                      {log.staff ? log.staff.name : '系统'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {formatTimestamp(log.createdAt)}
                    </div>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary shrink-0 ml-2">
                    {ACTION_LABELS[log.action] || log.action}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {log.targetType || '-'}
                  {log.targetId && <span className="opacity-60"> #{log.targetId.slice(-6)}</span>}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {formatDetail(log.detail as Record<string, unknown> | null | undefined)}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground font-mono">{log.ip || '-'}</span>
                  <button
                    onClick={() => setSelectedLog(log)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs hover:bg-accent transition-colors min-h-[44px]"
                  >
                    <Eye className="h-3 w-3" />
                    详情
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                显示 {showingStart} - {showingEnd} 条，共 {total} 条记录
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <select
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="rounded-lg border bg-card px-3 py-1.5 text-sm"
                >
                  <option value={10}>10 条/页</option>
                  <option value={20}>20 条/页</option>
                  <option value={50}>50 条/页</option>
                  <option value={100}>100 条/页</option>
                </select>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 rounded-lg border bg-card px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                  上一页
                </button>
                <span className="text-sm text-muted-foreground">
                  第 {page} / {totalPages} 页
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 rounded-lg border bg-card px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl bg-card p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">操作详情</h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-md p-1 hover:bg-accent transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">操作时间</div>
                  <div className="text-sm font-medium">
                    {new Date(selectedLog.createdAt).toLocaleString('zh-CN')}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">操作人</div>
                  <div className="text-sm font-medium">
                    {selectedLog.staff ? selectedLog.staff.name : '系统'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">操作类型</div>
                  <div className="text-sm font-medium">
                    {ACTION_LABELS[selectedLog.action] || selectedLog.action}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">IP地址</div>
                  <div className="text-sm font-mono">{selectedLog.ip || '-'}</div>
                </div>
                {selectedLog.targetType && (
                  <>
                    <div>
                      <div className="text-xs text-muted-foreground">目标类型</div>
                      <div className="text-sm font-medium">{selectedLog.targetType}</div>
                    </div>
                    {selectedLog.targetId && (
                      <div>
                        <div className="text-xs text-muted-foreground">目标ID</div>
                        <div className="text-sm font-mono text-xs">{selectedLog.targetId}</div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {selectedLog.detail && Object.keys(selectedLog.detail).length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-2">详细信息</div>
                  <div className="rounded-lg bg-secondary/30 p-3 text-xs space-y-1">
                    {Object.entries(selectedLog.detail).map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <span className="font-medium text-muted-foreground w-24 shrink-0">
                          {DETAIL_KEY_LABELS[key] || key}:
                        </span>
                        <span className="font-mono">
                          {key === 'amount' || key === 'giftAmount' || key === 'payableAmount' || key === 'paidAmount'
                            ? `¥${(Number(value) / 100).toFixed(2)}`
                            : key === 'isActive'
                              ? (value ? '启用' : '停用')
                              : typeof value === 'object' && value !== null
                                ? JSON.stringify(value)
                                : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}