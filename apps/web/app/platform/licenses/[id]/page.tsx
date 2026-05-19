'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getLicenseById,
  getPlanDefaults,
  renewLicense,
  type LicenseDetail,
  type LicensePlan,
  type PlanDefaults,
} from '@/lib/api/platform-services';

const PLAN_CONFIG: Record<LicensePlan, { name: string; color: string; description: string }> = {
  FREE: { name: '免费版', color: 'bg-slate-100 text-slate-700 border-slate-300', description: '基础功能，适合小型店铺' },
  PRO: { name: '专业版', color: 'bg-blue-100 text-blue-700 border-blue-300', description: '完整功能，适合中型店铺' },
  ENTERPRISE: { name: '企业版', color: 'bg-purple-100 text-purple-700 border-purple-300', description: '全功能支持，适合连锁店' },
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

export default function LicenseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [license, setLicense] = useState<LicenseDetail | null>(null);
  const [planDefaults, setPlanDefaults] = useState<PlanDefaults | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [renewData, setRenewData] = useState({
    plan: 'PRO' as LicensePlan,
    durationMonths: 12,
    staffLimit: 10,
    membersLimit: 1000,
    modules: [] as string[],
  });

  const loadLicense = useCallback(async () => {
    try {
      const [data, defaults] = await Promise.all([
        getLicenseById(params.id as string),
        getPlanDefaults(),
      ]);
      setLicense(data);
      setPlanDefaults(defaults);
    } catch (error) {
      console.error('Failed to load license:', error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadLicense();
  }, [loadLicense]);

  function openRenewModal() {
    if (!license) return;
    setRenewData({
      plan: license.plan,
      durationMonths: 12,
      staffLimit: license.staffLimit,
      membersLimit: license.membersLimit,
      modules: [...license.modules],
    });
    setShowRenewModal(true);
  }

  function applyPlanDefaults(plan: LicensePlan) {
    if (!planDefaults) return;
    const planDef = planDefaults.plans.find(p => p.plan === plan);
    if (planDef) {
      setRenewData(prev => ({
        ...prev,
        plan,
        staffLimit: planDef.staffLimit === Infinity ? 999 : planDef.staffLimit,
        membersLimit: planDef.membersLimit === Infinity ? 9999 : planDef.membersLimit,
        modules: [...planDef.modules],
      }));
    }
  }

  function toggleModule(moduleId: string) {
    setRenewData(prev => ({
      ...prev,
      modules: prev.modules.includes(moduleId)
        ? prev.modules.filter(m => m !== moduleId)
        : [...prev.modules, moduleId],
    }));
  }

  async function handleRenew(e: React.FormEvent) {
    e.preventDefault();
    if (!license) return;
    setSubmitting(true);
    try {
      await renewLicense(license.id, {
        durationMonths: renewData.durationMonths,
        plan: renewData.plan,
        staffLimit: renewData.staffLimit,
        membersLimit: renewData.membersLimit,
        modules: renewData.modules.length > 0 ? renewData.modules : undefined,
      });
      setShowRenewModal(false);
      loadLicense();
    } catch (error) {
      alert('续费/升级失败');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!license) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 text-lg">License不存在</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          返回
        </button>
      </div>
    );
  }

  const planConfig = PLAN_CONFIG[license.plan];
  const staffUsagePercent = license.staffLimit > 0
    ? Math.min(100, Math.round((license.usage.currentStaffCount / license.staffLimit) * 100))
    : 0;
  const memberUsagePercent = license.membersLimit > 0
    ? Math.min(100, Math.round((license.usage.currentMembersCount / license.membersLimit) * 100))
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push('/platform/licenses')}
            className="text-blue-600 hover:text-blue-700 text-sm mb-2 flex items-center gap-1"
          >
            &larr; 返回列表
          </button>
          <h1 className="text-2xl font-bold text-slate-900">License详情</h1>
        </div>
        <button
          onClick={openRenewModal}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
        >
          续费/升级
        </button>
      </div>

      {/* Status Card */}
      <div className={`rounded-xl border-2 p-6 ${
        license.status === 'ACTIVE'
          ? 'bg-emerald-50 border-emerald-200'
          : license.status === 'EXPIRING_SOON'
          ? 'bg-amber-50 border-amber-200'
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
              license.status === 'ACTIVE'
                ? 'bg-emerald-100'
                : license.status === 'EXPIRING_SOON'
                ? 'bg-amber-100'
                : 'bg-red-100'
            }`}>
              <span className="text-2xl">
                {license.status === 'ACTIVE' ? '✓' : license.status === 'EXPIRING_SOON' ? '!' : '✕'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{license.shopName}</h2>
              <p className={`mt-0.5 text-sm font-medium ${
                license.status === 'ACTIVE'
                  ? 'text-emerald-700'
                  : license.status === 'EXPIRING_SOON'
                  ? 'text-amber-700'
                  : 'text-red-700'
              }`}>
                {license.status === 'ACTIVE'
                  ? 'License生效中'
                  : license.status === 'EXPIRING_SOON'
                  ? `即将在 ${license.daysUntilExpiry} 天后到期`
                  : `已过期 ${Math.abs(license.daysUntilExpiry)} 天`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">到期时间</p>
            <p className="text-lg font-bold text-slate-900">
              {new Date(license.expiresAt).toLocaleDateString('zh-CN')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* License Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">授权信息</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">License Key</span>
              <span className="font-mono text-sm bg-slate-100 px-3 py-1 rounded-lg text-slate-700">{license.licenseKey}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">版本</span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${planConfig.color}`}>
                {planConfig.name}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">签发时间</span>
              <span className="text-sm text-slate-700">{new Date(license.issuedAt).toLocaleDateString('zh-CN')}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">最后更新</span>
              <span className="text-sm text-slate-700">{new Date(license.updatedAt).toLocaleString('zh-CN')}</span>
            </div>
            <div className="py-2">
              <span className="text-sm text-slate-500 block mb-1">店铺信息</span>
              <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{license.shop.name}</p>
                  <p className="text-xs text-slate-500">{license.shop.phone || '无电话'} &middot; {license.shop.status}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Stats */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">使用情况</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-sm text-slate-500">员工数量</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {license.usage.currentStaffCount}
                    <span className="text-sm font-normal text-slate-400 ml-1">
                      / {license.staffLimit >= 999 ? '无限' : license.staffLimit}
                    </span>
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  staffUsagePercent > 90 ? 'bg-red-100 text-red-700' :
                  staffUsagePercent > 70 ? 'bg-amber-100 text-amber-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {staffUsagePercent}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${
                    staffUsagePercent > 90 ? 'bg-red-500' :
                    staffUsagePercent > 70 ? 'bg-amber-500' :
                    'bg-emerald-500'
                  }`}
                  style={{ width: `${staffUsagePercent}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-sm text-slate-500">会员数量</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {license.usage.currentMembersCount}
                    <span className="text-sm font-normal text-slate-400 ml-1">
                      / {license.membersLimit >= 9999 ? '无限' : license.membersLimit}
                    </span>
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  memberUsagePercent > 90 ? 'bg-red-100 text-red-700' :
                  memberUsagePercent > 70 ? 'bg-amber-100 text-amber-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {memberUsagePercent}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${
                    memberUsagePercent > 90 ? 'bg-red-500' :
                    memberUsagePercent > 70 ? 'bg-amber-500' :
                    'bg-emerald-500'
                  }`}
                  style={{ width: `${memberUsagePercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Module Permissions */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">
            模块权限
            <span className="text-sm font-normal text-slate-400 ml-2">
              {license.modules.length} 个已授权
            </span>
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(MODULE_LABELS).map(([key, label]) => {
              const isActive = license.modules.includes(key);
              return (
                <div key={key} className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-50 text-slate-400 border border-slate-100'
                }`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    isActive ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                  }`}>
                    {isActive ? '✓' : '-'}
                  </span>
                  {label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Technical Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">技术信息</h3>
          <div className="space-y-3">
            <div className="flex items-start justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">License ID</span>
              <span className="font-mono text-xs text-slate-700 max-w-[200px] break-all text-right">{license.id}</span>
            </div>
            <div className="flex items-start justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">Shop ID</span>
              <span className="font-mono text-xs text-slate-700 max-w-[200px] break-all text-right">{license.shopId}</span>
            </div>
            <div className="py-2">
              <span className="text-sm text-slate-500 block mb-1">RSA签名</span>
              <p className="font-mono text-[10px] text-slate-400 break-all bg-slate-50 p-2 rounded-lg">
                {license.signature.slice(0, 80)}...
              </p>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">创建时间</span>
              <span className="text-xs text-slate-700">{new Date(license.createdAt).toLocaleString('zh-CN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Renew Modal */}
      {showRenewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">续费/升级License</h2>
            <p className="text-sm text-slate-500 mb-5">
              为 <span className="font-semibold text-slate-700">{license.shopName}</span> 续费或升级
            </p>
            <form onSubmit={handleRenew} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">目标版本</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(PLAN_CONFIG) as LicensePlan[]).map(plan => (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => applyPlanDefaults(plan)}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                        renewData.plan === plan
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
                  value={renewData.durationMonths}
                  onChange={e => setRenewData({ ...renewData, durationMonths: Number(e.target.value) })}
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
                    value={renewData.staffLimit}
                    onChange={e => setRenewData({ ...renewData, staffLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">会员上限</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={renewData.membersLimit}
                    onChange={e => setRenewData({ ...renewData, membersLimit: Number(e.target.value) })}
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
                      const isSelected = renewData.modules.includes(mod.id);
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
                  onClick={() => setShowRenewModal(false)}
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
