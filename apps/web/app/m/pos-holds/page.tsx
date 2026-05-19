'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getOrders, cancelOrder, type Order } from '../../../lib/api/orders';

export default function HoldsPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.replace('/login');
      return;
    }
    loadOrders();
  }, [router]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { items, pagination } = await getOrders({ status: 'PENDING', pageSize: 50 });
      setOrders(items);
      setTotal(pagination.total);
    } catch (error) {
      alert(`加载挂单失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResume = (order: Order) => {
    router.push(`/m/pos?resume=${order.id}`);
  };

  const handleCancel = async (orderId: string, orderNo: string) => {
    if (!confirm(`确认取消挂单 ${orderNo.slice(-8)}?`)) {
      return;
    }

    setCancellingId(orderId);
    try {
      await cancelOrder(orderId, '手动取消挂单');
      await loadOrders();
    } catch (error) {
      alert(`取消挂单失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setCancellingId(null);
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    return date.toLocaleDateString('zh-CN');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700 z-10">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => router.push('/m/pos')}
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">挂单列表</h1>
          <span className="ml-auto bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
            {total} 单
          </span>
        </div>
      </div>

      <div className="p-3 sm:p-4 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center py-16">
            <div className="w-10 h-10 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <div className="text-slate-500 dark:text-slate-400 text-sm">加载中...</div>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <p className="text-slate-500 dark:text-slate-400 text-base mb-2">暂无挂单</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mb-6">可以到收银台创建新订单并挂单</p>
            <button
              type="button"
              onClick={() => router.push('/m/pos')}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all"
            >
              开始收银
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
              const isCancelling = cancellingId === order.id;

              return (
                <div
                  key={order.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden"
                >
                  {/* Order header */}
                  <div className="p-4 pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md text-xs font-mono font-medium">
                          {order.orderNo.slice(-8)}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {formatRelativeTime(order.createdAt)} {formatTime(order.createdAt)}
                        </span>
                      </div>
                      <div className="font-bold text-lg text-blue-600 dark:text-blue-400">
                        {(order.payableAmount / 100).toFixed(2)}元
                      </div>
                    </div>

                    {/* Member info */}
                    {order.member && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {order.member.name[0]}
                        </div>
                        <span className="font-medium text-sm text-slate-900 dark:text-white">
                          {order.member.name}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {order.member.phone}
                        </span>
                        {order.member.memberLevel && (
                          <span className="text-xs text-blue-500 dark:text-blue-400">
                            {order.member.memberLevel.name}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Items preview */}
                  <div className="px-4 pb-3">
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                      {order.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex justify-between text-sm py-1">
                          <span className="text-slate-600 dark:text-slate-300 flex-1">
                            {item.serviceName}
                            <span className="text-slate-400 dark:text-slate-500 ml-1">
                              x{item.quantity}
                            </span>
                            <span className="text-slate-400 dark:text-slate-500 ml-1">
                              - {item.staffName}
                            </span>
                          </span>
                          <span className="text-slate-900 dark:text-white font-medium ml-2">
                            {(item.finalPrice / 100).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="text-xs text-slate-400 dark:text-slate-500 pt-1">
                          还有 {order.items.length - 3} 个项目...
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 mt-1 border-t border-slate-200 dark:border-slate-600">
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          共 {itemCount} 项
                        </span>
                        {order.discountAmount > 0 && (
                          <span className="text-xs text-green-500">
                            已优惠 {(order.discountAmount / 100).toFixed(2)}元
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Remark */}
                  {order.remark && (
                    <div className="px-4 pb-2">
                      <div className="text-xs text-slate-400 dark:text-slate-500 italic bg-slate-50 dark:bg-slate-700/50 rounded-lg px-3 py-1.5">
                        {order.remark}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="px-4 pb-4 pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleResume(order)}
                      className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      恢复结算
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancel(order.id, order.orderNo)}
                      disabled={isCancelling}
                      className="px-5 py-3 bg-slate-100 dark:bg-slate-700 text-red-500 dark:text-red-400 rounded-xl font-bold text-sm disabled:opacity-50 active:bg-slate-200 dark:active:bg-slate-600 transition-colors flex items-center justify-center gap-1"
                    >
                      {isCancelling ? (
                        <>
                          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          取消中
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          取消
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
