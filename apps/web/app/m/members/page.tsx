'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Plus, User, Phone, CreditCard, TrendingUp, Wallet } from 'lucide-react';
import { searchMembers, getMembers, type Member, type MemberListParams } from '../../../lib/api/members';
import { usePullRefresh } from '../../../hooks/use-pull-refresh';
import { useDebounce } from '../../../hooks/use-debounce';
import PullRefreshIndicator from '../../../components/mobile/pull-refresh-indicator';
import SwipeableItem from '../../../components/mobile/swipeable-item';

// Custom hook for infinite scroll
function useInfiniteScroll(hasMore: boolean, onLoadMore: () => void) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || !loadMoreRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [hasMore, onLoadMore]);

  return { loadMoreRef };
}

// Quick recharge amount presets
const AMOUNT_PRESETS = [100, 200, 500, 1000];

export default function MobileMembersPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);
  const [hasMore, setHasMore] = useState(false);
  const [recentMembers, setRecentMembers] = useState<Member[]>([]);
  const [stats, setStats] = useState({ total: 0, totalBalance: 0, todayCount: 0 });

  const debouncedSearch = useDebounce(searchKeyword, 300);

  // Pull-to-refresh
  const { containerRef, pulling, refreshing, pullDistance } = usePullRefresh(async () => {
    await loadData();
  });

  // Infinite scroll
  const { loadMoreRef } = useInfiniteScroll(hasMore, () => {
    if (!loading && hasMore) {
      setCurrentPage((prev) => prev + 1);
    }
  });

  // Load initial data
  useEffect(() => {
    loadData();
    loadRecentMembers();
    loadStats();
  }, []);

  // Handle search
  useEffect(() => {
    if (debouncedSearch.trim()) {
      handleSearch(debouncedSearch);
    } else {
      loadData();
    }
  }, [debouncedSearch, currentPage]);

  // Load data
  const loadData = async () => {
    setLoading(true);
    try {
      const params: MemberListParams = {
        page: currentPage,
        pageSize,
      };

      const result = await getMembers(params);

      if (currentPage === 1) {
        setMembers(result.items);
      } else {
        setMembers((prev) => [...prev, ...result.items]);
      }

      setTotal(result.pagination.total);
      setHasMore(result.pagination.hasMore);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load recent members
  const loadRecentMembers = async () => {
    try {
      const result = await getMembers({ page: 1, pageSize: 10 });
      setRecentMembers(result.items.slice(0, 5));
    } catch (error) {
      console.error('Failed to load recent members:', error);
    }
  };

  // Load stats
  const loadStats = async () => {
    try {
      const result = await getMembers({ page: 1, pageSize: 1000 });
      const today = new Date().toDateString();
      const memberItems = result.items;

      setStats({
        total: result.pagination.total,
        totalBalance: memberItems.reduce((sum, m) => sum + m.principalBalance + m.giftBalance, 0),
        todayCount: memberItems.filter((m) => new Date(m.createdAt).toDateString() === today).length,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  // Handle search with real-time fuzzy matching
  const handleSearch = async (keyword: string) => {
    setLoading(true);
    try {
      if (keyword.trim().length >= 2) {
        const results = await searchMembers(keyword.trim());
        setMembers(results);
        setTotal(results.length);
        setHasMore(false);
      } else {
        loadData();
      }
    } catch (error) {
      console.error('Failed to search members:', error);
    } finally {
      setLoading(false);
    }
  };

  // Quick recharge
  const handleQuickRecharge = async (memberId: string, amount: number) => {
    if (!confirm(`确认充值 ¥${amount}？`)) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/v1/members/${memberId}/recharge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: amount * 100,
          giftAmount: 0,
          payMethod: 'WECHAT',
        }),
      });

      const data = await response.json();

      if (data.code === 0) {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([10, 50, 20]);
        }
        alert('充值成功');
        loadData();
      } else {
        alert(data.message || '充值失败');
      }
    } catch (error: unknown) {
      alert(`充值失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div
        ref={containerRef}
        className="flex-1 overflow-auto"
        style={{ height: '100vh', maxHeight: '100vh', WebkitOverflowScrolling: 'touch' }}
      >
        {/* Pull-to-refresh indicator */}
        <PullRefreshIndicator
          pulling={pulling}
          refreshing={refreshing}
          pullDistance={pullDistance}
        />

        {/* Header */}
        <div className="px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索姓名/手机号/卡号"
                className="w-full pl-10 pr-10 py-3 bg-slate-100 dark:bg-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 dark:text-white transition-all min-h-[44px]"
              />
              {searchKeyword && (
                <button
                  type="button"
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-300 text-xs active:scale-90 transition-transform"
                >
                  x
                </button>
              )}
            </div>
            <Link
              href="/admin/members/new"
              className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md shadow-primary/30 active:scale-95 transition-all shrink-0"
            >
              <Plus className="h-5 w-5" />
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-2.5 text-white text-center active:scale-[0.97] transition-transform"
            >
              <div className="text-lg font-bold">{stats.total}</div>
              <div className="text-xs text-white/80">会员总数</div>
            </button>
            <button
              type="button"
              className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-2.5 text-white text-center active:scale-[0.97] transition-transform"
            >
              <div className="text-lg font-bold">
                ¥{(stats.totalBalance / 100).toFixed(0)}k
              </div>
              <div className="text-xs text-white/80">总余额</div>
            </button>
            <button
              type="button"
              className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-2.5 text-white text-center active:scale-[0.97] transition-transform"
            >
              <div className="text-lg font-bold">{stats.todayCount}</div>
              <div className="text-xs text-white/80">今日新增</div>
            </button>
          </div>
        </div>

        {/* Recent members */}
        {!searchKeyword && recentMembers.length > 0 && (
          <div className="px-4 py-3">
            <div className="text-xs text-slate-400 dark:text-slate-500 mb-2 font-medium uppercase tracking-wider">
              最近服务
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
              {recentMembers.map((member) => (
                <Link
                  key={member.id}
                  href={`/m/members/${member.id}`}
                  className="flex-shrink-0 w-16 text-center active:scale-95 transition-transform"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg mx-auto mb-1 shadow-md">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      member.name[0]
                    )}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 truncate">
                    {member.name}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Member list */}
        <div className="px-4 pb-20">
          {loading && members.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              <p className="text-slate-500 dark:text-slate-400">
                {searchKeyword ? '未找到匹配的会员' : '暂无会员数据'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <SwipeableItem
                  key={member.id}
                  rightAction={{
                    label: '充值',
                    color: '#22c55e',
                    icon: <Wallet className="h-4 w-4" />,
                  }}
                  leftAction={{
                    label: '详情',
                    color: '#3b82f6',
                    icon: <User className="h-4 w-4" />,
                  }}
                  onSwipeRight={() => handleQuickRecharge(member.id, 100)}
                  onSwipeLeft={() => router.push(`/m/members/${member.id}`)}
                >
                  <MemberCard
                    member={member}
                    onQuickRecharge={(amount) => handleQuickRecharge(member.id, amount)}
                  />
                </SwipeableItem>
              ))}
            </div>
          )}

          {/* Loading more indicator */}
          {loading && members.length > 0 && (
            <div className="flex items-center justify-center py-4">
              <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* No more data indicator */}
          {!loading && !hasMore && members.length > 0 && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              已显示全部会员
            </div>
          )}

          {/* Infinite scroll sentinel */}
          <div ref={loadMoreRef} className="h-4" />
        </div>
      </div>
    </div>
  );
}

interface MemberCardProps {
  member: Member;
  onQuickRecharge: (amount: number) => void;
}

function MemberCard({ member, onQuickRecharge }: MemberCardProps) {
  const totalBalance = member.principalBalance + member.giftBalance;
  const totalBalanceDisplay = `¥${(totalBalance / 100).toFixed(2)}`;

  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg font-bold shadow-md shrink-0">
          {member.avatar ? (
            <img
              src={member.avatar}
              alt={member.name}
              className="w-full h-full rounded-xl object-cover"
            />
          ) : (
            member.name[0]
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
              {member.name}
            </h3>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {member.cardNo}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Phone className="h-3 w-3" />
              {member.phone}
            </div>
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
              {member.memberLevel.name}
            </span>
          </div>

          {/* Balance */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-sm">
              <CreditCard className="h-4 w-4 text-primary" />
              <span className="font-medium text-slate-900 dark:text-white">
                {totalBalanceDisplay}
              </span>
            </div>
            {member.totalConsume > 0 && (
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <TrendingUp className="h-3 w-3" />
                消费 ¥{(member.totalConsume / 100).toFixed(2)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick recharge - touch-optimized */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 dark:text-slate-500">快速充值</span>
          <div className="flex gap-2">
            {AMOUNT_PRESETS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onQuickRecharge(amount);
                }}
                className="px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-xs font-medium shadow-sm active:scale-95 transition-all min-h-[36px]"
              >
                ¥{amount}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
