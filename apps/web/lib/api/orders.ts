import { apiFetch } from '../api/client';

export interface ServiceItem {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  duration: number;
  image?: string;
  sortOrder: number;
}

export interface ServiceCategory {
  id: string;
  name: string;
  sortOrder: number;
}

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
  payableAmount: number;
  paidAmount: number;
  remark?: string;
  createdAt: string;
  member: {
    id: string;
    name: string;
    cardNo: string;
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
  }>;
}

export async function getServiceItems(categoryId?: string): Promise<ServiceItem[]> {
  const params = new URLSearchParams();
  if (categoryId) params.append('categoryId', categoryId);
  params.append('activeOnly', 'true');
  const path = `/service/items${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await apiFetch<{ code: number; data: ServiceItem[] }>(path);
  return res.data;
}

export async function getServiceCategories(): Promise<ServiceCategory[]> {
  const res = await apiFetch<{ code: number; data: ServiceCategory[] }>('/service/categories');
  return res.data;
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
  page?: number;
  pageSize?: number;
}): Promise<{ items: Order[]; pagination: { total: number; page: number; pageSize: number; hasMore: boolean } }> {
  const query = new URLSearchParams();
  if (params?.memberId) query.append('memberId', params.memberId);
  if (params?.status) query.append('status', params.status);
  if (params?.page) query.append('page', String(params.page));
  if (params?.pageSize) query.append('pageSize', String(params.pageSize));
  const path = `/orders${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await apiFetch<{ code: number; data: { items: Order[]; pagination: { total: number; page: number; pageSize: number; hasMore: boolean } } }>(path);
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