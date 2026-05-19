'use client';

import { Gift, Sparkles, ArrowRight, Wallet } from 'lucide-react';
import type { Recommendation } from '../../../lib/api/member-profile';

interface MemberRecommendationsProps {
  recommendations: Recommendation[];
}

const TYPE_CONFIG: Record<
  string,
  { icon: typeof Gift; bg: string; border: string; iconColor: string }
> = {
  service: {
    icon: Sparkles,
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    iconColor: 'text-indigo-600',
  },
  recharge: {
    icon: Wallet,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconColor: 'text-amber-600',
  },
  comeback: {
    icon: ArrowRight,
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    iconColor: 'text-emerald-600',
  },
};

export default function MemberRecommendations({
  recommendations,
}: MemberRecommendationsProps) {
  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        暂无推荐
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recommendations.map((rec, idx) => {
        const config = TYPE_CONFIG[rec.type] ?? TYPE_CONFIG.service;
        const IconComp = config.icon;

        return (
          <div
            key={`${rec.type}-${idx}`}
            className={`p-4 rounded-lg border ${config.border} ${config.bg} transition-colors hover:shadow-sm`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${config.iconColor}`}>
                <IconComp className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{rec.title}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {rec.description}
                </div>
              </div>
              {rec.suggestedAmount && (
                <div className="text-right shrink-0">
                  <div className="text-xs text-muted-foreground">建议金额</div>
                  <div className="font-bold text-sm">
                    ¥{(rec.suggestedAmount / 100).toFixed(0)}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
