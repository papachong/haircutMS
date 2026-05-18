'use client';

import Link from 'next/link';

export default function AdminSettingsPage() {
  const settingsItems = [
    { href: '/admin/settings/audit', title: '操作日志', description: '查看店铺操作记录和审计日志', icon: '📋' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">设置</h1>
        <p className="text-sm text-muted-foreground mt-1">管理店铺设置和配置</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingsItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-xl border bg-card p-6 hover:border-primary/50 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <span className="text-3xl">{item.icon}</span>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                →
              </div>
            </div>
            <h3 className="font-semibold mt-4">{item.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}