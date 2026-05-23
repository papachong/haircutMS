import { apiFetch } from './client';

export interface ShopInfo {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  logo: string | null;
  businessHours: string | null;
}

export async function getShopInfo(): Promise<ShopInfo> {
  const res = await apiFetch<{ code: number; data: ShopInfo }>('/auth/shop');
  return res.data;
}

export async function updateShopInfo(
  data: Partial<Pick<ShopInfo, 'name' | 'address' | 'phone' | 'businessHours' | 'logo'>>,
): Promise<ShopInfo> {
  const res = await apiFetch<{ code: number; data: ShopInfo }>('/auth/shop', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return res.data;
}
