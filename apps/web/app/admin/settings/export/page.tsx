'use client';

import { useState } from 'react';
import {
  exportMembers,
  exportOrders,
  exportRechargeRecords,
  exportStaffStats,
} from '@/lib/api/export';

type ExportType = 'members' | 'orders' | 'recharge' | 'staff';
type Format = 'xlsx' | 'csv';

const EXPORT_ITEMS: { key: ExportType; label: string; description: string }[] = [
  { key: 'members', label: '会员数据', description: '导出所有会员信息，包括档案、余额、等级、标签' },
  { key: 'orders', label: '订单数据', description: '导出订单记录，包括服务项目、金额、支付方式' },
  { key: 'recharge', label: '充值记录', description: '导出所有充值流水，包括本金、赠送金额、操作人' },
  { key: 'staff', label: '员工统计', description: '导出员工服务次数、营收、服务类型分布' },
];

export default function ExportPage() {
  const [format, setFormat] = useState<Format>('xlsx');
  const [exporting, setExporting] = useState<ExportType | null>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleExport(type: ExportType) {
    setExporting(type);
    setMessage(null);
    try {
      switch (type) {
        case 'members':
          await exportMembers(format);
          break;
        case 'orders':
          await exportOrders(format, dateRange.start || undefined, dateRange.end || undefined);
          break;
        case 'recharge':
          await exportRechargeRecords(format);
          break;
        case 'staff':
          await exportStaffStats(format);
          break;
      }
      setMessage({ type: 'success', text: '导出成功' });
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : '导出失败' });
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">数据导出</h1>
        <p className="text-sm text-muted-foreground mt-1">导出店铺经营数据，支持 Excel 和 CSV 格式</p>
      </div>

      {message && (
        <div className={`rounded-md p-3 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Format Selection */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">导出格式：</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="format"
              checked={format === 'xlsx'}
              onChange={() => setFormat('xlsx')}
              className="accent-primary"
            />
            <span className="text-sm">Excel (.xlsx)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="format"
              checked={format === 'csv'}
              onChange={() => setFormat('csv')}
              className="accent-primary"
            />
            <span className="text-sm">CSV (.csv)</span>
          </label>
        </div>
      </div>

      {/* Date Range (for orders) */}
      <div className="rounded-xl border bg-card p-4">
        <h3 className="text-sm font-medium mb-3">时间范围（仅订单导出生效）</h3>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <span className="text-sm text-muted-foreground">至</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <button
            onClick={() => setDateRange({ start: '', end: '' })}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            清除
          </button>
        </div>
      </div>

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EXPORT_ITEMS.map((item) => (
          <div
            key={item.key}
            className="rounded-xl border bg-card p-6 flex flex-col justify-between"
          >
            <div>
              <h3 className="font-semibold text-lg">{item.label}</h3>
              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
            </div>
            <button
              onClick={() => handleExport(item.key)}
              disabled={exporting !== null}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting === item.key ? '导出中...' : `导出${item.label}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
