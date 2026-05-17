'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getCouponTemplates,
  createCouponTemplate,
  updateCouponTemplate,
  deleteCouponTemplate,
  issueCoupons,
  type CouponTemplate,
  type CreateCouponTemplateDto,
} from '../../../lib/api/coupon';

type CouponFormData = {
  name: string;
  type: 'FIXED' | 'PERCENT';
  threshold: number;
  discount: number;
  total: number;
  startsAt: string;
  endsAt: string;
};

const INITIAL_FORM: CouponFormData = {
  name: '',
  type: 'FIXED',
  threshold: 0,
  discount: 10,
  total: 100,
  startsAt: new Date().toISOString().split('T')[0],
  endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
};

export default function CouponsPage() {
  const [templates, setTemplates] = useState<CouponTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CouponTemplate | null>(null);
  const [formData, setFormData] = useState<CouponFormData>(INITIAL_FORM);
  const [memberIds, setMemberIds] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTemplates = async () => {
    try {
      const data = await getCouponTemplates();
      setTemplates(data.items);
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (selectedTemplate) {
        await updateCouponTemplate(selectedTemplate.id, formData);
      } else {
        await createCouponTemplate(formData);
      }
      setShowCreateModal(false);
      setSelectedTemplate(null);
      setFormData(INITIAL_FORM);
      fetchTemplates();
    } catch (error) {
      console.error('Failed to save coupon:', error);
      alert('保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此优惠券模板？')) return;

    try {
      await deleteCouponTemplate(id);
      fetchTemplates();
    } catch (error) {
      console.error('Failed to delete coupon:', error);
      alert('删除失败');
    }
  };

  const handleEdit = (template: CouponTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      threshold: template.threshold,
      discount: template.discount,
      total: template.total,
      startsAt: template.startsAt.split('T')[0],
      endsAt: template.endsAt.split('T')[0],
    });
    setShowCreateModal(true);
  };

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    const ids = memberIds.split('\n').map(id => id.trim()).filter(Boolean);
    if (ids.length === 0) {
      alert('请输入会员ID');
      return;
    }

    setSubmitting(true);

    try {
      const result = await issueCoupons(selectedTemplate.id, ids);
      alert(`成功发放 ${result.issued} 张优惠券`);
      setShowIssueModal(false);
      setSelectedTemplate(null);
      setMemberIds('');
      fetchTemplates();
    } catch (error) {
      console.error('Failed to issue coupons:', error);
      alert('发放失败');
    } finally {
      setSubmitting(false);
    }
  };

  const openIssueModal = (template: CouponTemplate) => {
    setSelectedTemplate(template);
    setShowIssueModal(true);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">优惠券管理</h1>
        <button
          onClick={() => {
            setSelectedTemplate(null);
            setFormData(INITIAL_FORM);
            setShowCreateModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + 创建优惠券
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map(template => (
          <div
            key={template.id}
            className={`border rounded-lg p-4 ${!template.isActive ? 'opacity-60 bg-gray-50' : 'bg-white'}`}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-lg">{template.name}</h3>
              <span className={`px-2 py-1 text-xs rounded-full ${
                template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {template.isActive ? '生效中' : '已停用'}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">类型:</span>
                <span className="font-medium">
                  {template.type === 'FIXED'
                    ? `满减券 - 满 ${template.threshold} 减 ${template.discount}`
                    : `折扣券 - 满 ${template.threshold} 打 ${100 - template.discount} 折`
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">发放:</span>
                <span className="font-medium">{template.issued} / {template.total}</span>
              </div>
              {template.availableCount !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">可用:</span>
                  <span className="font-medium text-green-600">{template.availableCount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">有效期:</span>
                <span className="font-medium">
                  {template.startsAt.split('T')[0]} ~ {template.endsAt.split('T')[0]}
                </span>
              </div>
            </div>

            <div className="mt-4 flex gap-2 pt-3 border-t">
              <button
                onClick={() => handleEdit(template)}
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                编辑
              </button>
              <button
                onClick={() => openIssueModal(template)}
                className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                发放
              </button>
              <button
                onClick={() => handleDelete(template.id)}
                className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>暂无优惠券模板</p>
          <button
            onClick={() => {
              setSelectedTemplate(null);
              setFormData(INITIAL_FORM);
              setShowCreateModal(true);
            }}
            className="mt-4 text-blue-600 hover:underline"
          >
            创建第一个优惠券
          </button>
        </div>
      )}

      {/* 创建/编辑模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">
              {selectedTemplate ? '编辑优惠券' : '创建优惠券'}
            </h2>
            <form onSubmit={handleSubmitCreate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">优惠券名称</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="如：满200减30"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">类型</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as 'FIXED' | 'PERCENT' })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="FIXED">满减券</option>
                    <option value="PERCENT">折扣券</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">消费门槛</label>
                    <input
                      type="number"
                      value={formData.threshold}
                      onChange={e => setFormData({ ...formData, threshold: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-lg"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {formData.type === 'FIXED' ? '减免金额' : '折扣百分比'}
                    </label>
                    <input
                      type="number"
                      value={formData.discount}
                      onChange={e => setFormData({ ...formData, discount: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-lg"
                      min={formData.type === 'FIXED' ? 1 : 1}
                      max={formData.type === 'PERCENT' ? 99 : undefined}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">发行数量</label>
                  <input
                    type="number"
                    value={formData.total}
                    onChange={e => setFormData({ ...formData, total: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border rounded-lg"
                    min="1"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">开始日期</label>
                    <input
                      type="date"
                      value={formData.startsAt}
                      onChange={e => setFormData({ ...formData, startsAt: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">结束日期</label>
                    <input
                      type="date"
                      value={formData.endsAt}
                      onChange={e => setFormData({ ...formData, endsAt: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedTemplate(null);
                    setFormData(INITIAL_FORM);
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  disabled={submitting}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={submitting}
                >
                  {submitting ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 发放模态框 */}
      {showIssueModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">发放优惠券</h2>
            <p className="text-sm text-gray-600 mb-4">
              优惠券：{selectedTemplate.name}
              <br />
              可用数量：{selectedTemplate.total - selectedTemplate.issued}
            </p>

            <form onSubmit={handleIssue}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  会员ID（每行一个）
                </label>
                <textarea
                  value={memberIds}
                  onChange={e => setMemberIds(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg h-32"
                  placeholder="请输入会员ID，每行一个"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowIssueModal(false);
                    setSelectedTemplate(null);
                    setMemberIds('');
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  disabled={submitting}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={submitting}
                >
                  {submitting ? '发放中...' : '发放'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden">
        <div className="flex justify-around py-2">
          <Link href="/m/pos" className="flex flex-col items-center px-4 py-2 text-gray-600">
            <span className="text-2xl">📋</span>
            <span className="text-xs">收银</span>
          </Link>
          <Link href="/m/orders" className="flex flex-col items-center px-4 py-2 text-gray-600">
            <span className="text-2xl">📦</span>
            <span className="text-xs">订单</span>
          </Link>
          <Link href="/m/coupons" className="flex flex-col items-center px-4 py-2 text-blue-600">
            <span className="text-2xl">🎫</span>
            <span className="text-xs">优惠券</span>
          </Link>
          <Link href="/m/members" className="flex flex-col items-center px-4 py-2 text-gray-600">
            <span className="text-2xl">👥</span>
            <span className="text-xs">会员</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}