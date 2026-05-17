'use client';

import { useEffect, useState } from 'react';
import { getShopStaffStats, getStaffDetailStats, StaffStats } from '@/lib/api/staff-stats';
import { BarChart } from '@/components/BarChart';
import { ArrowLeft, Scissors, TrendingUp, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StaffStatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<StaffStats[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    try {
      const data = await getShopStaffStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load staff stats:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadStaffDetail(staffId: string) {
    try {
      const detail = await getStaffDetailStats(staffId);
      setSelectedStaff(detail);
    } catch (error) {
      console.error('Failed to load staff detail:', error);
    }
  }

  function handleBackToList() {
    setSelectedStaff(null);
  }

  const roleLabels: Record<string, string> = {
    OWNER: '店长',
    MANAGER: '经理',
    RECEPTIONIST: '前台',
    STYLIST: '发型师',
    TECHNICIAN: '技师',
  };

  const chartData = stats.map((s) => ({
    label: s.staffName,
    value: s.totalServices,
    revenue: s.totalRevenue,
  }));

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (selectedStaff) {
    return (
      <div className="space-y-6">
        <button
          onClick={handleBackToList}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          返回列表
        </button>

        <div className="rounded-xl border bg-card p-6">
          <h1 className="mb-6 text-2xl font-bold">{selectedStaff.staffName} - 详细统计</h1>

          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                  <Scissors className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">总服务次数</p>
                  <p className="text-2xl font-bold">{selectedStaff.totalServices}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">总营收</p>
                  <p className="text-2xl font-bold">
                    {(selectedStaff.totalRevenue / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
                  <TrendingUp className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">客单价</p>
                  <p className="text-2xl font-bold">
                    {selectedStaff.totalServices > 0
                      ? (selectedStaff.totalRevenue / selectedStaff.totalServices / 100).toFixed(2)
                      : '0.00'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <h2 className="mb-4 text-lg font-semibold">服务类型分布</h2>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">服务类型</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">服务次数</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">营收</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">占比</th>
                </tr>
              </thead>
              <tbody>
                {selectedStaff.serviceTypeDistribution.map((type, i) => {
                  const percentage =
                    selectedStaff.totalServices > 0
                      ? (type.count / selectedStaff.totalServices) * 100
                      : 0;
                  return (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-3 text-sm">{type.categoryName}</td>
                      <td className="px-4 py-3 text-right text-sm">{type.count}</td>
                      <td className="px-4 py-3 text-right text-sm">
                        {(type.revenue / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">{percentage.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">员工服务统计</h1>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">服务排行</h2>
        <div className="h-64">
          <BarChart data={chartData} height={250} barColor="#3b82f6" showRevenue />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full">
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
            {stats.map((staff, i) => {
              const averageTicket =
                staff.totalServices > 0
                  ? staff.totalRevenue / staff.totalServices / 100
                  : 0;
              return (
                <tr
                  key={staff.staffId}
                  className="border-t hover:bg-muted/50 cursor-pointer"
                  onClick={() => loadStaffDetail(staff.staffId)}
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
                    {(staff.totalRevenue / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">{averageTicket.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-sm text-primary">
                    查看详情
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}