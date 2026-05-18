'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getServiceItems,
  getServiceCategories,
  getStaff,
  searchMembers,
  createOrder,
  settleOrder,
  getPassCards,
  type ServiceItem,
  type ServiceCategory,
  type Staff,
  type Member,
  type OrderItemInput,
  type Order,
  type PassCard,
} from '../../../lib/api/orders';
import SettlementDialog, { SettlementProps } from '../../../components/SettlementDialog';

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

type Step = 'member' | 'services' | 'confirm' | 'settle';

export default function MobilePOSPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('member');
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
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [showSettlementDialog, setShowSettlementDialog] = useState(false);
  const [memberPassCards, setMemberPassCards] = useState<PassCard[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.replace('/login');
      return;
    }
    loadData();
  }, [router]);

  useEffect(() => {
    if (step === 'services') {
      loadServices();
    }
  }, [step, selectedCategory]);

  const loadData = async () => {
    const [cats, staffData] = await Promise.all([
      getServiceCategories(),
      getStaff(),
    ]);
    setCategories(cats);
    setStaff(staffData);
  };

  const loadServices = async () => {
    if (selectedCategory) {
      const data = await getServiceItems(selectedCategory);
      setServices(data);
    } else {
      const data = await getServiceItems();
      setServices(data);
    }
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

  const selectMember = async (member: Member) => {
    setSelectedMember(member);
    setMemberSearch('');
    setMemberResults([]);
    await loadMemberPassCards(member.id);
    setStep('services');
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

  const loadMemberPassCards = async (memberId: string) => {
    try {
      const data = await getPassCards({
        memberId,
        availableOnly: true,
      });
      setMemberPassCards(data.items);
    } catch (error) {
      console.error('加载次卡失败:', error);
    }
  };

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

      if (status === 'PENDING') {
        alert(`订单创建成功\n订单号: ${order.orderNo}`);
        router.push('/m');
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
    router.push('/m/orders');
  };

  const payableAmount = cart.reduce((sum, item) => sum + item.finalPrice, 0);
  const originalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const discountAmount = originalAmount - payableAmount;

  const handleSettleClick = async () => {
    await handleCreateOrder('PENDING');
    setStep('settle');
  };

  return (
    <div className="min-h-screen bg-background">
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

      {step === 'member' && (
        <div className="p-4">
          <h1 className="text-xl font-bold mb-4">选择会员</h1>

          <input
            type="text"
            value={memberSearch}
            onChange={(e) => handleMemberSearch(e.target.value)}
            placeholder="搜索姓名/手机号/卡号"
            className="w-full px-4 py-3 border rounded-lg text-lg mb-4"
            autoFocus
          />

          <div className="space-y-2">
            {memberResults.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => selectMember(member)}
                className="w-full p-4 bg-card border rounded-lg text-left"
              >
                <div className="flex items-center gap-3">
                  {member.avatar && (
                    <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-lg">{member.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {member.cardNo} · {member.phone}
                    </div>
                    <div className="text-sm text-primary mt-1">
                      {member.memberLevel.name} · {member.memberLevel.discount * 10}折
                    </div>
                  </div>
                </div>
              </button>
            ))}
            {memberResults.length === 0 && memberSearch.length >= 2 && (
              <div className="text-center text-muted-foreground py-8">
                未找到匹配的会员
              </div>
            )}
          </div>
        </div>
      )}

      {step === 'services' && (
        <div>
          <div className="sticky top-0 bg-background border-b p-4 z-10">
            <div className="flex items-center gap-2 mb-3">
              <button type="button" onClick={() => setStep('member')} className="text-2xl">
                ←
              </button>
              <h1 className="text-lg font-bold">选择服务</h1>
              <span className="ml-auto text-sm text-muted-foreground">{cart.length} 项</span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
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
                  className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                    selectedCategory === cat.id ? 'bg-primary text-primary-foreground' : 'bg-accent'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 grid grid-cols-2 gap-4 pb-32">
            {services.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => addToCart(service)}
                className="bg-card border rounded-lg p-4 text-left"
              >
                {service.image && (
                  <img src={service.image} alt={service.name} className="w-full h-28 object-cover rounded mb-3" />
                )}
                <div className="font-medium">{service.name}</div>
                <div className="text-sm text-muted-foreground mt-1">{service.duration}分钟</div>
                <div className="text-lg font-bold text-primary mt-2">
                  ¥{(service.price / 100).toFixed(2)}
                </div>
              </button>
            ))}
          </div>

          {cart.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4">
              <button
                type="button"
                onClick={() => setStep('confirm')}
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-bold text-lg"
              >
                下一步 · ¥{(payableAmount / 100).toFixed(2)}
              </button>
            </div>
          )}
        </div>
      )}

      {step === 'confirm' && (
        <div className="p-4 pb-32">
          <div className="flex items-center gap-2 mb-6">
            <button type="button" onClick={() => setStep('services')} className="text-2xl">
              ←
            </button>
            <h1 className="text-lg font-bold">确认订单</h1>
          </div>

          {selectedMember && (
            <div className="bg-card border rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                {selectedMember.avatar && (
                  <img src={selectedMember.avatar} alt={selectedMember.name} className="w-12 h-12 rounded-full" />
                )}
                <div className="flex-1">
                  <div className="font-medium">{selectedMember.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedMember.cardNo}</div>
                  <div className="text-sm text-primary">
                    {selectedMember.memberLevel.name} · {selectedMember.memberLevel.discount * 10}折
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-card border rounded-lg p-4 mb-4">
            <h2 className="font-semibold mb-3">服务项目</h2>
            <div className="space-y-3">
              {cart.map((item, index) => (
                <div key={`${item.serviceItemId}-${item.staffId}`} className="border-b pb-3 last:border-0">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{item.serviceName}</span>
                    <button
                      type="button"
                      onClick={() => removeFromCart(index)}
                      className="text-destructive text-sm"
                    >
                      删除
                    </button>
                  </div>

                  <select
                    value={item.staffId}
                    onChange={(e) => updateCartItemStaff(index, e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm mb-2"
                  >
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.role})
                      </option>
                    ))}
                  </select>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => updateCartItemQuantity(index, -1)}
                        className="w-8 h-8 rounded-full bg-accent font-bold"
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateCartItemQuantity(index, 1)}
                        className="w-8 h-8 rounded-full bg-accent font-bold"
                      >
                        +
                      </button>
                    </div>
                    <div className="font-bold">¥{(item.finalPrice / 100).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border rounded-lg p-4 mb-4">
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="订单备注"
              className="w-full px-3 py-2 border rounded-md resize-none"
              rows={3}
            />
          </div>

          <div className="bg-card border rounded-lg p-4 mb-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>原价</span>
                <span>¥{(originalAmount / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-primary">
                <span>会员折扣</span>
                <span>-¥{(discountAmount / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>应付金额</span>
                <span>¥{(payableAmount / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleCreateOrder('PENDING')}
              disabled={loading || cart.length === 0}
              className="py-3 bg-accent rounded-lg font-medium disabled:opacity-50"
            >
              挂单
            </button>
            <button
              type="button"
              onClick={handleSettleClick}
              disabled={loading || cart.length === 0}
              className="py-3 bg-primary text-primary-foreground rounded-lg font-bold disabled:opacity-50"
            >
              {loading ? '处理中...' : '去结算'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}