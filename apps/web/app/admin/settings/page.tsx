'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getShopInfo, updateShopInfo, type ShopInfo } from '@/lib/api/shop';

export default function AdminSettingsPage() {
  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', phone: '', businessHours: '' });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    getShopInfo()
      .then((data) => {
        setShop(data);
        setForm({
          name: data.name || '',
          address: data.address || '',
          phone: data.phone || '',
          businessHours: data.businessHours || '',
        });
      })
      .catch(() => setMessage({ type: 'error', text: 'Failed to load shop info' }));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const updated = await updateShopInfo(form);
      setShop(updated);
      setEditing(false);
      setMessage({ type: 'success', text: '店铺信息已保存' });
    } catch {
      setMessage({ type: 'error', text: '保存失败，请重试' });
    } finally {
      setSaving(false);
    }
  }

  const settingsItems = [
    { href: '/admin/settings/services', title: '服务项目', description: '管理服务分类和项目，设置价格和时长', icon: '✂️' },
    { href: '/admin/settings/levels', title: '会员等级', description: '管理会员等级、折扣比例和排序', icon: '🏷️' },
    { href: '/admin/settings/tags', title: '会员标签', description: '管理标签分组和标签，用于客户分类', icon: '🔖' },
    { href: '/admin/settings/recharge', title: '充值方案', description: '管理充值方案、充赠活动和限时优惠', icon: '💰' },
    { href: '/admin/settings/coupons', title: '优惠券', description: '创建和管理优惠券模板，发放给会员', icon: '🎟️' },
    { href: '/admin/settings/audit', title: '操作日志', description: '查看店铺操作记录和审计日志', icon: '📋' },
    { href: '/admin/settings/export', title: '数据导出', description: '导出会员、订单、充值等经营数据', icon: '📤' },
    { href: '/admin/settings/payment', title: '支付配置', description: '配置线下支付方式选项', icon: '💳' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">设置</h1>
        <p className="text-sm text-muted-foreground mt-1">管理店铺设置和配置</p>
      </div>

      {message && (
        <div className={`rounded-md p-3 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Shop Info Card */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏪</span>
            <div>
              <h2 className="font-semibold text-lg">店铺信息</h2>
              <p className="text-sm text-muted-foreground">编辑店铺名称、地址、营业时间、联系方式</p>
            </div>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              编辑
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium mb-1">店铺名称</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">店铺地址</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">联系电话</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">营业时间</label>
              <input
                type="text"
                value={form.businessHours}
                onChange={(e) => setForm({ ...form, businessHours: e.target.value })}
                placeholder="例如: 09:00-21:00"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                取消
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">店铺名称</span>
              <p className="font-medium">{shop?.name || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">联系电话</span>
              <p className="font-medium">{shop?.phone || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">店铺地址</span>
              <p className="font-medium">{shop?.address || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">营业时间</span>
              <p className="font-medium">{shop?.businessHours || '-'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Settings Links */}
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
