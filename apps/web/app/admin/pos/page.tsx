'use client';

import { useState, useEffect } from 'react';
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

export default function POSPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberResults, setMemberResults] = useState<Member[]>([]);
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      getServiceItems(selectedCategory).then(setServices);
    } else {
      getServiceItems().then(setServices);
    }
  }, [selectedCategory]);

  const loadData = async () => {
    const [cats, staffData] = await Promise.all([
      getServiceCategories(),
      getStaff(),
    ]);
    setCategories(cats);
    setStaff(staffData);
    getServiceItems().then(setServices);
  };

  const handleMemberSearch = async (value: string) => {
    setMemberSearch(value);
    if (value.length >= 2) {
      const results = await searchMembers(value);
      setMemberResults(results);
    } else {
      setMemberResults([]);
    }
  };

  const selectMember = (member: Member) => {
    setSelectedMember(member);
    setMemberSearch('');
    setMemberResults([]);
  };

  const addToCart = (serviceItem: ServiceItem) => {
    const defaultStaff = staff[0];
    if (!defaultStaff) {
      alert('请先添加员工');
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

    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      newCart[existingIndex].subtotal = newCart[existingIndex].unitPrice * newCart[existingIndex].quantity;
      newCart[existingIndex].finalPrice = Math.floor(newCart[existingIndex].subtotal * discountRate);
      setCart(newCart);
    } else {
      setCart([
        ...cart,
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
          finalPrice,
        },
      ]);
    }
  };

  const updateCartItemStaff = (index: number, staffId: string) => {
    const newStaff = staff.find((s) => s.id === staffId);
    if (!newStaff) return;

    const newCart = [...cart];
    newCart[index].staffId = staffId;
    newCart[index].staff = newStaff;
    newCart[index].staffName = newStaff.name;
    setCart(newCart);
  };

  const updateCartItemQuantity = (index: number, delta: number) => {
    const newCart = [...cart];
    const newQuantity = newCart[index].quantity + delta;
    if (newQuantity <= 0) {
      newCart.splice(index, 1);
    } else {
      newCart[index].quantity = newQuantity;
      newCart[index].subtotal = newCart[index].unitPrice * newQuantity;
      const discountRate = selectedMember?.memberLevel?.discount ?? 1;
      newCart[index].finalPrice = Math.floor(newCart[index].subtotal * discountRate);
    }
    setCart(newCart);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedMember(null);
    setRemark('');
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

      alert(`订单创建成功\n订单号: ${order.orderNo}`);
      clearCart();
    } catch (error: unknown) {
      alert(`创建订单失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const originalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const discountAmount = originalAmount - cart.reduce((sum, item) => sum + item.finalPrice, 0);
  const payableAmount = cart.reduce((sum, item) => sum + item.finalPrice, 0);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <aside className="w-80 border-r flex flex-col bg-card">
        <div className="p-4 border-b">
          <h2 className="font-semibold mb-3">选择会员</h2>
          <div className="relative">
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => handleMemberSearch(e.target.value)}
              placeholder="搜索姓名/手机号/卡号"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
            {memberResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto z-10">
                {memberResults.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => selectMember(member)}
                    className="w-full px-3 py-2 text-left hover:bg-accent text-sm"
                  >
                    <div className="font-medium">{member.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {member.cardNo} · {member.phone}
                    </div>
                    <div className="text-xs text-primary">
                      {member.memberLevel.name} · {member.memberLevel.discount * 10}折
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedMember && (
          <div className="p-4 border-b bg-primary/5">
            <div className="flex items-center gap-3">
              {selectedMember.avatar && (
                <img
                  src={selectedMember.avatar}
                  alt={selectedMember.name}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div className="flex-1">
                <div className="font-medium">{selectedMember.name}</div>
                <div className="text-sm text-muted-foreground">{selectedMember.cardNo}</div>
                <div className="text-xs text-primary">
                  {selectedMember.memberLevel.name} · {selectedMember.memberLevel.discount * 10}折
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="bg-background rounded p-2">
                <div className="text-muted-foreground text-xs">本金余额</div>
                <div className="font-medium">¥{(selectedMember.principalBalance / 100).toFixed(2)}</div>
              </div>
              <div className="bg-background rounded p-2">
                <div className="text-muted-foreground text-xs">赠送余额</div>
                <div className="font-medium">¥{(selectedMember.giftBalance / 100).toFixed(2)}</div>
              </div>
            </div>
            {selectedMember.passCards && selectedMember.passCards.length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-muted-foreground mb-1">可用次卡</div>
                <div className="space-y-1">
                  {selectedMember.passCards.map((pc) => (
                    <div key={pc.id} className="bg-background rounded px-2 py-1 text-xs">
                      <span className="font-medium">{pc.name}</span>
                      <span className="text-muted-foreground ml-1">
                        {pc.remainingTimes}/{pc.totalTimes}
                      </span>
                      {pc.expiresAt && (
                        <span className="text-muted-foreground ml-1">
                          ({new Date(pc.expiresAt).toLocaleDateString('zh-CN')})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col">
        <div className="p-4 border-b flex gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-md text-sm ${
              selectedCategory === null ? 'bg-primary text-primary-foreground' : 'bg-accent'
            }`}
          >
            全部
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-md text-sm ${
                selectedCategory === cat.id ? 'bg-primary text-primary-foreground' : 'bg-accent'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex-1 p-4 overflow-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {services.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => addToCart(service)}
                className="bg-card border rounded-lg p-4 text-left hover:border-primary transition-colors"
              >
                {service.image && (
                  <img src={service.image} alt={service.name} className="w-full h-32 object-cover rounded mb-3" />
                )}
                <div className="font-medium">{service.name}</div>
                <div className="text-sm text-muted-foreground mt-1">{service.duration}分钟</div>
                <div className="text-lg font-bold text-primary mt-2">
                  ¥{(service.price / 100).toFixed(2)}
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>

      <aside className="w-96 border-l flex flex-col bg-card">
        <div className="p-4 border-b">
          <h2 className="font-semibold">订单明细</h2>
        </div>

        <div className="flex-1 overflow-auto">
          {cart.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              请选择服务项目
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {cart.map((item, index) => (
                <div key={`${item.serviceItemId}-${item.staffId}`} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.serviceName}</div>
                      <select
                        value={item.staffId}
                        onChange={(e) => updateCartItemStaff(index, e.target.value)}
                        className="mt-1 text-xs px-2 py-1 border rounded"
                      >
                        {staff.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.role})
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(index)}
                      className="text-muted-foreground hover:text-destructive ml-2"
                    >
                      ×
                    </button>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateCartItemQuantity(index, -1)}
                        className="w-6 h-6 rounded bg-accent hover:bg-accent/80"
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateCartItemQuantity(index, 1)}
                        className="w-6 h-6 rounded bg-accent hover:bg-accent/80"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right">
                      {item.discountRate < 1 && (
                        <div className="text-xs text-muted-foreground line-through">
                          ¥{(item.subtotal / 100).toFixed(2)}
                        </div>
                      )}
                      <div className="font-medium">¥{(item.finalPrice / 100).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t space-y-3">
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="订单备注"
            className="w-full px-3 py-2 border rounded-md text-sm resize-none"
            rows={2}
          />

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>原价</span>
              <span>¥{(originalAmount / 100).toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-primary">
                <span>会员折扣</span>
                <span>-¥{(discountAmount / 100).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>应付金额</span>
              <span>¥{(payableAmount / 100).toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleCreateOrder('PENDING')}
              disabled={loading || cart.length === 0 || !selectedMember}
              className="px-4 py-3 bg-accent hover:bg-accent/80 rounded-md font-medium disabled:opacity-50"
            >
              挂单
            </button>
            <button
              type="button"
              onClick={() => handleCreateOrder('SETTLED')}
              disabled={loading || cart.length === 0 || !selectedMember}
              className="px-4 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium disabled:opacity-50"
            >
              {loading ? '处理中...' : '结算'}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}