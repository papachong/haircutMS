'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Phone,
  Calendar,
  CreditCard,
  ShoppingCart,
  TrendingUp,
  Gift,
  Edit,
  Wallet,
  History,
  ChevronRight,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { getMemberById, type Member } from '@/lib/api/members';
import { rechargeMember, PayMethod, PAY_METHOD_LABELS } from '@/lib/api/recharge';
import { usePullRefresh } from '@/hooks/use-pull-refresh';
import PullRefreshIndicator from '@/components/mobile/pull-refresh-indicator';

type TabType = 'info' | 'orders' | 'recharge';

const AMOUNT_PRESETS = [50, 100, 200, 500, 1000];

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [showRechargeDialog, setShowRechargeDialog] = useState(false);
  const [rechargeLoading, setRechargeLoading] = useState(false);

  // Pull-to-refresh
  const { containerRef, pulling, refreshing, pullDistance } = usePullRefresh(async () => {
    await loadMember();
  });

  useEffect(() => {
    loadMember();
  }, [params.id]);

  const loadMember = async () => {
    setLoading(true);
    try {
      const data = await getMemberById(params.id as string);
      setMember(data);
    } catch (error) {
      console.error('Failed to load member:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecharge = async (
    amount: number,
    giftAmount: number,
    payMethod: PayMethod,
    remark?: string
  ) => {
    setRechargeLoading(true);
    try {
      await rechargeMember(params.id as string, {
        amount: amount * 100,
        giftAmount: giftAmount * 100,
        payMethod,
        remark,
      });
      setShowRechargeDialog(false);
      await loadMember();
      alert('充值成功！');
    } catch (error: unknown) {
      alert(`充值失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setRechargeLoading(false);
    }
  };

  const getGenderLabel = (gender?: string) => {
    switch (gender) {
      case 'MALE': return '男';
      case 'FEMALE': return '女';
      case 'OTHER': return '其他';
      default: return '未知';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <div className="text-4xl mb-4">👤</div>
        <p className="text-slate-500 dark:text-slate-400 mb-4">会员不存在</p>
        <Link
          href="/m/members"
          className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium"
        >
          返回列表
        </Link>
      </div>
    );
  }

  const totalBalance = member.principalBalance + member.giftBalance;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 pb-safe-bottom">
      <div
        ref={containerRef}
        className="flex-1 overflow-auto"
        style={{ height: '100vh', maxHeight: '100vh' }}
      >
        {/* Pull-to-refresh indicator */}
        <PullRefreshIndicator
          pulling={pulling}
          refreshing={refreshing}
          pullDistance={pullDistance}
        />

        {/* Header */}
        <div className="sticky top-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700 z-40">
          <div className="flex items-center px-4 py-3">
            <Link
              href="/m/members"
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 active:bg-slate-200 dark:active:bg-slate-600 transition-colors active:scale-95"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="flex-1 ml-3 text-lg font-bold text-slate-900 dark:text-white">
              会员详情
            </h1>
            <button
              type="button"
              onClick={() => setShowRechargeDialog(true)}
              className="px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium shadow-md shadow-green-500/30 active:scale-95 transition-all min-h-[44px]"
            >
              充值
            </button>
          </div>

          {/* Tabs */}
          <div className="flex px-2 pb-0">
            {[
              { id: 'info' as TabType, label: '信息', icon: User },
              { id: 'orders' as TabType, label: '消费', icon: ShoppingCart },
              { id: 'recharge' as TabType, label: '充值', icon: History },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 mx-1 rounded-t-xl font-medium text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="px-4 py-4">
          {/* Member info card */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-4 mb-4 text-white shadow-lg shadow-blue-500/20">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold backdrop-blur shrink-0">
                {member.avatar ? (
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-full h-full rounded-2xl object-cover"
                  />
                ) : (
                  member.name[0]
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold mb-1 truncate">{member.name}</h2>
                <div className="text-white/80 text-sm truncate mb-2">{member.cardNo}</div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                    {member.memberLevel.name}
                  </span>
                  <span className="text-sm text-white/80">
                    {Math.round(member.memberLevel.discount * 10)}折
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Balance cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
                <CreditCard className="h-4 w-4" />
                本金余额
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                ¥{(member.principalBalance / 100).toFixed(2)}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
                <Gift className="h-4 w-4" />
                赠送余额
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                ¥{(member.giftBalance / 100).toFixed(2)}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
                <TrendingUp className="h-4 w-4" />
                总消费
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                ¥{(member.totalConsume / 100).toFixed(2)}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
                <ShoppingCart className="h-4 w-4" />
                消费次数
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {member.visitCount}
              </div>
            </div>
          </div>

          {/* Tab content */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            {activeTab === 'info' && <InfoTab member={member} />}
            {activeTab === 'orders' && <OrdersTab orders={member.orders || []} />}
            {activeTab === 'recharge' && (
              <RechargeTab records={member.rechargeRecords || []} />
            )}
          </div>
        </div>
      </div>

      {/* Recharge dialog */}
      {showRechargeDialog && (
        <RechargeDialog
          onClose={() => setShowRechargeDialog(false)}
          onRecharge={handleRecharge}
          loading={rechargeLoading}
        />
      )}
    </div>
  );
}

interface InfoTabProps {
  member: Member;
}

function InfoTab({ member }: InfoTabProps) {
  const getGenderLabel = (gender?: string) => {
    switch (gender) {
      case 'MALE': return '男';
      case 'FEMALE': return '女';
      case 'OTHER': return '其他';
      default: return '未知';
    }
  };

  return (
    <div className="p-4 space-y-4">
      <InfoItem
        icon={<Phone className="h-4 w-4" />}
        label="手机号"
        value={member.phone}
      />
      <InfoItem
        icon={<User className="h-4 w-4" />}
        label="性别"
        value={getGenderLabel(member.gender)}
      />
      {member.birthday && (
        <InfoItem
          icon={<Calendar className="h-4 w-4" />}
          label="生日"
          value={new Date(member.birthday).toLocaleDateString('zh-CN')}
        />
      )}
      <InfoItem
        icon={<TrendingUp className="h-4 w-4" />}
        label="累计充值"
        value={`¥${(member.totalRecharge / 100).toFixed(2)}`}
      />
      <InfoItem
        icon={<Calendar className="h-4 w-4" />}
        label="注册时间"
        value={new Date(member.createdAt).toLocaleString('zh-CN')}
      />
      {member.lastVisitAt && (
        <InfoItem
          icon={<Calendar className="h-4 w-4" />}
          label="最后消费"
          value={new Date(member.lastVisitAt).toLocaleString('zh-CN')}
        />
      )}
      {member.remark && (
        <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">备注</div>
          <div className="text-sm text-slate-900 dark:text-white">{member.remark}</div>
        </div>
      )}
    </div>
  );
}

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function InfoItem({ icon, label, value }: InfoItemProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
        {icon}
        {label}
      </div>
      <div className="text-sm text-slate-900 dark:text-white font-medium">{value}</div>
    </div>
  );
}

interface OrdersTabProps {
  orders: Member['orders'];
}

function OrdersTab({ orders }: OrdersTabProps) {
  if (!orders || orders.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-slate-500 dark:text-slate-400">暂无消费记录</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-700">
      {orders.map((order) => (
        <div key={order.id} className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium text-slate-900 dark:text-white">{order.orderNo}</div>
            <div className="flex items-center gap-1 text-sm">
              {order.status === 'SETTLED' ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  order.status === 'SETTLED'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                }`}
              >
                {order.status === 'SETTLED' ? '已结算' : order.status === 'PENDING' ? '待结算' : order.status}
              </span>
            </div>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            {new Date(order.createdAt).toLocaleString('zh-CN')}
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600 dark:text-slate-300">
              {order.items.map((item, idx) => (
                <span key={idx}>
                  {item.serviceName} × {item.quantity}
                  {idx < order.items.length - 1 && '、'}
                </span>
              ))}
            </div>
            <div className="font-bold text-slate-900 dark:text-white">
              ¥{(order.payableAmount / 100).toFixed(2)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface RechargeTabProps {
  records: Member['rechargeRecords'];
}

function RechargeTab({ records }: RechargeTabProps) {
  if (!records || records.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-4xl mb-3">💰</div>
        <p className="text-slate-500 dark:text-slate-400">暂无充值记录</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-700">
      {records.map((record) => (
        <div key={record.id} className="p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white">
                ¥{(record.amount / 100).toFixed(2)}
              </span>
              {record.giftAmount > 0 && (
                <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                  + ¥{(record.giftAmount / 100).toFixed(2)}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {new Date(record.createdAt).toLocaleDateString('zh-CN')}
            </div>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            操作人: {record.operator.name}
          </div>
        </div>
      ))}
    </div>
  );
}

interface RechargeDialogProps {
  onClose: () => void;
  onRecharge: (
    amount: number,
    giftAmount: number,
    payMethod: PayMethod,
    remark?: string
  ) => void;
  loading: boolean;
}

function RechargeDialog({ onClose, onRecharge, loading }: RechargeDialogProps) {
  const [amount, setAmount] = useState('');
  const [giftAmount, setGiftAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PayMethod>(PayMethod.WECHAT);
  const [remark, setRemark] = useState('');

  const handlePresetClick = (preset: number) => {
    setAmount(preset.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const numAmount = parseFloat(amount);
    const numGiftAmount = parseFloat(giftAmount) || 0;

    if (!numAmount || numAmount <= 0) {
      alert('请输入有效的充值金额');
      return;
    }

    onRecharge(numAmount, numGiftAmount, payMethod, remark || undefined);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-y-auto pb-safe-bottom">
        {/* Handle for mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white text-lg">会员充值</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Amount presets */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              快速选择
            </label>
            <div className="grid grid-cols-4 gap-2">
              {AMOUNT_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className="py-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl font-medium text-slate-700 dark:text-slate-300 active:scale-95 transition-all hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30"
                >
                  ¥{preset}
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              充值金额 (元)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                ¥
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-4 bg-slate-100 dark:bg-slate-700 border-2 border-transparent rounded-xl text-2xl font-bold text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Gift amount */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              赠送金额 (元)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                ¥
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={giftAmount}
                onChange={(e) => setGiftAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Payment method */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              支付方式
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(PayMethod).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPayMethod(method)}
                  className={`py-3 rounded-xl text-sm font-medium transition-all ${
                    payMethod === method
                      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {PAY_METHOD_LABELS[method]}
                </button>
              ))}
            </div>
          </div>

          {/* Remark */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              备注
            </label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="选填备注信息"
              rows={2}
              className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>

          {/* Summary */}
          {(parseFloat(amount) || 0) > 0 && (
            <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">合计到账</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                ¥{((parseFloat(amount) || 0) + (parseFloat(giftAmount) || 0)).toFixed(2)}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium active:bg-slate-200 dark:active:bg-slate-600 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || !parseFloat(amount)}
              className="flex-1 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
            >
              {loading ? '处理中...' : '确认充值'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}