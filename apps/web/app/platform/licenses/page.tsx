'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  getAllLicenses,
  getExpiringShops,
  getPlanDefaults,
  createLicense,
  renewLicense,
  getAllShops,
  type LicenseListItem,
  type LicensePlan,
  type ExpiringShopItem,
  type ShopListItem,
  type PlanDefaults,
} from '@/lib/api/platform-services';

const PLAN_CONFIG: Record<LicensePlan, { name: string; color: string; description: string }> = {
  FREE: { name: '免费版', color: 'bg-slate-100 text-slate-700', description: '2员工 / 200会员 / 基础功能' },
  PRO: { name: '专业版', color: 'bg-blue-100 text-blue-700', description: '10员工 / 1000会员 / 全功能' },
  ENTERPRISE: { name: '企业版', color: 'bg-purple-100 text-purple-700', description: '无限员工 / 无限会员 / 全功能' },
};

const MODULE_LABELS: Record<string, string> = {
  pos: '收银系统',
  member: '会员管理',
  service: '服务管理',
  staff: '员工管理',
  order: '订单管理',
  report: '报表统计',
  analytics: '数据分析',
  coupon: '优惠券',
  marketing: '营销管理',
  inventory: '库存管理',
};

const DURATION_OPTIONS = [
  { value: 1, label: '1个月' },
  { value: 3, label: '3个月' },
  { value: 6, label: '6个月' },
  { value: 12, label: '1年' },
  { value: 24, label: '2年' },
  { value: 36, label: '3年' },
];

