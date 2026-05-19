'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Phone,
  Calendar,
  CreditCard,
  ShoppingCart,
  TrendingUp,
  Gift,
  Plus,
  Edit,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { apiFetch } from '../../../../lib/api/client';

interface Member {
  id: string;
  cardNo: string;
  name: string;
  phone: string;
  gender?: string;
  birthday?: string;
  avatar?: string;
  memberLevel: {
    id: string;
    name: string;
    discount: number;
  };
  principalBalance: number;
  giftBalance: number;
  totalRecharge: number;
  totalConsume: number;
  visitCount: number;
  lastVisitAt?: string;
  remark?: string;
  createdAt: string;
  tagRelations?: Array<{
    tag: {
      id: string;
      name: string;
      group: {
        name: string;
      };
    };
  }>;
  rechargeRecords?: Array<{
    id: string;
    amount: number;
    giftAmount: number;
    type: string;
    operator: {
      name: string;
    };
    createdAt: string;
  }>;
  orders?: Array<{
    id: string;
    orderNo: string;
    payableAmount: number;
    status: string;
    createdAt: string;
    items: Array<{
      serviceName: string;
      quantity: number;
    }>;
  }>;
  passCards?: Array<{
    id: string;
    name: string;
    totalTimes: number;
    remainingTimes: number;
    expiresAt?: string;
    createdAt: string;
  }>;
}

type TabType = 'info' | 'orders' | 'recharge' | 'passcards';

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [showRechargeDialog, setShowRechargeDialog] = useState(false);
  const [showPassCardPurchase, setShowPassCardPurchase] = useState(false);

  useEffect(() => {
    loadMember();
  }, [params.id]);

  const loadMember = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ code: number; data: Member }>(`/members/${params.id}`);
      setMember(res.data);
    } catch (error) {
      console.error('Failed to load member:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecharge = async (amount: number, giftAmount: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/v1/members/${params.id}/recharge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: amount * 100,
          giftAmount: giftAmount * 100,
        }),
      });

      const data = await response.json();

      if (data.code === 0) {
        setShowRechargeDialog(false);
        loadMember();
      } else {
        alert(data.message || '充值失败');
      }
    } catch (error: unknown) {
      alert(`充值失败: ${error instanceof Error ? error.message : '未知错误'}`);
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

  const tabs = [
    { id: 'info' as TabType, label: '基本信息', icon: User },
    { id: 'orders' as TabType, label: '消费记录', icon: ShoppingCart },
    { id: 'recharge' as TabType, label: '充值记录', icon: RefreshCw },
    { id: 'passcards' as TabType, label: '次卡', icon: CreditCard },
  ];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-96 gap-4">
        <p className="text-muted-foreground">会员不存在</p>
        <Link
          href="/admin/members"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          返回列表
        </Link>
      </div>
    );
  }

  const totalBalance = member.principalBalance + member.giftBalance;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/members" className="p-2 hover:bg-accent rounded-md">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold flex-1">会员详情</h1>
        <button
          type="button"
          onClick={() => setShowRechargeDialog(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          充值
        </button>
      </div>

      {/* Member Info Card */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-start gap-4 mb-6">
          {member.avatar ? (
            <img
              src={member.avatar}
              alt={member.name}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-10 w-10 text-primary" />
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{member.name}</h2>
            <div className="text-muted-foreground mt-1">{member.cardNo}</div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1 text-sm">
                <Phone className="h-3 w-3" />
                {member.phone}
              </div>
              {member.gender && (
                <div className="flex items-center gap-1 text-sm">
                  {getGenderLabel(member.gender)}
                </div>
              )}
              {member.birthday && (
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-3 w-3" />
                  {new Date(member.birthday).toLocaleDateString('zh-CN')}
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            className="p-2 hover:bg-accent rounded-md"
          >
            <Edit className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-primary/5 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <CreditCard className="h-4 w-4" />
              本金余额
            </div>
            <div className="text-2xl font-bold">¥{(member.principalBalance / 100).toFixed(2)}</div>
          </div>
          <div className="bg-primary/5 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Gift className="h-4 w-4" />
              赠送余额
            </div>
            <div className="text-2xl font-bold">¥{(member.giftBalance / 100).toFixed(2)}</div>
          </div>
          <div className="bg-primary/5 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              总消费
            </div>
            <div className="text-2xl font-bold">¥{(member.totalConsume / 100).toFixed(2)}</div>
          </div>
          <div className="bg-primary/5 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <ShoppingCart className="h-4 w-4" />
              消费次数
            </div>
            <div className="text-2xl font-bold">{member.visitCount}</div>
          </div>
        </div>

        {member.tagRelations && member.tagRelations.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground mb-2">标签</div>
            <div className="flex flex-wrap gap-2">
              {member.tagRelations.map((relation) => (
                <span
                  key={relation.tag.id}
                  className="px-2 py-1 bg-secondary rounded text-xs"
                >
                  {relation.tag.group.name}: {relation.tag.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {member.remark && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground mb-1">备注</div>
            <div className="text-sm">{member.remark}</div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-card border rounded-lg p-6">
        {activeTab === 'info' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">会员等级</div>
                <div className="font-medium mt-1">{member.memberLevel.name}</div>
                <div className="text-sm text-primary">
                  享受 {(member.memberLevel.discount * 10).toFixed(0)} 折优惠
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">注册时间</div>
                <div className="font-medium mt-1">
                  {new Date(member.createdAt).toLocaleString('zh-CN')}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">最后消费</div>
                <div className="font-medium mt-1">
                  {member.lastVisitAt
                    ? new Date(member.lastVisitAt).toLocaleString('zh-CN')
                    : '暂无'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">累计充值</div>
                <div className="font-medium mt-1">
                  ¥{(member.totalRecharge / 100).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            {member.orders && member.orders.length > 0 ? (
              <div className="space-y-3">
                {member.orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders`}
                    className="block p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{order.orderNo}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString('zh-CN')}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {order.items.map((item, idx) => (
                          <span key={idx}>
                            {item.serviceName} × {item.quantity}
                            {idx < order.items.length - 1 && '、'}
                          </span>
                        ))}
                      </div>
                      <div className="font-medium">
                        ¥{(order.payableAmount / 100).toFixed(2)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">暂无消费记录</div>
            )}
          </div>
        )}

        {activeTab === 'recharge' && (
          <div>
            {member.rechargeRecords && member.rechargeRecords.length > 0 ? (
              <div className="space-y-3">
                {member.rechargeRecords.map((record) => (
                  <div key={record.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">
                        ¥{(record.amount / 100).toFixed(2)}
                        {record.giftAmount > 0 && (
                          <span className="text-primary ml-2">
                            + 赠送 ¥{(record.giftAmount / 100).toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(record.createdAt).toLocaleString('zh-CN')}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      操作人: {record.operator.name}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">暂无充值记录</div>
            )}
          </div>
        )}

        {activeTab === 'passcards' && (
          <div>
            {/* Purchase button */}
            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={() => setShowPassCardPurchase(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
              >
                <Plus className="h-4 w-4" />
                购买次卡
              </button>
            </div>

            {member.passCards && member.passCards.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {member.passCards.map((card) => {
                  const percentage = (card.remainingTimes / card.totalTimes) * 100;
                  const isExpired = card.expiresAt && new Date(card.expiresAt) < new Date();
                  const isUsedUp = card.remainingTimes === 0;
                  const daysUntilExpiry = card.expiresAt
                    ? Math.ceil((new Date(card.expiresAt).getTime() - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24))
                    : null;
                  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;

                  const getProgressColor = () => {
                    if (isExpired) return 'bg-red-500';
                    if (isExpiringSoon) return 'bg-orange-500';
                    if (percentage <= 20) return 'bg-red-500';
                    if (percentage <= 50) return 'bg-yellow-500';
                    return 'bg-green-500';
                  };

                  return (
                    <div
                      key={card.id}
                      className={`p-4 border rounded-lg ${
                        isExpired ? 'border-destructive/50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-medium">{card.name}</div>
                        {isExpired && (
                          <span className="px-2 py-1 text-xs bg-destructive/10 text-destructive rounded">
                            已过期
                          </span>
                        )}
                        {isExpiringSoon && !isExpired && (
                          <span className="px-2 py-1 text-xs bg-orange-500/10 text-orange-700 rounded">
                            即将过期
                          </span>
                        )}
                        {isUsedUp && !isExpired && (
                          <span className="px-2 py-1 text-xs bg-secondary text-muted-foreground rounded">
                            已用完
                          </span>
                        )}
                      </div>

                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>剩余次数</span>
                          <span className="font-medium">
                            {card.remainingTimes} / {card.totalTimes}
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className={`${getProgressColor()} h-2 rounded-full transition-all`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>

                      {card.expiresAt && (
                        <div className="text-sm text-muted-foreground">
                          有效期至: {new Date(card.expiresAt).toLocaleDateString('zh-CN')}
                          {isExpiringSoon && (
                            <span className="text-orange-600 ml-1">({daysUntilExpiry}天后过期)</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <div className="mb-4">
                  <CreditCard className="h-12 w-12 mx-auto opacity-20" />
                </div>
                <p>暂无次卡</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recharge Dialog */}
      {showRechargeDialog && (
        <RechargeDialog
          onClose={() => setShowRechargeDialog(false)}
          onRecharge={handleRecharge}
        />
      )}

      {/* Pass Card Purchase Dialog */}
      {showPassCardPurchase && member && (
        <PassCardPurchaseDialogInline
          memberId={member.id}
          memberName={member.name}
          onClose={() => setShowPassCardPurchase(false)}
          onSuccess={() => {
            setShowPassCardPurchase(false);
            loadMember();
          }}
        />
      )}
    </div>
  );
}

interface RechargeDialogProps {
  onClose: () => void;
  onRecharge: (amount: number, giftAmount: number) => void;
}

function RechargeDialog({ onClose, onRecharge }: RechargeDialogProps) {
  const [amount, setAmount] = useState('');
  const [giftAmount, setGiftAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const numAmount = parseFloat(amount);
    const numGiftAmount = parseFloat(giftAmount) || 0;

    if (!numAmount || numAmount <= 0) {
      alert('请输入有效的充值金额');
      return;
    }

    setLoading(true);
    onRecharge(numAmount, numGiftAmount);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">会员充值</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              充值金额 (元) <span className="text-destructive">*</span>
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="请输入充值金额"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              赠送金额 (元)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={giftAmount}
              onChange={(e) => setGiftAmount(e.target.value)}
              placeholder="选填赠送金额"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="p-3 bg-primary/5 rounded-lg text-sm">
            <div className="text-muted-foreground mb-1">合计到账</div>
            <div className="text-xl font-bold">
              ¥{((parseFloat(amount) || 0) + (parseFloat(giftAmount) || 0)).toFixed(2)}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-md hover:bg-accent transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? '处理中...' : '确认充值'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface PassCardPurchaseDialogInlineProps {
  memberId: string;
  memberName: string;
  onClose: () => void;
  onSuccess: () => void;
}

function PassCardPurchaseDialogInline({
  memberId,
  memberName,
  onClose,
  onSuccess,
}: PassCardPurchaseDialogInlineProps) {
  const [formData, setFormData] = useState({
    name: '',
    totalTimes: 10,
    price: 0,
    expiresAt: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('请输入次卡名称');
      return;
    }
    if (formData.totalTimes <= 0) {
      alert('次数必须大于0');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/v1/pass-cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          memberId,
          name: formData.name.trim(),
          totalTimes: formData.totalTimes,
          price: Math.round(formData.price * 100),
          expiresAt: formData.expiresAt || undefined,
          isActive: true,
        }),
      });
      const data = await response.json();
      if (data.code === 0) {
        alert('次卡创建成功');
        onSuccess();
      } else {
        alert(data.message || '创建失败');
      }
    } catch (error: unknown) {
      alert(`创建失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">购买次卡</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div className="bg-accent/50 rounded-lg p-3">
            <div className="text-sm text-muted-foreground">会员</div>
            <div className="font-medium">{memberName}</div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              次卡名称 <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例如: 剪发10次卡"
              className="w-full px-3 py-2 border rounded-md"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">次数</label>
              <input
                type="number"
                min="1"
                value={formData.totalTimes}
                onChange={(e) => setFormData({ ...formData, totalTimes: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">价格 (元)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">有效期</label>
            <input
              type="date"
              value={formData.expiresAt}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border rounded-md"
            />
            <p className="text-xs text-muted-foreground mt-1">留空则永久有效</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-md hover:bg-accent transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? '处理中...' : '创建次卡'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}