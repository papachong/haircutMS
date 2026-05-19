'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  User,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  Trash2,
  Clock,
  ShoppingCart,
  ClipboardList,
  X,
  RefreshCw,
  Tag,
  Wallet,
} from 'lucide-react';
import {
  getServiceItems,
  getServiceCategories,
  getStaff,
  searchMembers,
  createOrder,
  getPendingOrders,
  getOrderById,
  updateOrder,
  getPassCards,
  type ServiceItem,
  type ServiceCategory,
  type Staff,
  type Member,
  type OrderItemInput,
  type PassCard,
  type Order,
} from '../../../lib/api/orders';
import SettlementDialog from '../../../components/SettlementDialog';

// ─── Types ───────────────────────────────────────────────────────────────────

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

interface PendingOrderItem {
  id: string;
  orderNo: string;
  memberName: string;
  memberPhone: string;
  createdAt: string;
  itemCount: number;
  totalAmount: number;
  memberId?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

function formatDiscountLabel(discount: number): string {
  return discount >= 1 ? '无折扣' : `${Math.round(discount * 100) / 10}折`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  return `${Math.floor(hours / 24)}天前`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function POSPage() {
  // Data state
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  // UI state
  const [memberSearch, setMemberSearch] = useState('');
  const [memberResults, setMemberResults] = useState<Member[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [showSettlementDialog, setShowSettlementDialog] = useState(false);
  const [memberPassCards, setMemberPassCards] = useState<PassCard[]>([]);

  // Pending orders panel
  const [showPendingPanel, setShowPendingPanel] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<PendingOrderItem[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);

  // Member search debounce
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Data Loading ────────────────────────────────────────────────────────

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const [cats, staffData] = await Promise.all([
      getServiceCategories(),
      getStaff(),
    ]);
    setCategories(cats);
    setStaff(staffData.filter((s) => s.isActive));
    const allServices = await getServiceItems();
    setServices(allServices);
    // Expand all categories by default
    setExpandedCategories(new Set(cats.map((c) => c.id)));
  };

  // ─── Member Search ───────────────────────────────────────────────────────

  const handleMemberSearch = useCallback((value: string) => {
    setMemberSearch(value);
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    if (value.length < 2) {
      setMemberResults([]);
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchMembers(value);
        setMemberResults(results);
      } catch {
        setMemberResults([]);
      }
    }, 300);
  }, []);

  const loadMemberPassCards = async (memberId: string) => {
    try {
      const data = await getPassCards({
        memberId,
        availableOnly: true,
      });
      setMemberPassCards(data.items);
    } catch {
      setMemberPassCards([]);
    }
  };

  const selectMember = async (member: Member) => {
    setSelectedMember(member);
    setMemberSearch('');
    setMemberResults([]);
    await loadMemberPassCards(member.id);
    // Recalculate cart prices with new member discount
    recalculateCart(member, cart);
  };

  const clearMember = () => {
    setSelectedMember(null);
    setMemberPassCards([]);
    recalculateCart(null, cart);
  };

  // ─── Cart Operations ─────────────────────────────────────────────────────

  const recalculateCart = (member: Member | null, currentCart: CartItem[]) => {
    const discountRate = member?.memberLevel?.discount ?? 1;
    return currentCart.map((item) => ({
      ...item,
      discountRate,
      finalPrice: Math.floor(item.subtotal * discountRate),
    }));
  };

  const addToCart = (serviceItem: ServiceItem) => {
    const defaultStaff = staff[0];
    if (!defaultStaff) {
      alert('请先添加员工');
      return;
    }

    const discountRate = selectedMember?.memberLevel?.discount ?? 1;
    const unitPrice = serviceItem.price;
    const quantity = 1;
    const subtotal = unitPrice * quantity;

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.serviceItemId === serviceItem.id &&
          item.staffId === defaultStaff.id,
      );

