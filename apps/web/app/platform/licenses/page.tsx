'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getAllLicenses,
  getExpiringShops,
  createLicense,
  updateLicense,
  renewLicense,
  getAllShops,
  type LicenseListItem,
  type LicensePlan,
  type ExpiringShopItem,
  type ShopListItem,
} from '@/lib/api/platform-services';

const PLAN_CONFIG = {
  FREE: { name: '免费版', color: 'bg-slate-100 text-slate-700' },
  PRO: { name: '专业版', color: 'bg-blue-100 text-blue-700' },
  ENTERPRISE: { name: '企业版', color: 'bg-purple-100 text-purple-700' },
};

const DURATION_OPTIONS = [
  { value: 6, label: '6个月' },
  { value: 12, label: '1年' },
  { value: 24, label: '2年' },
  { value: 36, label: '3年' },
];

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<LicenseListItem[]>([]);
  const [expiringShops, setExpiringShops] = useState<ExpiringShopItem[]>([]);
  const [shops, setShops] = useState<ShopListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<LicenseListItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED'>('ALL');

  const [formData, setFormData] = useState({
    shopId: '',
    plan: 'PRO' as LicensePlan,
    durationMonths: 12,
    staffLimit: 10,
    membersLimit: 500,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [licensesData, expiringData, shopsData] = await Promise.all([
        getAllLicenses(),
        getExpiringShops(),
        getAllShops(),
      ]);
      setLicenses(licensesData);
      setExpiringShops(expiringData);
      setShops(shopsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredLicenses = licenses.filter(license => {
    if (filterStatus === 'ALL') return true;
    return license.status === filterStatus;
  });

  const shopsWithoutLicense = shops.filter(shop =>
    !licenses.some(license => license.shopId === shop.id)
  );

  async function handleCreateLicense(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createLicense(formData);
      setShowCreateModal(false);
      setFormData({
        shopId: '',
        plan: 'PRO',
        durationMonths: 12,
        staffLimit: 10,
        membersLimit: 500,
      });
      loadData();
    } catch (error) {
      alert('创建License失败');
    }
  }

  async function handleRenewLicense(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLicense) return;

    try {
      await renewLicense(selectedLicense.id, {
        durationMonths: formData.durationMonths,
        plan: formData.plan,
        staffLimit: formData.staffLimit,
        membersLimit: formData.membersLimit,
      });
      setShowRenewModal(false);
      setSelectedLicense(null);
      loadData();
    } catch (error) {
      alert('续费失败');
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
    });
    setShowRenewModal(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">License管理</h1>
          <p className="text-slate-600 mt-1">管理各店铺的License分配、续费和状态</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          分配License
        </button>
      </div>

      {/* Expiring Alert */}
      {expiringShops.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-amber-800">License即将到期提醒</h3>
              <p className="text-amber-700 text-sm mt-1">
                有 {expiringShops.length} 个店铺的License即将在15天内到期，请注意及时续费
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {expiringShops.slice(0, 5).map(shop => (
              <span key={shop.id} className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                <span>{shop.name}</span>
                <span className="text-amber-600">({shop.daysUntilExpiry}天后到期)</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">总License数</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{licenses.length}</p>
            </div>
            <div className="text-3xl">📄</div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">生效中</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {licenses.filter(l => l.status === 'ACTIVE').length}
              </p>
            </div>
            <div className="text-3xl">✅</div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">即将到期</p>
              <p className="text-2xl font-bold text-amber-600 mt-2">
                {licenses.filter(l => l.status === 'EXPIRING_SOON').length}
              </p>
            </div>
            <div className="text-3xl">⏰</div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">已过期</p>
              <p className="text-2xl font-bold text-red-600 mt-2">
                {licenses.filter(l => l.status === 'EXPIRED').length}
              </p>
            </div>
            <div className="text-3xl">❌</div>
          </div>
        </div>
      </div>

      {/* License List */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {(['ALL', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {status === 'ALL' ? '全部' : status === 'ACTIVE' ? '生效中' : status === 'EXPIRING_SOON' ? '即将到期' : '已过期'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {filteredLicenses.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              暂无License数据
            </div>
          ) : (
            filteredLicenses.map(license => (
              <div key={license.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-slate-900">{license.shopName}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_CONFIG[license.plan].color}`}>
                        {PLAN_CONFIG[license.plan].name}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        license.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : license.status === 'EXPIRING_SOON'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {license.status === 'ACTIVE' ? '生效中' : license.status === 'EXPIRING_SOON' ? '即将到期' : '已过期'}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">License Key:</span>
                        <span className="ml-2 font-mono text-slate-700">{license.licenseKey}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">到期时间:</span>
                        <span className="ml-2 text-slate-700">{new Date(license.expiresAt).toLocaleDateString('zh-CN')}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">员工上限:</span>
                        <span className="ml-2 text-slate-700">{license.staffLimit}人</span>
                      </div>
                      <div>
                        <span className="text-slate-500">会员上限:</span>
                        <span className="ml-2 text-slate-700">{license.membersLimit}人</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/platform/licenses/${license.id}`}
                      className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      详情
                    </Link>
                    <button
                      onClick={() => openRenewModal(license)}
                      className="px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">分配License</h2>
            <form onSubmit={handleCreateLicense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">选择店铺</label>
                <select
                  required
                  value={formData.shopId}
                  onChange={e => setFormData({ ...formData, shopId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <select
                  required
                  value={formData.plan}
                  onChange={e => setFormData({ ...formData, plan: e.target.value as LicensePlan })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="FREE">免费版</option>
                  <option value="PRO">专业版</option>
                  <option value="ENTERPRISE">企业版</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">有效期</label>
                <select
                  required
                  value={formData.durationMonths}
                  onChange={e => setFormData({ ...formData, durationMonths: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {DURATION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">员工上限</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.staffLimit}
                    onChange={e => setFormData({ ...formData, staffLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Renew Modal */}
      {showRenewModal && selectedLicense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">续费/升级License</h2>
            <p className="text-sm text-slate-600 mb-4">
              为 <span className="font-semibold">{selectedLicense.shopName}</span> 续费或升级
            </p>
            <form onSubmit={handleRenewLicense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">版本</label>
                <select
                  value={formData.plan}
                  onChange={e => setFormData({ ...formData, plan: e.target.value as LicensePlan })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="FREE">免费版</option>
                  <option value="PRO">专业版</option>
                  <option value="ENTERPRISE">企业版</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">续费时长</label>
                <select
                  required
                  value={formData.durationMonths}
                  onChange={e => setFormData({ ...formData, durationMonths: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {DURATION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">员工上限</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.staffLimit}
                    onChange={e => setFormData({ ...formData, staffLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowRenewModal(false);
                    setSelectedLicense(null);
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  续费/升级
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}