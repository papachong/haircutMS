'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  getServiceItems,
  getServiceCategories,
  getStaff,
  searchMembers,
  createOrder,
  getPassCards,
  getOrderById,
  type ServiceItem,
  type ServiceCategory,
  type Staff,
  type Member,
  type OrderItemInput,
  type PassCard,
} from '../../../lib/api/orders';
import SettlementDialog from '../../../components/SettlementDialog';

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
  { value: 'member', label: '会员', icon: '1' },
  { value: 'services', label: '项目', icon: '2' },
  { value: 'confirm', label: '确认', icon: '3' },
];

export default function MobilePOSPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  // Settlement dialog state
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [showSettlementDialog, setShowSettlementDialog] = useState(false);
  const [memberPassCards, setMemberPassCards] = useState<PassCard[]>([]);

  // Resume order from holds
  const resumeOrderId = searchParams.get('resume');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.replace('/login');
      return;
    }
    loadData();
  }, [router]);

  // Resume order if coming from holds page
  useEffect(() => {
    if (resumeOrderId) {
      resumeOrder(resumeOrderId);
    }
  }, [resumeOrderId]);

  // Re-group services when categories or services change
  useEffect(() => {
    const grouped = new Map<string, ServiceItem[]>();
    categories.forEach((cat) => {
      grouped.set(cat.id, services.filter((s) => s.categoryId === cat.id));
    });
    setServicesByCategory(grouped);

    const expanded: ExpandedCategories = {};
    categories.forEach((cat) => {
      expanded[cat.id] = true;
    });
    setExpandedCategories(expanded);
  }, [categories, services]);

  const loadData = async () => {
    const [cats, staffData, allServices] = await Promise.all([
      getServiceCategories(),
      getStaff(),
      getServiceItems(),
    ]);
    setCategories(cats);
    setStaff(staffData);
    setServices(allServices);
  };

  const loadMemberPassCards = async (memberId: string) => {
    try {
      const data = await getPassCards({
        memberId,
        availableOnly: true,
      });
      setMemberPassCards(data.items);
    } catch {
      // Silently handle pass card loading failure
    }
  };

  const resumeOrder = async (orderId: string) => {
    try {
      const order = await getOrderById(orderId);
      if (order.status !== 'PENDING') {
        alert('该订单已不可恢复');
        router.replace('/m/pos');
        return;
      }

      // Reconstruct member
      const member: Member = {
        id: order.member.id,
        name: order.member.name,
        cardNo: order.member.cardNo,
        phone: order.member.phone,
        avatar: order.member.avatar ?? undefined,
        memberLevel: {
          id: '',
          ...order.member.memberLevel,
        },
        principalBalance: 0,
        giftBalance: 0,
      };
      setSelectedMember(member);
      await loadMemberPassCards(member.id);

      // Reconstruct cart from order items
      const newCart: CartItem[] = order.items.map((item) => ({
        serviceItemId: item.serviceItem.id,
        staffId: item.staff.id,
        quantity: item.quantity,
        serviceItem: {
          id: item.serviceItem.id,
          categoryId: '',
          name: item.serviceItem.name,
          price: item.serviceItem.price,
          duration: item.serviceItem.duration,
          image: item.serviceItem.image ?? undefined,
          sortOrder: 0,
          isActive: true,
        },
        staff: {
          id: item.staff.id,
          name: item.staff.name,
          phone: '',
          role: item.staff.role,
          avatar: item.staff.avatar ?? undefined,
          isActive: true,
        },
        serviceName: item.serviceName,
        staffName: item.staffName,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        discountRate: item.discountRate,
        finalPrice: item.finalPrice,
      }));

      setCart(newCart);
      setRemark(order.remark ?? '');
      setStep('confirm');
    } catch {
      alert('恢复订单失败');
      router.replace('/m/pos');
    }
  };

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

  const selectMember = async (member: Member) => {
    setSelectedMember(member);
    setMemberSearch('');
    setMemberResults([]);
    await loadMemberPassCards(member.id);
    setStep('services');
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

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

    setCart((prev) => {
      const newCart = [...prev];
      if (existingIndex >= 0) {
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          quantity: newCart[existingIndex].quantity + 1,
          subtotal: newCart[existingIndex].unitPrice * (newCart[existingIndex].quantity + 1),
          finalPrice: Math.floor(
            newCart[existingIndex].unitPrice * (newCart[existingIndex].quantity + 1) * discountRate
          ),
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

  const updateCartItemStaff = (index: number, staffId: string) => {
    const newStaff = staff.find((s) => s.id === staffId);
    if (!newStaff) return;

    setCart((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, staffId, staff: newStaff, staffName: newStaff.name } : item
      )
    );
  };

  const updateCartItemQuantity = (index: number, delta: number) => {
    setCart(
      (prev) =>
        prev
          .map((item, i) => {
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
          })
          .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedMember(null);
    setRemark('');
    setMemberPassCards([]);
    setStep('member');
  };

  const handleCreateOrder = async (status: 'PENDING' | 'SETTLED') => {
    if (!selectedMember) {
      alert('请选择会员');
      return;
    }
    if (cart.length === 0) {
      alert('请添加服务项目');
      return;
    }

    setLoading(true);
    try {
      const order = await createOrder({
        memberId: selectedMember.id,
        items: cart.map((item) => ({
          serviceItemId: item.serviceItemId,
          staffId: item.staffId,
          quantity: item.quantity,
        })),
        remark,
        status,
      });

      if (status === 'PENDING') {
        alert(`挂单成功\n订单号: ${order.orderNo}`);
        clearCart();
      } else {
        setCreatedOrderId(order.id);
        setShowSettlementDialog(true);
      }
    } catch (error: unknown) {
      alert(`创建订单失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSettleSuccess = () => {
    clearCart();
    setShowSettlementDialog(false);
    alert('结算成功！');
  };

  const payableAmount = cart.reduce((sum, item) => sum + item.finalPrice, 0);
  const originalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const discountAmount = originalAmount - payableAmount;
  const currentStepIndex = STEPS.findIndex((s) => s.value === step);
  const cartItemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 pb-safe-bottom">
      {/* Step indicator */}
      <div className="sticky top-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Holds link */}
          <button
            type="button"
            onClick={() => router.push('/m/pos-holds')}
            className="relative w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
            </svg>
          </button>

          {/* Step progress */}
          <div className="flex items-center gap-1 flex-1 mx-4">
            {STEPS.map((s, i) => (
              <div key={s.value} className="flex-1 flex items-center">
                <div className="flex items-center justify-center w-full">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      i < currentStepIndex
                        ? 'bg-blue-500 text-white'
                        : i === currentStepIndex
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-110'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {i < currentStepIndex ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      s.icon
                    )}
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-1 transition-colors ${
                      i < currentStepIndex ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Cart badge */}
          <div className="relative w-9 h-9 flex items-center justify-center">
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {cartItemCount}
              </span>
            )}
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          </div>
        </div>

        {/* Step labels */}
        <div className="flex px-4 pb-2 -mt-1">
          <div className="flex-1" />
          {STEPS.map((s, i) => (
            <div key={s.value} className="flex-1 flex items-center">
              <span
                className={`text-[10px] text-center w-full font-medium ${
                  i <= currentStepIndex
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && <div className="flex-1" />}
            </div>
          ))}
          <div className="flex-1" />
        </div>
      </div>

      {/* Step 1: Member Selection */}
      {step === 'member' && (
        <div className="p-3 sm:p-4 max-w-2xl mx-auto">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
              选择会员
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              输入手机号、姓名或卡号搜索会员
            </p>
          </div>

          <div className="relative mb-4">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => handleMemberSearch(e.target.value)}
              placeholder="搜索会员..."
              className="w-full px-4 py-3.5 pl-12 text-base bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all dark:text-white"
              autoFocus
            />
            {memberSearch && (
              <button
                type="button"
                onClick={() => {
                  setMemberSearch('');
                  setMemberResults([]);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Empty state */}
          {!memberSearch && (
            <div className="mb-4">
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-2 font-medium uppercase tracking-wider">
                快速开始
              </p>
              <div className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                输入手机号搜索会员
              </div>
            </div>
          )}

          {/* Search results */}
          <div className="space-y-3">
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              memberResults.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => selectMember(member)}
                  className="w-full p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-left active:scale-[0.98] transition-all hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-md shrink-0">
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
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-base sm:text-lg text-slate-900 dark:text-white truncate">
                        {member.name}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {member.phone}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                          {member.memberLevel.name}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {Math.round(member.memberLevel.discount * 10)}折
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {member.cardNo}
                        </span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))
            )}
            {memberResults.length === 0 && memberSearch.length >= 2 && !isSearching && (
              <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-slate-500 dark:text-slate-400">未找到匹配的会员</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Services Selection */}
      {step === 'services' && (
        <div>
          {/* Sub-header */}
          <div className="sticky top-[76px] bg-white/95 dark:bg-slate-800/95 backdrop-blur border-b border-slate-200 dark:border-slate-700 z-40">
            <div className="flex items-center px-4 py-3">
              <button
                type="button"
                onClick={() => setStep('member')}
                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 active:bg-slate-200 dark:active:bg-slate-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex-1 ml-3">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">选择服务</h1>
                {selectedMember && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedMember.name}
                    <span className="ml-1">
                      ({Math.round(selectedMember.memberLevel.discount * 10)}折)
                    </span>
                  </p>
                )}
              </div>
              {cart.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {cartItemCount}项
                  </span>
                </div>
              )}
            </div>

            {/* Category toggle buttons */}
            <div className="px-4 pb-3">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
                <button
                  type="button"
                  onClick={() => {
                    const expanded: ExpandedCategories = {};
                    categories.forEach((cat) => {
                      expanded[cat.id] = true;
                    });
                    setExpandedCategories(expanded);
                  }}
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

          {/* Services list grouped by category */}
          <div className="p-3 sm:p-4 pb-40 max-w-2xl mx-auto">
            {categories.map((category) => {
              const categoryServices = servicesByCategory.get(category.id) || [];
              if (categoryServices.length === 0) return null;

              const isExpanded = expandedCategories[category.id];
              const cartCount = cart.filter((c) =>
                categoryServices.some((s) => s.id === c.serviceItemId)
              ).length;

              return (
                <div key={category.id} className="mb-4">
                  <button
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className="w-full p-3 sm:p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between active:bg-slate-50 dark:active:bg-slate-750 transition-colors shadow-sm"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-md shrink-0">
                        {category.name[0]}
                      </div>
                      <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                        {category.name}
                      </span>
                      <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                        {categoryServices.length}
                      </span>
                      {cartCount > 0 && (
                        <span className="text-xs text-white bg-blue-500 px-2 py-0.5 rounded-full">
                          {cartCount}
                        </span>
                      )}
                    </div>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${
                        isExpanded
                          ? 'rotate-180 bg-blue-100 dark:bg-blue-900/30 text-blue-500'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      {categoryServices.map((service) => {
                        const inCart = cart.filter((c) => c.serviceItemId === service.id);
                        const qty = inCart.reduce((s, c) => s + c.quantity, 0);

                        return (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => addToCart(service)}
                            className="bg-white dark:bg-slate-800 rounded-2xl p-3 sm:p-4 text-left border border-slate-200 dark:border-slate-700 active:scale-[0.98] transition-all hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg group relative overflow-hidden"
                          >
                            {qty > 0 && (
                              <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                                {qty}
                              </div>
                            )}
                            {service.image && (
                              <div className="w-full h-24 sm:h-32 rounded-xl overflow-hidden mb-2 sm:mb-3 bg-slate-100 dark:bg-slate-700">
                                <img
                                  src={service.image}
                                  alt={service.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                            )}
                            <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-white mb-1 pr-8">
                              {service.name}
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                {service.duration}分钟
                              </span>
                              <span className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">
                                {(service.price / 100).toFixed(0)}元
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom cart bar */}
          {cart.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 pb-safe-bottom shadow-2xl z-50">
              <div className="max-w-2xl mx-auto flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    已选 {cartItemCount} 项
                  </div>
                  <div className="font-bold text-lg text-slate-900 dark:text-white">
                    {(payableAmount / 100).toFixed(2)}元
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('confirm')}
                  className="flex-1 py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-bold text-base shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  下一步
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Confirm Order */}
      {step === 'confirm' && (
        <div className="p-3 sm:p-4 pb-8 max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <button
              type="button"
              onClick={() => setStep('services')}
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 active:bg-slate-200 dark:active:bg-slate-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">确认订单</h1>
          </div>

          {/* Member info card */}
          {selectedMember && (
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-4 mb-4 text-white shadow-lg shadow-blue-500/20">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/20 flex items-center justify-center text-xl sm:text-2xl font-bold backdrop-blur shrink-0">
                  {selectedMember.avatar ? (
                    <img
                      src={selectedMember.avatar}
                      alt={selectedMember.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    selectedMember.name[0]
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-base sm:text-lg truncate">{selectedMember.name}</div>
                  <div className="text-white/80 text-xs sm:text-sm truncate">{selectedMember.phone}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-white/20 rounded-full">
                      {selectedMember.memberLevel.name}
                    </span>
                    <span className="text-xs sm:text-sm text-white/80">
                      {Math.round(selectedMember.memberLevel.discount * 10)}折
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cart items */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 mb-4 border border-slate-200 dark:border-slate-700 shadow-sm">
            <h2 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold">
                {cartItemCount}
              </span>
              服务项目
            </h2>
            <div className="space-y-3">
              {cart.map((item, index) => (
                <div
                  key={`${item.serviceItemId}-${item.staffId}-${index}`}
                  className="border-b border-slate-100 dark:border-slate-700 pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      {item.serviceName}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFromCart(index)}
                      className="text-red-500 text-xs px-2 py-1 rounded-full bg-red-50 dark:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/40 transition-colors shrink-0"
                    >
                      删除
                    </button>
                  </div>

                  <div className="mb-2">
                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                      服务员工
                    </label>
                    <select
                      value={item.staffId}
                      onChange={(e) => updateCartItemStaff(index, e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white"
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
                        className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-lg active:bg-slate-200 dark:active:bg-slate-600 transition-colors"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-bold text-slate-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartItemQuantity(index, 1)}
                        className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold text-lg active:bg-blue-600 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <div className="font-bold text-base sm:text-lg text-blue-600 dark:text-blue-400">
                      {(item.finalPrice / 100).toFixed(2)}元
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Remark */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 mb-4 border border-slate-200 dark:border-slate-700 shadow-sm">
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-2 block font-medium">
              订单备注
            </label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="如有特殊需求请在此说明..."
              className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl resize-none focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white text-sm"
              rows={2}
            />
          </div>

          {/* Amount summary */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 mb-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">原价</span>
                <span className="text-slate-900 dark:text-white">
                  {(originalAmount / 100).toFixed(2)}元
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>会员折扣 ({selectedMember?.memberLevel?.name})</span>
                  <span>-{(discountAmount / 100).toFixed(2)}元</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-900 dark:text-white">应付金额</span>
                <span className="text-blue-600 dark:text-blue-400">
                  {(payableAmount / 100).toFixed(2)}元
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleCreateOrder('PENDING')}
              disabled={loading || cart.length === 0 || !selectedMember}
              className="py-3.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed active:bg-slate-200 dark:active:bg-slate-600 transition-colors"
            >
              {loading ? '处理中...' : '挂单'}
            </button>
            <button
              type="button"
              onClick={() => handleCreateOrder('SETTLED')}
              disabled={loading || cart.length === 0 || !selectedMember}
              className="py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-bold text-base shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
            >
              {loading ? '处理中...' : '结算'}
            </button>
          </div>
        </div>
      )}

      {/* Settlement Dialog */}
      {createdOrderId && selectedMember && (
        <SettlementDialog
          isOpen={showSettlementDialog}
          onClose={() => setShowSettlementDialog(false)}
          orderId={createdOrderId}
          originalAmount={originalAmount}
          discountAmount={discountAmount}
          payableAmount={payableAmount}
          member={selectedMember}
          memberPassCards={memberPassCards}
          onSettleSuccess={handleSettleSuccess}
        />
      )}
    </div>
  );
}
