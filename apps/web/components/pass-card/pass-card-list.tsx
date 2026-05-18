'use client';

import { useState, useEffect } from 'react';
import {
  getPassCards,
  deactivatePassCard,
  activatePassCard,
  type PassCard,
  getPassCardStatusLabel,
  getPassCardStatusColor,
  isPassCardUsable,
} from '@/lib/api/pass-cards';

interface PassCardListProps {
  memberId: string;
  refreshTrigger?: number;
  onPassCardClick?: (passCard: PassCard) => void;
}

export function PassCardList({ memberId, refreshTrigger, onPassCardClick }: PassCardListProps) {
  const [passCards, setPassCards] = useState<PassCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPassCards();
  }, [memberId, refreshTrigger]);

  const loadPassCards = async () => {
    setLoading(true);
    try {
      const result = await getPassCards({ memberId });
      setPassCards(result.items);
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (passCard: PassCard) => {
    try {
      if (passCard.isActive) {
        await deactivatePassCard(passCard.id);
      } else {
        await activatePassCard(passCard.id);
      }
      loadPassCards();
    } catch (error: unknown) {
      alert(`操作失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const getDaysUntilExpiry = (expiresAt: string | null): number | null => {
    if (!expiresAt) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        加载中...
      </div>
    );
  }

  if (passCards.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        该会员暂无次卡
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {passCards.map((passCard) => {
        const usable = isPassCardUsable(passCard);
        const daysUntilExpiry = getDaysUntilExpiry(passCard.expiresAt);
        const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;

        return (
          <div
            key={passCard.id}
            onClick={() => onPassCardClick?.(passCard)}
            className={`border rounded-lg p-4 transition-all ${
              usable ? 'hover:border-primary cursor-pointer' : 'opacity-60'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{passCard.name}</h3>
                <div className="text-xs text-muted-foreground mt-1">
                  购买于 {new Date(passCard.createdAt).toLocaleDateString('zh-CN')}
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleActive(passCard);
                }}
                className={`px-2 py-1 rounded text-xs ${
                  passCard.isActive ? 'bg-green-500/10 text-green-700' : 'bg-gray-500/10 text-gray-700'
                }`}
              >
                {passCard.isActive ? '有效' : '已停用'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="text-xs text-muted-foreground">剩余次数</div>
                <div className="text-2xl font-bold text-primary">
                  {passCard.remainingTimes}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    / {passCard.totalTimes}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">购买价格</div>
                <div className="text-lg font-semibold">
                  ¥{(passCard.price / 100).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs border ${getPassCardStatusColor(passCard.status)}`}>
                  {getPassCardStatusLabel(passCard.status)}
                </span>
                {!usable && passCard.status !== 'ACTIVE' && (
                  <span className="text-xs text-destructive">不可用</span>
                )}
                {isExpiringSoon && (
                  <span className="text-xs text-orange-600">即将过期</span>
                )}
              </div>
              {passCard.expiresAt && (
                <div className="text-xs text-muted-foreground">
                  {daysUntilExpiry !== null ? (
                    daysUntilExpiry > 0 ? (
                      <span>剩余 {daysUntilExpiry} 天</span>
                    ) : (
                      <span className="text-destructive">已过期</span>
                    )
                  ) : (
                    new Date(passCard.expiresAt).toLocaleDateString('zh-CN')
                  )}
                </div>
              )}
            </div>

            {passCard.usages && passCard.usages.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <div className="text-xs text-muted-foreground mb-2">最近使用</div>
                <div className="space-y-1">
                  {passCard.usages.slice(0, 3).map((usage) => (
                    <div key={usage.id} className="text-xs flex justify-between">
                      <span>{usage.orderItem?.serviceName || '未知服务'}</span>
                      <span className="text-muted-foreground">
                        {new Date(usage.usedAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}