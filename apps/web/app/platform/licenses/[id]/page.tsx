'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getLicenseById, type LicenseDetail, type LicensePlan } from '@/lib/api/platform-services';

const PLAN_CONFIG = {
  FREE: { name: '免费版', description: '基础功能，适合小型店铺' },
  PRO: { name: '专业版', description: '完整功能，适合中型店铺' },
  ENTERPRISE: { name: '企业版', description: '全功能支持，适合连锁店' },
};

const MODULE_LABELS: Record<string, string> = {
  POS: '收银系统',
  MEMBER: '会员管理',
  STAFF: '员工管理',
  SERVICE: '服务管理',
  ORDER: '订单管理',
  PASS_CARD: '次卡管理',
  COUPON: '优惠券',
  RECHARGE: '充值管理',
  ANALYTICS: '数据分析',
  AUDIT: '审计日志',
};

export default function LicenseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [license, setLicense] = useState<LicenseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLicense();
  }, [params.id]);

  async function loadLicense() {
    try {
      const data = await getLicenseById(params.id as string);
      setLicense(data);
    } catch (error) {
      console.error('Failed to load license:', error);
      alert('加载License失败');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">加载中...</div>
      </div>
    );
  }

  if (!license) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">License不存在</p>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 text-sm mb-2 flex items-center gap-1"
          >
            ← 返回列表
          </button>
          <h1 className="text-2xl font-bold text-slate-900">License详情</h1>
        </div>
      </div>

      {/* License Status Card */}
      <div className={`rounded-lg border p-6 ${
        license.status === 'ACTIVE'
          ? 'bg-green-50 border-green-200'
          : license.status === 'EXPIRING_SOON'
          ? 'bg-amber-50 border-amber-200'
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${
            license.status === 'ACTIVE'
              ? 'bg-green-100'
              : license.status === 'EXPIRING_SOON'
              ? 'bg-amber-100'
              : 'bg-red-100'
          }`}>
            {license.status === 'ACTIVE' ? '✅' : license.status === 'EXPIRING_SOON' ? '⏰' : '❌'}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">{license.shopName}</h2>
            <p className={`mt-1 ${
              license.status === 'ACTIVE'
                ? 'text-green-700'
                : license.status === 'EXPIRING_SOON'
                ? 'text-amber-700'
                : 'text-red-700'
            }`}>
              {license.status === 'ACTIVE'
                ? 'License生效中'
                : license.status === 'EXPIRING_SOON'
                ? `License即将在${license.daysUntilExpiry}天后到期`
                : 'License已过期，店铺已降级为免费版'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-600">到期时间</p>
            <p className="text-lg font-semibold text-slate-900">
              {new Date(license.expiresAt).toLocaleDateString('zh-CN')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* License Info */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">License信息</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">License Key</p>
                <p className="font-mono text-sm bg-slate-100 p-2 rounded mt-1">{license.licenseKey}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">版本</p>
                <p className="font-semibold text-slate-900 mt-1">{planConfig.name}</p>
                <p className="text-xs text-slate-500">{planConfig.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">签发时间</p>
                <p className="text-slate-900 mt-1">{new Date(license.issuedAt).toLocaleDateString('zh-CN')}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">创建时间</p>
                <p className="text-slate-900 mt-1">{new Date(license.createdAt).toLocaleString('zh-CN')}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-600">店铺信息</p>
              <div className="mt-1">
                <p className="text-slate-900">{license.shop.name}</p>
                <p className="text-sm text-slate-600">{license.shop.phone || '无电话'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Limits */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">额度限制</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-600">员工数量</span>
                <span className="text-sm font-semibold text-slate-900">{license.staffLimit}人</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-600">会员数量</span>
                <span className="text-sm font-semibold text-slate-900">{license.membersLimit}人</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Modules */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">可用模块</h3>
          <div className="grid grid-cols-2 gap-3">
            {license.modules.map(module => (
              <div key={module} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                <span className="text-green-600">✓</span>
                <span className="text-sm text-slate-700">{MODULE_LABELS[module] || module}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Info */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">技术信息</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-600">License ID</p>
              <p className="font-mono text-xs text-slate-900 break-all">{license.id}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Shop ID</p>
              <p className="font-mono text-xs text-slate-900 break-all">{license.shopId}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">RSA签名</p>
              <p className="font-mono text-xs text-slate-500 break-all mt-1">{license.signature.slice(0, 50)}...</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">最后更新</p>
              <p className="text-slate-900 text-sm">{new Date(license.updatedAt).toLocaleString('zh-CN')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}