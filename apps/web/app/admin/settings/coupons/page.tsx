'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Gift, Users, ToggleLeft, ToggleRight } from 'lucide-react';
import {
  getCouponTemplates,
  createCouponTemplate,
  updateCouponTemplate,
  deleteCouponTemplate,
  type CouponTemplate,
  type CreateCouponTemplateDto,
  type UpdateCouponTemplateDto,
} from '@/lib/api/coupon';

export default function CouponTemplatesPage() {
  const [templates, setTemplates] = useState<CouponTemplate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CouponTemplate | null>(null);
  const [formData, setFormData] = useState<CreateCouponTemplateDto>({
    name: '',
    type: 'FIXED',
    threshold: 0,
    discount: 0,
    total: 100,
    startsAt: new Date().toISOString().split('T')[0],
    endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true,
  });
  const [issueMemberIds, setIssueMemberIds] = useState('');
  const [filters, setFilters] = useState<{ type?: 'FIXED' | 'PERCENT'; isActive?: boolean }>({});

  useEffect(() => {
    loadTemplates();
  }, [filters, page]);

  async function loadTemplates() {
    setLoading(true);
    try {
      const response = await getCouponTemplates({ ...filters, page, pageSize: 20 });
      setTemplates(response.items);
      setTotal(response.pagination.total);
    } catch (e: unknown) {
      console.error(e);
      alert(`加载失败: ${e instanceof Error ? e.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || formData.discount <= 0) {
      alert('请填写完整信息');
      return;
    }

    setLoading(true);
    try {
      if (selectedTemplate) {
        await updateCouponTemplate(selectedTemplate.id, formData as UpdateCouponTemplateDto);
        alert('更新成功');
      } else {
        await createCouponTemplate(formData);
        alert('创建成功');
      }
      setShowCreateModal(false);
      setSelectedTemplate(null);
      setFormData({
        name: '',
        type: 'FIXED',
        threshold: 0,
        discount: 0,
        total: 100,
        startsAt: new Date().toISOString().split('T')[0],
        endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isActive: true,
      });
      loadTemplates();
    } catch (e: unknown) {
      alert(`操作失败: ${e instanceof Error ? e.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确认删除此优惠券模板？')) return;
    setLoading(true);
    try {
      await deleteCouponTemplate(id);
      alert('删除成功');
      loadTemplates();
    } catch (e: unknown) {
      alert(`删除失败: ${e instanceof Error ? e.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  }

  function openEditModal(template: CouponTemplate) {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      threshold: template.threshold,
      discount: template.discount,
      total: template.total,
      startsAt: template.startsAt.split('T')[0],
      endsAt: template.endsAt.split('T')[0],
      isActive: template.isActive,
    });
    setShowCreateModal(true);
  }

  function openIssueModal(template: CouponTemplate) {
    setSelectedTemplate(template);
    setShowIssueModal(true);
  }

  function updateFilter(key: string, value: string | undefined) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  function resetFilters() {
    setFilters({});
    setPage(1);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">优惠券管理</h1>
        <button
          onClick={() => {
            setSelectedTemplate(null);
            setFormData({
              name: '',
              type: 'FIXED',
              threshold: 0,
              discount: 0,
              total: 100,
              startsAt: new Date().toISOString().split('T')[0],
              endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              isActive: true,
            });
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> 创建优惠券
        </button>
      </div>

      <div className="flex items-center gap-4">
        <select
          value={filters.type || ''}
          onChange={(e) => updateFilter('type', e.target.value || undefined)}
          className="rounded-lg border bg-card px-3 py-2 text-sm"
        >
          <option value="">全部类型</option>
          <option value="FIXED">满减券</option>
          <option value="PERCENT">折扣券</option>
        </select>
        <select
          value={filters.isActive === undefined ? '' : String(filters.isActive)}
          onChange={(e) => updateFilter('isActive', e.target.value ? e.target.value === 'true' : undefined)}
          className="rounded-lg border bg-card px-3 py-2 text-sm"
        >
          <option value="">全部状态</option>
          <option value="true">启用</option>
          <option value="false">停用</option>
        </select>
        <button onClick={resetFilters} className="rounded-lg border px-3 py-2 text-sm hover:bg-secondary">
          重置
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">加载中...</div>
      ) : templates.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">暂无优惠券模板</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <div key={template.id} className="rounded-xl border bg-card p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{template.name}</h3>
                    <span className="text-xs text-muted-foreground">
                      {template.type === 'FIXED' ? '满减券' : '折扣券'}
                    </span>
                  </div>
                  {template.isActive ? (
                    <ToggleRight className="h-5 w-5 text-primary" />
                  ) : (
                    <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-primary" />
                    <span className="font-medium text-lg">
                      {template.type === 'FIXED'
                        ? `满 ¥${(template.threshold / 100).toFixed(2)} 减 ¥${(template.discount / 100).toFixed(2)}`
                        : `满 ¥${(template.threshold / 100).toFixed(2)} ${template.discount / 10}折`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>
                      已发放: {template.issued} / {template.total}
                    </span>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    有效期: {new Date(template.startsAt).toLocaleDateString('zh-CN')} 至{' '}
                    {new Date(template.endsAt).toLocaleDateString('zh-CN')}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openIssueModal(template)}
                    disabled={template.issued >= template.total || !template.isActive}
                    className="flex-1 rounded-lg border px-3 py-2 text-xs hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    发放
                  </button>
                  <button
                    onClick={() => openEditModal(template)}
                    className="rounded-lg border px-3 py-2 hover:bg-secondary"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="rounded-lg border px-3 py-2 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">共 {total} 条</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-secondary disabled:opacity-50"
              >
                上一页
              </button>
              <span className="px-3 py-2 text-sm">第 {page} 页</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 20 >= total}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-secondary disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        </>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">
              {selectedTemplate ? '编辑优惠券' : '创建优惠券'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm">优惠券名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="如：满200减30"
                  className="w-full rounded-lg border bg-card px-3 py-2 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm">类型</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'FIXED' | 'PERCENT' })}
                    className="w-full rounded-lg border bg-card px-3 py-2 text-sm"
                  >
                    <option value="FIXED">满减券</option>
                    <option value="PERCENT">折扣券</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm">发放数量</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.total}
                    onChange={(e) => setFormData({ ...formData, total: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg border bg-card px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm">
                    {formData.type === 'FIXED' ? '满额门槛 (元)' : '满额门槛 (元)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.threshold / 100}
                    onChange={(e) =>
                      setFormData({ ...formData, threshold: Math.round(parseFloat(e.target.value) * 100) })
                    }
                    className="w-full rounded-lg border bg-card px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm">
                    {formData.type === 'FIXED' ? '减免金额 (元)' : '折扣 (如8.5即8.5折)'}
                  </label>
                  <input
                    type="number"
                    min={formData.type === 'FIXED' ? 0.01 : 0.1}
                    max={formData.type === 'PERCENT' ? 9.9 : undefined}
                    step={formData.type === 'PERCENT' ? 0.1 : 0.01}
                    value={formData.type === 'FIXED' ? formData.discount / 100 : formData.discount / 10}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount: formData.type === 'FIXED'
                          ? Math.round(parseFloat(e.target.value) * 100)
                          : Math.round(parseFloat(e.target.value) * 10),
                      })
                    }
                    className="w-full rounded-lg border bg-card px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm">开始日期</label>
                  <input
                    type="date"
                    value={formData.startsAt}
                    onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                    className="w-full rounded-lg border bg-card px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm">结束日期</label>
                  <input
                    type="date"
                    value={formData.endsAt}
                    onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                    className="w-full rounded-lg border bg-card px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="isActive" className="text-sm">
                  启用（启用后可发放）
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-lg border px-4 py-2 text-sm hover:bg-secondary"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {selectedTemplate ? '更新' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showIssueModal && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">发放优惠券</h2>
            <div className="mb-4 space-y-2 rounded-lg bg-secondary/50 p-4">
              <div className="font-medium">{selectedTemplate.name}</div>
              <div className="text-sm text-muted-foreground">
                {selectedTemplate.type === 'FIXED'
                  ? `满 ¥${(selectedTemplate.threshold / 100).toFixed(2)} 减 ¥${(selectedTemplate.discount / 100).toFixed(2)}`
                  : `满 ¥${(selectedTemplate.threshold / 100).toFixed(2)} ${selectedTemplate.discount / 10}折`}
              </div>
              <div className="text-sm">
                可发放: {selectedTemplate.total - selectedTemplate.issued} 张
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm">会员ID列表（逗号分隔）</label>
              <textarea
                value={issueMemberIds}
                onChange={(e) => setIssueMemberIds(e.target.value)}
                placeholder="输入会员ID，多个用逗号分隔"
                className="w-full rounded-lg border bg-card px-3 py-2 text-sm h-32"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                输入 {issueMemberIds.split(',').filter(Boolean).length} 个会员
              </p>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setShowIssueModal(false);
                  setIssueMemberIds('');
                }}
                className="flex-1 rounded-lg border px-4 py-2 text-sm hover:bg-secondary"
              >
                取消
              </button>
              <button
                onClick={async () => {
                  const memberIds = issueMemberIds
                    .split(',')
                    .map((id) => id.trim())
                    .filter(Boolean);

                  if (memberIds.length === 0) {
                    alert('请输入会员ID');
                    return;
                  }

                  const available = selectedTemplate.total - selectedTemplate.issued;
                  if (memberIds.length > available) {
                    alert(`剩余 ${available} 张优惠券，无法发放给 ${memberIds.length} 位会员`);
                    return;
                  }

                  setLoading(true);
                  try {
                    const result = await (await import('@/lib/api/coupon')).issueCoupons(
                      selectedTemplate.id,
                      memberIds,
                    );
                    alert(`成功发放 ${result.issued} 张优惠券`);
                    setShowIssueModal(false);
                    setIssueMemberIds('');
                    loadTemplates();
                  } catch (e: unknown) {
                    alert(`发放失败: ${e instanceof Error ? e.message : '未知错误'}`);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                发放
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}