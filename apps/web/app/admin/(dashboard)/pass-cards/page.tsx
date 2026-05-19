'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getPassCards,
  createPassCard,
  getPassCardById,
  getPassCardUsages,
  deactivatePassCard,
  activatePassCard,
  getPassCardStatusLabel,
  getPassCardStatusColor,
  isPassCardUsable,
  type PassCard,
  type PassCardUsage,
  type CreatePassCardInput,
  type PaginationMeta,
} from '@/lib/api/pass-cards';
import { searchMembers, type Member } from '@/lib/api/orders';
import { getServiceItems } from '@/lib/api/orders';

type StatusFilter = 'ALL' | 'ACTIVE' | 'EXPIRED' | 'USED_UP' | 'INACTIVE';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: '全部' },
  { value: 'ACTIVE', label: '有效' },
  { value: 'EXPIRED', label: '已过期' },
  { value: 'USED_UP', label: '已用完' },
  { value: 'INACTIVE', label: '已停用' },
];

export default function PassCardsPage() {
  const [passCards, setPassCards] = useState<PassCard[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    pageSize: 20,
    hasMore: false,
  });
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [loading, setLoading] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [selectedPassCard, setSelectedPassCard] = useState<PassCard | null>(null);
  const [usageHistory, setUsageHistory] = useState<PassCardUsage[]>([]);
  const [usagePagination, setUsagePagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    pageSize: 10,
    hasMore: false,
  });

  const loadPassCards = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const result = await getPassCards({
        keyword: keyword || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        page,
        pageSize: 20,
      });
      setPassCards(result.items);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Failed to load pass cards:', error);
    } finally {
      setLoading(false);
    }
  }, [keyword, statusFilter]);

  useEffect(() => {
    loadPassCards(1);
  }, [loadPassCards]);

  const loadUsageHistory = async (passCardId: string, page = 1) => {
    try {
      const result = await getPassCardUsages(passCardId, page, 10);
      setUsageHistory(result.items);
      setUsagePagination(result.pagination);
    } catch (error) {
      console.error('Failed to load usage history:', error);
    }
  };

  const handleOpenDetail = async (passCardId: string) => {
    try {
      const detail = await getPassCardById(passCardId);
      setSelectedPassCard(detail);
      loadUsageHistory(passCardId);
    } catch (error) {
      console.error('Failed to load pass card detail:', error);
    }
  };

  const handleToggleActive = async (passCard: PassCard) => {
    try {
      if (passCard.isActive) {
        await deactivatePassCard(passCard.id);
      } else {
        await activatePassCard(passCard.id);
      }
      loadPassCards(pagination.page);
      if (selectedPassCard?.id === passCard.id) {
        handleOpenDetail(passCard.id);
      }
    } catch (error: unknown) {
      alert(`操作失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const handlePurchaseSuccess = () => {
    setShowPurchaseDialog(false);
    loadPassCards(1);
  };

  const getDaysUntilExpiry = (expiresAt: string | null): number | null => {
    if (!expiresAt) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getProgressColor = (percentage: number, isExpired: boolean) => {
    if (isExpired) return 'bg-red-500';
    if (percentage <= 20) return 'bg-red-500';
    if (percentage <= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">次卡管理</h1>
        <button
          type="button"
          onClick={() => setShowPurchaseDialog(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          购买次卡
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索次卡名称、会员姓名、手机号..."
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex gap-1 border rounded-md p-1">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                statusFilter === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border rounded-lg">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">加载中...</div>
        ) : passCards.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <div className="text-4xl mb-2 opacity-20">🎫</div>
            <p>暂无次卡数据</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-4 p-4 border-b font-medium text-sm text-muted-foreground">
              <div>次卡名称</div>
              <div>会员</div>
              <div>次数进度</div>
              <div>价格</div>
              <div>有效期</div>
              <div>状态</div>
              <div>操作</div>
            </div>
            {passCards.map((card) => {
              const daysUntilExpiry = getDaysUntilExpiry(card.expiresAt);
              const isExpired = card.status === 'EXPIRED';
              const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
              const percentage = card.totalTimes > 0 ? (card.remainingTimes / card.totalTimes) * 100 : 0;

              return (
                <div
                  key={card.id}
                  className="grid grid-cols-7 gap-4 p-4 border-b text-sm hover:bg-accent/50 transition-colors items-center"
                >
                  <div className="font-medium truncate">{card.name}</div>
                  <div>
                    <div className="font-medium">{card.member?.name}</div>
                    <div className="text-xs text-muted-foreground">{card.member?.phone}</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium">{card.remainingTimes}/{card.totalTimes}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${getProgressColor(percentage, isExpired)}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div>¥{(card.price / 100).toFixed(2)}</div>
                  <div>
                    <div className="text-muted-foreground">
                      {card.expiresAt ? new Date(card.expiresAt).toLocaleDateString('zh-CN') : '永久'}
                    </div>
                    {isExpiringSoon && (
                      <div className="text-xs text-orange-600 mt-0.5">({daysUntilExpiry}天后过期)</div>
                    )}
                  </div>
                  <div>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs border ${getPassCardStatusColor(card.status)}`}>
                      {getPassCardStatusLabel(card.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(card.id)}
                      className="px-2 py-1 text-xs text-primary hover:bg-primary/10 rounded transition-colors"
                    >
                      详情
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(card)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        card.isActive
                          ? 'text-destructive hover:bg-destructive/10'
                          : 'text-green-600 hover:bg-green-500/10'
                      }`}
                    >
                      {card.isActive ? '停用' : '启用'}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {pagination.total > pagination.pageSize && (
              <div className="flex items-center justify-between p-4">
                <div className="text-sm text-muted-foreground">
                  共 {pagination.total} 条
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() => loadPassCards(pagination.page - 1)}
                    className="px-3 py-1.5 border rounded-md text-sm hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  <span className="text-sm">
                    {pagination.page} / {Math.ceil(pagination.total / pagination.pageSize)}
                  </span>
                  <button
                    type="button"
                    disabled={!pagination.hasMore}
                    onClick={() => loadPassCards(pagination.page + 1)}
                    className="px-3 py-1.5 border rounded-md text-sm hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Purchase Dialog */}
      {showPurchaseDialog && (
        <PurchaseDialog
          onSuccess={handlePurchaseSuccess}
          onClose={() => setShowPurchaseDialog(false)}
        />
      )}

      {/* Detail Drawer */}
      {selectedPassCard && (
        <DetailDrawer
          passCard={selectedPassCard}
          usageHistory={usageHistory}
          usagePagination={usagePagination}
          onLoadMoreUsages={(page) => loadUsageHistory(selectedPassCard.id, page)}
          onToggleActive={() => handleToggleActive(selectedPassCard)}
          onClose={() => setSelectedPassCard(null)}
        />
      )}
    </div>
  );
}

// --- Purchase Dialog ---

interface PurchaseDialogProps {
  onSuccess: () => void;
  onClose: () => void;
}

function PurchaseDialog({ onSuccess, onClose }: PurchaseDialogProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    totalTimes: 10,
    price: 0,
    expiresAt: '',
  });

  const handleMemberSearch = async (value: string) => {
    setMemberSearch(value);
    if (value.length >= 2) {
      const results = await searchMembers(value);
      setMembers(results);
    } else {
      setMembers([]);
    }
  };

  const handleCreate = async () => {
    if (!selectedMember) {
      alert('请选择会员');
      return;
    }
    if (!formData.name.trim()) {
      alert('请输入次卡名称');
      return;
    }
    if (formData.totalTimes <= 0) {
      alert('次数必须大于0');
      return;
    }
    if (formData.price < 0) {
      alert('价格不能为负数');
      return;
    }

    setLoading(true);
    try {
      const input: CreatePassCardInput = {
        memberId: selectedMember.id,
        name: formData.name.trim(),
        totalTimes: formData.totalTimes,
        price: Math.round(formData.price * 100),
        expiresAt: formData.expiresAt || undefined,
        isActive: true,
      };
      await createPassCard(input);
      alert('次卡创建成功');
      onSuccess();
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
          {/* Member Select */}
          <div>
            <label className="block text-sm font-medium mb-2">
              选择会员 <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => handleMemberSearch(e.target.value)}
                placeholder="搜索姓名/手机号/卡号"
                className="w-full px-3 py-2 border rounded-md"
              />
              {members.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto z-10">
                  {members.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => {
                        setSelectedMember(member);
                        setMemberSearch('');
                        setMembers([]);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-accent text-sm"
                    >
                      <div className="font-medium">{member.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {member.cardNo} · {member.phone}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedMember && (
              <div className="mt-2 p-2 bg-accent rounded-md text-sm">
                已选择: {selectedMember.name} ({selectedMember.cardNo})
              </div>
            )}
          </div>

          {/* Name */}
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
            />
          </div>

          {/* Times and Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                次数 <span className="text-destructive">*</span>
              </label>
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

          {/* Expiry */}
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

          {/* Actions */}
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
              onClick={handleCreate}
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

// --- Detail Drawer ---

interface DetailDrawerProps {
  passCard: PassCard;
  usageHistory: PassCardUsage[];
  usagePagination: PaginationMeta;
  onLoadMoreUsages: (page: number) => void;
  onToggleActive: () => void;
  onClose: () => void;
}

function DetailDrawer({
  passCard,
  usageHistory,
  usagePagination,
  onLoadMoreUsages,
  onToggleActive,
  onClose,
}: DetailDrawerProps) {
  const getDaysUntilExpiry = (expiresAt: string | null): number | null => {
    if (!expiresAt) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysUntilExpiry = getDaysUntilExpiry(passCard.expiresAt);
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  const percentage = passCard.totalTimes > 0 ? (passCard.remainingTimes / passCard.totalTimes) * 100 : 0;
  const isExpired = passCard.status === 'EXPIRED';

  const getProgressColor = () => {
    if (isExpired) return 'bg-red-500';
    if (isExpiringSoon) return 'bg-orange-500';
    if (percentage <= 20) return 'bg-red-500';
    if (percentage <= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50">
      <div className="bg-background w-full max-w-lg h-full overflow-auto shadow-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">次卡详情</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Card Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">{passCard.name}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs border ${getPassCardStatusColor(passCard.status)}`}>
                {getPassCardStatusLabel(passCard.status)}
              </span>
            </div>

            {/* Expiry Warning */}
            {isExpiringSoon && (
              <div className="flex items-center gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-md text-orange-700 text-sm">
                <span>⚠️</span>
                <span>此卡将在 {daysUntilExpiry} 天后过期</span>
              </div>
            )}

            {isExpired && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-700 text-sm">
                <span>⛔</span>
                <span>此卡已过期，不可继续使用</span>
              </div>
            )}

            {/* Member Info */}
            {passCard.member && (
              <div className="p-3 bg-accent/50 rounded-lg">
                <div className="text-sm text-muted-foreground">会员</div>
                <div className="font-medium">{passCard.member.name}</div>
                <div className="text-sm text-muted-foreground">
                  {passCard.member.cardNo} · {passCard.member.phone}
                </div>
              </div>
            )}

            {/* Progress */}
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span>剩余次数</span>
                <span className="font-bold text-lg">
                  {passCard.remainingTimes}
                  <span className="text-muted-foreground font-normal text-sm"> / {passCard.totalTimes}</span>
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${getProgressColor()}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">购买价格</div>
                <div className="font-medium">¥{(passCard.price / 100).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">有效期至</div>
                <div className="font-medium">
                  {passCard.expiresAt ? new Date(passCard.expiresAt).toLocaleDateString('zh-CN') : '永久有效'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">创建时间</div>
                <div className="font-medium">{new Date(passCard.createdAt).toLocaleDateString('zh-CN')}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">单价</div>
                <div className="font-medium">
                  ¥{(passCard.totalTimes > 0 ? passCard.price / passCard.totalTimes / 100 : 0).toFixed(2)}/次
                </div>
              </div>
            </div>

            {/* Toggle Active */}
            <button
              type="button"
              onClick={onToggleActive}
              className={`w-full px-4 py-2 rounded-md transition-colors ${
                passCard.isActive
                  ? 'border border-destructive text-destructive hover:bg-destructive/10'
                  : 'border border-green-600 text-green-600 hover:bg-green-500/10'
              }`}
            >
              {passCard.isActive ? '停用次卡' : '启用次卡'}
            </button>
          </div>

          {/* Usage History */}
          <div>
            <h4 className="font-semibold mb-3">使用记录</h4>
            {usageHistory.length === 0 ? (
              <div className="text-center text-muted-foreground py-6 text-sm">暂无使用记录</div>
            ) : (
              <div className="space-y-2">
                {usageHistory.map((usage) => (
                  <div key={usage.id} className="p-3 border rounded-lg text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium">
                        {usage.orderItem?.serviceName || '未知服务'}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {new Date(usage.usedAt).toLocaleString('zh-CN')}
                      </div>
                    </div>
                    {usage.orderItem?.staffName && (
                      <div className="text-xs text-muted-foreground">
                        服务人员: {usage.orderItem.staffName}
                      </div>
                    )}
                    {usage.orderItem?.order && (
                      <div className="text-xs text-muted-foreground">
                        订单号: {usage.orderItem.order.orderNo}
                      </div>
                    )}
                  </div>
                ))}

                {usagePagination.hasMore && (
                  <button
                    type="button"
                    onClick={() => onLoadMoreUsages(usagePagination.page + 1)}
                    className="w-full py-2 text-sm text-primary hover:bg-primary/5 rounded-md transition-colors"
                  >
                    加载更多
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