function CountdownBadge({ daysUntilExpiry }: { daysUntilExpiry: number }) {
  if (daysUntilExpiry <= 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
        已过期 {Math.abs(daysUntilExpiry)} 天
      </span>
    );
  }
  if (daysUntilExpiry <= 15) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 animate-pulse">
        {daysUntilExpiry} 天后到期
      </span>
    );
  }
  if (daysUntilExpiry <= 30) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        {daysUntilExpiry} 天后到期
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      {daysUntilExpiry} 天后到期
    </span>
  );
}

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<LicenseListItem[]>([]);
  const [expiringShops, setExpiringShops] = useState<ExpiringShopItem[]>([]);
  const [shops, setShops] = useState<ShopListItem[]>([]);
  const [planDefaults, setPlanDefaults] = useState<PlanDefaults | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<LicenseListItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED'>('ALL');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    shopId: '',
    plan: 'PRO' as LicensePlan,
    durationMonths: 12,
    staffLimit: 10,
    membersLimit: 1000,
    modules: [] as string[],
  });

  const loadData = useCallback(async () => {
    try {
      const [licensesData, expiringData, shopsData, defaultsData] = await Promise.all([
        getAllLicenses(),
        getExpiringShops(),
        getAllShops(),
        getPlanDefaults(),
      ]);
      setLicenses(licensesData);
      setExpiringShops(expiringData);
      setShops(shopsData);
      setPlanDefaults(defaultsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredLicenses = licenses.filter(license => {
    if (filterStatus === 'ALL') return true;
    return license.status === filterStatus;
  });

  const shopsWithoutLicense = shops.filter(shop =>
    !licenses.some(license => license.shopId === shop.id)
  );

  function applyPlanDefaults(plan: LicensePlan) {
    if (!planDefaults) return;
    const planDef = planDefaults.plans.find(p => p.plan === plan);
    if (planDef) {
      setFormData(prev => ({
        ...prev,
        plan,
        staffLimit: planDef.staffLimit === Infinity ? 999 : planDef.staffLimit,
        membersLimit: planDef.membersLimit === Infinity ? 9999 : planDef.membersLimit,
        modules: [...planDef.modules],
      }));
    }
  }

  function handlePlanChange(plan: LicensePlan) {
    applyPlanDefaults(plan);
  }

  function toggleModule(moduleId: string) {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.includes(moduleId)
        ? prev.modules.filter(m => m !== moduleId)
        : [...prev.modules, moduleId],
    }));
  }

  async function handleCreateLicense(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createLicense({
        shopId: formData.shopId,
        plan: formData.plan,
        durationMonths: formData.durationMonths,
        staffLimit: formData.staffLimit,
        membersLimit: formData.membersLimit,
        modules: formData.modules.length > 0 ? formData.modules : undefined,
      });
      setShowCreateModal(false);
      setFormData({
        shopId: '',
        plan: 'PRO',
        durationMonths: 12,
        staffLimit: 10,
        membersLimit: 1000,
        modules: [],
      });
      loadData();
    } catch (error) {
      alert('创建License失败');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRenewLicense(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLicense) return;
    setSubmitting(true);
    try {
      await renewLicense(selectedLicense.id, {
        durationMonths: formData.durationMonths,
        plan: formData.plan,
        staffLimit: formData.staffLimit,
        membersLimit: formData.membersLimit,
        modules: formData.modules.length > 0 ? formData.modules : undefined,
      });
      setShowRenewModal(false);
      setSelectedLicense(null);
      loadData();
    } catch (error) {
      alert('续费失败');
    } finally {
      setSubmitting(false);
    }
  }

  function openRenewModal(license: LicenseListItem) {
    setSelectedLicense(license);
    setFormData({
      shopId: license.shopId,
      plan: license.plan,
      durationMonths: 12,
      staffLimit: license.staffLimit,
      membersLimit: license.membersLimit,
      modules: [...license.modules],
    });
    setShowRenewModal(true);
  }

  function openCreateModal() {
    setFormData({
      shopId: '',
      plan: 'PRO',
      durationMonths: 12,
      staffLimit: 10,
      membersLimit: 1000,
      modules: planDefaults?.plans.find(p => p.plan === 'PRO')?.modules ?? [],
    });
    setShowCreateModal(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const statusCounts = {
    total: licenses.length,
    active: licenses.filter(l => l.status === 'ACTIVE').length,
    expiring: licenses.filter(l => l.status === 'EXPIRING_SOON').length,
    expired: licenses.filter(l => l.status === 'EXPIRED').length,
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">License管理</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">管理各店铺的License分配、续费和状态</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          + 分配License
        </button>
      </div>

      {/* Expiring Alert */}
      {expiringShops.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <span className="text-amber-600 text-lg">!</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-amber-800 text-sm sm:text-base">License到期预警</h3>
              <p className="text-amber-700 text-xs sm:text-sm mt-0.5">
                有 <span className="font-bold">{expiringShops.length}</span> 个店铺的License即将到期
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {expiringShops.slice(0, 8).map(shop => (
              <Link
                key={shop.id}
                href={`/platform/licenses?highlight=${shop.id}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-amber-200 text-amber-800 rounded-lg text-xs sm:text-sm hover:bg-amber-50 transition-colors"
              >
                <span className="truncate max-w-[100px] sm:max-w-none font-medium">{shop.name}</span>
                <span className="text-amber-500 font-mono text-xs">
                  {shop.daysUntilExpiry > 0 ? `${shop.daysUntilExpiry}天` : '已过期'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
          <p className="text-xs sm:text-sm font-medium text-slate-500">总License</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{statusCounts.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
          <p className="text-xs sm:text-sm font-medium text-slate-500">生效中</p>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-1">{statusCounts.active}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
          <p className="text-xs sm:text-sm font-medium text-slate-500">即将到期</p>
          <p className="text-2xl sm:text-3xl font-bold text-amber-600 mt-1">{statusCounts.expiring}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
          <p className="text-xs sm:text-sm font-medium text-slate-500">已过期</p>
          <p className="text-2xl sm:text-3xl font-bold text-red-600 mt-1">{statusCounts.expired}</p>
        </div>
      </div>

      {/* License List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto">
            {(['ALL', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status === 'ALL' ? '全部' : status === 'ACTIVE' ? '生效中' : status === 'EXPIRING_SOON' ? '即将到期' : '已过期'}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-400 ml-2 shrink-0">{filteredLicenses.length} 条</span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredLicenses.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <p className="text-lg mb-1">暂无License数据</p>
              <p className="text-sm">点击上方按钮为店铺分配License</p>
            </div>
          ) : (
            filteredLicenses.map(license => (
              <div key={license.id} className={`p-3 sm:p-4 hover:bg-slate-50/50 transition-colors ${
                license.status === 'EXPIRING_SOON' ? 'border-l-4 border-l-amber-400' : ''
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/platform/licenses/${license.id}`}
                        className="font-semibold text-slate-900 hover:text-blue-600 transition-colors truncate"
                      >
                        {license.shopName}
                      </Link>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PLAN_CONFIG[license.plan].color}`}>
                        {PLAN_CONFIG[license.plan].name}
                      </span>
                      <CountdownBadge daysUntilExpiry={license.daysUntilExpiry} />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
                      <span>员工 <span className="font-medium text-slate-700">{license.staffLimit === 999 ? '无限' : `${license.staffLimit}人`}</span></span>
                      <span>会员 <span className="font-medium text-slate-700">{license.membersLimit === 9999 ? '无限' : `${license.membersLimit}人`}</span></span>
                      <span>模块 <span className="font-medium text-slate-700">{license.modules.length}个</span></span>
                      <span>到期 <span className="font-medium text-slate-700">{new Date(license.expiresAt).toLocaleDateString('zh-CN')}</span></span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {license.modules.slice(0, 5).map(m => (
                        <span key={m} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px]">
                          {MODULE_LABELS[m] || m}
                        </span>
                      ))}
                      {license.modules.length > 5 && (
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded text-[10px]">
                          +{license.modules.length - 5}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link
                      href={`/platform/licenses/${license.id}`}
                      className="px-3 py-1.5 text-xs sm:text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                    >
                      详情
                    </Link>
                    <button
                      onClick={() => openRenewModal(license)}
                      className="px-3 py-1.5 text-xs sm:text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors font-medium"
                    >
                      续费/升级
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-5">分配License</h2>
            <form onSubmit={handleCreateLicense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">选择店铺</label>
                <select
                  required
                  value={formData.shopId}
                  onChange={e => setFormData({ ...formData, shopId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">请选择店铺</option>
                  {shopsWithoutLicense.map(shop => (
                    <option key={shop.id} value={shop.id}>
                      {shop.name} ({shop.phone || '无电话'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">版本</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(PLAN_CONFIG) as LicensePlan[]).map(plan => (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => handlePlanChange(plan)}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                        formData.plan === plan
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-1 ${PLAN_CONFIG[plan].color}`}>
                        {PLAN_CONFIG[plan].name}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1">{PLAN_CONFIG[plan].description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">有效期</label>
                <select
                  required
                  value={formData.durationMonths}
                  onChange={e => setFormData({ ...formData, durationMonths: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {DURATION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">员工上限</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.staffLimit}
                    onChange={e => setFormData({ ...formData, staffLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">会员上限</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.membersLimit}
                    onChange={e => setFormData({ ...formData, membersLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Module Permissions */}
              {planDefaults && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">模块权限</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {planDefaults.availableModules.map(mod => {
                      const isSelected = formData.modules.includes(mod.id);
                      return (
                        <button
                          key={mod.id}
                          type="button"
                          onClick={() => toggleModule(mod.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                            isSelected
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${
                            isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-300'
                          }`}>
                            {isSelected ? '✓' : ''}
                          </span>
                          {MODULE_LABELS[mod.id] || mod.id}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {submitting ? '创建中...' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Renew Modal */}
      {showRenewModal && selectedLicense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">续费/升级License</h2>
            <p className="text-sm text-slate-500 mb-5">
              为 <span className="font-semibold text-slate-700">{selectedLicense.shopName}</span> 续费或升级
            </p>
            <form onSubmit={handleRenewLicense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">目标版本</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(PLAN_CONFIG) as LicensePlan[]).map(plan => (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => handlePlanChange(plan)}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                        formData.plan === plan
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-1 ${PLAN_CONFIG[plan].color}`}>
                        {PLAN_CONFIG[plan].name}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1">{PLAN_CONFIG[plan].description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">续费时长</label>
                <select
                  required
                  value={formData.durationMonths}
                  onChange={e => setFormData({ ...formData, durationMonths: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {DURATION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">员工上限</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.staffLimit}
                    onChange={e => setFormData({ ...formData, staffLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">会员上限</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.membersLimit}
                    onChange={e => setFormData({ ...formData, membersLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Module Permissions */}
              {planDefaults && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">模块权限</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {planDefaults.availableModules.map(mod => {
                      const isSelected = formData.modules.includes(mod.id);
                      return (
                        <button
                          key={mod.id}
                          type="button"
                          onClick={() => toggleModule(mod.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                            isSelected
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${
                            isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-300'
                          }`}>
                            {isSelected ? '✓' : ''}
                          </span>
                          {MODULE_LABELS[mod.id] || mod.id}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRenewModal(false);
                    setSelectedLicense(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {submitting ? '处理中...' : '确认续费/升级'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
