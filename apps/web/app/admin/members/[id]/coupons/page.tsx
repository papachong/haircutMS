'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getMemberCoupons, getMemberCouponSummary, type CouponInstance } from '@/lib/api/coupon';

export default function MemberCouponsPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;

  const [coupons, setCoupons] = useState<CouponInstance[]>([]);
  const [summary, setSummary] = useState<{ available: number; used: number; expired: number; recentCoupons: CouponInstance[] } | null>(null);
  const [statusFilter, setStatusFilter] = useState<'AVAILABLE' | 'USED' | 'EXPIRED' | undefined>('AVAILABLE');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadData();
  }, [memberId, statusFilter, page]);

  async function loadData() {
    setLoading(true);
    try {
      const [couponsData, summaryData] = await Promise.all([
        getMemberCoupons(memberId, { status: statusFilter, page, pageSize: 20 }),
        getMemberCouponSummary(memberId),
      ]);
      setCoupons(couponsData.items);
      setTotal(couponsData.pagination.total);
      setSummary(summaryData);
    } catch (e: unknown) {
      console.error(e);
      alert(`加载失败: ${e instanceof Error ? e.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'AVAILABLE':
        return '可用';
      case 'USED':
        return '已使用';
      case 'EXPIRED':
        return '已过期';
      default:
        return status;
    }
  }

  function getStatusClass(status: string) {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-primary/10 text-primary';
      case 'USED':
        return 'bg-muted text-muted-foreground';
      case 'EXPIRED':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">会员优惠券</h1>
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-2 text-sm text-muted-foreground hover:text-primary"
          >
            ← 返回
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border bg-card p-4 text-center">
            <div className="text-2xl font-bold text-primary">{summary.available}</div>
            <div className="text-sm text-muted-foreground">可用</div>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center">
            <div className="text-2xl font-bold text-muted-foreground">{summary.used}</div>
            <div className="text-sm text-muted-foreground">已使用</div>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center">
            <div className="text-2xl font-bold text-destructive">{summary.expired}</div>
            <div className="text-sm text-muted-foreground">已过期</div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter('AVAILABLE')}
          className={`px-4 py-2 rounded-lg text-sm ${statusFilter === 'AVAILABLE' ? 'bg-primary text-primary-foreground' : 'bg-accent'}`}
        >
          可用
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('USED')}
          className={`px-4 py-2 rounded-lg text-sm ${statusFilter === 'USED' ? 'bg-primary text-primary-foreground' : 'bg-accent'}`}
        >
          已使用
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('EXPIRED')}
          className={`px-4 py-2 rounded-lg text-sm ${statusFilter === 'EXPIRED' ? 'bg-primary text-primary-foreground' : 'bg-accent'}`}
        >
          已过期
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">加载中...</div>
      ) : coupons.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          {statusFilter === 'AVAILABLE' ? '暂无可用优惠券' : '暂无相关优惠券'}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className={`rounded-xl border bg-card p-5 ${coupon.status === 'AVAILABLE' ? 'border-primary/20' : 'opacity-70'}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="font-bold text-2xl text-primary">
                  {coupon.template?.type === 'FIXED'
                    ? `-¥${((coupon.template?.discount ?? 0) / 100).toFixed(2)}`
                    : `${(coupon.template?.discount ?? 0) / 10}折`}
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusClass(coupon.status)}`}>
                  {getStatusLabel(coupon.status)}
                </span>
              </div>

              <h3 className="font-semibold mb-2">{coupon.template?.name ?? '未知优惠券'}</h3>

              <div className="space-y-1 text-sm">
                <div className="text-muted-foreground">
                  {coupon.template?.type === 'FIXED'
                    ? `满 ¥${((coupon.template?.threshold ?? 0) / 100).toFixed(2)} 可用`
                    : `满 ¥${((coupon.template?.threshold ?? 0) / 100).toFixed(2)} 打 ${(coupon.template?.discount ?? 0) / 10} 折`}
                </div>
                <div className="text-muted-foreground text-xs">
                  有效期至 {new Date(coupon.expiresAt).toLocaleDateString('zh-CN')}
                </div>
                {coupon.status === 'USED' && coupon.usedAt && (
                  <div className="text-muted-foreground text-xs">
                    使用时间 {new Date(coupon.usedAt).toLocaleString('zh-CN')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {total > 20 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">共 {total} 条</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-secondary disabled:opacity-50"
            >
              上一页
            </button>
            <span className="px-3 py-2 text-sm">第 {page} 页</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 20 >= total}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-secondary disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}