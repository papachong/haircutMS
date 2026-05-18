'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  getStaffList,
  type Staff,
  type StaffRole,
  STAFF_ROLE_LABELS,
} from '@/lib/api/staff';
import {
  getStaffRecords,
  getStaffDetailStatsWithDate,
  getStaffServiceTrends,
  type StaffStats,
  type PersonalServiceRecord,
  type ServiceTrend,
  TimeRange,
} from '@/lib/api/staff-stats';
import { LineChart } from '@/components/LineChart';
import { BarChart } from '@/components/BarChart';
import { PieChart } from '@/components/PieChart';
import {
  Calendar,
  Clock,
  DollarSign,
  Scissors,
  TrendingUp,
  Users,
  Filter,
  ChevronLeft,
} from 'lucide-react';

export default function StaffAnalyticsPage() {
  const searchParams = useSearchParams();
  const staffIdParam = searchParams.get('staffId');

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [records, setRecords] = useState<PersonalServiceRecord[]>([]);
  const [trends, setTrends] = useState<ServiceTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);

  // Filters
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.WEEK);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [recordsPage, setRecordsPage] = useState(1);
  const [recordsTotal, setRecordsTotal] = useState(0);
  const [recordsTotalPages, setRecordsTotalPages] = useState(0);

  useEffect(() => {
    loadStaffList();
  }, []);

  useEffect(() => {
    if (staffIdParam && staffList.length > 0) {
      const staff = staffList.find((s) => s.id === staffIdParam);
      if (staff) {
        selectStaff(staff);
      }
    }
  }, [staffIdParam, staffList]);

  useEffect(() => {
    if (selectedStaff) {
      loadData();
    }
  }, [selectedStaff, timeRange, startDate, endDate]);

  async function loadStaffList() {
    try {
      const data = await getStaffList();
      setStaffList(data.filter((s) => s.isActive));
    } catch (error) {
      console.error('Failed to load staff list:', error);
    }
  }

  function selectStaff(staff: Staff) {
    setSelectedStaff(staff);
    setRecordsPage(1);
    setRecords([]);
  }

  async function loadData() {
    if (!selectedStaff) return;

    setLoading(true);
    try {
      const [statsData, trendsData] = await Promise.all([
        getStaffDetailStatsWithDate(
          selectedStaff.id,
          startDate || undefined,
          endDate || undefined,
        ),
        getStaffServiceTrends(
          selectedStaff.id,
          timeRange,
          startDate || undefined,
          endDate || undefined,
        ),
      ]);

      setStats(statsData);
      setTrends(trendsData);

      // Load first page of records
      await loadRecords(1);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadRecords(page: number) {
    if (!selectedStaff) return;

    setRecordsLoading(true);
    try {
      const data = await getStaffRecords(
        selectedStaff.id,
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

  function handleTimeRangeChange(range: TimeRange) {
    setTimeRange(range);
    setStartDate('');
    setEndDate('');
  }

  function handleCustomDateRange() {
    if (startDate && endDate) {
      setTimeRange('week'); // Reset time range
    }
  }

  function formatCurrency(value: number) {
    return (value / 100).toFixed(2);
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const timeRangeOptions = [
    { value: TimeRange.DAY as const, label: '今日' },
    { value: TimeRange.WEEK as const, label: '本周' },
    { value: TimeRange.MONTH as const, label: '本月' },
  ];

  const trendData = trends.map((t) => ({
    date: t.date,
    value: t.count,
    label: t.date,
  }));

  const serviceTypeData = stats?.serviceTypeDistribution.map((s) => ({
    label: s.categoryName,
    value: s.count,
  })) || [];

  const serviceTypeRevenueData = stats?.serviceTypeDistribution.map((s) => ({
    label: s.categoryName,
    value: Math.round(s.revenue / 100),
    revenue: s.revenue,
  })) || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">员工服务记录</h1>
          <p className="text-sm text-muted-foreground mt-1">
            查看员工的服务记录、业绩统计和趋势分析
          </p>
        </div>
      </div>

      {/* Staff Selection */}
      {!selectedStaff && (
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">选择员工</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffList.map((staff) => (
              <button
                key={staff.id}
                onClick={() => selectStaff(staff)}
                className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent transition-colors text-left"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg">
                  {staff.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{staff.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {STAFF_ROLE_LABELS[staff.role as StaffRole]}
                  </p>
                </div>
                <ChevronLeft className="h-5 w-5 rotate-180 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedStaff && (
        <>
          {/* Staff Header */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedStaff(null)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4 rotate-180" />
              返回员工列表
            </button>
            <div className="flex items-center gap-3 flex-1">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xl">
                {selectedStaff.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold">{selectedStaff.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {STAFF_ROLE_LABELS[selectedStaff.role as StaffRole]}
                </p>
              </div>
            </div>
          </div>

          {/* Time Range Filter */}
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">时间范围:</span>
              </div>
              <div className="flex gap-2">
                {timeRangeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleTimeRangeChange(option.value)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      timeRange === option.value && !startDate && !endDate
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 border-l pl-4">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="text-muted-foreground">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={handleCustomDateRange}
                  disabled={!startDate || !endDate}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  应用
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex h-96 items-center justify-center">
              <p className="text-muted-foreground">加载中...</p>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-xl border bg-card p-6">
                  <div className="flex items-center justify-between">
                    <Scissors className="h-5 w-5 text-blue-600" />
                    <span className="text-xs text-muted-foreground">服务次数</span>
                  </div>
                  <p className="mt-4 text-3xl font-bold text-blue-600">
                    {stats?.totalServices || 0}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">次</p>
                </div>

                <div className="rounded-xl border bg-card p-6">
                  <div className="flex items-center justify-between">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="text-xs text-muted-foreground">总营收</span>
                  </div>
                  <p className="mt-4 text-3xl font-bold text-green-600">
                    {formatCurrency(stats?.totalRevenue || 0)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">元</p>
                </div>

                <div className="rounded-xl border bg-card p-6">
                  <div className="flex items-center justify-between">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <span className="text-xs text-muted-foreground">客单价</span>
                  </div>
                  <p className="mt-4 text-3xl font-bold text-purple-600">
                    {stats?.totalServices
                      ? formatCurrency((stats.totalRevenue / 100) / stats.totalServices)
                      : '0.00'}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">元</p>
                </div>

                <div className="rounded-xl border bg-card p-6">
                  <div className="flex items-center justify-between">
                    <Users className="h-5 w-5 text-amber-600" />
                    <span className="text-xs text-muted-foreground">服务类型</span>
                  </div>
                  <p className="mt-4 text-3xl font-bold text-amber-600">
                    {stats?.serviceTypeDistribution.length || 0}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">种</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Service Trend Chart */}
                <div className="rounded-xl border bg-card p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    服务趋势
                  </h3>
                  <LineChart data={trendData} color="#3b82f6" height={200} />
                </div>

                {/* Service Type Distribution */}
                <div className="rounded-xl border bg-card p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Scissors className="h-5 w-5 text-primary" />
                    服务类型分布
                  </h3>
                  <div className="flex flex-col items-center">
                    <PieChart data={serviceTypeData} size={200} showPercentage />
                  </div>
                </div>
              </div>

              {/* Service Type Revenue */}
              <div className="rounded-xl border bg-card p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  各类型营收
                </h3>
                <BarChart data={serviceTypeRevenueData} height={250} showRevenue />
              </div>

              {/* Service Records Table */}
              <div className="rounded-xl border bg-card">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    服务记录
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    共 {recordsTotal} 条记录
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="py-4 px-6 text-left font-medium">订单号</th>
                        <th className="py-4 px-6 text-left font-medium">客户</th>
                        <th className="py-4 px-6 text-left font-medium">服务项目</th>
                        <th className="py-4 px-6 text-left font-medium">类型</th>
                        <th className="py-4 px-6 text-left font-medium">数量</th>
                        <th className="py-4 px-6 text-left font-medium">金额</th>
                        <th className="py-4 px-6 text-left font-medium">完成时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recordsLoading ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-muted-foreground">
                            加载中...
                          </td>
                        </tr>
                      ) : records.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-muted-foreground">
                            暂无服务记录
                          </td>
                        </tr>
                      ) : (
                        records.map((record) => (
                          <tr key={record.id} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="py-4 px-6 font-mono text-xs">
                              {record.orderNo}
                            </td>
                            <td className="py-4 px-6">
                              <div>
                                <p className="font-medium">{record.memberName}</p>
                                <p className="text-xs text-muted-foreground">{record.memberPhone}</p>
                              </div>
                            </td>
                            <td className="py-4 px-6">{record.serviceName}</td>
                            <td className="py-4 px-6">
                              <span className="rounded-full bg-primary/10 px-2 py-1 text-xs">
                                {record.category}
                              </span>
                            </td>
                            <td className="py-4 px-6">{record.quantity}</td>
                            <td className="py-4 px-6 font-medium">
                              {formatCurrency(record.finalPrice)}元
                            </td>
                            <td className="py-4 px-6 text-muted-foreground text-xs">
                              {formatDate(record.completedAt)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {recordsTotalPages > 1 && (
                  <div className="p-4 border-t flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      第 {recordsPage} / {recordsTotalPages} 页
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadRecords(recordsPage - 1)}
                        disabled={recordsPage === 1}
                        className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
                      >
                        上一页
                      </button>
                      <button
                        onClick={() => loadRecords(recordsPage + 1)}
                        disabled={recordsPage === recordsTotalPages}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      >
                        下一页
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}