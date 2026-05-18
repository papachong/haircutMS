'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { formatCurrency } from '@haircut-ms/shared';
import {
  getAllRechargePlans,
  createRechargePlan,
  updateRechargePlan,
  toggleRechargePlan,
  deleteRechargePlan,
  type RechargePlan,
  RECHARGE_PLAN_TYPE_LABELS,
} from '@/lib/api/recharge';
import { Plus, Pencil, Trash2, Eye, EyeOff, Clock, Gift } from 'lucide-react';

interface CreatePlanData {
  name: string;
  amount: number;
  giftAmount: number;
  type: RechargePlan['type'];
  startsAt: string;
  endsAt: string;
  sortOrder: number;
}

type FilterType = 'all' | 'active' | 'inactive';

export default function RechargePlansPage() {
  const [plans, setPlans] = useState<RechargePlan[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<RechargePlan | null>(null);

  const [formData, setFormData] = useState<CreatePlanData>({
    name: '',
    amount: 0,
    giftAmount: 0,
    type: 'DIRECT',
    sortOrder: 0,
    startsAt: '',
    endsAt: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const res = await getAllRechargePlans();
      setPlans(res.sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }));
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      amount: 0,
      giftAmount: 0,
      type: 'DIRECT',
      sortOrder: 0,
      startsAt: '',
      endsAt: '',
    });
    setEditingPlan(null);
  };

  const openModal = (plan?: RechargePlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        amount: plan.amount,
        giftAmount: plan.giftAmount,
        type: plan.type,
        sortOrder: plan.sortOrder,
        startsAt: plan.startsAt ? new Date(plan.startsAt).toISOString().slice(0, 16) : '',
        endsAt: plan.endsAt ? new Date(plan.endsAt).toISOString().slice(0, 16) : '',
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async () => {
    if (!formData.name || formData.amount <= 0) {
      alert('请填写方案名称和充值金额');
      return;
    }

    setSubmitting(true);
    try {
      const data: Record<string, unknown> = {
        name: formData.name,
        amount: formData.amount,
        giftAmount: formData.giftAmount,
        type: formData.type,
        sortOrder: formData.sortOrder,
      };

      if (formData.startsAt) data.startsAt = new Date(formData.startsAt).toISOString();
      if (formData.endsAt) data.endsAt = new Date(formData.endsAt).toISOString();

      if (editingPlan) {
        await updateRechargePlan(editingPlan.id, data);
      } else {
        await createRechargePlan(data);
      }

      closeModal();
      loadPlans();
    } catch (error: any) {
      alert(`操作失败：${error.message || '未知错误'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: string) => {
    setTogglingId(id);
    try {
      const updated = await toggleRechargePlan(id);
      setPlans(plans.map((p) => (p.id === id ? updated : p)));
    } catch (error: any) {
      alert(`操作失败：${error.message || '未知错误'}`);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个充值方案吗？')) return;

    setDeletingId(id);
    try {
      await deleteRechargePlan(id);
      loadPlans();
    } catch (error: any) {
      alert(`删除失败：${error.message || '未知错误'}`);
    } finally {
      setDeletingId(null);
    }
  };

  const isExpired = (plan: RechargePlan): boolean => {
    if (!plan.endsAt) return false;
    return new Date(plan.endsAt) < new Date();
  };

  const isNotStarted = (plan: RechargePlan): boolean => {
    if (!plan.startsAt) return false;
    return new Date(plan.startsAt) > new Date();
  };

  const isOngoing = (plan: RechargePlan): boolean => {
    return !isNotStarted(plan) && !isExpired(plan);
  };

  const getPlanStatus = (plan: RechargePlan): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' } => {
    if (!plan.isActive) {
      return { label: '已下架', variant: 'secondary' };
    }
    if (isExpired(plan)) {
      return { label: '已结束', variant: 'secondary' };
    }
    if (isNotStarted(plan)) {
      return { label: '未开始', variant: 'warning' };
    }
    return { label: '进行中', variant: 'success' };
  };

  const getStatusBgColor = (variant: string): string => {
    switch (variant) {
      case 'success': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'secondary': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filteredPlans = plans.filter((plan) => {
    if (filter === 'active') return plan.isActive;
    if (filter === 'inactive') return !plan.isActive;
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">充值方案管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理充值方案、充赠活动和限时优惠
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          新增方案
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          全部 ({plans.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'active'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          上架中 ({plans.filter((p) => p.isActive).length})
        </button>
        <button
          onClick={() => setFilter('inactive')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'inactive'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          已下架 ({plans.filter((p) => !p.isActive).length})
        </button>
      </div>

      {/* Plans List */}
      <div className="rounded-lg border bg-card">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">加载中...</div>
        ) : filteredPlans.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">方案名称</th>
                  <th className="text-left py-3 px-4 font-medium">类型</th>
                  <th className="text-left py-3 px-4 font-medium">充值金额</th>
                  <th className="text-left py-3 px-4 font-medium">赠送金额</th>
                  <th className="text-left py-3 px-4 font-medium">活动时间</th>
                  <th className="text-left py-3 px-4 font-medium">状态</th>
                  <th className="text-left py-3 px-4 font-medium">排序</th>
                  <th className="text-left py-3 px-4 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.map((plan) => {
                  const status = getPlanStatus(plan);
                  return (
                    <tr
                      key={plan.id}
                      className={`border-b hover:bg-accent/50 transition-colors ${
                        !plan.isActive ? 'opacity-60' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-medium">{plan.name}</td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-1">
                          {plan.type === 'TIMED' && <Clock className="h-3 w-3" />}
                          {plan.type === 'GIFT' && <Gift className="h-3 w-3" />}
                          {RECHARGE_PLAN_TYPE_LABELS[plan.type]}
                        </span>
                      </td>
                      <td className="py-3 px-4">{formatCurrency(plan.amount)}</td>
                      <td className="py-3 px-4">
                        {plan.giftAmount > 0 ? (
                          <span className="text-orange-600 dark:text-orange-400 font-medium">
                            +{formatCurrency(plan.giftAmount)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {plan.startsAt || plan.endsAt ? (
                          <div className="space-y-0.5">
                            {plan.startsAt && (
                              <div className="text-muted-foreground">
                                开始：{new Date(plan.startsAt).toLocaleDateString('zh-CN')}{' '}
                                {new Date(plan.startsAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                            {plan.endsAt && (
                              <div className="text-muted-foreground">
                                结束：{new Date(plan.endsAt).toLocaleDateString('zh-CN')}{' '}
                                {new Date(plan.endsAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">永久有效</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusBgColor(status.variant)}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">{plan.sortOrder}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggle(plan.id)}
                            disabled={togglingId === plan.id}
                            className={`p-1.5 rounded-md transition-colors ${
                              plan.isActive
                                ? 'hover:bg-accent text-muted-foreground'
                                : 'hover:bg-accent'
                            }`}
                            title={plan.isActive ? '下架' : '上架'}
                          >
                            {plan.isActive ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => openModal(plan)}
                            className="p-1.5 rounded-md hover:bg-accent text-primary"
                            title="编辑"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(plan.id)}
                            disabled={deletingId === plan.id}
                            className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
                            title="删除"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            {filter === 'inactive' ? '暂无已下架的方案' : '暂无充值方案，点击上方按钮创建'}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg p-6 max-w-lg w-full shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                {editingPlan ? '编辑充值方案' : '新增充值方案'}
              </h2>
              <button
                onClick={closeModal}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-accent"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">方案名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="如：充100送10"
                  className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">方案类型</label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as RechargePlan['type'],
                    })
                  }
                  className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="DIRECT">直充 - 无赠送</option>
                  <option value="GIFT">充赠 - 充多少送多少</option>
                  <option value="PERCENTAGE">阶梯 - 多充多送</option>
                  <option value="TIMED">限时活动 - 限时优惠</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">充值金额（元）*</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={formData.amount / 100}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: Math.round(Number(e.target.value) * 100) })
                    }
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">赠送金额（元）</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.giftAmount / 100}
                    onChange={(e) =>
                      setFormData({ ...formData, giftAmount: Math.round(Number(e.target.value) * 100) })
                    }
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">开始时间</label>
                  <input
                    type="datetime-local"
                    value={formData.startsAt}
                    onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">结束时间</label>
                  <input
                    type="datetime-local"
                    value={formData.endsAt}
                    onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">排序（数字越小越靠前）</label>
                <input
                  type="number"
                  min="0"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                disabled={submitting}
                className="flex-1 py-2 px-4 rounded-md border border-input hover:bg-accent transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-2 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {submitting ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}