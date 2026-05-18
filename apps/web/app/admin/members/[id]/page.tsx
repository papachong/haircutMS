'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { formatCurrency } from '@haircut-ms/shared';
import {
  getActiveRechargePlans,
  rechargeMember,
  getRechargeHistory,
  RECHARGE_PLAN_TYPE_LABELS,
  PAY_METHOD_LABELS,
  type RechargePlan,
  type RechargeHistoryResponse,
  PayMethod,
} from '@/lib/api/recharge';

interface Member {
  id: string;
  cardNo: string;
  name: string;
  phone: string;
  principalBalance: number;
  giftBalance: number;
  totalRecharge: number;
  level?: {
    name: string;
  };
}

export default function MemberDetailPage() {
  const params = useParams();
  const memberId = params.id as string;

  const [member, setMember] = useState<Member | null>(null);
  const [plans, setPlans] = useState<RechargePlan[]>([]);
  const [history, setHistory] = useState<RechargeHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Recharge form state
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [customGiftAmount, setCustomGiftAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PayMethod>(PayMethod.WECHAT);
  const [remark, setRemark] = useState('');
  const [recharging, setRecharging] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);

  const calculateTotal = (): { amount: number; gift: number } => {
    if (selectedPlan !== null) {
      const plan = plans.find((p) => parseInt(p.id) === selectedPlan);
      if (plan) {
        return { amount: plan.amount, gift: plan.giftAmount };
      }
    }
    return {
      amount: parseInt(customAmount) || 0,
      gift: parseInt(customGiftAmount) || 0,
    };
  };

  const isPlanExpired = (plan: RechargePlan): boolean => {
    if (!plan.endsAt) return false;
    return new Date(plan.endsAt) < new Date();
  };

  const loadMember = async () => {
    try {
      const res = await apiFetch<{ code: number; data: Member; message: string }>(`/members/${memberId}`);
      if (res.code === 0) {
        setMember(res.data);
      }
    } catch (error) {
      console.error('Failed to load member:', error);
    }
  };

  const loadPlans = async () => {
    try {
      const res = await getActiveRechargePlans();
      setPlans(res.filter((p) => !isPlanExpired(p)));
    } catch (error) {
      console.error('Failed to load plans:', error);
    }
  };

  const loadHistory = async (page = 1) => {
    setHistoryLoading(true);
    try {
      const res = await getRechargeHistory(memberId, page, 20);
      setHistory(res);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([loadMember(), loadPlans(), loadHistory()]);
      setLoading(false);
    };
    init();
  }, [memberId]);

  const handleRecharge = async () => {
    if (!member) return;

    const { amount, gift } = calculateTotal();
    if (amount <= 0) {
      alert('请选择充值方案或输入充值金额');
      return;
    }

    setRecharging(true);
    try {
      const data: any = {
        payMethod,
      };
      if (selectedPlan !== null) {
        data.planId = selectedPlan;
      } else {
        data.amount = amount;
        data.giftAmount = gift;
      }
      if (remark) data.remark = remark;

      await rechargeMember(memberId, data);
      alert('充值成功！');
      setShowRechargeModal(false);
      setSelectedPlan(null);
      setCustomAmount('');
      setCustomGiftAmount('');
      setRemark('');
      await Promise.all([loadMember(), loadHistory()]);
    } catch (error: any) {
      alert(`充值失败：${error.message || '未知错误'}`);
    } finally {
      setRecharging(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">会员不存在</div>
      </div>
    );
  }

  const totalBalance = member.principalBalance + member.giftBalance;
  const { amount, gift } = calculateTotal();
  const newBalance = totalBalance + amount + gift;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Member Info Card */}
      <div className="rounded-lg border bg-card p-6">
        <h1 className="text-2xl font-semibold mb-4">会员详情</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-muted-foreground">会员号</div>
            <div className="text-lg font-medium">{member.cardNo}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">姓名</div>
            <div className="text-lg font-medium">{member.name}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">手机号</div>
            <div className="text-lg font-medium">{member.phone}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">会员等级</div>
            <div className="text-lg font-medium">{member.level?.name || '普通会员'}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">本金余额</div>
            <div className="text-lg font-medium text-blue-600">
              {formatCurrency(member.principalBalance)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">赠送余额</div>
            <div className="text-lg font-medium text-orange-600">
              {formatCurrency(member.giftBalance)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">累计充值</div>
            <div className="text-lg font-medium text-green-600">
              {formatCurrency(member.totalRecharge)}
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="text-sm text-muted-foreground">总余额</div>
            <div className="text-xl font-bold text-primary">
              {formatCurrency(totalBalance)}
            </div>
          </div>
        </div>
        <div className="mt-6">
          <button
            onClick={() => setShowRechargeModal(true)}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            充值
          </button>
        </div>
      </div>

      {/* Recharge History */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">充值流水</h2>
        {historyLoading ? (
          <div className="text-center py-8 text-muted-foreground">加载中...</div>
        ) : history && history.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">时间</th>
                  <th className="text-left py-3 px-4 font-medium">充值金额</th>
                  <th className="text-left py-3 px-4 font-medium">赠送金额</th>
                  <th className="text-left py-3 px-4 font-medium">充值方案</th>
                  <th className="text-left py-3 px-4 font-medium">支付方式</th>
                  <th className="text-left py-3 px-4 font-medium">操作人</th>
                  <th className="text-left py-3 px-4 font-medium">备注</th>
                </tr>
              </thead>
              <tbody>
                {history.items.map((record) => (
                  <tr key={record.id} className="border-b hover:bg-accent/50">
                    <td className="py-3 px-4">
                      {new Date(record.createdAt).toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 font-medium text-green-600">
                      {formatCurrency(record.amount)}
                    </td>
                    <td className="py-3 px-4 font-medium text-orange-600">
                      {record.giftAmount > 0 ? `+${formatCurrency(record.giftAmount)}` : '-'}
                    </td>
                    <td className="py-3 px-4">{record.plan?.name || '自定义'}</td>
                    <td className="py-3 px-4">
                      {PAY_METHOD_LABELS[record.payMethod as PayMethod] || record.payMethod}
                    </td>
                    <td className="py-3 px-4">{record.operator.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{record.remark || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 text-sm text-muted-foreground">
              共 {history.pagination.total} 条记录
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">暂无充值记录</div>
        )}
      </div>

      {/* Recharge Modal */}
      {showRechargeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">会员充值</h2>
              <button
                onClick={() => setShowRechargeModal(false)}
                className="text-muted-foreground hover:text-foreground text-2xl"
              >
                ×
              </button>
            </div>

            {/* Member Summary */}
            <div className="bg-muted rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">会员：</span>
                  <span className="font-medium">{member.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">当前余额：</span>
                  <span className="font-medium text-primary">{formatCurrency(totalBalance)}</span>
                </div>
              </div>
            </div>

            {/* Recharge Plans */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">选择充值方案</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => {
                      setSelectedPlan(parseInt(plan.id));
                      setCustomAmount('');
                      setCustomGiftAmount('');
                    }}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedPlan === parseInt(plan.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="font-medium mb-1">{plan.name}</div>
                    <div className="text-sm text-muted-foreground">
                      充 {formatCurrency(plan.amount)}
                      {plan.giftAmount > 0 && (
                        <span className="text-orange-600"> 送 {formatCurrency(plan.giftAmount)}</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {RECHARGE_PLAN_TYPE_LABELS[plan.type]}
                    </div>
                  </button>
                ))}
              </div>
              <div className="text-sm text-muted-foreground mb-2">或自定义金额</div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm mb-1">充值金额</label>
                  <input
                    type="number"
                    min="1"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedPlan(null);
                    }}
                    placeholder="请输入金额"
                    className="w-full px-3 py-2 rounded-md border border-input bg-background"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm mb-1">赠送金额</label>
                  <input
                    type="number"
                    min="0"
                    value={customGiftAmount}
                    onChange={(e) => setCustomGiftAmount(e.target.value)}
                    placeholder="可选"
                    className="w-full px-3 py-2 rounded-md border border-input bg-background"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">支付方式</h3>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(PAY_METHOD_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setPayMethod(key as PayMethod)}
                    className={`py-2 px-3 rounded-md border transition-all ${
                      payMethod === key
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Remark */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">备注（可选）</label>
              <input
                type="text"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="请输入备注信息"
                maxLength={200}
                className="w-full px-3 py-2 rounded-md border border-input bg-background"
              />
            </div>

            {/* Summary */}
            <div className="bg-muted rounded-lg p-4 mb-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>本金充值：</span>
                  <span className="font-medium">{formatCurrency(amount)}</span>
                </div>
                {gift > 0 && (
                  <div className="flex justify-between">
                    <span>赠送金额：</span>
                    <span className="font-medium text-orange-600">+{formatCurrency(gift)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2">
                  <span>充值后余额：</span>
                  <span className="font-bold text-lg">{formatCurrency(newBalance)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowRechargeModal(false)}
                className="flex-1 py-2 px-4 rounded-md border border-input hover:bg-accent transition-colors"
                disabled={recharging}
              >
                取消
              </button>
              <button
                onClick={handleRecharge}
                disabled={recharging || amount <= 0}
                className="flex-1 py-2 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {recharging ? '充值中...' : '确认充值'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}