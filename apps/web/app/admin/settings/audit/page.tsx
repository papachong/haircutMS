'use client';

  import { useEffect, useState } from 'react';
  import { getAuditLogs, AuditActions, ACTION_LABELS } from '@/lib/api/audit';
  import { Filter, FileText } from 'lucide-react';

  export default function AdminAuditLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState<any>({ pageSize: 20 });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => { loadLogs(); }, [filters, page]);

    async function loadLogs() {
      setLoading(true);
      try {
        const response = await getAuditLogs({ ...filters, page });
        setLogs(response.items);
        setTotal(response.pagination.total);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }

    function updateFilter(key: string, value: any) {
      setFilters(prev => ({ ...prev, [key]: value }));
      setPage(1);
    }
  
    function resetFilters() {
      setFilters({ pageSize: 20 });
      setPage(1);
    }
  
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">操作日志</h1>
  
        <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm">
          <Filter className="h-4 w-4" /> 筛选
        </button>

        {showFilters && (
          <div className="rounded-xl border bg-card p-4 grid grid-cols-4 gap-4">
            <select value={filters.action || ''} onChange={e => updateFilter('action', e.target.value || undefined)} className="w-full rounded-lg border bg-card px-3 py-2 text-sm">
              <option value="">全部操作</option>
              {Object.entries(AuditActions).map(([k, v]) => <option key={k} value={v}>{ACTION_LABELS[v]}</option>)}
            </select>
            <input type="date" value={filters.startDate || ''} onChange={e => updateFilter('startDate', e.target.value || undefined)} className="w-full rounded-lg border bg-card px-3 py-2 
  text-sm" />
            <input type="date" value={filters.endDate || ''} onChange={e => updateFilter('endDate', e.target.value || undefined)} className="w-full rounded-lg border bg-card px-3 py-2 
  text-sm" />
            <button onClick={resetFilters} className="w-full rounded-lg border px-3 py-2 text-sm hover:bg-secondary">重置</button>
          </div>
        )}
  
        {loading ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">加载中...</div>
        ) : logs.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">暂无日志记录</div>
        ) : (
          <table className="w-full text-sm rounded-xl border bg-card">
            <thead>
              <tr className="border-b bg-secondary/50">
                <th className="px-6 py-3 text-left">时间</th>
                <th className="px-6 py-3 text-left">操作</th>
                <th className="px-6 py-3 text-left">目标</th>
                <th className="px-6 py-3 text-left">详情</th>
                <th className="px-6 py-3 text-left">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b hover:bg-secondary/30">
                  <td className="px-6 py-4 text-muted-foreground">{new Date(log.createdAt).toLocaleString('zh-CN')}</td>
                  <td className="px-6 py-4"><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">{ACTION_LABELS[log.action] || log.action}</span></td>
                  <td className="px-6 py-4 text-muted-foreground">{log.targetType || '-'}</td>
                  <td className="px-6 py-4 text-muted-foreground text-xs">{log.detail ? Object.entries(log.detail).map(([k,v]) => `${k}:${v}`).join(' ') : '-'}</td>
                  <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{log.ip || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }
