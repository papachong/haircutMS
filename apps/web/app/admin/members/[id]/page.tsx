'use client';

import { useState, useEffect, useCallback } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Check,
  BarChart3,
  Lightbulb,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { apiFetch } from '../../../../lib/api/client';
import {
  getActiveRechargePlans,
  rechargeMember,
  getRechargeHistory,
  PayMethod,
  PAY_METHOD_LABELS,
  type RechargePlan,
  type RechargeRecord,
} from '../../../../lib/api/recharge';
import {
  getMemberProfile,
  getMemberRecommendations,
  getMemberConsumptionChart,
  type MemberProfileData,
  type Recommendation as RecommendationData,
  type ConsumptionChartData,
} from '../../../../lib/api/member-profile';
import MemberProfileCard from '../../../../components/member/member-profile-card';
import MemberConsumptionChart from '../../../../components/member/member-consumption-chart';
import MemberRecommendations from '../../../../components/member/member-recommendations';

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
    payMethod: string;
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

type TabType = 'info' | 'orders' | 'recharge' | 'passcards' | 'profile';

const PAY_METHOD_OPTIONS: Array<{ value: PayMethod; label: string; color: string }> = [
  { value: PayMethod.CASH, label: '现金', color: 'bg-green-50 border-green-200 text-green-700' },
  { value: PayMethod.WECHAT, label: '微信支付', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { value: PayMethod.ALIPAY, label: '支付宝', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { value: PayMethod.BANK_CARD, label: '银行卡', color: 'bg-purple-50 border-purple-200 text-purple-700' },
];

const PAGE_SIZE = 10;

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [showRechargeDialog, setShowRechargeDialog] = useState(false);

  // Recharge history state
  const [rechargeHistory, setRechargeHistory] = useState<RechargeRecord[]>([]);
  const [rechargeHistoryTotal, setRechargeHistoryTotal] = useState(0);
  const [rechargeHistoryPage, setRechargeHistoryPage] = useState(1);
  const [rechargeHistoryLoading, setRechargeHistoryLoading] = useState(false);

  // Profile data state
  const [profileData, setProfileData] = useState<MemberProfileData | null>(null);
  const [chartData, setChartData] = useState<ConsumptionChartData | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationData[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);

  const loadMember = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ code: number; data: Member }>(`/members/${params.id}`);
      setMember(res.data);
    } catch (error) {
      console.error('Failed to load member:', error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const loadRechargeHistory = useCallback(async (page: number) => {
    if (!params.id) return;
    setRechargeHistoryLoading(true);
    try {
      const res = await getRechargeHistory(params.id as string, page, PAGE_SIZE);
      setRechargeHistory(res.items);
      setRechargeHistoryTotal(res.pagination.total);
      setRechargeHistoryPage(page);
    } catch (error) {
      console.error('Failed to load recharge history:', error);
    } finally {
      setRechargeHistoryLoading(false);
    }
  }, [params.id]);

  const loadProfileData = useCallback(async () => {
    if (!params.id) return;
    setProfileLoading(true);
    try {
      const [profile, chart, recs] = await Promise.all([
        getMemberProfile(params.id as string),
        getMemberConsumptionChart(params.id as string),
        getMemberRecommendations(params.id as string),
      ]);
      setProfileData(profile);
      setChartData(chart);
      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to load member profile:', error);
    } finally {
      setProfileLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadMember();
  }, [loadMember]);

  useEffect(() => {
    if (activeTab === 'recharge') {
      loadRechargeHistory(1);
    }
  }, [activeTab, loadRechargeHistory]);

  useEffect(() => {
    if (activeTab === 'profile') {
      loadProfileData();
    }
  }, [activeTab, loadProfileData]);

  const handleRechargeSuccess = () => {
    setShowRechargeDialog(false);
    loadMember();
    if (activeTab === 'recharge') {
      loadRechargeHistory(1);
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

  const getPayMethodLabel = (method: string) => {
    return PAY_METHOD_LABELS[method as PayMethod] ?? method;
  };

  const tabs = [
    { id: 'info' as TabType, label: '基本信息', icon: User },
    { id: 'profile' as TabType, label: '消费画像', icon: BarChart3 },
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
  const rechargeHistoryTotalPages = Math.ceil(rechargeHistoryTotal / PAGE_SIZE);

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

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-primary/5 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <CreditCard className="h-4 w-4" />
              本金余额
            </div>
            <div className="text-2xl font-bold">{(member.principalBalance / 100).toFixed(2)}<span className="text-sm font-normal ml-1">元</span></div>
          </div>
          <div className="bg-primary/5 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Gift className="h-4 w-4" />
              赠送余额
            </div>
            <div className="text-2xl font-bold">{(member.giftBalance / 100).toFixed(2)}<span className="text-sm font-normal ml-1">元</span></div>
          </div>
          <div className="bg-primary/5 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <CreditCard className="h-4 w-4" />
              账户总余额
            </div>
            <div className="text-2xl font-bold text-primary">{(totalBalance / 100).toFixed(2)}<span className="text-sm font-normal ml-1">元</span></div>
          </div>
          <div className="bg-primary/5 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              总消费
            </div>
            <div className="text-2xl font-bold">{(member.totalConsume / 100).toFixed(2)}<span className="text-sm font-normal ml-1">元</span></div>
          </div>
          <div className="bg-primary/5 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <ShoppingCart className="h-4 w-4" />
              消费次数
            </div>
            <div className="text-2xl font-bold">{member.visitCount}<span className="text-sm font-normal ml-1">次</span></div>
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
                  {(member.totalRecharge / 100).toFixed(2)} 元
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
                            {item.serviceName} x {item.quantity}
                            {idx < order.items.length - 1 && '、'}
                          </span>
                        ))}
                      </div>
                      <div className="font-medium">
                        {(order.payableAmount / 100).toFixed(2)} 元
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
          <RechargeHistoryTab
            records={rechargeHistory}
            loading={rechargeHistoryLoading}
            currentPage={rechargeHistoryPage}
            totalPages={rechargeHistoryTotalPages}
            total={rechargeHistoryTotal}
            onPageChange={loadRechargeHistory}
            getPayMethodLabel={getPayMethodLabel}
          />
        )}

        {activeTab === 'passcards' && (
          <div>
            {member.passCards && member.passCards.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {member.passCards.map((card) => {
                  const percentage = (card.remainingTimes / card.totalTimes) * 100;
                  const isExpired = card.expiresAt && new Date(card.expiresAt) < new Date();
                  const isUsedUp = card.remainingTimes === 0;

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
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>

                      {card.expiresAt && (
                        <div className="text-sm text-muted-foreground">
                          有效期至: {new Date(card.expiresAt).toLocaleDateString('zh-CN')}
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

        {activeTab === 'profile' && (
          <div>
            {profileLoading ? (
              <div className="text-center py-8 text-muted-foreground">加载画像数据...</div>
            ) : profileData ? (
              <div className="space-y-6">
                {/* Profile Overview */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <PieChartIcon className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">消费画像</h3>
                  </div>
                  <MemberProfileCard profile={profileData} />
                </div>

                {/* Consumption Charts */}
                {chartData && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      <h3 className="font-medium">消费图表</h3>
                    </div>
                    <MemberConsumptionChart data={chartData} />
                  </div>
                )}

                {/* Smart Recommendations */}
                {recommendations.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Lightbulb className="h-5 w-5 text-amber-500" />
                      <h3 className="font-medium">智能推荐</h3>
                    </div>
                    <MemberRecommendations recommendations={recommendations} />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                暂无画像数据
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recharge Dialog */}
      {showRechargeDialog && (
        <RechargeDialog
          memberId={member.id}
          onClose={() => setShowRechargeDialog(false)}
          onSuccess={handleRechargeSuccess}
        />
      )}
    </div>
  );
}

// --- Recharge History Tab (paginated, with payMethod display) ---

interface RechargeHistoryTabProps {
  records: RechargeRecord[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  getPayMethodLabel: (method: string) => string;
}

function RechargeHistoryTab({
  records,
  loading,
  currentPage,
  totalPages,
  total,
  onPageChange,
  getPayMethodLabel,
}: RechargeHistoryTabProps) {
  if (loading) {
    return (
      <div className="text-center text-muted-foreground py-8">加载中...</div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">暂无充值记录</div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          共 {total} 条充值记录
        </div>
      </div>

      {/* Table header */}
      <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 text-xs text-muted-foreground border-b font-medium">
        <div className="col-span-3">充值时间</div>
        <div className="col-span-2">充值金额</div>
        <div className="col-span-2">赠送金额</div>
        <div className="col-span-2">支付方式</div>
        <div className="col-span-1">操作人</div>
        <div className="col-span-2">备注</div>
      </div>

      <div className="divide-y">
        {records.map((record) => (
          <div key={record.id} className="grid grid-cols-1 md:grid-cols-12 gap-1 md:gap-2 px-4 py-3 hover:bg-accent/30 transition-colors">
            {/* Mobile layout */}
            <div className="md:hidden space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium">
                  {(record.amount / 100).toFixed(2)} 元
                  {record.giftAmount > 0 && (
                    <span className="text-primary ml-2 text-sm">
                      + 赠送 {(record.giftAmount / 100).toFixed(2)} 元
                    </span>
                  )}
                </div>
                <span className="px-2 py-0.5 text-xs rounded border bg-secondary">
                  {getPayMethodLabel(record.payMethod)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{new Date(record.createdAt).toLocaleString('zh-CN')}</span>
                <span>操作人: {record.operator.name}</span>
              </div>
              {record.remark && (
                <div className="text-sm text-muted-foreground">{record.remark}</div>
              )}
              {record.plan && (
                <div className="text-xs text-muted-foreground">方案: {record.plan.name}</div>
              )}
            </div>

            {/* Desktop layout */}
            <div className="hidden md:block col-span-3 text-sm self-center">
              {new Date(record.createdAt).toLocaleString('zh-CN')}
            </div>
            <div className="hidden md:block col-span-2 text-sm font-medium self-center">
              {(record.amount / 100).toFixed(2)} 元
            </div>
            <div className="hidden md:block col-span-2 text-sm self-center">
              {record.giftAmount > 0 ? (
                <span className="text-primary">{(record.giftAmount / 100).toFixed(2)} 元</span>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
            <div className="hidden md:block col-span-2 text-sm self-center">
              <span className="inline-block px-2 py-0.5 text-xs rounded border bg-secondary">
                {getPayMethodLabel(record.payMethod)}
              </span>
            </div>
            <div className="hidden md:block col-span-1 text-sm text-muted-foreground self-center truncate">
              {record.operator.name}
            </div>
            <div className="hidden md:block col-span-2 text-sm text-muted-foreground self-center truncate">
              {record.plan ? record.plan.name : (record.remark || '-')}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t mt-2">
          <div className="text-sm text-muted-foreground">
            第 {currentPage} / {totalPages} 页
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-2 rounded-md hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-md hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Recharge Dialog with plan selection + pay method ---

interface RechargeDialogProps {
  memberId: string;
  onClose: () => void;
  onSuccess: () => void;
}

type RechargeStep = 'select-plan' | 'confirm' | 'success';

function RechargeDialog({ memberId, onClose, onSuccess }: RechargeDialogProps) {
  const [step, setStep] = useState<RechargeStep>('select-plan');
  const [plans, setPlans] = useState<RechargePlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  // Plan selection
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [customGiftAmount, setCustomGiftAmount] = useState('');

  // Payment
  const [selectedPayMethod, setSelectedPayMethod] = useState<PayMethod>(PayMethod.CASH);
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setPlansLoading(true);
    try {
      const activePlans = await getActiveRechargePlans();
      setPlans(activePlans);
    } catch {
      // Silently fail, user can still use custom amount
    } finally {
      setPlansLoading(false);
    }
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? null;

  const effectiveAmount = selectedPlan
    ? selectedPlan.amount
    : Math.round(parseFloat(customAmount) * 100) || 0;
  const effectiveGiftAmount = selectedPlan
    ? selectedPlan.giftAmount
    : Math.round(parseFloat(customGiftAmount) * 100) || 0;

  const canProceed = selectedPlan
    || (parseFloat(customAmount) > 0 && Math.round(parseFloat(customAmount) * 100) >= 1);

  const canSubmit = canProceed && !submitting;

  const handleProceed = () => {
    if (!canProceed) return;
    setError('');
    setStep('confirm');
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    setError('');

    try {
      const payload: {
        planId?: string;
        amount?: number;
        giftAmount?: number;
        payMethod: PayMethod;
        remark?: string;
      } = {
        payMethod: selectedPayMethod,
      };

      if (selectedPlan) {
        payload.planId = selectedPlan.id;
      } else {
        payload.amount = effectiveAmount;
        if (effectiveGiftAmount > 0) {
          payload.giftAmount = effectiveGiftAmount;
        }
      }

      if (remark.trim()) {
        payload.remark = remark.trim();
      }

      await rechargeMember(memberId, payload);
      setStep('success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '充值失败，请重试';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (step === 'success') {
      onSuccess();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h2 className="font-semibold text-lg">
            {step === 'select-plan' && '选择充值方案'}
            {step === 'confirm' && '确认充值信息'}
            {step === 'success' && '充值成功'}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground text-xl leading-none"
          >
            x
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto flex-1">
          {/* Step: Select Plan */}
          {step === 'select-plan' && (
            <div className="space-y-4">
              {/* Plan cards */}
              {plansLoading ? (
                <div className="text-center py-8 text-muted-foreground">加载充值方案...</div>
              ) : plans.length > 0 ? (
                <div>
                  <div className="text-sm font-medium mb-2">充值方案</div>
                  <div className="grid grid-cols-2 gap-2">
                    {plans.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => {
                          setSelectedPlanId(plan.id === selectedPlanId ? null : plan.id);
                          setCustomAmount('');
                          setCustomGiftAmount('');
                        }}
                        className={`relative p-3 border rounded-lg text-left transition-all ${
                          selectedPlanId === plan.id
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : 'hover:border-primary/50'
                        }`}
                      >
                        {selectedPlanId === plan.id && (
                          <div className="absolute top-1.5 right-1.5">
                            <Check className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div className="font-semibold">{(plan.amount / 100).toFixed(0)}<span className="text-sm font-normal">元</span></div>
                        {plan.giftAmount > 0 && (
                          <div className="text-sm text-primary mt-0.5">
                            赠 {(plan.giftAmount / 100).toFixed(0)} 元
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1 truncate">{plan.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  暂无可用充值方案，请手动输入金额
                </div>
              )}

              {/* Divider */}
              {plans.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t" />
                  <span className="text-xs text-muted-foreground">或手动输入</span>
                  <div className="flex-1 border-t" />
                </div>
              )}

              {/* Custom amount inputs */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    充值金额 (元) <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedPlanId(null);
                    }}
                    placeholder={selectedPlan ? (selectedPlan.amount / 100).toString() : '请输入充值金额'}
                    disabled={!!selectedPlan}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:bg-muted disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    赠送金额 (元)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={customGiftAmount}
                    onChange={(e) => {
                      setCustomGiftAmount(e.target.value);
                      setSelectedPlanId(null);
                    }}
                    placeholder={selectedPlan ? (selectedPlan.giftAmount / 100).toString() : '选填赠送金额'}
                    disabled={!!selectedPlan}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:bg-muted disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="p-3 bg-primary/5 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">合计到账</div>
                    <div className="text-xl font-bold">
                      {((effectiveAmount + effectiveGiftAmount) / 100).toFixed(2)}<span className="text-sm font-normal ml-1">元</span>
                    </div>
                  </div>
                  {effectiveGiftAmount > 0 && (
                    <div className="text-right text-sm">
                      <div className="text-muted-foreground">本金</div>
                      <div className="font-medium">{(effectiveAmount / 100).toFixed(2)} 元</div>
                      <div className="text-muted-foreground mt-1">赠送</div>
                      <div className="font-medium text-primary">{(effectiveGiftAmount / 100).toFixed(2)} 元</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-5">
              {/* Amount summary */}
              <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">充值本金</span>
                  <span className="font-medium">{(effectiveAmount / 100).toFixed(2)} 元</span>
                </div>
                {effectiveGiftAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">赠送金额</span>
                    <span className="font-medium text-primary">{(effectiveGiftAmount / 100).toFixed(2)} 元</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-medium">合计到账</span>
                  <span className="text-lg font-bold">{((effectiveAmount + effectiveGiftAmount) / 100).toFixed(2)} 元</span>
                </div>
              </div>

              {/* Plan name */}
              {selectedPlan && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">充值方案</span>
                  <span className="font-medium">{selectedPlan.name}</span>
                </div>
              )}

              {/* Pay method selection */}
              <div>
                <div className="text-sm font-medium mb-2">支付方式 <span className="text-destructive">*</span></div>
                <div className="grid grid-cols-2 gap-2">
                  {PAY_METHOD_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedPayMethod(option.value)}
                      className={`p-3 border rounded-lg text-sm font-medium transition-all ${
                        selectedPayMethod === option.value
                          ? `${option.color} ring-1 ring-current`
                          : 'hover:border-primary/50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Remark */}
              <div>
                <label className="block text-sm font-medium mb-1.5">备注</label>
                <input
                  type="text"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="选填备注信息"
                  maxLength={200}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <div className="text-lg font-semibold">充值成功</div>
                <div className="text-muted-foreground mt-1">
                  已到账 {((effectiveAmount + effectiveGiftAmount) / 100).toFixed(2)} 元
                  {effectiveGiftAmount > 0 && (
                    <span className="text-primary">
                      {' '}(含赠送 {(effectiveGiftAmount / 100).toFixed(2)} 元)
                    </span>
                  )}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                支付方式: {PAY_METHOD_LABELS[selectedPayMethod]}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t shrink-0">
          {step === 'select-plan' && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border rounded-md hover:bg-accent transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleProceed}
                disabled={!canProceed}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一步
              </button>
            </div>
          )}

          {step === 'confirm' && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setStep('select-plan');
                }}
                className="flex-1 px-4 py-2 border rounded-md hover:bg-accent transition-colors"
              >
                上一步
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {submitting ? '处理中...' : '确认充值'}
              </button>
            </div>
          )}

          {step === 'success' && (
            <button
              type="button"
              onClick={handleClose}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              完成
            </button>
          )}
        </div>
      </div>
    </div>
  );
}