'use client';

import { ShopUsageTable } from '../components/shop-usage-table';

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">店铺使用统计</h1>
        <p className="text-slate-600 mt-1">查看各店铺的详细使用情况</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <ShopUsageTable />
      </div>
    </div>
  );
}