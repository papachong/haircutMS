'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getMyStatsSummary,
  getMyServiceRecords,
  type StaffStats,
  type PersonalServiceRecord,
} from '@/lib/api/staff-stats';
import { Scissors, DollarSign, TrendingUp, Calendar, Clock } from 'lucide-react';

export default function MobileStatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [records, setRecords] = useState<PersonalServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [activeTab, setActiveTab] = useState<'summary' | 'records'>('summary');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [summaryData, recordsData] = await Promise.all([
        getMyStatsSummary(),
        getMyServiceRecords(1, 10),
      ]);
      setStats(summaryData);
      setRecords(recordsData.records);
      setTotalPages(recordsData.totalPages);
    } catch (error) {
      console.error('Failed to load stats:', error);
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  }

  async function loadMoreRecords() {
    if (page >= totalPages) return;
    const nextPage = page + 1;
    try {
      const data = await getMyServiceRecords(nextPage, 10);
      setRecords((prev) => [...prev, ...data.records]);
      setPage(nextPage);
    } catch (error) {
      console.error('Failed to load more records:', error);
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      OWNER: '店长',
      MANAGER: '经理',
      RECEPTIONIST: '前台',
      STYLIST: '发型师',
      TECHNICIAN: '技师',
    };
    return labels[role] || role;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">我的统计</h1>
        {stats && (
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {getRoleLabel(stats.staffRole)}
          </span>
        )}
      </div>

      <div className="flex gap-2 rounded-lg bg-muted p-1">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'summary'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          数据概览
        </button>
        <button
          onClick={() => setActiveTab('records')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'records'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          服务记录
        </button>
      </div>

      {activeTab === 'summary' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border bg-card p-4">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Scissors className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-xs font-medium text-muted-foreground">总服务次数</p>
              <p className="mt-1 text-xl font-bold">{stats.totalServices}</p>
            </div>

            <div className="rounded-xl border bg-card p-4">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-xs font-medium text-muted-foreground">总营收</p>
              <p className="mt-1 text-xl font-bold">
                {(stats.totalRevenue / 100).toFixed(2)}
              </p>
            </div>

            <div className="rounded-xl border bg-card p-4">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-xs font-medium text-muted-foreground">客单价</p>
              <p className="mt-1 text-xl font-bold">
                {stats.totalServices > 0
                  ? (stats.totalRevenue / stats.totalServices / 100).toFixed(2)
                  : '0.00'}
              </p>
            </div>

            <div className="rounded-xl border bg-card p-4">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                <Calendar className="h-5 w-5 text-orange-500" />
              </div>
              <p className="text-xs font-medium text-muted-foreground">服务类型</p>
              <p className="mt-1 text-xl font-bold">{stats.serviceTypeDistribution.length}</p>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <h2 className="mb-4 text-sm font-semibold">服务类型分布</h2>
            <div className="space-y-3">
              {stats.serviceTypeDistribution.map((type, i) => {
                const percentage =
                  stats.totalServices > 0 ? (type.count / stats.totalServices) * 100 : 0;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{type.categoryName}</span>
                      <span className="text-xs text-muted-foreground">
                        {type.count}次 ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-end">
                      <span className="text-xs text-muted-foreground">
                        营收: {(type.revenue / 100).toFixed(2)}元
                      </span>
                    </div>
                  </div>
                );
              })}
              {stats.serviceTypeDistribution.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">暂无数据</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'records' && (
        <div className="space-y-3">
          {records.length === 0 ? (
            <div className="rounded-xl border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">暂无服务记录</p>
            </div>
          ) : (
            <>
              {records.map((record) => (
                <div key={record.id} className="rounded-xl border bg-card p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{record.memberName}</h3>
                      <p className="text-xs text-muted-foreground">{record.memberPhone}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(record.completedAt)}
                    </div>
                  </div>

                  <div className="space-y-2 rounded-lg bg-muted/50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{record.serviceName}</span>
                      <span className="text-xs text-muted-foreground">{record.category}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        单价: {record.price / 100}元 x {record.quantity}
                      </span>
                      <span className="font-medium">
                        {record.finalPrice / 100}元
                      </span>
                    </div>
                    {record.discountRate !== '0%' && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-green-600">折扣: {record.discountRate}</span>
                        <span className="text-muted-foreground line-through">
                          {record.subtotal / 100}元
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {page < totalPages && (
                <button
                  onClick={loadMoreRecords}
                  className="w-full rounded-xl border bg-card py-3 text-sm font-medium hover:bg-muted/50"
                >
                  加载更多
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
