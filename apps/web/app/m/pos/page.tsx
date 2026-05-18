'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getServiceItems,
  getServiceCategories,
  getStaff,
  searchMembers,
  createOrder,
  type ServiceItem,
  type ServiceCategory,
  type Staff,
  type Member,
  type OrderItemInput,
} from '../../../lib/api/orders';

interface CartItem extends OrderItemInput {
  serviceItem: ServiceItem;
  staff: Staff;
  serviceName: string;
  staffName: string;
  unitPrice: number;
  subtotal: number;
  discountRate: number;
  finalPrice: number;
}

type Step = 'member' | 'services' | 'confirm';

interface ExpandedCategories {
  [key: string]: boolean;
}

const STEPS: Array<{ value: Step; label: string; icon: string }> = [
  { value: 'member', label: '会员', icon: '👤' },
  { value: 'services', label: '项目', icon: '💇' },
  { value: 'confirm', label: '确认', icon: '✓' },
];

export default function MobilePOSPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('member');
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [servicesByCategory, setServicesByCategory] = useState<Map<string, ServiceItem[]>>(new Map());
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberResults, setMemberResults] = useState<Member[]>([]);
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<ExpandedCategories>({});

  // 获取数据
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.replace('/login');
      return;
    }
    loadData();
  }, [router]);

  // 加载服务数据
  useEffect(() => {
    loadServices();
  }, [step]);

  // 搜索防抖
  const handleMemberSearch = useCallback(async (value: string) => {
    setMemberSearch(value);
    if (value.length >= 2) {
      setIsSearching(true);
      try {
        const results = await searchMembers(value);
        setMemberResults(results);
      } finally {
        setIsSearching(false);
      }
    } else {
      setMemberResults([]);
    }
  }, []);

  // 加载初始数据
  const loadData = async () => {
    const [cats, staffData] = await Promise.all([
      getServiceCategories(),
      getStaff(),
    ]);
    setCategories(cats);
    setStaff(staffData);
  };

  // 加载服务项目（按分类分组）
  const loadServices = async () => {
    const allServices = await getServiceItems();
    setServices(allServices);

    // 按分类分组服务
    const grouped = new Map<string, ServiceItem[]>();
    categories.forEach(cat => {
      grouped.set(cat.id, allServices.filter(s => s.categoryId === cat.id));
    });

    // 默认展开所有分类
    const expanded: ExpandedCategories = {};
    categories.forEach(cat => expanded[cat.id] = true);
    setExpandedCategories(expanded);
    setServicesByCategory(grouped);
  };

  // 选择会员
  const selectMember = (member: Member) => {
    setSelectedMember(member);
    setMemberSearch('');
    setMemberResults([]);
    setStep('services');
  };

  // 切换分类展开/折叠
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // 添加到购物车
  const addToCart = (serviceItem: ServiceItem) => {
    const defaultStaff = staff[0];
    if (!defaultStaff) {
      return;
    }

    const existingIndex = cart.findIndex(
      (item) => item.serviceItemId === serviceItem.id && item.staffId === defaultStaff.id
    );

    const discountRate = selectedMember?.memberLevel?.discount ?? 1;
    const unitPrice = serviceItem.price;
    const quantity = 1;
    const subtotal = unitPrice * quantity;
    const finalPrice = Math.floor(subtotal * discountRate);

    setCart(prev => {
      const newCart = [...prev];
      if (existingIndex >= 0) {
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          quantity: newCart[existingIndex].quantity + 1,
          subtotal: newCart[existingIndex].unitPrice * (newCart[existingIndex].quantity + 1),
          finalPrice: Math.floor(newCart[existingIndex].unitPrice * (newCart[existingIndex].quantity + 1) * discountRate),
        };
      } else {
        newCart.push({
          serviceItemId: serviceItem.id,
          staffId: defaultStaff.id,
          quantity,
          serviceItem,
          staff: defaultStaff,
          serviceName: serviceItem.name,
          staffName: defaultStaff.name,
          unitPrice,
          subtotal,
          discountRate,
          finalPrice,
        });
      }
      return newCart;
    });
  };

  // 更新购物车项目的员工
  const updateCartItemStaff = (index: number, staffId: string) => {
    const newStaff = staff.find((s) => s.id === staffId);
    if (!newStaff) return;

    setCart(prev => prev.map((item, i) =>
      i === index ? { ...item, staffId, staff: newStaff, staffName: newStaff.name } : item
    ));
  };

  // 更新购物车项目数量
  const updateCartItemQuantity = (index: number, delta: number) => {
    setCart(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const newQuantity = item.quantity + delta;
      if (newQuantity <= 0) return null;
      const discountRate = selectedMember?.memberLevel?.discount ?? 1;
      return {
        ...item,
        quantity: newQuantity,
        subtotal: item.unitPrice * newQuantity,
        finalPrice: Math.floor(item.unitPrice * newQuantity * discountRate),
      };
    }).filter(Boolean) as CartItem[]);
  };

  // 从购物车移除
  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  // 创建订单
  const handleCreateOrder = async (status: 'PENDING' | 'SETTLED') => {
    setLoading(true);
    try {
      const order = await createOrder({
        memberId: selectedMember!.id,
        items: cart.map((item) => ({
          serviceItemId: item.serviceItemId,
          staffId: item.staffId,
          quantity: item.quantity,
        })),
        remark,
        status,
      });

      alert(`订单创建成功\n订单号: ${order.orderNo}`);
      router.push('/m');
    } catch (error: unknown) {
      alert(`创建订单失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const payableAmount = cart.reduce((sum, item) => sum + item.finalPrice, 0);
  const originalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const currentStepIndex = STEPS.findIndex(s => s.value === step);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 pb-safe-bottom">
      {/* 步骤进度条 */}
      <div className="sticky top-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          {STEPS.map((s, i) => (
            <div key={s.value} className="flex-1 flex items-center">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-medium transition-all ${
                    i <= currentStepIndex
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {i < currentStepIndex ? '✓' : s.icon}
                </div>
                <span
                  className={`text-xs mt-1 font-medium ${
                    i <= currentStepIndex
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 transition-colors ${
                    i < currentStepIndex ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {step === 'member' && (
        <div className="p-3 sm:p-4 max-w-2xl mx-auto">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
              选择会员
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              搜索姓名、手机号或卡号来选择会员
            </p>
          </div>

          <div className="relative mb-4">
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => handleMemberSearch(e.target.value)}
              placeholder="搜索会员..."
              className="w-full px-4 py-3 sm:py-4 pl-12 text-base sm:text-lg bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all dark:text-white"
              autoFocus
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
            {memberSearch && (
              <button
                type="button"
                onClick={() => {
                  setMemberSearch('');
                  setMemberResults([]);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            )}
          </div>

          {/* 常用会员快捷入口 */}
          {!memberSearch && (
            <div className="mb-4">
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-2 font-medium uppercase tracking-wider">
                最近服务
              </p>
              <div className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                输入关键词搜索会员
              </div>
            </div>
          )}

          <div className="space-y-3">
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              memberResults.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => selectMember(member)}
                  className="w-full p-4 bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 text-left active:scale-[0.98] transition-all hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-md shrink-0">
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        member.name[0]
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-base sm:text-lg text-slate-900 dark:text-white truncate">
                        {member.name}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {member.cardNo} · {member.phone}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                          {member.memberLevel.name}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {Math.round(member.memberLevel.discount * 10)}折
                        </span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0">
                      →
                    </div>
                  </div>
                </button>
              ))
            )}
            {memberResults.length === 0 && memberSearch.length >= 2 && !isSearching && (
              <div className="text-center py-12">
                <span className="text-4xl mb-3 block">📭</span>
                <p className="text-slate-500 dark:text-slate-400">未找到匹配的会员</p>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 'services' && (
        <div>
          {/* 顶部导航栏 */}
          <div className="sticky top-[68px] bg-white/95 dark:bg-slate-800/95 backdrop-blur border-b border-slate-200 dark:border-slate-700 z-40">
            <div className="flex items-center px-4 py-3">
              <button
                type="button"
                onClick={() => setStep('member')}
                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 active:bg-slate-200 dark:active:bg-slate-600 transition-colors"
              >
                ←
              </button>
              <div className="flex-1 ml-3">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">选择服务</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">{selectedMember?.name}</p>
              </div>
              {cart.length > 0 && (
                <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)}
                </div>
              )}
            </div>

            {/* 分类标签 */}
            <div className="px-4 pb-3">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
                <button
                  type="button"
                  onClick={() => setExpandedCategories(prev => {
                    const newExpanded = {};
                    categories.forEach(cat => newExpanded[cat.id] = true);
                    return newExpanded;
                  })}
                  className="px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap bg-blue-500 text-white shadow-md shadow-blue-500/30"
                >
                  全部展开
                </button>
                <button
                  type="button"
                  onClick={() => setExpandedCategories({})}
                  className="px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                >
                  全部折叠
                </button>
              </div>
            </div>
          </div>

          {/* 服务项目列表 */}
          <div className="p-3 sm:p-4 pb-40 max-w-2xl mx-auto">
            {categories.map((category) => {
              const categoryServices = servicesByCategory.get(category.id) || [];
              if (categoryServices.length === 0) return null;

              const isExpanded = expandedCategories[category.id];

              return (
                <div key={category.id} className="mb-4">
                  <button
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className="w-full p-3 sm:p-4 bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between active:bg-slate-50 dark:active:bg-slate-750 transition-colors shadow-sm"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-md shrink-0">
                        {category.name[0]}
                      </div>
                      <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">{category.name}</span>
                      <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                        {categoryServices.length}
                      </span>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${isExpanded ? 'rotate-180 bg-blue-100 dark:bg-blue-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
                      ▼
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      {categoryServices.map((service) => (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => addToCart(service)}
                          className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-left border border-slate-200 dark:border-slate-700 active:scale-[0.98] transition-all hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg group"
                        >
                          {service.image && (
                            <div className="w-full h-24 sm:h-32 rounded-xl overflow-hidden mb-2 sm:mb-3 bg-slate-100 dark:bg-slate-700">
                              <img
                                src={service.image}
                                alt={service.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                          <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-white mb-1">{service.name}</div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                              ⏱ {service.duration}分钟
                            </span>
                            <span className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">
                              ¥{(service.price / 100).toFixed(2)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 底部购物车栏 */}
          {cart.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 pb-safe-bottom shadow-2xl z-50">
              <div className="max-w-2xl mx-auto">
                <button
                  type="button"
                  onClick={() => setStep('confirm')}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <span>下一步</span>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                    ¥{(payableAmount / 100).toFixed(2)}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'confirm' && (
        <div className="p-3 sm:p-4 pb-40 max-w-2xl mx-auto">
          {/* 顶部导航栏 */}
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <button
              type="button"
              onClick={() => setStep('services')}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 active:bg-slate-200 dark:active:bg-slate-600 transition-colors"
            >
              ←
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">确认订单</h1>
          </div>

          {/* 会员信息卡片 */}
          {selectedMember && (
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 text-white shadow-lg shadow-blue-500/20">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/20 flex items-center justify-center text-xl sm:text-2xl font-bold backdrop-blur shrink-0">
                  {selectedMember.avatar ? (
                    <img src={selectedMember.avatar} alt={selectedMember.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    selectedMember.name[0]
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-base sm:text-lg truncate">{selectedMember.name}</div>
                  <div className="text-white/80 text-xs sm:text-sm truncate">{selectedMember.cardNo}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-white/20 rounded-full">
                      {selectedMember.memberLevel.name}
                    </span>
                    <span className="text-xs sm:text-sm text-white/80">{Math.round(selectedMember.memberLevel.discount * 10)}折</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 服务项目列表 */}
          <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 border border-slate-200 dark:border-slate-700 shadow-sm">
            <h2 className="font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm">💇</span>
              服务项目
            </h2>
            <div className="space-y-3 sm:space-y-4">
              {cart.map((item, index) => (
                <div key={`${item.serviceItemId}-${item.staffId}`} className="border-b border-slate-100 dark:border-slate-700 pb-3 sm:pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-2 sm:mb-3">
                    <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">{item.serviceName}</span>
                    <button
                      type="button"
                      onClick={() => removeFromCart(index)}
                      className="text-red-500 text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full bg-red-50 dark:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/40 transition-colors shrink-0"
                    >
                      删除
                    </button>
                  </div>

                  <div className="mb-2 sm:mb-3">
                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">服务员工</label>
                    <select
                      value={item.staffId}
                      onChange={(e) => updateCartItemStaff(index, e.target.value)}
                      className="w-full px-3 py-2 sm:py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white"
                    >
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateCartItemQuantity(index, -1)}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-base sm:text-lg active:bg-slate-200 dark:active:bg-slate-600 transition-colors"
                      >
                        −
                      </button>
                      <span className="w-7 sm:w-8 text-center font-bold text-slate-900 dark:text-white">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateCartItemQuantity(index, 1)}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold text-base sm:text-lg active:bg-blue-600 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <div className="font-bold text-base sm:text-lg text-blue-600 dark:text-blue-400">
                      ¥{(item.finalPrice / 100).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 备注输入 */}
          <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 border border-slate-200 dark:border-slate-700 shadow-sm">
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-2 block">订单备注</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="如有特殊需求请在此说明..."
              className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl resize-none focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white"
              rows={3}
            />
          </div>

          {/* 金额明细 */}
          <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-slate-600 dark:text-slate-400">原价</span>
                <span className="text-slate-900 dark:text-white">¥{(originalAmount / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm text-green-600 dark:text-green-400">
                <span>会员折扣</span>
                <span>-¥{((originalAmount - payableAmount) / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-base sm:text-lg pt-2 sm:pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-900 dark:text-white">应付金额</span>
                <span className="text-blue-600 dark:text-blue-400">¥{(payableAmount / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => handleCreateOrder('PENDING')}
              disabled={loading || cart.length === 0}
              className="py-3 sm:py-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed active:bg-slate-200 dark:active:bg-slate-600 transition-colors"
            >
              {loading ? '处理中...' : '挂单'}
            </button>
            <button
              type="button"
              onClick={() => handleCreateOrder('SETTLED')}
              disabled={loading || cart.length === 0}
              className="py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
            >
              {loading ? '处理中...' : '结算'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}