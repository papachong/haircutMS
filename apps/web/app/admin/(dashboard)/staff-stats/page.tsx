'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getShopStaffStats,
  getStaffDetailStats,
  getStaffServiceTrends,
  getStaffRecords,
  type StaffStats,
  type ServiceTrend,
  type PersonalServiceRecord,
  type TimeRange,
} from '@/lib/api/staff-stats';
import { BarChart } from '@/components/BarChart';
import { PieChart } from '@/components/PieChart';
import {
  ArrowLeft,
  Scissors,
  TrendingUp,
  DollarSign,
  Calendar,
  Clock,
  Filter,
  X,
  Users,
} from 'lucide-react';

const roleLabels: Record<string, string> = {
  OWNER: '店长',
  MANAGER: '经理',
  RECEPTIONIST: '前台',
  STYLIST: '发型师',
  TECHNICIAN: '技师',
};

const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: 'day', label: '今日' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
];

export default function StaffStatsPage() {
  const [stats, setStats] = useState<StaffStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Detail dialog state
  const [selectedStaff, setSelectedStaff] = useState<StaffStats | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [trends, setTrends] = useState<ServiceTrend[]>([]);
  const [records, setRecords] = useState<PersonalServiceRecord[]>([]);
  const [recordsTotal, setRecordsTotal] = useState(0);
  const [recordsTotalPages, setRecordsTotalPages] = useState(0);
  const [recordsPage, setRecordsPage] = useState(1);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getShopStaffStats(
        startDate || undefined,
        endDate || undefined,
      );
      setStats(data);
    } catch (error) {
      console.error('Failed to load staff stats:', error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  async function openStaffDetail(staff: StaffStats) {
    setSelectedStaff(staff);
    setDetailLoading(true);
    setRecordsPage(1);

    try {
      const [trendsData, recordsData] = await Promise.all([
        getStaffServiceTrends(
          staff.staffId,
          timeRange,
          startDate || undefined,
          endDate || undefined,
        ),
        getStaffRecords(
          staff.staffId,
          1,
          10,
          startDate || undefined,
          endDate || undefined,
        ),
      ]);
      setTrends(trendsData);
      setRecords(recordsData.records);
      setRecordsTotal(recordsData.total);
      setRecordsTotalPages(recordsData.totalPages);
    } catch (error) {
      console.error('Failed to load staff detail:', error);
    } finally {
      setDetailLoading(false);
    }
  }

  async function loadRecords(page: number) {
    if (!selectedStaff) return;
    setRecordsLoading(true);
    try {
      const data = await getStaffRecords(
        selectedStaff.staffId,
        page,
        10,
        startDate || undefined,
        endDate || undefined,
      );
      setRecords(data.records);
      setRecordsTotal(data.total);
      setRecordsTotalPages(data.totalPages);
      setRecordsPage(page);
    } catch (error) {
      console.error('Failed to load records:', error);
    } finally {
      setRecordsLoading(false);
    }
  }

  function closeDetail() {
    setSelectedStaff(null);
    setTrends([]);
    setRecords([]);
  }

  function handleTimeRangeChange(range: TimeRange) {
    setTimeRange(range);
    if (selectedStaff) {
      loadTrendsWithRange(selectedStaff.staffId, range);
    }
  }

  async function loadTrendsWithRange(staffId: string, range: TimeRange) {
    try {
      const trendsData = await getStaffServiceTrends(
        staffId,
        range,
        startDate || undefined,
        endDate || undefined,
      );
      setTrends(trendsData);
    } catch (error) {
      console.error('Failed to load trends:', error);
    }
  }

  function formatCurrency(value: number) {
    return (value / 100).toFixed(2);
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const chartData = stats.map((s) => ({
    label: s.staffName,
    value: s.totalServices,
    revenue: s.totalRevenue,
  }));

  const serviceTypeData =
    selectedStaff?.serviceTypeDistribution.map((s) => ({
      label: s.categoryName,
      value: s.count,
    })) || [];

  const trendBarData = trends.map((t) => ({
    label: t.date,
    value: t.count,
    revenue: t.revenue,
  }));

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header with date filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">员工服务统计</h1>
          <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
            按员工统计服务次数、营收、服务类型分布
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <span className="text-muted-foreground">-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="rounded-lg border px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              清除
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 sm:h-96 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">加载中...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Chart */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">服务排行</h2>
            {chartData.length > 0 ? (
              <div className="h-64">
                <BarChart data={chartData} height={250} barColor="#3b82f6" showRevenue />
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                暂无数据
              </div>
            )}
          </div>

          {/* Staff ranking table - Desktop */}
          <div className="hidden md:block overflow-hidden rounded-xl border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">排名</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">员工姓名</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">角色</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">服务次数</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">营收</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">客单价</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {stats.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                      暂无统计数据
                    </td>
                  </tr>
                ) : (
                  stats.map((staff, i) => {
                    const averageTicket =
                      staff.totalServices > 0
                        ? staff.totalRevenue / staff.totalServices / 100
                        : 0;
                    return (
                      <tr
                        key={staff.staffId}
                        className="border-t hover:bg-muted/50 cursor-pointer"
                        onClick={() => openStaffDetail(staff)}
                      >
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                              i === 0
                                ? 'bg-yellow-500 text-white'
                                : i === 1
                                  ? 'bg-gray-400 text-white'
                                  : i === 2
                                    ? 'bg-orange-400 text-white'
                                    : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">{staff.staffName}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {roleLabels[staff.staffRole] || staff.staffRole}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium">
                          {staff.totalServices}
                        </td>
                        <td className="px-4 py-3 text-right text-sm">
                          {formatCurrency(staff.totalRevenue)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm">{averageTicket.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-sm text-primary">
                          查看详情
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

          {/* Staff ranking cards - Mobile */}
          <div className="md:hidden rounded-xl border bg-card divide-y">
            {stats.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">暂无统计数据</div>
            ) : (
              stats.map((staff, i) => {
                const averageTicket =
                  staff.totalServices > 0
                    ? staff.totalRevenue / staff.totalServices / 100
                    : 0;
                return (
                  <button
                    key={staff.staffId}
                    type="button"
                    onClick={() => openStaffDetail(staff)}
                    className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                            i === 0
                              ? 'bg-yellow-500 text-white'
                              : i === 1
                              ? 'bg-gray-400 text-white'
                              : i === 2
                              ? 'bg-orange-400 text-white'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className="font-medium text-sm">{staff.staffName}</span>
                        <span className="text-xs text-muted-foreground">
                          {roleLabels[staff.staffRole] || staff.staffRole}
                        </span>
                      </div>
                      <span className="text-xs text-primary">详情</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-xs text-muted-foreground">服务次数</span>
                        <div className="font-medium">{staff.totalServices}</div>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">营收</span>
                        <div className="font-medium">¥{formatCurrency(staff.totalRevenue)}</div>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">客单价</span>
                        <div className="font-medium">¥{averageTicket.toFixed(2)}</div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Detail Dialog */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
          <div className="relative w-full max-w-4xl rounded-xl bg-card shadow-xl">
            {/* Dialog header */}
            <div className="flex items-center justify-between border-b p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={closeDetail}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  返回列表
                </button>
                <div className="flex items-center gap-3 ml-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    {selectedStaff.staffName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{selectedStaff.staffName}</h2>
                    <p className="text-xs text-muted-foreground">
                      {roleLabels[selectedStaff.staffRole] || selectedStaff.staffRole}
                    </p>
                  </div>
                </div>
              </div>
              <button onClick={closeDetail} className="p-2 hover:bg-accent rounded-md">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Dialog body */}
            <div className="p-4 sm:p-6 space-y-6">
              {detailLoading ? (
                <div className="flex h-48 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : (
                <>
                  {/* Summary cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="rounded-lg border bg-card p-3 sm:p-4">
                      <div className="flex items-center gap-2">
                        <Scissors className="h-4 w-4 text-blue-500" />
                        <span className="text-xs text-muted-foreground">服务次数</span>
                      </div>
                      <p className="mt-2 text-xl sm:text-2xl font-bold">{selectedStaff.totalServices}</p>
                    </div>
                    <div className="rounded-lg border bg-card p-3 sm:p-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span className="text-xs text-muted-foreground">总营收</span>
                      </div>
                      <p className="mt-2 text-xl sm:text-2xl font-bold">
                        {formatCurrency(selectedStaff.totalRevenue)}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-card p-3 sm:p-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                        <span className="text-xs text-muted-foreground">客单价</span>
                      </div>
                      <p className="mt-2 text-xl sm:text-2xl font-bold">
                        {selectedStaff.totalServices > 0
                          ? (selectedStaff.totalRevenue / selectedStaff.totalServices / 100).toFixed(2)
                          : '0.00'}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-card p-3 sm:p-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-amber-500" />
                        <span className="text-xs text-muted-foreground">服务类型</span>
                      </div>
                      <p className="mt-2 text-xl sm:text-2xl font-bold">
                        {selectedStaff.serviceTypeDistribution.length}
                      </p>
                    </div>
                  </div>

                  {/* Service type distribution + pie chart */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="rounded-lg border p-4">
                      <h3 className="mb-4 text-sm font-semibold">服务类型分布</h3>
                      {selectedStaff.serviceTypeDistribution.length > 0 ? (
                        <div className="overflow-hidden rounded-lg border">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="px-3 py-2 text-left font-medium">服务类型</th>
                                <th className="px-3 py-2 text-right font-medium">次数</th>
                                <th className="px-3 py-2 text-right font-medium">营收</th>
                                <th className="px-3 py-2 text-right font-medium">占比</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedStaff.serviceTypeDistribution.map((type, i) => {
                                const pct =
                                  selectedStaff.totalServices > 0
                                    ? (type.count / selectedStaff.totalServices) * 100
                                    : 0;
                                return (
                                  <tr key={i} className="border-t">
                                    <td className="px-3 py-2">{type.categoryName}</td>
                                    <td className="px-3 py-2 text-right">{type.count}</td>
                                    <td className="px-3 py-2 text-right">
                                      {formatCurrency(type.revenue)}
                                    </td>
                                    <td className="px-3 py-2 text-right">{pct.toFixed(1)}%</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="py-8 text-center text-sm text-muted-foreground">暂无数据</p>
                      )}
                    </div>

                    <div className="rounded-lg border p-4">
                      <h3 className="mb-4 text-sm font-semibold">类型占比图</h3>
                      {serviceTypeData.length > 0 ? (
                        <PieChart data={serviceTypeData} size={180} showPercentage />
                      ) : (
                        <p className="py-8 text-center text-sm text-muted-foreground">暂无数据</p>
                      )}
                    </div>
                  </div>

                  {/* Service trend */}
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold">服务趋势</h3>
                      <div className="flex gap-1 rounded-lg bg-muted p-1">
                        {timeRangeOptions.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => handleTimeRangeChange(opt.value)}
                            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                              timeRange === opt.value
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {trendBarData.length > 0 ? (
                      <BarChart data={trendBarData} height={200} barColor="#3b82f6" showRevenue />
                    ) : (
                      <p className="py-8 text-center text-sm text-muted-foreground">暂无趋势数据</p>
                    )}
                  </div>

                  {/* Recent service records */}
                  <div className="rounded-lg border">
                    <div className="flex items-center justify-between p-4 border-b">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        近期服务记录
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        共 {recordsTotal} 条
                      </span>
                    </div>
                    {recordsLoading ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        加载中...
                      </div>
                    ) : records.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        暂无服务记录
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b bg-muted/50">
                                <th className="py-3 px-4 text-left font-medium">订单号</th>
                                <th className="py-3 px-4 text-left font-medium">客户</th>
                                <th className="py-3 px-4 text-left font-medium">服务项目</th>
                                <th className="py-3 px-4 text-left font-medium">类型</th>
                                <th className="py-3 px-4 text-right font-medium">金额</th>
                                <th className="py-3 px-4 text-left font-medium">时间</th>
                              </tr>
                            </thead>
                            <tbody>
                              {records.map((record) => (
                                <tr key={record.id} className="border-b last:border-0 hover:bg-muted/30">
                                  <td className="py-3 px-4 font-mono text-xs">{record.orderNo}</td>
                                  <td className="py-3 px-4">
                                    <p className="font-medium">{record.memberName}</p>
                                  </td>
                                  <td className="py-3 px-4">{record.serviceName}</td>
                                  <td className="py-3 px-4">
                                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                                      {record.category}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right font-medium">
                                    {formatCurrency(record.finalPrice)}
                                  </td>
                                  <td className="py-3 px-4 text-xs text-muted-foreground">
                                    {formatDate(record.completedAt)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {recordsTotalPages > 1 && (
                          <div className="p-3 border-t flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              第 {recordsPage} / {recordsTotalPages} 页
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => loadRecords(recordsPage - 1)}
                                disabled={recordsPage === 1}
                                className="rounded-md border px-3 py-1 text-xs font-medium hover:bg-accent disabled:opacity-50"
                              >
                                上一页
                              </button>
                              <button
                                onClick={() => loadRecords(recordsPage + 1)}
                                disabled={recordsPage === recordsTotalPages}
                                className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                              >
                                下一页
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
