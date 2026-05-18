'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { formatCurrency } from '@haircut-ms/shared';
import {
  getActiveRechargePlans,
  type RechargePlan,
  RECHARGE_PLAN_TYPE_LABELS,
} from '@/lib/api/recharge';

interface CreatePlanData {
  name: string;
  amount: number;
  giftAmount: number;
  type: 'DIRECT' | 'GIFT' | 'PERCENTAGE' | 'TIMED';
  startsAt?: string;
  endsAt?: string;
  sortOrder: number;
}

export default function RechargePlansPage() {
  const [plans, setPlans] = useState<RechargePlan[]>([]);
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

  const loadPlans = async () => {
    setLoading(true);
    try {
      const res = await getActiveRechargePlans();
      setPlans(res);
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
      alert('请填写完整信息');
      return;
    }

    setSubmitting(true);
    try {
      const data: any = {
        name: formData.name,
        amount: formData.amount,
        giftAmount: formData.giftAmount,
        type: formData.type,
        sortOrder: formData.sortOrder,
      };

      if (formData.startsAt) data.startsAt = new Date(formData.startsAt).toISOString();
      if (formData.endsAt) data.endsAt = new Date(formData.endsAt).toISOString();

      if (editingPlan) {
        await apiFetch(`/recharge-plans/${editingPlan.id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
      } else {
        await apiFetch('/recharge-plans', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      }

      closeModal();
      loadPlans();
    } catch (error: any) {
      alert(`操作失败：${error.message || '未知错误'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('确定要删除这个充值方案吗？')) return;

    try {
      await apiFetch(`/recharge-plans/${planId}`, { method: 'DELETE' });
      loadPlans();
    } catch (error: any) {
      alert(`删除失败：${error.message || '未知错误'}`);
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">充值方案管理</h1>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          新增方案
        </button>
      </div>

      {/* Plans List */}
      <div className="rounded-lg border bg-card">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">加载中...</div>
        ) : plans.length > 0 ? (
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
                {plans.map((plan) => (
                  <tr key={plan.id} className="border-b hover:bg-accent/50">
                    <td className="py-3 px-4 font-medium">{plan.name}</td>
                    <td className="py-3 px-4">{RECHARGE_PLAN_TYPE_LABELS[plan.type]}</td>
                    <td className="py-3 px-4">{formatCurrency(plan.amount)}</td>
                    <td className="py-3 px-4 text-orange-600">
                      {plan.giftAmount > 0 ? formatCurrency(plan.giftAmount) : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {plan.startsAt || plan.endsAt ? (
                        <>
                          {plan.startsAt && (
                            <div>
                              开始：{new Date(plan.startsAt).toLocaleDateString('zh-CN')}
                            </div>
                          )}
                          {plan.endsAt && (
                            <div>
                              结束：{new Date(plan.endsAt).toLocaleDateString('zh-CN')}
                            </div>
                          )}
                        </>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {isExpired(plan) ? (
                        <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs">
                          已结束
                        </span>
                      ) : isNotStarted(plan) ? (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                          未开始
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                          进行中
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">{plan.sortOrder}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => openModal(plan)}
                        className="text-primary hover:underline mr-3"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(plan.id)}
                        className="text-destructive hover:underline"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">暂无充值方案</div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                {editingPlan ? '编辑充值方案' : '新增充值方案'}
              </h2>
              <button
                onClick={closeModal}
                className="text-muted-foreground hover:text-foreground text-2xl"
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
                  className="w-full px-3 py-2 rounded-md border border-input bg-background"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">方案类型</label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as 'DIRECT' | 'GIFT' | 'PERCENTAGE' | 'TIMED',
                    })
                  }
                  className="w-full px-3 py-2 rounded-md border border-input bg-background"
                >
                  <option value="DIRECT">直充</option>
                  <option value="GIFT">充赠</option>
                  <option value="PERCENTAGE">阶梯</option>
                  <option value="TIMED">限时活动</option>
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
                    className="w-full px-3 py-2 rounded-md border border-input bg-background"
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
                    className="w-full px-3 py-2 rounded-md border border-input bg-background"
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
                    className="w-full px-3 py-2 rounded-md border border-input bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">结束时间</label>
                  <input
                    type="datetime-local"
                    value={formData.endsAt}
                    onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">排序</label>
                <input
                  type="number"
                  min="0"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-md border border-input bg-background"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 py-2 px-4 rounded-md border border-input hover:bg-accent transition-colors"
                disabled={submitting}
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