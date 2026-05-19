'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, Trash2, Gift, Users, ToggleLeft, ToggleRight, Search, X, Check } from 'lucide-react';
import {
  getCouponTemplates,
  createCouponTemplate,
  updateCouponTemplate,
  deleteCouponTemplate,
  issueCoupons,
  type CouponTemplate,
  type CreateCouponTemplateDto,
  type UpdateCouponTemplateDto,
} from '@/lib/api/coupon';
import { searchMembers, type Member } from '@/lib/api/orders';

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
      resetFormData();
      loadTemplates();
    } catch (e: unknown) {
      alert(`操作失败: ${e instanceof Error ? e.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确认删除此优惠券模板？已发放的优惠券将无法删除。')) return;
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

  async function handleToggleActive(template: CouponTemplate) {
    setLoading(true);
    try {
      await updateCouponTemplate(template.id, { isActive: !template.isActive });
      loadTemplates();
    } catch (e: unknown) {
      alert(`操作失败: ${e instanceof Error ? e.message : '未知错误'}`);
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

  function updateFilter(key: string, value: string | boolean | undefined) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  function resetFilters() {
    setFilters({});
    setPage(1);
  }

  function resetFormData() {
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
  }

  function isExpired(template: CouponTemplate) {
    return new Date(template.endsAt) < new Date();
  }

  function isNotStarted(template: CouponTemplate) {
    return new Date(template.startsAt) > new Date();
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">优惠券管理</h1>
        <button
          onClick={() => {
            setSelectedTemplate(null);
            resetFormData();
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> 创建优惠券
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
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
            {templates.map((template) => {
              const expired = isExpired(template);
              const notStarted = isNotStarted(template);
              const remaining = template.total - template.issued;
              const availableCount = template.availableCount ?? 0;

              return (
                <div
                  key={template.id}
                  className={`rounded-xl border bg-card p-5 space-y-4 ${
                    expired ? 'opacity-60' : notStarted ? 'border-dashed' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{template.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${
                          template.type === 'FIXED'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        }`}>
                          {template.type === 'FIXED' ? '满减券' : '折扣券'}
                        </span>
                        {expired && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-400">已过期</span>
                        )}
                        {notStarted && (
                          <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">未开始</span>
                        )}
                        {!template.isActive && !expired && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">已停用</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleActive(template)}
                      title={template.isActive ? '点击停用' : '点击启用'}
                      disabled={expired}
                    >
                      {template.isActive ? (
                        <ToggleRight className="h-6 w-6 text-primary" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                      )}
                    </button>
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
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        已发 {template.issued}/{template.total}
                      </span>
                      <span>可用 {availableCount}</span>
                      {remaining > 0 && <span>剩余 {remaining}</span>}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {new Date(template.startsAt).toLocaleDateString('zh-CN')} 至{' '}
                      {new Date(template.endsAt).toLocaleDateString('zh-CN')}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openIssueModal(template)}
                      disabled={remaining <= 0 || !template.isActive || expired}
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
              );
            })}
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

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-4 sm:p-6 shadow-lg max-h-[90vh] overflow-y-auto">
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
                    disabled={!!selectedTemplate}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm">满额门槛 (元)</label>
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

      {/* Issue Modal with Member Search */}
      {showIssueModal && selectedTemplate && (
        <IssueCouponModal
          template={selectedTemplate}
          onClose={() => setShowIssueModal(false)}
          onSuccess={() => {
            setShowIssueModal(false);
            loadTemplates();
          }}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------- */
/* IssueCouponModal - member search & multi-select     */
/* -------------------------------------------------- */

interface IssueCouponModalProps {
  template: CouponTemplate;
  onClose: () => void;
  onSuccess: () => void;
}

interface SelectedMember {
  id: string;
  name: string;
  cardNo: string;
  phone: string;
}

function IssueCouponModal({ template, onClose, onSuccess }: IssueCouponModalProps) {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const remaining = template.total - template.issued;

  const handleSearch = useCallback(async (keyword: string) => {
    setSearchKeyword(keyword);
    if (keyword.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await searchMembers(keyword);
      // Filter out already selected members
      const selectedIds = new Set(selectedMembers.map((m) => m.id));
      setSearchResults(results.filter((m) => !selectedIds.has(m.id)));
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [selectedMembers]);

  const addMember = (member: Member) => {
    if (selectedMembers.length >= remaining) {
      alert(`最多只能选择 ${remaining} 位会员`);
      return;
    }
    if (selectedMembers.some((m) => m.id === member.id)) return;

    setSelectedMembers((prev) => [...prev, {
      id: member.id,
      name: member.name,
      cardNo: member.cardNo,
      phone: member.phone,
    }]);
    setSearchResults((prev) => prev.filter((m) => m.id !== member.id));
    setSearchKeyword('');
    setSearchResults([]);
  };

  const removeMember = (memberId: string) => {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  const handleIssue = async () => {
    if (selectedMembers.length === 0) {
      alert('请选择至少一位会员');
      return;
    }

    setLoading(true);
    try {
      const result = await issueCoupons(
        template.id,
        selectedMembers.map((m) => m.id),
      );
      alert(`成功发放 ${result.issued} 张优惠券`);
      onSuccess();
    } catch (e: unknown) {
      alert(`发放失败: ${e instanceof Error ? e.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-card p-4 sm:p-6 shadow-lg max-h-[85vh] overflow-y-auto">
        <h2 className="mb-4 text-lg font-semibold">发放优惠券</h2>

        {/* Template summary */}
        <div className="mb-4 space-y-2 rounded-lg bg-secondary/50 p-4">
          <div className="font-medium">{template.name}</div>
          <div className="text-sm text-muted-foreground">
            {template.type === 'FIXED'
              ? `满 ¥${(template.threshold / 100).toFixed(2)} 减 ¥${(template.discount / 100).toFixed(2)}`
              : `满 ¥${(template.threshold / 100).toFixed(2)} ${template.discount / 10}折`}
          </div>
          <div className="text-sm">
            可发放: <span className="font-medium text-primary">{remaining}</span> 张
          </div>
        </div>

        {/* Member search */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium">搜索会员</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="输入姓名/手机号/卡号搜索"
              className="w-full rounded-lg border bg-card py-2 pl-9 pr-3 text-sm"
            />
            {searching && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">搜索中...</span>
            )}
          </div>

          {/* Search results dropdown */}
          {searchResults.length > 0 && (
            <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border bg-card shadow-sm">
              {searchResults.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => addMember(member)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{member.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {member.cardNo} · {member.phone}
                    </div>
                  </div>
                  <Plus className="h-4 w-4 text-primary" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected members */}
        {selectedMembers.length > 0 && (
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium">
                已选择 ({selectedMembers.length}/{remaining})
              </label>
              <button
                type="button"
                onClick={() => setSelectedMembers([])}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                清空
              </button>
            </div>
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {selectedMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{member.name}</span>
                    <span className="ml-2 text-muted-foreground">{member.cardNo}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMember(member.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border px-4 py-2 text-sm hover:bg-secondary"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleIssue}
            disabled={loading || selectedMembers.length === 0}
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? '发放中...' : `确认发放 (${selectedMembers.length}张)`}
          </button>
        </div>
      </div>
    </div>
  );
}
