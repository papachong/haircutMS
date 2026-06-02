'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import type { TemplatePreview } from '@/lib/types/template';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuthData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [templates, setTemplates] = useState<TemplatePreview[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showTemplates, setShowTemplates] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    ownerPhone: '',
    ownerPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetch('/api/v1/auth/register/templates')
      .then((res) => res.json())
      .then((res) => {
        if (res.code === 0 && res.data) setTemplates(res.data);
      })
      .catch(() => {});
  }, []);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('请输入店铺名称');
      return;
    }
    if (!formData.ownerName.trim()) {
      setError('请输入您的姓名');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(formData.ownerPhone.trim())) {
      setError('请输入有效的手机号');
      return;
    }
    if (formData.ownerPassword.length < 6) {
      setError('密码至少需要6个字符');
      return;
    }
    if (formData.ownerPassword !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          ownerName: formData.ownerName.trim(),
          ownerPhone: formData.ownerPhone.trim(),
          ownerPassword: formData.ownerPassword,
          template: selectedTemplate || undefined,
        }),
      });
      const data = await res.json();

      if (data.code !== 0) {
        setError(data.message || '注册失败，请稍后重试');
        return;
      }

      // Auto-login: update auth state + localStorage
      setAuthData({
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
        shopId: data.data.shopId,
        staffId: data.data.staffId,
        role: data.data.role,
      });

      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );
      router.push(isMobile ? '/m/dashboard' : '/admin');
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  const selectedPreview = templates.find((t) => t.key === selectedTemplate);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">创建您的店铺</h1>
          <p className="mt-1 text-sm text-gray-500">注册即可免费使用理发店管理系统</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border bg-white p-6">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
          )}

          {/* Shop Name */}
          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">
              店铺名称 <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              className={inputClass}
              placeholder="请输入店铺名称"
            />
          </div>

          {/* Template Selection (collapsible) */}
          <div>
            <button
              type="button"
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex w-full items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <span>
                {selectedTemplate
                  ? `模板：${templates.find((t) => t.key === selectedTemplate)?.name || '自定义'}`
                  : '选择数据模板（可选）'}
              </span>
              <svg
                className={`h-4 w-4 text-gray-400 transition-transform ${showTemplates ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showTemplates && (
              <div className="mt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => setSelectedTemplate('')}
                  className={`w-full rounded-lg border-2 p-3 text-left text-sm transition-all ${
                    selectedTemplate === ''
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-700">不使用模板</div>
                  <div className="mt-0.5 text-xs text-gray-400">创建空白店铺，后续手动配置</div>
                </button>

                {templates.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setSelectedTemplate(t.key)}
                    className={`w-full rounded-lg border-2 p-3 text-left text-sm transition-all ${
                      selectedTemplate === t.key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{t.name}</div>
                    <div className="mt-0.5 text-xs text-gray-500">{t.description}</div>
                    <div className="mt-1 flex gap-2 text-xs text-gray-400">
                      <span>{t.serviceItemCount}个服务</span>
                      <span>{t.memberLevelCount}个等级</span>
                    </div>
                  </button>
                ))}

                {selectedPreview && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
                    <div className="font-medium text-blue-900 mb-1">模板预览：{selectedPreview.name}</div>
                    <div className="space-y-1">
                      <div>
                        服务项目：{selectedPreview.serviceCategoryCount} 分类，{selectedPreview.serviceItemCount} 项
                      </div>
                      <div>会员等级：{selectedPreview.memberLevelNames.join(' / ')}</div>
                      <div>充值方案：{selectedPreview.rechargePlans.join('、')}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Owner Info */}
          <div className="space-y-1">
            <label htmlFor="ownerName" className="text-sm font-medium text-gray-700">
              您的姓名 <span className="text-red-500">*</span>
            </label>
            <input
              id="ownerName"
              type="text"
              required
              value={formData.ownerName}
              onChange={(e) => updateField('ownerName', e.target.value)}
              className={inputClass}
              placeholder="请输入您的姓名"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="ownerPhone" className="text-sm font-medium text-gray-700">
              手机号 <span className="text-red-500">*</span>
            </label>
            <input
              id="ownerPhone"
              type="tel"
              required
              value={formData.ownerPhone}
              onChange={(e) => updateField('ownerPhone', e.target.value)}
              className={inputClass}
              placeholder="请输入手机号（将作为登录账号）"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="ownerPassword" className="text-sm font-medium text-gray-700">
              密码 <span className="text-red-500">*</span>
            </label>
            <input
              id="ownerPassword"
              type="password"
              required
              minLength={6}
              value={formData.ownerPassword}
              onChange={(e) => updateField('ownerPassword', e.target.value)}
              className={inputClass}
              placeholder="请设置密码（至少6位）"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
              确认密码 <span className="text-red-500">*</span>
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={6}
              value={formData.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              className={inputClass}
              placeholder="请再次输入密码"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? '注册中...' : '免费注册'}
          </button>

          <p className="text-center text-sm text-gray-500">
            已有账号？
            <a href="/login" className="text-blue-600 hover:underline">
              去登录
            </a>
          </p>
        </form>
      </div>

      <footer className="mt-8 text-center text-xs text-slate-400 space-y-1">
        <p>
          儒虎智能科技（北京）有限公司 |
          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-600 transition-colors"
          >
            京ICP备2025154066号-1
          </a>{' '}
          |
          <a
            href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=11011402055127"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-600 transition-colors"
          >
            京公网安备11011402055127号
          </a>
        </p>
        <p>Copyright &copy; 2024-2025 Ruhoo AI. All Rights Reserved. 儒虎智能科技 版权所有</p>
      </footer>
    </div>
  );
}