      if (existingIndex >= 0) {
        return prev.map((item, i) => {
          if (i !== existingIndex) return item;
          const newQuantity = item.quantity + 1;
          const newSubtotal = unitPrice * newQuantity;
          return {
            ...item,
            quantity: newQuantity,
            subtotal: newSubtotal,
            finalPrice: Math.floor(newSubtotal * discountRate),
          };
        });
      }

      return [
        ...prev,
        {
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
          finalPrice: Math.floor(subtotal * discountRate),
        },
      ];
    });
  };

  const updateCartItemStaff = (index: number, staffId: string) => {
    const newStaff = staff.find((s) => s.id === staffId);
    if (!newStaff) return;

    setCart((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        return {
          ...item,
          staffId,
          staff: newStaff,
          staffName: newStaff.name,
        };
      }),
    );
  };

  const updateCartItemQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const result = prev.flatMap((item, i) => {
        if (i !== index) return [item];
        const newQuantity = item.quantity + delta;
        if (newQuantity <= 0) return [];
        const discountRate = selectedMember?.memberLevel?.discount ?? 1;
        const newSubtotal = item.unitPrice * newQuantity;
        return [
          {
            ...item,
            quantity: newQuantity,
            subtotal: newSubtotal,
            finalPrice: Math.floor(newSubtotal * discountRate),
          },
        ];
      });
      return result;
    });
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedMember(null);
    setMemberPassCards([]);
    setRemark('');
    setCreatedOrderId(null);
  };

  // ─── Category Toggle ─────────────────────────────────────────────────────

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const expandAllCategories = () => {
    setExpandedCategories(new Set(categories.map((c) => c.id)));
  };

  const collapseAllCategories = () => {
    setExpandedCategories(new Set());
  };

  // ─── Pending Orders ──────────────────────────────────────────────────────

  const loadPendingOrders = async () => {
    setLoadingPending(true);
    try {
      const orders = await getPendingOrders();
      setPendingOrders(
        orders.map((o: Order) => ({
          id: o.id,
          orderNo: o.orderNo,
          memberName: o.member?.name ?? '',
          memberPhone: o.member?.phone ?? '',
          createdAt: o.createdAt,
          itemCount: o.items?.length ?? 0,
          totalAmount: o.payableAmount ?? 0,
          memberId: o.member?.id,
        })),
      );
    } catch {
      setPendingOrders([]);
    } finally {
      setLoadingPending(false);
    }
  };

  const togglePendingPanel = () => {
    const next = !showPendingPanel;
    setShowPendingPanel(next);
    if (next) {
      loadPendingOrders();
    }
  };

  const restorePendingOrder = async (orderId: string) => {
    try {
      const order = await getOrderById(orderId);
      // Restore member
      if (order.member) {
        const memberData: Member = {
          id: order.member.id,
          name: order.member.name,
          cardNo: order.member.cardNo,
          phone: order.member.phone ?? '',
          avatar: order.member.avatar ?? undefined,
          memberLevel: {
            id: '',
            name: order.member.memberLevel.name,
            discount: order.member.memberLevel.discount,
          },
          principalBalance: 0,
          giftBalance: 0,
        };
        setSelectedMember(memberData);
        await loadMemberPassCards(memberData.id);
      }

      // Restore cart items
      const restoredCart: CartItem[] = (order.items ?? []).map((item) => ({
        serviceItemId: item.serviceItem?.id ?? '',
        staffId: item.staff?.id ?? '',
        quantity: item.quantity,
        serviceItem: {
          id: item.serviceItem?.id ?? '',
          categoryId: '',
          name: item.serviceItem?.name ?? item.serviceName,
          price: item.serviceItem?.price ?? item.unitPrice,
          duration: item.serviceItem?.duration ?? 0,
          sortOrder: 0,
          isActive: true,
        },
        staff: {
          id: item.staff?.id ?? '',
          name: item.staff?.name ?? item.staffName,
          phone: '',
          role: item.staff?.role ?? '',
          isActive: true,
        },
        serviceName: item.serviceItem?.name ?? item.serviceName,
        staffName: item.staff?.name ?? item.staffName,
        unitPrice: item.serviceItem?.price ?? item.unitPrice,
        subtotal: (item.serviceItem?.price ?? item.unitPrice) * item.quantity,
        discountRate: order.member?.memberLevel?.discount ?? 1,
        finalPrice: item.finalPrice,
      }));

      setCart(restoredCart);
      setRemark(order.remark ?? '');
      setShowPendingPanel(false);

      // Delete the old pending order after restore
      try {
        await updateOrder(orderId, { status: 'CANCELLED', cancelReason: '恢复挂单' });
      } catch {
        // Non-critical: the order is restored either way
      }
    } catch (error) {
      alert(`恢复订单失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // ─── Order Creation ──────────────────────────────────────────────────────

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
  };

  // ─── Computed Values ─────────────────────────────────────────────────────

  const originalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const discountAmount =
    originalAmount - cart.reduce((sum, item) => sum + item.finalPrice, 0);
  const payableAmount = cart.reduce((sum, item) => sum + item.finalPrice, 0);

  // Group services by category
  const servicesByCategory = categories
    .map((cat) => ({
      category: cat,
      items: services.filter((s) => s.categoryId === cat.id),
    }))
    .filter((group) => group.items.length > 0);

  // Uncategorised services
  const uncategorizedServices = services.filter(
    (s) => !categories.some((c) => c.id === s.categoryId),
  );

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      {/* Settlement Dialog */}
      {createdOrderId && (
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

      {/* Pending Orders Side Panel */}
      {showPendingPanel && (
        <PendingOrdersPanel
          orders={pendingOrders}
          loading={loadingPending}
          onRefresh={loadPendingOrders}
          onRestore={restorePendingOrder}
          onClose={() => setShowPendingPanel(false)}
        />
      )}

      <div className="flex h-[calc(100vh-4rem)] bg-background">
        {/* ─── Left Panel: Member Info ─────────────────────────────────── */}
        <aside className="hidden lg:flex w-72 xl:w-80 flex-col border-r bg-card shrink-0">
          <MemberPanel
            member={selectedMember}
            memberSearch={memberSearch}
            memberResults={memberResults}
            onSearch={handleMemberSearch}
            onSelectMember={selectMember}
            onClearMember={clearMember}
            memberPassCards={memberPassCards}
          />
        </aside>

        {/* ─── Center Panel: Service Selection ─────────────────────────── */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b px-4 py-2 bg-card">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm">服务项目</h2>
              <span className="text-xs text-muted-foreground">
                {services.length}项
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={expandAllCategories}
                className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground rounded hover:bg-accent"
              >
                全部展开
              </button>
              <button
                type="button"
                onClick={collapseAllCategories}
                className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground rounded hover:bg-accent"
              >
                全部折叠
              </button>
              <div className="w-px h-4 bg-border mx-1" />
              <button
                type="button"
                onClick={togglePendingPanel}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border hover:bg-accent relative"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                挂单
                {pendingOrders.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {pendingOrders.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Service Grid */}
          <div className="flex-1 overflow-auto">
            <div className="p-4 space-y-3">
              {servicesByCategory.map(({ category, items }) => (
                <div key={category.id} className="rounded-lg border bg-card">
                  <button
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {expandedCategories.has(category.id) ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="font-medium text-sm">{category.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({items.length})
                      </span>
                    </div>
                  </button>
                  {expandedCategories.has(category.id) && (
                    <div className="px-3 pb-3 grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2">
                      {items.map((service) => (
                        <ServiceCard
                          key={service.id}
                          service={service}
                          onAdd={() => addToCart(service)}
                          cartCount={cart.filter(
                            (c) => c.serviceItemId === service.id,
                          ).length}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {uncategorizedServices.length > 0 && (
                <div className="rounded-lg border bg-card">
                  <div className="px-4 py-2.5 flex items-center gap-2">
                    <span className="font-medium text-sm">未分类</span>
                    <span className="text-xs text-muted-foreground">
                      ({uncategorizedServices.length})
                    </span>
                  </div>
                  <div className="px-3 pb-3 grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2">
                    {uncategorizedServices.map((service) => (
                      <ServiceCard
                        key={service.id}
                        service={service}
                        onAdd={() => addToCart(service)}
                        cartCount={cart.filter(
                          (c) => c.serviceItemId === service.id,
                        ).length}
                      />
                    ))}
                  </div>
                </div>
              )}

              {services.length === 0 && (
                <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
                  暂无服务项目，请先在「服务设置」中添加
                </div>
              )}
            </div>
          </div>
        </main>

        {/* ─── Right Panel: Cart / Order Summary ───────────────────────── */}
        <aside className="hidden lg:flex w-96 xl:w-[420px] flex-col border-l bg-card shrink-0">
          <CartPanel
            cart={cart}
            staff={staff}
            selectedMember={selectedMember}
            remark={remark}
            loading={loading}
            originalAmount={originalAmount}
            discountAmount={discountAmount}
            payableAmount={payableAmount}
            onRemarkChange={setRemark}
            onUpdateStaff={updateCartItemStaff}
            onUpdateQuantity={updateCartItemQuantity}
            onRemoveItem={removeFromCart}
            onClearCart={clearCart}
            onCreateOrder={handleCreateOrder}
            onTogglePending={togglePendingPanel}
            pendingCount={pendingOrders.length}
          />
        </aside>

        {/* ─── Mobile Bottom Bar ───────────────────────────────────────── */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t p-3 flex gap-2 z-30">
          <button
            type="button"
            onClick={() => {
              // Mobile: show member picker modal
              const name = prompt('搜索会员（姓名/手机号/卡号）:');
              if (name && name.length >= 2) {
                handleMemberSearch(name);
              }
            }}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-md border text-sm"
          >
            <User className="w-4 h-4" />
            {selectedMember ? selectedMember.name : '选择会员'}
          </button>
          <button
            type="button"
            onClick={() => handleCreateOrder('SETTLED')}
            disabled={loading || cart.length === 0 || !selectedMember}
            className="flex-[2] py-2 bg-primary text-primary-foreground rounded-md font-medium text-sm disabled:opacity-50"
          >
            {loading
              ? '处理中...'
              : `结算 ¥${formatPrice(payableAmount)}`}
          </button>
          <button
            type="button"
            onClick={togglePendingPanel}
            className="px-3 py-2 rounded-md border text-sm relative"
          >
            <ClipboardList className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

// Service Card
function ServiceCard({
  service,
  onAdd,
  cartCount,
}: {
  service: ServiceItem;
  onAdd: () => void;
  cartCount: number;
}) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="relative bg-background border rounded-lg p-3 text-left hover:border-primary hover:shadow-sm transition-all group"
    >
      {cartCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-medium">
          {cartCount}
        </span>
      )}
      <div className="font-medium text-sm truncate">{service.name}</div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
          <Clock className="w-3 h-3" />
          {service.duration}分钟
        </span>
      </div>
      <div className="flex items-baseline gap-1 mt-2">
        <span className="text-base font-bold text-primary">
          ¥{formatPrice(service.price)}
        </span>
        <span className="text-[10px] text-muted-foreground">/次</span>
      </div>
    </button>
  );
}

// Member Panel (Left)
function MemberPanel({
  member,
  memberSearch,
  memberResults,
  onSearch,
  onSelectMember,
  onClearMember,
  memberPassCards,
}: {
  member: Member | null;
  memberSearch: string;
  memberResults: Member[];
  onSearch: (v: string) => void;
  onSelectMember: (m: Member) => void;
  onClearMember: () => void;
  memberPassCards: PassCard[];
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <>
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
          <User className="w-4 h-4" />
          会员信息
        </h2>
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => {
                onSearch(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => {
                if (memberResults.length > 0) setShowDropdown(true);
              }}
              placeholder="搜索姓名/手机号/卡号"
              className="w-full pl-8 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            {memberSearch && (
              <button
                type="button"
                onClick={() => {
                  onSearch('');
                  setShowDropdown(false);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-accent rounded"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>
          {showDropdown && memberResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto z-20">
              {memberResults.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    onSelectMember(m);
                    setShowDropdown(false);
                  }}
                  className="w-full px-3 py-2.5 text-left hover:bg-accent text-sm border-b last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{m.name}</span>
                    <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      {formatDiscountLabel(m.memberLevel.discount)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {m.cardNo} · {m.phone}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Member Details */}
      {member ? (
        <div className="flex-1 overflow-auto">
          <div className="p-4 bg-primary/5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {member.avatar ? (
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-11 h-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                    {member.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">
                    {member.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {member.cardNo}
                  </div>
                  <div className="text-xs text-primary mt-0.5">
                    {member.memberLevel.name} ·{' '}
                    {formatDiscountLabel(member.memberLevel.discount)}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClearMember}
                className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground"
                title="取消选择"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="bg-background rounded-md p-2.5">
                <div className="text-muted-foreground text-[10px] mb-0.5">
                  本金余额
                </div>
                <div className="font-semibold text-sm">
                  ¥{formatPrice(member.principalBalance)}
                </div>
              </div>
              <div className="bg-background rounded-md p-2.5">
                <div className="text-muted-foreground text-[10px] mb-0.5">
                  赠送余额
                </div>
                <div className="font-semibold text-sm">
                  ¥{formatPrice(member.giftBalance)}
                </div>
              </div>
            </div>

            <div className="mt-2 bg-background rounded-md p-2.5 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-muted-foreground">总余额</span>
              <span className="text-sm font-semibold text-primary ml-auto">
                ¥
                {formatPrice(member.principalBalance + member.giftBalance)}
              </span>
            </div>
          </div>

          {/* Pass Cards */}
          {memberPassCards.length > 0 && (
            <div className="p-4">
              <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                可用次卡 ({memberPassCards.length})
              </div>
              <div className="space-y-1.5">
                {memberPassCards.map((pc) => (
                  <div
                    key={pc.id}
                    className="bg-background border rounded-md px-3 py-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{pc.name}</span>
                      <span className="text-muted-foreground">
                        {pc.remainingTimes}/{pc.totalTimes}次
                      </span>
                    </div>
                    {pc.expiresAt && (
                      <div className="text-muted-foreground mt-0.5">
                        有效期至 {new Date(pc.expiresAt).toLocaleDateString('zh-CN')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-muted-foreground">
            <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">请搜索选择会员</p>
            <p className="text-xs mt-1">支持姓名、手机号、卡号搜索</p>
          </div>
        </div>
      )}
    </>
  );
}

// Cart Panel (Right)
function CartPanel({
  cart,
  staff,
  selectedMember,
  remark,
  loading,
  originalAmount,
  discountAmount,
  payableAmount,
  onRemarkChange,
  onUpdateStaff,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCreateOrder,
  onTogglePending,
  pendingCount,
}: {
  cart: CartItem[];
  staff: Staff[];
  selectedMember: Member | null;
  remark: string;
  loading: boolean;
  originalAmount: number;
  discountAmount: number;
  payableAmount: number;
  onRemarkChange: (v: string) => void;
  onUpdateStaff: (index: number, staffId: string) => void;
  onUpdateQuantity: (index: number, delta: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  onCreateOrder: (status: 'PENDING' | 'SETTLED') => void;
  onTogglePending: () => void;
  pendingCount: number;
}) {
  return (
    <>
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-sm flex items-center gap-1.5">
          <ShoppingCart className="w-4 h-4" />
          订单明细
          {cart.length > 0 && (
            <span className="text-xs text-muted-foreground font-normal">
              ({cart.length}项)
            </span>
          )}
        </h2>
        {cart.length > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            清空
          </button>
        )}
      </div>

      {/* Member badge */}
      {selectedMember && (
        <div className="px-4 py-2 border-b bg-primary/5 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
            {selectedMember.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium truncate">
              {selectedMember.name}
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              {selectedMember.memberLevel.name}
            </span>
          </div>
          <span className="text-xs text-primary font-medium">
            {formatDiscountLabel(selectedMember.memberLevel.discount)}
          </span>
        </div>
      )}

      {/* Cart Items */}
      <div className="flex-1 overflow-auto">
        {cart.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-8">
            <div className="text-center">
              <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>请从左侧添加服务项目</p>
            </div>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {cart.map((item, index) => (
              <div
                key={`${item.serviceItemId}-${item.staffId}-${index}`}
                className="border rounded-lg p-3 bg-background"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 mr-2">
                    <div className="font-medium text-sm truncate">
                      {item.serviceName}
                    </div>
                    <div className="mt-1">
                      <select
                        value={item.staffId}
                        onChange={(e) =>
                          onUpdateStaff(index, e.target.value)
                        }
                        className="text-xs px-2 py-1 border rounded-md bg-background w-full max-w-[180px] focus:outline-none focus:ring-1 focus:ring-primary/20"
                      >
                        {staff.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(index)}
                    className="p-1 text-muted-foreground hover:text-destructive rounded hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(index, -1)}
                      className="w-7 h-7 rounded-md border flex items-center justify-center hover:bg-accent"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(index, 1)}
                      className="w-7 h-7 rounded-md border flex items-center justify-center hover:bg-accent"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">
                      ¥{formatPrice(item.unitPrice)} x {item.quantity}
                    </div>
                    {item.discountRate < 1 && (
                      <div className="text-xs text-muted-foreground line-through">
                        ¥{formatPrice(item.subtotal)}
                      </div>
                    )}
                    <div className="font-semibold text-sm">
                      ¥{formatPrice(item.finalPrice)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer: Remark + Summary + Actions */}
      <div className="border-t">
        {/* Remark */}
        <div className="px-4 pt-3">
          <textarea
            value={remark}
            onChange={(e) => onRemarkChange(e.target.value)}
            placeholder="订单备注（可选）"
            className="w-full px-3 py-2 border rounded-md text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary/20"
            rows={2}
          />
        </div>

        {/* Summary */}
        <div className="px-4 py-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>原价</span>
            <span>¥{formatPrice(originalAmount)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-primary">
              <span>
                会员折扣
                {selectedMember &&
                  `(${formatDiscountLabel(selectedMember.memberLevel.discount)})`}
              </span>
              <span>-¥{formatPrice(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base pt-2 border-t">
            <span>应付</span>
            <span className="text-primary">¥{formatPrice(payableAmount)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 pt-0 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onCreateOrder('PENDING')}
            disabled={loading || cart.length === 0 || !selectedMember}
            className="px-4 py-2.5 bg-accent hover:bg-accent/80 rounded-md font-medium text-sm disabled:opacity-50 transition-colors"
          >
            挂单
          </button>
          <button
            type="button"
            onClick={() => onCreateOrder('SETTLED')}
            disabled={loading || cart.length === 0 || !selectedMember}
            className="px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium text-sm disabled:opacity-50 transition-colors"
          >
            {loading ? '处理中...' : '结算'}
          </button>
        </div>
      </div>
    </>
  );
}

// Pending Orders Panel (Overlay)
function PendingOrdersPanel({
  orders,
  loading,
  onRefresh,
  onRestore,
  onClose,
}: {
  orders: PendingOrderItem[];
  loading: boolean;
  onRefresh: () => void;
  onRestore: (orderId: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="w-96 bg-card border-l flex flex-col shadow-xl">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-sm">挂单列表</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="p-1.5 hover:bg-accent rounded"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-accent rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading && orders.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              加载中...
            </div>
          ) : orders.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              暂无挂单
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {orders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => onRestore(order.id)}
                  className="w-full border rounded-lg p-3 text-left hover:border-primary hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">
                      {order.memberName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(order.createdAt)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {order.orderNo}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {order.itemCount}项服务
                    </span>
                    <span className="text-sm font-semibold text-primary">
                      ¥{formatPrice(order.totalAmount)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
