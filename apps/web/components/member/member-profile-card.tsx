'use client';

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import type {
  MemberProfileData,
  SpendingBreakdown,
} from '../../../lib/api/member-profile';

const PIE_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#a78bfa',
  '#c4b5fd',
  '#818cf8',
  '#a5b4fc',
];

interface MemberProfileCardProps {
  profile: MemberProfileData;
}

const TREND_LABELS: Record<string, { label: string; color: string }> = {
  increasing: { label: '上升', color: 'text-green-600' },
  decreasing: { label: '下降', color: 'text-red-500' },
  stable: { label: '平稳', color: 'text-gray-500' },
};

export default function MemberProfileCard({ profile }: MemberProfileCardProps) {
  const pieData = useMemo(() => {
    return profile.spendingBreakdown.map((item: SpendingBreakdown) => ({
      name: item.categoryName,
      value: item.totalAmount,
    }));
  }, [profile.spendingBreakdown]);

  const loyaltyLevel = useMemo(() => {
    if (profile.loyaltyScore >= 80) return { label: '高忠诚', color: 'bg-green-100 text-green-700' };
    if (profile.loyaltyScore >= 50) return { label: '中等', color: 'bg-yellow-100 text-yellow-700' };
    if (profile.loyaltyScore >= 20) return { label: '一般', color: 'bg-gray-100 text-gray-600' };
    return { label: '待提升', color: 'bg-red-50 text-red-600' };
  }, [profile.loyaltyScore]);

  const trend = TREND_LABELS[profile.spendingTrend] ?? TREND_LABELS.stable;

  return (
    <div className="space-y-6">
      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="总消费金额"
          value={`¥${(profile.totalSpent / 100).toFixed(0)}`}
          sub={`共 ${profile.totalVisits} 次到店`}
        />
        <StatCard
          label="平均消费"
          value={`¥${(profile.averageSpendingPerVisit / 100).toFixed(0)}`}
          sub="每次到店"
        />
        <StatCard
          label="消费趋势"
          value={trend.label}
          valueClassName={trend.color}
          sub={`会龄 ${profile.membershipDuration} 天`}
        />
        <StatCard
          label="忠诚度"
          value={String(profile.loyaltyScore)}
          sub={
            <span className={`inline-block px-2 py-0.5 rounded text-xs ${loyaltyLevel.color}`}>
              {loyaltyLevel.label}
            </span>
          }
        />
      </div>

      {/* Preferred Stylist */}
      {profile.preferredStylist && (
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-2">首选发型师</div>
          <div className="flex items-center justify-between">
            <div className="font-medium">{profile.preferredStylist.staffName}</div>
            <div className="text-sm text-muted-foreground">
              服务 {profile.preferredStylist.visitCount} 次
            </div>
          </div>
        </div>
      )}

      {/* Service Preference Pie Chart */}
      {pieData.length > 0 && (
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-3">消费类别分布</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }: { name: string; percent: number }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {pieData.map((_entry: { name: string; value: number }, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `¥${(value / 100).toFixed(2)}`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top Services List */}
      {profile.servicePreferences.length > 0 && (
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-3">偏好服务 TOP {Math.min(profile.servicePreferences.length, 5)}</div>
          <div className="space-y-2">
            {profile.servicePreferences.slice(0, 5).map((pref, idx) => (
              <div
                key={pref.serviceItemId}
                className="flex items-center justify-between py-2 px-3 rounded hover:bg-accent/50"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-medium text-sm">{pref.serviceName}</div>
                    <div className="text-xs text-muted-foreground">{pref.categoryName}</div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {pref.count} 次 / ¥{(pref.totalAmount / 100).toFixed(0)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  valueClassName,
}: {
  label: string;
  value: string;
  sub: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="text-sm text-muted-foreground mb-1">{label}</div>
      <div className={`text-xl font-bold ${valueClassName ?? ''}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}
