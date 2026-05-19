import { apiFetch } from '../api/client';

export type {
  ServiceCategory,
  ServiceItem,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateServiceItemInput,
  UpdateServiceItemInput,
} from './service';

import type {
  ServiceCategory,
  ServiceItem,
} from './service';

import {
  getServiceCategories as fetchServiceCategories,
  getServiceItems as fetchServiceItems,
} from './service';

export interface Staff {
  id: string;
  name: string;
  phone: string;
  role: string;
  avatar?: string;
  isActive: boolean;
}

export interface Member {
  id: string;
  name: string;
  cardNo: string;
  phone: string;
  avatar?: string;
  memberLevel: {
    id: string;
    name: string;
    discount: number;
  };
  principalBalance: number;
  giftBalance: number;
  passCards?: MemberPassCard[];
}

export interface PassCard {
  id: string;
  memberId: string;
  name: string;
  totalTimes: number;
  remainingTimes: number;
  price?: number;
  expiresAt?: string;
  isActive?: boolean;
  status?: 'ACTIVE' | 'EXPIRED' | 'USED_UP' | 'INACTIVE';
  createdAt?: string;
  member?: {
    id: string;
    name: string;
    cardNo: string;
    phone: string;
  };
}

export interface MemberPassCard {
  id: string;
  name: string;
  totalTimes: number;
  remainingTimes: number;
  expiresAt?: string;
}

export interface OrderItemInput {
  serviceItemId: string;
  staffId: string;
  quantity: number;
}

export interface OrderInput {
  memberId: string;
  items: OrderItemInput[];
  remark?: string;
  status?: 'PENDING' | 'SETTLED' | 'CANCELLED' | 'REFUNDED';
}

export interface Order {
  id: string;
  orderNo: string;
  status: string;
  originalAmount: number;
  discountAmount: number;
  couponAmount: number;
  payableAmount: number;
  paidAmount: number;
  remark?: string;
  createdAt: string;
  settledAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  member: {
    id: string;
    name: string;
    cardNo: string;
    phone: string;
    avatar?: string | null;
    memberLevel: {
      name: string;
      discount: number;
    };
  };
  items: Array<{
    id: string;
    serviceName: string;
    staffName: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
    discountRate: number;
    finalPrice: number;
    serviceItem: {
      id: string;
      name: string;
      price: number;
      duration: number;
      image?: string | null;
    };
    staff: {
      id: string;
      name: string;
      role: string;
      avatar?: string | null;
    };
  }>;
  payments: Array<{
    id: string;
    method: 'BALANCE' | 'PASS_CARD' | 'OFFLINE' | 'COUPON';
    amount: number;
    detail?: string | null;
    createdAt: string;
  }>;
}

export async function getServiceItems(categoryId?: string): Promise<ServiceItem[]> {
  return fetchServiceItems({ categoryId, activeOnly: true });
}

export async function getServiceCategories(): Promise<ServiceCategory[]> {
  return fetchServiceCategories();
}

export async function getStaff(): Promise<Staff[]> {
  const res = await apiFetch<{ code: number; data: Staff[] }>('/staff');
  return res.data;
}

export async function searchMembers(keyword: string): Promise<Member[]> {
  const res = await apiFetch<{ code: number; data: Member[] }>(
    `/members/search/keyword?keyword=${encodeURIComponent(keyword)}`
  );
  return res.data;
}

export async function createOrder(order: OrderInput): Promise<Order> {
  const res = await apiFetch<{ code: number; data: Order }>('/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  });
  return res.data;
}

export async function getOrders(params?: {
  memberId?: string;
  status?: string;
  keyword?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: Order[]; pagination: { total: number; page: number; pageSize: number; hasMore: boolean } }> {
  const query = new URLSearchParams();
  if (params?.memberId) query.append('memberId', params.memberId);
  if (params?.status) query.append('status', params.status);
  if (params?.keyword) query.append('keyword', params.keyword);
  if (params?.startDate) query.append('startDate', params.startDate);
  if (params?.endDate) query.append('endDate', params.endDate);
  if (params?.page) query.append('page', String(params.page));
  if (params?.pageSize) query.append('pageSize', String(params.pageSize));
  const path = `/orders${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await apiFetch<{ code: number; data: { items: Order[]; pagination: { total: number; page: number; pageSize: number; hasMore: boolean } } }>(path);
  return res.data;
}

export interface OrderStats {
  todayOrderCount: number;
  todayRevenue: number;
  pendingCount: number;
}

export async function getOrderStats(): Promise<OrderStats> {
  const res = await apiFetch<{ code: number; data: OrderStats }>('/orders/stats');
  return res.data;
}

export async function getPendingOrders(): Promise<Order[]> {
  const res = await apiFetch<{ code: number; data: Order[] }>('/orders/pending');
  return res.data;
}

export async function updateOrder(
  id: string,
  data: { status?: string; remark?: string; cancelReason?: string }
): Promise<Order> {
  const res = await apiFetch<{ code: number; data: Order }>(`/orders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return res.data;
}

// Pass card APIs
export async function getPassCards(params?: {
  memberId?: string;
  status?: string;
  availableOnly?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<{
  items: PassCard[];
  pagination: { total: number; page: number; pageSize: number; hasMore: boolean };
}> {
  const query = new URLSearchParams();
  if (params?.memberId) query.append('memberId', params.memberId);
  if (params?.status) query.append('status', params.status);
  if (params?.availableOnly) query.append('availableOnly', 'true');
  if (params?.page) query.append('page', String(params.page));
  if (params?.pageSize) query.append('pageSize', String(params.pageSize));
  const path = `/pass-cards${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await apiFetch<{
    code: number;
    data: {
      items: PassCard[];
      pagination: { total: number; page: number; pageSize: number; hasMore: boolean };
    };
  }>(path);
  return res.data;
}

export async function createPassCard(data: {
  memberId: string;
  name: string;
  totalTimes: number;
  price: number;
  expiresAt?: string;
  isActive?: boolean;
}): Promise<PassCard> {
  const res = await apiFetch<{ code: number; data: PassCard }>('/pass-cards', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data;
}

// Coupon APIs
export interface CouponInstance {
  id: string;
  templateId: string;
  memberId: string;
  status: 'AVAILABLE' | 'USED' | 'EXPIRED';
  usedAt: string | null;
  expiresAt: string;
  createdAt: string;
  template?: {
    id: string;
    name: string;
    type: 'FIXED' | 'PERCENT';
    threshold: number;
    discount: number;
  };
}

export async function getAvailableCoupons(memberId: string, amount: number): Promise<Array<CouponInstance & {
  template: { id: string; name: string; type: 'FIXED' | 'PERCENT'; threshold: number; discount: number };
  canUse: boolean;
  discount: number;
  finalAmount: number;
}>> {
  const res = await apiFetch<{ code: number; data: Array<CouponInstance & {
    template: { id: string; name: string; type: 'FIXED' | 'PERCENT'; threshold: number; discount: number };
    canUse: boolean;
    discount: number;
    finalAmount: number;
  }> }>(`/coupons/members/${memberId}/available?amount=${amount}`);
  return res.data;
}

export interface PaymentInput {
  method: 'BALANCE' | 'PASS_CARD' | 'OFFLINE' | 'COUPON';
  amount: number;
  detail?: string;
  passCardId?: string;
  couponInstanceId?: string;
}

export async function settleOrder(orderId: string, payments: PaymentInput[]): Promise<Order> {
  const res = await apiFetch<{ code: number; data: Order }>(`/orders/${orderId}/settle`, {
    method: 'POST',
    body: JSON.stringify({ payments }),
  });
  return res.data;
}

export async function getOrderById(orderId: string): Promise<Order> {
  const res = await apiFetch<{ code: number; data: Order }>(`/orders/${orderId}`);
  return res.data;
}

export async function cancelOrder(orderId: string, reason?: string): Promise<Order> {
  const res = await apiFetch<{ code: number; data: Order }>(`/orders/${orderId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  return res.data;
}

export async function deleteOrder(orderId: string): Promise<void> {
  await apiFetch(`/orders/${orderId}`, {
    method: 'DELETE',
  });
}